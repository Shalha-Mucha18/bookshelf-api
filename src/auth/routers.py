from fastapi import APIRouter, Depends
from .schemas import UserCreateModel, UserModel
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import AuthService
from src.db.main import get_session
from fastapi import HTTPException, status

auth = APIRouter()


auth_service = AuthService()


@auth.post("/sign-up", response_model=UserModel, status_code=status.HTTP_201_CREATED)
async def sign_up(user_data: UserCreateModel,session: AsyncSession = Depends(get_session)):
    user_eamil = user_data.email
    if await auth_service.user_exists(session, user_eamil):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists")
    
    new_user = await auth_service.create_user(session, user_data)
    return new_user