from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    app_env: str = "development"
    api_port: int = 8745

    model_config = {"env_file": ".env"}


settings = Settings()
