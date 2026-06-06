from src.db.models import User
from sqlmodel import select, desc
from sqlmodel.ext.asyncio.session import AsyncSession
from .utils import generated_password_hash, verify_password
from .schemas import UserCreateModel

class AuthService:

    async def get_user_by_mail(self,session: AsyncSession, email: str) -> User:
        statement = select(User).where(User.email == email)
        result = await session.exec(statement)

        user = result.first()

        return user
    
    async def user_exists(self, session: AsyncSession, email: str) -> bool:
        user = await self.get_user_by_mail(session, email)
        
        if user is not None:
            return True
        else:
            return False

    async def create_user(self, session: AsyncSession, user_data: UserCreateModel) -> User:
        user_data_dict = user_data.model_dump()

        new_user = User(
            username=user_data_dict["username"],
            email=user_data_dict["email"],
            first_name=user_data_dict["first_name"],
            last_name=user_data_dict["last_name"],
            hashed_password=generated_password_hash(user_data_dict["password"]),
        )
        new_user.role = "user"

        session.add(new_user)
        await session.commit()

        return new_user

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return verify_password(plain_password, hashed_password)
