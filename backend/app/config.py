from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "VitalCare AI"
    APP_VERSION: str = "1.0.0"

    SECRET_KEY: str = "CHANGE_THIS_TO_A_SECURE_SECRET_KEY_FOR_PRODUCTION"
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480


settings = Settings()