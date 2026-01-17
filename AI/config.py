import os
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

class Config:
    """
    Centralized configuration for RAG pipeline.
    """
    
    # Pinecone settings
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME")
    PINECONE_NAMESPACE: Optional[str] = os.getenv("PINECONE_NAMESPACE", None)
    
    # Embedding model settings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-mpnet-base-v2"
    EMBEDDING_DEVICE: str = "cpu"  # Change to "cuda" for GPU
    EMBEDDING_BATCH_SIZE: int = 32
    NORMALIZE_EMBEDDINGS: bool = True
    
    # Retrieval settings
    DEFAULT_TOP_K: int = 5
    MAX_TOP_K: int = 20
    
    # Cache settings
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000
    
    # API settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4

    # CORS settings (comma-separated origins in .env, e.g. "http://localhost:5173,http://localhost:5174")
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
        if o.strip()
    ]
    # Allow any localhost port in dev (covers Vite's dynamic port changes)
    CORS_ORIGIN_REGEX: str = os.getenv(
        "CORS_ORIGIN_REGEX",
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    )
    
    # Groq LLM settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_TEMPERATURE: float = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
    GROQ_MAX_TOKENS: int = int(os.getenv("GROQ_MAX_TOKENS", "1024"))
    
    # Logging
    LOG_LEVEL: str = "INFO"


config = Config()