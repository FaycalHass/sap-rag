import logging
from typing import List, Dict, Any, Optional
from . import embeddings, vector_store
from .chunking import detect_sap_module

logger = logging.getLogger(__name__)


def _rerank(
    chunks: List[Dict[str, Any]],
    question: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    detected_module = detect_sap_module(question)

    scored = []
    for chunk in chunks:
        score = chunk["score"]
        meta = chunk.get("metadata", {})

        # Boost chunks whose SAP module matches the query's detected module
        if detected_module and meta.get("module") == detected_module:
            score += 0.1

        scored.append({**chunk, "final_score": score})

    scored.sort(key=lambda x: x["final_score"], reverse=True)
    return scored[:top_k]


def search(
    question: str,
    n_results: int = 10,
    top_k: int = 5,
    module_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query_embedding = embeddings.embed_query(question)

    raw_results = vector_store.search(
        query_embedding=query_embedding,
        n_results=n_results,
        module_filter=module_filter,
    )

    if not raw_results:
        logger.info("No chunks found in vector store")
        return []

    reranked = _rerank(raw_results, question, top_k=top_k)
    logger.info(f"Retrieved {len(reranked)} chunks after reranking (from {len(raw_results)} candidates)")
    return reranked
