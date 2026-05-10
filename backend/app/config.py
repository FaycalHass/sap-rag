from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GROQ_API_KEY: str
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    DOCUMENTS_DIR: str = "./documents"
    MAX_CHUNKS_PER_QUERY: int = 5
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    model_config = {"env_file": ".env"}


settings = Settings()
