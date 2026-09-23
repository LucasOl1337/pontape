#!/usr/bin/env python3
"""Conferidor independente do contrato v1 do livro público VidaNova.

Usa somente a biblioteca padrão. Os campos de payload ainda não enumerados no
contrato são conferidos na parte comum; o hash protege o payload inteiro.
"""

import hashlib
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path


HASH = re.compile(r"[0-9a-f]{64}\Z")
SEQUENCE = re.compile(r"[1-9][0-9]*\Z")
SIGNED_CENTS = re.compile(r"(?:0|-?[1-9][0-9]*)\Z")
ENVELOPE = {"schemaVersion", "sequence", "previousHash", "recordedAt", "payload", "hash"}
ACTIONS = {
    "project": {"repository_created", "decision_recorded", "pull_request_merged"},
    "finance": {"movement_recorded", "reversal"},
    "field": {"food_delivered", "clothing_delivered", "hygiene_delivered"},
    "candidate": {"contact_completed", "interview_completed", "referral_completed", "support_completed"},
}
MAX_SAFE_INTEGER = 2**53 - 1


class LedgerError(Exception):
    """First problem found in the ledger."""


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise LedgerError(f"chave JSON repetida: {key}")
        result[key] = value
    return result


def no_fraction(value):
    raise LedgerError(f"número fracionário não previsto no contrato: {value}")


def read_json(path):
    try:
        return json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=unique_object,
            parse_float=no_fraction,
            parse_constant=no_fraction,
        )
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise LedgerError(f"não foi possível ler o JSON: {exc}") from exc


def jcs(value):
    """JCS (RFC 8785) for the integer-only JSON domain of contract v1."""
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            raise LedgerError("número JSON fora do intervalo inteiro seguro de JCS")
        return str(value)
    if isinstance(value, str):
        try:
            value.encode("utf-8")
        except UnicodeEncodeError as exc:
            raise LedgerError("texto JSON contém substituto Unicode isolado") from exc
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(jcs(item) for item in value) + "]"
    if isinstance(value, dict):
        try:
            keys = sorted(value, key=lambda key: key.encode("utf-16-be"))
        except UnicodeEncodeError as exc:
            raise LedgerError("chave JSON contém substituto Unicode isolado") from exc
        return "{" + ",".join(jcs(key) + ":" + jcs(value[key]) for key in keys) + "}"
    raise LedgerError("tipo JSON não previsto no contrato")


def decimal_string(value, pattern, description):
    if not isinstance(value, str) or not pattern.fullmatch(value):
        raise LedgerError(f"{description} deve ser string decimal canônica")
    return int(value)


def utc_milliseconds(value, description):
    if not isinstance(value, str) or not re.fullmatch(
        r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z", value
    ):
        raise LedgerError(f"{description} deve estar em UTC com milissegundos")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise LedgerError(f"{description} inválido") from exc


