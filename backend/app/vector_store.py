import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
from .config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "sap_documentation"

_client: Optional[chromadb.PersistentClient] = None
_collection = None


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        logger.info(f"ChromaDB client initialized at {settings.CHROMA_PERSIST_DIR}")
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"Collection '{COLLECTION_NAME}' ready with {_collection.count()} documents")
    return _collection


def add_chunks(
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]],
    doc_id: str,
) -> int:
    collection = get_collection()

    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    texts = [c["text"] for c in chunks]
    metadatas = []

    for c in chunks:
        meta = {k: (v if v is not None else "") for k, v in c["metadata"].items()}
        meta["doc_id"] = doc_id
        metadatas.append(meta)

    collection.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)
    logger.info(f"Added {len(chunks)} chunks for document {doc_id}")
    return len(chunks)


def search(
    query_embedding: List[float],
    n_results: int = 10,
    module_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    collection = get_collection()

    if collection.count() == 0:
        return []

    where = {"module": module_filter} if module_filter else None

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as e:
        logger.error(f"ChromaDB query failed: {e}")
        return []

    chunks = []
    if results["documents"] and results["documents"][0]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            score = 1.0 - dist  # Convert cosine distance to similarity
            chunks.append({"text": doc, "metadata": meta, "score": score})

    return chunks


def delete_document(doc_id: str) -> int:
    collection = get_collection()
    existing = collection.get(where={"doc_id": doc_id})
    if not existing["ids"]:
        return 0
    collection.delete(ids=existing["ids"])
    deleted = len(existing["ids"])
    logger.info(f"Deleted {deleted} chunks for document {doc_id}")
    return deleted


def get_document_ids() -> List[str]:
    collection = get_collection()
    if collection.count() == 0:
        return []
    results = collection.get(include=["metadatas"])
    doc_ids = set()
    for meta in results["metadatas"]:
        if meta and "doc_id" in meta:
            doc_ids.add(meta["doc_id"])
    return list(doc_ids)


def get_collection_stats() -> Dict[str, Any]:
    collection = get_collection()
    total = collection.count()

    if total == 0:
        return {"total_chunks": 0, "modules": []}

    results = collection.get(include=["metadatas"])
    modules = set()
    for meta in results["metadatas"]:
        if meta and meta.get("module"):
            modules.add(meta["module"])

    return {"total_chunks": total, "modules": sorted(list(modules))}
