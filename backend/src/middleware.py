from fastapi import FastAPI
from fastapi.requests import Request
import time
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.middleware.trustedhost import TrustedHostMiddleware


def format_time(seconds: float) -> str:
    if seconds < 0.001:
        return f"{seconds*1000000:.2f}µs"
    elif seconds < 1:
        return f"{seconds*1000:.2f}ms"
    else:
        return f"{seconds:.2f}s"


def register_middleware(app: FastAPI):

    @app.middleware("http")
    async def custom_logging(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        processing_time = time.time() - start_time

        message = (
            f"{request.client.host}:{request.client.port} - "
            f"{request.method} {request.url.path} - "
            f"response completed {response.status_code} - {format_time(processing_time)}"
        )
        print(message)
        return response
    app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,)

   
    def register_middleware(app: FastAPI):
        ...  # rest of the middleware code
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["localhost", "127.0.0.1"],
    )
    



