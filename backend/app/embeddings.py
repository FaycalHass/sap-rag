import logging
from typing import List

from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

logger = logging.getLogger(__name__)

_ef: DefaultEmbeddingFunction | None = None


def _get_ef() -> DefaultEmbeddingFunction:
    global _ef
    if _ef is None:
        logger.info("Initializing ChromaDB DefaultEmbeddingFunction (ONNX)")
        _ef = DefaultEmbeddingFunction()
        logger.info("Embedding function ready")
    return _ef


def embed_texts(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    ef = _get_ef()
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_embeddings = ef(batch)
        results.extend([list(e) for e in batch_embeddings])
        logger.debug(f"Embedded batch {i // batch_size + 1}, {len(batch)} texts")
    return results


def embed_query(query: str) -> List[float]:
    ef = _get_ef()
    return list(ef([query])[0])
