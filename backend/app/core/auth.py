"""
Autenticação via Firebase JWT.

Para o MVP, o frontend envia o Firebase ID Token no header:
    Authorization: Bearer <firebase_id_token>

O backend valida esse token consultando a API pública do Firebase
(sem precisar do Admin SDK, apenas com o project_id).
"""

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.core.config import settings

security = HTTPBearer()

FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"


async def _get_firebase_public_keys() -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(FIREBASE_CERTS_URL)
        resp.raise_for_status()
        return resp.json()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Valida o Firebase ID Token e retorna o payload com uid do usuário.
    Levanta 401 se o token for inválido ou expirado.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # --- Modo DEV: aceita token "dev-<uid>" para testes locais ---
    if settings.ENVIRONMENT == "development" and token.startswith("dev-"):
        uid = token.removeprefix("dev-")
        return {"uid": uid, "email": f"{uid}@dev.local"}

    # --- Validação real via Firebase ---
    try:
        public_keys = await _get_firebase_public_keys()

        # Descobre qual chave usar pelo kid no header do JWT
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid or kid not in public_keys:
            raise credentials_exception

        public_key = public_keys[kid]

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}",
        )

        uid: str = payload.get("sub")
        if uid is None:
            raise credentials_exception

        return {"uid": uid, "email": payload.get("email", "")}

    except JWTError:
        raise credentials_exception
    except Exception:
        raise credentials_exception
