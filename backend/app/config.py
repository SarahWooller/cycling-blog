import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VeloTales Cycling API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database URL: Auto-detects PostgreSQL on Railway, falls back to SQLite locally
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./velotales.db")
    
    # Fix Railway's legacy 'postgres://' URL scheme for SQLAlchemy
    @property
    def sync_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    # Security & JWT Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "velotales-cycling-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS Allowed Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://*.railway.app",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
