from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost/financeiro"
    FIREBASE_PROJECT_ID: str = ""
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # APIs de cotações
    BRAPI_TOKEN: str = ""
    HG_BRASIL_KEY: str = ""

    # TTLs de cache em segundos
    CACHE_TTL_QUOTE: int = 300      # 5 minutos — cotações
    CACHE_TTL_MACRO: int = 3600     # 1 hora    — dados BCB
    CACHE_TTL_DIVIDENDS: int = 7200  # 2 horas   — dividendos

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()