def check_payload(payload, earlier, reversed_movements):
    if not isinstance(payload, dict):
        raise LedgerError("payload deve ser objeto")
    required = {"type", "action", "occurredOn", "correctionOf"}
    if not required.issubset(payload):
        raise LedgerError("payload sem type, action, occurredOn ou correctionOf")
    family, action = payload["type"], payload["action"]
    if not isinstance(family, str) or not isinstance(action, str) or action not in ACTIONS.get(family, set()):
        raise LedgerError("família ou ação não prevista no contrato v1")
    occurred_on = payload["occurredOn"]
    if not isinstance(occurred_on, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", occurred_on):
        raise LedgerError("occurredOn deve ser data YYYY-MM-DD")
    try:
        date.fromisoformat(occurred_on)
    except ValueError as exc:
        raise LedgerError("occurredOn inválido") from exc

    reference = payload["correctionOf"]
    if reference is not None:
        number = decimal_string(reference, SEQUENCE, "correctionOf")
        if number not in earlier:
            raise LedgerError("correctionOf não aponta para ação anterior")
        target = earlier[number]
        if action == "reversal":
            if target["type"] != "finance" or target["action"] != "movement_recorded":
                raise LedgerError("estorno deve apontar para movimento financeiro")
            if number in reversed_movements:
                raise LedgerError("movimento financeiro já estornado")
            if payload.get("category") != target.get("category"):
                raise LedgerError("categoria do estorno diferente do movimento")
            original = decimal_string(target.get("amountCents"), SIGNED_CENTS, "amountCents original")
            reverse = decimal_string(payload.get("amountCents"), SIGNED_CENTS, "amountCents do estorno")
            if reverse != -original:
                raise LedgerError("estorno não contém o delta inverso")
            reversed_movements.add(number)
        elif target["type"] != family or target["action"] != action:
            raise LedgerError("correção aponta para outra família ou ação")
    elif action == "reversal":
        raise LedgerError("estorno sem correctionOf")

    if family == "finance":
        if payload.get("currency") != "BRL":
            raise LedgerError("moeda financeira deve ser BRL")
        cents = decimal_string(payload.get("amountCents"), SIGNED_CENTS, "amountCents")
        if not isinstance(payload.get("category"), str) or not payload["category"]:
            raise LedgerError("categoria financeira ausente")
        if not isinstance(payload.get("evidence"), str) or not payload["evidence"]:
            raise LedgerError("estado da evidência ausente")
        return cents
    if family in {"field", "candidate"}:
        field = "quantity" if family == "field" else "count"
        decimal_string(payload.get(field), SEQUENCE, field)
    return 0


def verify(document):
    if isinstance(document, list):
        events = document
    elif isinstance(document, dict) and isinstance(document.get("events"), list):
        events = document["events"]
    else:
        raise LedgerError("livro deve ser lista de ações ou objeto com events")

    previous_hash = "0" * 64
    earlier = {}
    reversed_movements = set()
    balance_cents = 0
    for line, event in enumerate(events, 1):
        try:
            if not isinstance(event, dict) or set(event) != ENVELOPE:
                raise LedgerError("evento não tem os seis campos exatos do envelope")
            if type(event["schemaVersion"]) is not int or event["schemaVersion"] != 1:
                raise LedgerError("schemaVersion deve ser 1")
            sequence = decimal_string(event["sequence"], SEQUENCE, "sequence")
            if sequence != line:
                raise LedgerError(f"sequência esperada {line}, encontrada {sequence}")
            if not isinstance(event["previousHash"], str) or not HASH.fullmatch(event["previousHash"]):
                raise LedgerError("previousHash inválido")
            if event["previousHash"] != previous_hash:
                raise LedgerError("previousHash não aponta para a ação anterior")
            utc_milliseconds(event["recordedAt"], "recordedAt")
            if not isinstance(event["hash"], str) or not HASH.fullmatch(event["hash"]):
                raise LedgerError("hash inválido")
            balance_cents += check_payload(event["payload"], earlier, reversed_movements)
            envelope = {key: value for key, value in event.items() if key != "hash"}
            digest = hashlib.sha256(jcs(envelope).encode("utf-8")).hexdigest()
            if event["hash"] != digest:
                raise LedgerError("hash não confere: conteúdo alterado")
            earlier[sequence] = event["payload"]
            previous_hash = digest
        except LedgerError as exc:
            raise LedgerError(f"Linha {line}: {exc}") from exc

    if isinstance(document, dict) and "checkpoint" in document:
        checkpoint = document["checkpoint"]
        if not isinstance(checkpoint, dict):
            raise LedgerError("checkpoint deve ser objeto")
        # O literal do identificador ainda não consta no contrato atual.
        if type(checkpoint.get("schemaVersion")) is not int or checkpoint["schemaVersion"] != 1:
            raise LedgerError("checkpoint: schemaVersion deve ser 1")
        if checkpoint.get("sequence") != str(len(events)):
            raise LedgerError("checkpoint: sequence diferente do fim do livro")
        if checkpoint.get("headHash") != previous_hash:
            raise LedgerError("checkpoint: headHash diferente do fim do livro")
        utc_milliseconds(checkpoint.get("generatedAt"), "checkpoint.generatedAt")
    return len(events), balance_cents


def main(argv):
    if len(argv) != 2:
        print("Uso: python3 tools/conferir.py CAMINHO_DO_LIVRO.json", file=sys.stderr)
        return 1
    try:
        count, cents = verify(read_json(Path(argv[1])))
    except LedgerError as exc:
        print(f"Problema: {exc}")
        return 1
    sign = "-" if cents < 0 else ""
    whole, fraction = divmod(abs(cents), 100)
    print(f"Tudo certo: {count} ações, nada apagado nem mudado")
    print(f"Saldo dos movimentos: {sign}R$ {whole:,}".replace(",", ".") + f",{fraction:02d}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
