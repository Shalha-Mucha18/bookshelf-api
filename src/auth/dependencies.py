from fastapi.security import HTTPBearer
from .utils import decode_access_token
from fastapi import Request
from fastapi import HTTPException
from fastapi.security.http import HTTPAuthorizationCredentials

class AccessTokenScheme(HTTPBearer):
     
    def __init__(self, auto_error=True):  
         super().__init__(auto_error=auto_error)


    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials | None:
        creds = await super().__call__(request)
        token = creds.credentials

        try:
            token_data = decode_access_token(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        if token_data['refresh']:
            raise HTTPException(status_code=401, detail="Refresh tokens are not allowed for authentication")

        return token_data



     