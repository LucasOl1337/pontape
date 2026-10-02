#!/usr/bin/env python3
"""Conferidor independente do contrato v1 do livro público VidaNova.

Usa somente a biblioteca padrão e o formato descrito no contrato público.
"""

import hashlib
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


HASH = re.compile(r"[0-9a-f]{64}\Z")
SEQUENCE = re.compile(r"[1-9][0-9]{0,19}\Z")
NONNEGATIVE = re.compile(r"(?:0|[1-9][0-9]{0,19})\Z")
SIGNED_CENTS = re.compile(r"-?[1-9][0-9]{0,19}\Z")
COMMIT = re.compile(r"[0-9a-f]{40}\Z")
DECISION = re.compile(r"D[0-9]{3}\Z")
EXTERNAL_ID = re.compile(r"[A-Za-z0-9:_-]{1,80}\Z")
ENVELOPE = {"schemaVersion", "sequence", "previousHash", "recordedAt", "payload", "hash"}
COMMON = {"type", "action", "occurredOn", "correctionOf"}
SPECIFIC = {
    "repository_created": {"repository"},
    "decision_recorded": {"decisionId", "sourceCommit"},
    "pull_request_merged": {"pullRequest", "mergeCommit"},
    "signing_key_rotated": {"publicKey", "previousPublicKey"},
    "movement_recorded": {"currency", "amountCents", "category", "evidence"},
    "reversal": {"currency", "amountCents", "category", "evidence"},
    "food_delivered": {"quantity"},
    "clothing_delivered": {"quantity"},
    "hygiene_delivered": {"quantity"},
    "contact_completed": {"count"},
    "interview_completed": {"count"},
    "referral_completed": {"count"},
    "support_completed": {"count"},
}
CATEGORIES = {"donation", "food", "clothing", "hygiene", "operations", "fee", "refund"}
EVIDENCE = {"pending", "not_published"}
CHECKPOINT = {"schemaVersion", "ledger", "sequence", "headHash", "generatedAt"}
ACTIONS = {
    "project": {"repository_created", "decision_recorded", "pull_request_merged", "signing_key_rotated"},
    "finance": {"movement_recorded", "reversal"},
    "field": {"food_delivered", "clothing_delivered", "hygiene_delivered"},
    "candidate": {"contact_completed", "interview_completed", "referral_completed", "support_completed"},
}
MAX_SAFE_INTEGER = 2**53 - 1
try:
    SAO_PAULO = ZoneInfo("America/Sao_Paulo")
except ZoneInfoNotFoundError:
    SAO_PAULO = None


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
        raw = path.read_text(encoding="utf-8")
        document = json.loads(
            raw,
            object_pairs_hook=unique_object,
            parse_float=no_fraction,
            parse_constant=no_fraction,
        )
        canonical = jcs(document)
        if isinstance(document, dict) and set(document) == {"events", "checkpoint"}:
            if raw != canonical:
                raise LedgerError("documento de produção não está em bytes JCS exatos")
        return document
    except (OSError, UnicodeError, ValueError) as exc:
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
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise LedgerError(f"{description} inválido") from exc


