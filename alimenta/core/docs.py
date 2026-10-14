"""CNPJ (numérico e alfanumérico), CEP e telefone: validação local, sem rede.

CNPJ alfanumérico: a Receita emite desde 31/07/2026. Cada caractere vale `ord(c) - 48`
(0-9 → 0-9, A-Z → 17-42); os dois dígitos verificadores continuam numéricos, módulo 11 com os
pesos de sempre. Fonte: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/julho/receita-federal-gera-o-primeiro-cnpj-em-formato-alfanumerico
(acesso 14/10/2026).
"""

from __future__ import annotations

import re

W1 = (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
W2 = (6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
CNPJ_SHAPE = re.compile(r"^[0-9A-Z]{12}[0-9]{2}$")


def clean_cnpj(raw: str) -> str:
    return re.sub(r"[.\-/\s]", "", raw or "").upper()


def _dv(chars: str, weights: tuple[int, ...]) -> int:
    total = sum((ord(c) - 48) * w for c, w in zip(chars, weights))
    rest = total % 11
    return 0 if rest < 2 else 11 - rest


def cnpj_valid(raw: str) -> bool:
    value = clean_cnpj(raw)
    if not CNPJ_SHAPE.match(value) or len(set(value)) == 1:
        return False
    return _dv(value[:12], W1) == int(value[12]) and _dv(value[:13], W2) == int(value[13])


def cnpj_with_dv(base12: str) -> str:
    """Completa 12 caracteres com os dois dígitos (usado pelo ensaio para CNPJ fictício)."""
    first = _dv(base12, W1)
    return base12 + str(first) + str(_dv(base12 + str(first), W2))


def clean_cep(raw: str) -> str:
    value = re.sub(r"\D", "", raw or "")
    if len(value) != 8:
        raise ValueError("CEP precisa de 8 dígitos")
    return value


def clean_phone(raw: str) -> str:
    """DDD + número, só dígitos (10 ou 11). Aceita +55 na frente."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("55") and len(digits) in (12, 13):
        digits = digits[2:]
    if len(digits) not in (10, 11) or digits[0] == "0":
        raise ValueError("telefone precisa de DDD + número (10 ou 11 dígitos)")
    return digits
