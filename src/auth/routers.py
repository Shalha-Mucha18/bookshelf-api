from fastapi import APIRouter, Depends, HTTPException
from .schemas import (
    UserCreateModel,
    UserModel,
    UserLoginModel,
    PasswordResetRequestModel,
    PasswordResetConfirmModel,
)
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import AuthService
from .utils import create_access_token, generated_password_hash
from src.db.main import get_session
from fastapi import status
from datetime import timedelta
from fastapi.responses import JSONResponse
from .dependencies import AccessTokenScheme, RefreshTokenScheme
import datetime
from src.db.redis import add_jti_to_blocklist, token_in_blocklist
from src.auth.dependencies import get_current_user
from .dependencies import RoleChecker
from typing import Any
from src.auth.schemas import UserBooksModel
from error import UserAlreadyExists, UsernameAlreadyExists, InvalidCredentials, InvalidToken
from src.mail import mail, create_message
from src.auth.schemas import EmailModel
from src.books.config import settings as Config
from .utils import (
    create_url_safe_token,
    decode_url_safe_token,
)
from src.celery_tasks import send_email

auth = APIRouter()


auth_service = AuthService()
role_checker = RoleChecker(allowed_roles=["admin", "user"])

REFRESH_TOKEN_EXPIRY = 2

@auth.post("/sign-up", status_code=status.HTTP_201_CREATED)
async def sign_up(
    user_data: UserCreateModel,
    session: AsyncSession = Depends(get_session),
):
    """
    Create user account using email, username, first_name, last_name
    params:
        user_data: UserCreateModel
    """
    email = user_data.email

    if await auth_service.user_exists(session, email):
        raise UserAlreadyExists()

    if await auth_service.username_exists(session, user_data.username):
        raise UsernameAlreadyExists()

    new_user = await auth_service.create_user(session, user_data)

    token = create_url_safe_token({"email": email})

    link = f"http://{Config.DOMAIN}/api/v1.0.0/auth/verify/{token}"

    html = f"""
    <h1>Verify your Email</h1>
    <p>Please click this <a href="{link}">link</a> to verify your email</p>
    <p>Or copy this URL into your browser:</p>
    <p>{link}</p>
    """

    subject = "Verify Your email"

    send_email.delay([email], subject, html)

    return {
        "message": "Account Created! Check email to verify your account",
        "user": UserModel.model_validate(new_user),
    }

@auth.get("/verify/{token}")
async def verify_email(token: str, session: AsyncSession = Depends(get_session)):
    token_data = decode_url_safe_token(token)

    if token_data is None:
        raise InvalidToken()

    user = await auth_service.get_user_by_mail(session, token_data["email"])

    if user is None:
        raise InvalidToken()

    user.is_verified = True
    session.add(user)
    await session.commit()

    return JSONResponse(content={"message": "Account verified successfully"})

@auth.post("/login")
async def login(user_data: UserLoginModel, session: AsyncSession = Depends(get_session)):
    user_email = user_data.email
    user_password = user_data.password

    user = await auth_service.get_user_by_mail(session, user_email)


    if user is not None:

        password_valid = auth_service.verify_password(user_password, user.hashed_password)

        if password_valid:
            access_token = create_access_token(user_data={"email": user.email, "user_id": str(user.uid), "role": user.role})
            
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

    raise InvalidCredentials()




@auth.get("/me", response_model=UserBooksModel)
async def get_current_user_info(current_user: UserModel = Depends(get_current_user),_bool: Any = Depends(role_checker)):
    return current_user


@auth.post("/refresh")

async def refresh_token(token_data=Depends(RefreshTokenScheme())):

    expiery_time = token_data.get("exp")


    if expiery_time and datetime.datetime.fromtimestamp(expiery_time) < datetime.datetime.now():
        raise InvalidToken()
    
    new_access_token = create_access_token(user_data =token_data['user'])

    return JSONResponse(content={"access_token": new_access_token})


@auth.post("/logout")
async def logout(token_data=Depends(AccessTokenScheme())):

    jti = token_data.get("jti")

    if jti:
        await add_jti_to_blocklist(jti)
        return JSONResponse(content={"message": "Logout successful"})

    raise InvalidToken()


@auth.post("/send_mail")
async def send_mail(email_data: EmailModel, _admin: Any = Depends(RoleChecker(allowed_roles=["admin"]))):
    recipients = email_data.addresses

    html = "<h1>Welcome to the app</h1>"
    subject = "Welcome to our app"

    send_email.delay(recipients, subject, html)

    return {"message": "Email sent successfully"}


@auth.post("/password-reset-request")
async def password_reset_request(
    email_data: PasswordResetRequestModel,
    session: AsyncSession = Depends(get_session),
):
    email = email_data.email

    # Only send if the account exists, but respond identically either way
    # so the endpoint can't be used to probe which emails are registered.
    if await auth_service.user_exists(session, email):
        token = create_url_safe_token({"email": email})

        link = f"http://{Config.DOMAIN}/api/v1.0.0/auth/password-reset-confirm/{token}"

        html_message = f"""
        <h1>Reset Your Password</h1>
        <p>Please click this <a href="{link}">link</a> to reset your password</p>
        <p>Or copy this URL into your browser:</p>
        <p>{link}</p>
        """
        subject = "Reset Your Password"

        send_email.delay([email], subject, html_message)

    return JSONResponse(
        content={
            "message": "Please check your email for instructions to reset your password",
        },
        status_code=status.HTTP_200_OK,
    )


@auth.post("/password-reset-confirm/{token}")
async def reset_account_password(
    token: str,
    passwords: PasswordResetConfirmModel,
    session: AsyncSession = Depends(get_session),
):
    new_password = passwords.new_password
    confirm_password = passwords.confirm_new_password

    if new_password != confirm_password:
        raise HTTPException(
            detail="Passwords do not match", status_code=status.HTTP_400_BAD_REQUEST
        )

    token_data = decode_url_safe_token(token)

    if token_data is None:
        raise InvalidToken()

    user = await auth_service.get_user_by_mail(session, token_data["email"])

    if user is None:
        raise InvalidToken()

    user.hashed_password = generated_password_hash(new_password)
    session.add(user)
    await session.commit()

    return JSONResponse(
        content={"message": "Password reset Successfully"},
        status_code=status.HTTP_200_OK,
    )