def check_payload(payload, recorded_at, earlier, corrected_targets, project_sources):
    if not isinstance(payload, dict):
        raise LedgerError("payload deve ser objeto")
    if not COMMON.issubset(payload):
        raise LedgerError("payload sem type, action, occurredOn ou correctionOf")
    family, action = payload["type"], payload["action"]
    if not isinstance(family, str) or not isinstance(action, str) or action not in ACTIONS.get(family, set()):
        raise LedgerError("família ou ação não prevista no contrato v1")
    allowed = COMMON | SPECIFIC[action]
    if family == "finance" and "externalId" in payload:
        allowed = allowed | {"externalId"}
        if not isinstance(payload["externalId"], str) or not EXTERNAL_ID.fullmatch(payload["externalId"]):
            raise LedgerError("externalId inválido")
    if set(payload) != allowed:
        raise LedgerError("payload tem campo ausente ou extra para a ação")
    occurred_on = payload["occurredOn"]
    if not isinstance(occurred_on, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", occurred_on):
        raise LedgerError("occurredOn deve ser data YYYY-MM-DD")
    try:
        occurred_date = date.fromisoformat(occurred_on)
    except ValueError as exc:
        raise LedgerError("occurredOn inválido") from exc
    if occurred_date > recorded_at.astimezone(SAO_PAULO).date():
        raise LedgerError("occurredOn posterior a recordedAt")

    reference = payload["correctionOf"]
    if reference is not None:
        number = decimal_string(reference, SEQUENCE, "correctionOf")
        if number not in earlier:
            raise LedgerError("correctionOf não aponta para ação anterior")
        if number in corrected_targets:
            raise LedgerError("ação anterior já foi alvo direto de correção")
        target = earlier[number]
        if action == "reversal":
            if target["type"] != "finance" or target["action"] != "movement_recorded":
                raise LedgerError("estorno deve apontar para movimento financeiro")
            if payload.get("category") != target.get("category"):
                raise LedgerError("categoria do estorno diferente do movimento")
            original = decimal_string(target.get("amountCents"), SIGNED_CENTS, "amountCents original")
            reverse = decimal_string(payload.get("amountCents"), SIGNED_CENTS, "amountCents do estorno")
            if reverse != -original:
                raise LedgerError("estorno não contém o delta inverso")
        elif target["type"] != family or target["action"] != action:
            raise LedgerError("correção aponta para outra família ou ação")
        elif family == "finance":
            raise LedgerError("movimento financeiro original não pode corrigir diretamente")
        elif action == "decision_recorded" and payload["decisionId"] != target["decisionId"]:
            raise LedgerError("correção mudou decisionId")
        elif action == "pull_request_merged" and payload["pullRequest"] != target["pullRequest"]:
            raise LedgerError("correção mudou pullRequest")
        corrected_targets.add(number)
    elif action == "reversal":
        raise LedgerError("estorno sem correctionOf")

    if family == "project":
        if action == "repository_created":
            if payload["repository"] != "LucasOl1337/VidaNova":
                raise LedgerError("repositório diferente do literal do contrato")
            source = (action, payload["repository"])
        elif action == "decision_recorded":
            if not isinstance(payload["decisionId"], str) or not DECISION.fullmatch(payload["decisionId"]):
                raise LedgerError("decisionId inválido")
            if not isinstance(payload["sourceCommit"], str) or not COMMIT.fullmatch(payload["sourceCommit"]):
                raise LedgerError("sourceCommit inválido")
            source = (action, payload["decisionId"])
        elif action == "signing_key_rotated":
            for field in ("publicKey", "previousPublicKey"):
                if not isinstance(payload[field], str) or not HASH.fullmatch(payload[field]):
                    raise LedgerError(f"{field} inválida")
            source = (action, payload["publicKey"])
        else:
            decimal_string(payload["pullRequest"], SEQUENCE, "pullRequest")
            if not isinstance(payload["mergeCommit"], str) or not COMMIT.fullmatch(payload["mergeCommit"]):
                raise LedgerError("mergeCommit inválido")
            source = (action, payload["pullRequest"])
        if reference is None:
            if source in project_sources:
                raise LedgerError("fonte de projeto original duplicada")
            project_sources.add(source)
        return 0

    if family == "finance":
        if payload.get("currency") != "BRL":
            raise LedgerError("moeda financeira deve ser BRL")
        cents = decimal_string(payload.get("amountCents"), SIGNED_CENTS, "amountCents")
        if not isinstance(payload["category"], str) or payload["category"] not in CATEGORIES:
            raise LedgerError("categoria financeira não permitida")
        if not isinstance(payload["evidence"], str) or payload["evidence"] not in EVIDENCE:
            raise LedgerError("estado da evidência não permitido")
        return cents
    if family in {"field", "candidate"}:
        field = "quantity" if family == "field" else "count"
        decimal_string(payload.get(field), SEQUENCE, field)
    return 0


def verify(document):
    if SAO_PAULO is None:
        raise LedgerError("base de fusos do sistema não contém America/Sao_Paulo")
    if isinstance(document, list):
        events = document
    elif isinstance(document, dict) and isinstance(document.get("events"), list):
        shape = set(document)
        if shape not in (
            {"notice", "events"},
            {"events", "checkpoint"},
            {"notice", "events", "checkpoint"},
        ):
            raise LedgerError("contêiner do livro tem chaves ausentes ou extras")
        if "notice" in document and (not isinstance(document["notice"], str) or not document["notice"]):
            raise LedgerError("notice fictício inválido")
        events = document["events"]
    else:
        raise LedgerError("livro deve ser lista de ações ou objeto com events")
    if len(events) > 100_000:
        raise LedgerError("livro excede 100.000 ações")

    previous_hash = "0" * 64
    earlier = {}
    corrected_targets = set()
    project_sources = set()
    balance_cents = 0
    latest_recorded_at = None
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
            recorded_at = utc_milliseconds(event["recordedAt"], "recordedAt")
            if not isinstance(event["hash"], str) or not HASH.fullmatch(event["hash"]):
                raise LedgerError("hash inválido")
            balance_cents += check_payload(
                event["payload"], recorded_at, earlier, corrected_targets, project_sources
            )
            envelope = {key: value for key, value in event.items() if key != "hash"}
            digest = hashlib.sha256(jcs(envelope).encode("utf-8")).hexdigest()
            if event["hash"] != digest:
                raise LedgerError("hash não confere: conteúdo alterado")
            earlier[sequence] = event["payload"]
            previous_hash = digest
            if latest_recorded_at is None or recorded_at > latest_recorded_at:
                latest_recorded_at = recorded_at
        except LedgerError as exc:
            raise LedgerError(f"Linha {line}: {exc}") from exc

    if isinstance(document, dict) and "checkpoint" in document:
        checkpoint = document["checkpoint"]
        if not isinstance(checkpoint, dict):
            raise LedgerError("checkpoint deve ser objeto")
        if set(checkpoint) != CHECKPOINT:
            raise LedgerError("checkpoint tem campos ausentes ou extras")
        if type(checkpoint.get("schemaVersion")) is not int or checkpoint["schemaVersion"] != 1:
            raise LedgerError("checkpoint: schemaVersion deve ser 1")
        if checkpoint["ledger"] != "vidanova-public-actions":
            raise LedgerError("checkpoint: identificador do livro incorreto")
        decimal_string(checkpoint["sequence"], NONNEGATIVE, "checkpoint.sequence")
        if checkpoint.get("sequence") != str(len(events)):
            raise LedgerError("checkpoint: sequence diferente do fim do livro")
        if not isinstance(checkpoint["headHash"], str) or not HASH.fullmatch(checkpoint["headHash"]):
            raise LedgerError("checkpoint: headHash inválido")
        if checkpoint.get("headHash") != previous_hash:
            raise LedgerError("checkpoint: headHash diferente do fim do livro")
        generated_at = utc_milliseconds(checkpoint["generatedAt"], "checkpoint.generatedAt")
        if latest_recorded_at is not None and generated_at < latest_recorded_at:
            raise LedgerError("checkpoint: generatedAt anterior a uma ação")
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
    unit = "ação" if count == 1 else "ações"
    print(f"Tudo certo: {count} {unit}, nada apagado nem mudado")
    print(f"Saldo dos movimentos: {sign}R$ {whole:,}".replace(",", ".") + f",{fraction:02d}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
