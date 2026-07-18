from fastapi import HTTPException, status


class AccountNotVerified(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Account not verified")


class InsufficientPermission(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
