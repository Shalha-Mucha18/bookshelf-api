from fastapi import APIRouter, Depends
from .schemas import UserCreateModel, UserModel, UserLoginModel
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import AuthService
from .utils import create_access_token
from src.db.main import get_session
from fastapi import HTTPException, status
from datetime import timedelta
from fastapi.responses import JSONResponse
from .dependencies import AccessTokenScheme, RefreshTokenScheme
import datetime


auth = APIRouter()


auth_service = AuthService()


REFRESH_TOKEN_EXPIRY = 2


@auth.post("/sign-up", response_model=UserModel, status_code=status.HTTP_201_CREATED)
async def sign_up(user_data: UserCreateModel,session: AsyncSession = Depends(get_session)):
    user_eamil = user_data.email
    if await auth_service.user_exists(session, user_eamil):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")
    
    new_user = await auth_service.create_user(session, user_data)
    return new_user

@auth.post("/loogin")
async def login(user_data: UserLoginModel, session: AsyncSession = Depends(get_session)):
    user_email = user_data.email
    user_password = user_data.password

    user = await auth_service.get_user_by_mail(session, user_email)


    if user is not None:

        password_valid = auth_service.verify_password(user_password, user.hashed_password)

        if password_valid:
            access_token = create_access_token(user_data={"email": user.email, "user_id": str(user.uid)})
            
            refresh_token = create_access_token(
                user_data={"email": user.email, "user_id": str(user.uid)},
                refresh=True,
                expiry=timedelta(days=REFRESH_TOKEN_EXPIRY),
            )

            return JSONResponse(
                content={
                    "message": "Login successful",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user": {"email": user.email, "uid": str(user.uid)},
                }
            )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")


@auth.post("/refresh")

async def refresh_token(token_data=Depends(RefreshTokenScheme())):

    expiery_time = token_data.get("exp")


    if expiery_time and datetime.datetime.fromtimestamp(expiery_time) < datetime.datetime.now():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")
    
    new_access_token = create_access_token(user_data =token_data['user'])

    return JSONResponse(content={"access_token": new_access_token})