import sys
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://graph_user:graph_password@localhost:5432/graph_db"

    # Security
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GRAPH Educational Platform"

    # CORS — includes production and dev origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://graph.ranepa.ru",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Fail fast if DATABASE_URL looks like a placeholder in production
if "CHANGE_ME" in settings.DATABASE_URL:
    print("FATAL: DATABASE_URL contains placeholder value. Set a real password in .env.prod", file=sys.stderr)
    sys.exit(1)

