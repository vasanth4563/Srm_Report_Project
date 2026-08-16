import os
from pydantic_settings import BaseSettings

# Simple robust manual .env loader
def load_env_file():
    paths = [".env", "backend/.env", "../.env"]
    for path in paths:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()
            print(f"Loaded environment variables from: {path}")
            break

load_env_file()

class Settings(BaseSettings):
    DB_TYPE: str = "postgresql"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "report"

    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production-1234567890")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    @property
    def DATABASE_URL(self) -> str:
        direct_url = os.getenv("DATABASE_URL")
        if direct_url:
            if direct_url.startswith("postgres://"):
                return direct_url.replace("postgres://", "postgresql://", 1)
            return direct_url
        from urllib.parse import quote_plus
        encoded_password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        password_part = f":{encoded_password}" if encoded_password else ""
        if self.DB_TYPE == "mysql":
            return f"mysql+pymysql://{self.DB_USER}{password_part}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        else:
            return f"postgresql://{self.DB_USER}{password_part}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()
