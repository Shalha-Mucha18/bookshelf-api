from fastapi.security import HTTPBearer
from .utils import decode_access_token
from fastapi import Request
from fastapi import HTTPException
from fastapi.security.http import HTTPAuthorizationCredentials

class TokenScheme(HTTPBearer):
     
    def __init__(self, auto_error=True):  
         super().__init__(auto_error=auto_error)


    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials | None:
        creds = await super().__call__(request)
        token = creds.credentials

        try:
            token_data = decode_access_token(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        self.verify_token_data(token_data)

        return token_data
    
    def verify_token_data(self, token_data: dict):
        raise NotImplementedError("Subclasses must implement the verify_token_data method to validate token data according to their specific requirements")


class AccessTokenScheme(TokenScheme):


    def verify_token_data(self,token_data:dict):

        if token_data and token_data['refresh']:
            raise HTTPException(status_code=401, detail="Refresh tokens are not allowed for authentication")
        

class RefreshTokenScheme(TokenScheme):

    def verify_token_data(self, token_data: dict):
        if token_data and not token_data['refresh']:
            raise HTTPException(status_code=401, detail="Access tokens are not allowed for refresh token operations")        



     