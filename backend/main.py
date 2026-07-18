import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

from src import app

__all__ = ["app"]
