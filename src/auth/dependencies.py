from fastapi.security import HTTPBearer
from .utils import decode_access_token
from fastapi import Request, Depends
from src.db.main import get_session
from fastapi import HTTPException
from fastapi.security.http import HTTPAuthorizationCredentials
from src.db.redis import token_in_blocklist
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.service import AuthService
from typing import List, Any
from src.auth.models import User
from src.auth.exceptions import AccountNotVerified, InsufficientPermission

user_service = AuthService()

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
        
        if await token_in_blocklist(token_data['jti']):
            raise HTTPException(status_code=401, detail="Token has been revoked")
    

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



async def get_current_user(
    token_details: dict = Depends(AccessTokenScheme()),
    session: AsyncSession = Depends(get_session),
):
    user_email = token_details["user"]["email"]

    user = await user_service.get_user_by_mail(session, user_email)

    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> Any:
        if not current_user.is_verified:
            raise AccountNotVerified()
        if current_user.role in self.allowed_roles:
            return True

        raise InsufficientPermission()