from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    DATABASE_URL: str = "postgresql://user:pass@localhost/chatbot_db"
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    SECRET_KEY: str = "change-me-in-production"

    class Config:
        env_file = ".env"


settings = Settings()
