"""Tokens de sessão assinados (HMAC-SHA256), sem dependências externas.

Formato: base64url(payload).base64url(hmac)
O segredo vem de AUTH_SECRET. O token é validado pela API principal e emitido
pela API de autenticação; como as duas rodam no mesmo container, compartilham
a variável de ambiente.
"""

import base64
import hashlib
import hmac
import json
import os
import time

SECRET = os.getenv("AUTH_SECRET", "").strip()
TTL_SEGUNDOS = int(os.getenv("AUTH_TOKEN_TTL", "43200"))

if not SECRET:
    raise RuntimeError(
        "AUTH_SECRET não configurado. Defina AUTH_SECRET no .env/compose."
    )


def _b64e(dados: bytes) -> str:
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode("ascii")


def _b64d(texto: str) -> bytes:
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


def _assinar(payload_b64: str) -> str:
    assinatura = hmac.new(
        SECRET.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256
    ).digest()
    return _b64e(assinatura)


def criar_token(
    usuario: dict, perfil: str | None = None, perfis: list[str] | None = None
) -> str:
    agora = int(time.time())
    payload = {
        "sub": usuario.get("id"),
        "email": usuario.get("email"),
        "nome": usuario.get("nome"),
        "perfil": perfil,
        "perfis": perfis or [],
        "iat": agora,
        "exp": agora + TTL_SEGUNDOS,
    }
    payload_b64 = _b64e(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    return f"{payload_b64}.{_assinar(payload_b64)}"


def validar_token(token: str) -> dict | None:
    try:
        payload_b64, assinatura = token.split(".", 1)
        if not hmac.compare_digest(assinatura, _assinar(payload_b64)):
            return None
        payload = json.loads(_b64d(payload_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None
