import json
import logging
import time
from collections import defaultdict
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .models import (
    ChatRequest,
    DeleteResponse,
    DocumentInfo,
    StatsResponse,
    UploadResponse,
)
from . import embeddings, generation, ingestion, retrieval, vector_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SAP RAG API",
    description="API pour interroger la documentation SAP via RAG",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory rate limiter: 30 requests/minute per real client IP
_rate_store: Dict[str, list] = defaultdict(list)
RATE_LIMIT = 30
RATE_WINDOW = 60


def _get_client_ip(request: Request) -> str:
    # On HF Spaces / behind a reverse proxy, request.client.host is the proxy IP.
    # The real client IP is in X-Forwarded-For (first entry).
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    timestamps = _rate_store[ip]
    _rate_store[ip] = [t for t in timestamps if now - t < RATE_WINDOW]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return False
    _rate_store[ip].append(now)
    return True


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Starting SAP RAG API...")
    Path(settings.DOCUMENTS_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)

    # Warm up the embedding model and ChromaDB so the FIRST user query is fast.
    # Without this, the first /api/chat blocks 30-120s while ONNX loads, and the
    # SSE stream never emits — the UI looks frozen until the user retries.
    try:
        embeddings.embed_query("warmup")
        vector_store.get_collection()
        logger.info("Embedding model and vector store warmed up")
    except Exception as e:
        logger.warning(f"Warm-up failed (first query will be slow): {e}")

    # Scan documents folder for pre-existing files
    try:
        results = ingestion.scan_documents_folder()
        if results:
            logger.info(f"Auto-ingested {len(results)} documents from {settings.DOCUMENTS_DIR}")
    except Exception as e:
        logger.warning(f"Auto-ingestion scan failed: {e}")

    logger.info("SAP RAG API started successfully")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "model": settings.GROQ_MODEL}


@app.post("/api/chat")
async def chat(request: Request, chat_request: ChatRequest):
    client_ip = _get_client_ip(request)

    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Trop de requêtes. Limite : 30 questions par minute.",
        )

    question = chat_request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="La question ne peut pas être vide.")

    if len(question) > 2000:
        raise HTTPException(status_code=400, detail="La question est trop longue (max 2000 caractères).")

    async def event_stream():
        try:
            chunks = retrieval.search(
                question=question,
                n_results=10,
                top_k=settings.MAX_CHUNKS_PER_QUERY,
                module_filter=chat_request.module_filter,
            )

            async for sse_chunk in generation.generate_stream(
                question=question,
                chunks=chunks,
                use_web_search=chat_request.use_web_search,
                language=chat_request.language,
            ):
                yield sse_chunk

        except Exception as e:
            logger.exception(f"Chat error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.post("/api/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    allowed_ext = {".pdf", ".docx", ".doc", ".txt", ".md", ".html", ".htm"}
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté: {suffix}. Formats acceptés: {', '.join(allowed_ext)}",
        )

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 50 MB).")

    try:
        doc_info = ingestion.ingest_bytes(content, file.filename or "document")
        return UploadResponse(
            message=f"Document '{file.filename}' ingéré avec succès.",
            document_id=doc_info["id"],
            chunks_created=doc_info["chunks"],
            module_detected=doc_info.get("module"),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'ingestion: {str(e)}")


@app.get("/api/documents")
async def list_documents():
    docs = ingestion.get_all_documents()
    return [DocumentInfo(**d) for d in docs]


@app.delete("/api/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str):
    success = ingestion.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' non trouvé.")
    return DeleteResponse(
        message=f"Document '{doc_id}' supprimé avec succès.",
        document_id=doc_id,
    )


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    stats = ingestion.get_stats()
    return StatsResponse(**stats)


# Serve frontend static files (built React app) at the root.
# Must be registered AFTER all /api routes so they take precedence.
_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if _STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(_STATIC_DIR), html=True), name="static")
