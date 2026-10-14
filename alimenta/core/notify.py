"""Aviso às ONGs: caixa de ofertas (sempre) e link wa.me para alguém tocar e mandar.

Sem API paga e sem envio automático: o link abre o WhatsApp de quem tocou com o texto pronto.
https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat (acesso 14/10/2026).
O texto tem categoria, kg, prazo e bairro; nunca nome de beneficiário nem endereço completo.
"""

from __future__ import annotations

from urllib.parse import quote

from alimenta.core.clock import local
from alimenta.core.domain import CATEGORIES


def offer_text(category: str, kg: float, respond_by, district: str | None) -> str:
    where = f" em {district}" if district else ""
    return (f"Rede Alimenta: oferta de doação de {CATEGORIES[category].lower()}, {kg:g} kg{where}. "
            f"Responda no painel até {local(respond_by).strftime('%d/%m %H:%M')}.")


def wa_link(phone_digits: str | None, text: str) -> str | None:
    """`https://wa.me/55<DDD><número>?text=...`. Sem telefone: None."""
    if not phone_digits:
        return None
    return f"https://wa.me/55{phone_digits}?text={quote(text)}"
