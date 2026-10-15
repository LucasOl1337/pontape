"""Erros de domínio e leitura básica. Viram HTTP na API: NotFound 404, Forbidden 403, Conflict 409,
Invalid 422, Unavailable 503.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session


class NotFound(Exception):
    pass


class Forbidden(Exception):
    pass


class Conflict(Exception):
    pass


class Invalid(Exception):
    pass


class Unavailable(Exception):
    pass


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def get(session: Session, model, key):
    row = session.get(model, key)
    if row is None:
        raise NotFound(f"{model.__tablename__}/{key} não existe")
    return row
