import io
import json
import hashlib
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

from .config import settings
from .chunking import create_chunks, detect_sap_module
from . import embeddings, vector_store

logger = logging.getLogger(__name__)

REGISTRY_FILE = "document_registry.json"


def _registry_path() -> Path:
    return Path(settings.CHROMA_PERSIST_DIR) / REGISTRY_FILE


def _load_registry() -> Dict[str, Any]:
    path = _registry_path()
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load registry: {e}")
    return {}


def _save_registry(registry: Dict[str, Any]) -> None:
    path = _registry_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)


def _compute_doc_id(filename: str, content: bytes) -> str:
    h = hashlib.sha256(filename.encode() + content[:1024]).hexdigest()
    return h[:16]


def _extract_text_pdf(content: bytes, filename: str) -> List[Tuple[str, int]]:
    import fitz  # PyMuPDF

    pages: List[Tuple[str, int]] = []
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")

            # Also try to extract tables as text
            try:
                tables = page.find_tables()
                for table in tables.tables:
                    table_text = table.to_pandas().to_string(index=False)
                    text += f"\n[TABLEAU]\n{table_text}\n"
            except Exception:
                pass

            if text.strip():
                pages.append((text, page_num + 1))
        doc.close()
    except Exception as e:
        logger.error(f"PDF extraction failed for {filename}: {e}")

    return pages


def _extract_text_docx(content: bytes, filename: str) -> List[Tuple[str, int]]:
    from docx import Document

    pages: List[Tuple[str, int]] = []
    try:
        doc = Document(io.BytesIO(content))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    full_text.append(f"[TABLEAU] {row_text}")
        if full_text:
            pages.append(("\n".join(full_text), 1))
    except Exception as e:
        logger.error(f"DOCX extraction failed for {filename}: {e}")

    return pages


def _extract_text_plain(content: bytes, filename: str) -> List[Tuple[str, int]]:
    try:
        text = content.decode("utf-8", errors="replace")
        if text.strip():
            return [(text, 1)]
    except Exception as e:
        logger.error(f"Text extraction failed for {filename}: {e}")
    return []


def _extract_text_html(content: bytes, filename: str) -> List[Tuple[str, int]]:
    try:
        import re
        text = content.decode("utf-8", errors="replace")
        # Strip HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"&nbsp;", " ", text)
        text = re.sub(r"&amp;", "&", text)
        text = re.sub(r"&lt;", "<", text)
        text = re.sub(r"&gt;", ">", text)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            return [(text, 1)]
    except Exception as e:
        logger.error(f"HTML extraction failed for {filename}: {e}")
    return []


def _extract_pages(content: bytes, filename: str) -> List[Tuple[str, int]]:
    ext = Path(filename).suffix.lower()
    extractors = {
        ".pdf": _extract_text_pdf,
        ".docx": _extract_text_docx,
        ".doc": _extract_text_docx,
        ".txt": _extract_text_plain,
        ".md": _extract_text_plain,
        ".html": _extract_text_html,
        ".htm": _extract_text_html,
    }
    extractor = extractors.get(ext)
    if not extractor:
        logger.warning(f"Unsupported file type: {ext}")
        return []
    return extractor(content, filename)


def ingest_bytes(content: bytes, filename: str) -> Dict[str, Any]:
    doc_id = _compute_doc_id(filename, content)
    registry = _load_registry()

    if doc_id in registry:
        logger.info(f"Document {filename} already ingested (id: {doc_id})")
        return registry[doc_id]

    logger.info(f"Ingesting document: {filename} ({len(content)} bytes)")
    pages = _extract_pages(content, filename)

    if not pages:
        raise ValueError(f"Could not extract text from {filename}. Check file format.")

    all_chunks: List[Dict[str, Any]] = []
    for text, page_num in pages:
        page_chunks = create_chunks(
            text=text,
            source_name=filename,
            page_num=page_num,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP,
        )
        all_chunks.extend(page_chunks)

    if not all_chunks:
        raise ValueError(f"No text chunks could be extracted from {filename}")

    # Detect primary module from all text
    full_text = " ".join(c["text"] for c in all_chunks[:20])
    primary_module = detect_sap_module(full_text)

    # Generate embeddings
    texts = [c["text"] for c in all_chunks]
    chunk_embeddings = embeddings.embed_texts(texts)

    # Store in vector store
    vector_store.add_chunks(all_chunks, chunk_embeddings, doc_id)

    # Update registry
    doc_info = {
        "id": doc_id,
        "name": filename,
        "chunks": len(all_chunks),
        "module": primary_module,
        "ingested_at": datetime.utcnow().isoformat(),
        "size_bytes": len(content),
    }
    registry[doc_id] = doc_info
    _save_registry(registry)

    logger.info(f"Successfully ingested {filename}: {len(all_chunks)} chunks, module={primary_module}")
    return doc_info


def ingest_file(file_path: str) -> Dict[str, Any]:
    path = Path(file_path)
    with open(path, "rb") as f:
        content = f.read()
    return ingest_bytes(content, path.name)


def get_all_documents() -> List[Dict[str, Any]]:
    registry = _load_registry()
    return list(registry.values())


def delete_document(doc_id: str) -> bool:
    registry = _load_registry()
    if doc_id not in registry:
        return False

    deleted = vector_store.delete_document(doc_id)
    logger.info(f"Deleted {deleted} chunks for document {doc_id}")

    del registry[doc_id]
    _save_registry(registry)
    return True


def get_stats() -> Dict[str, Any]:
    registry = _load_registry()
    vs_stats = vector_store.get_collection_stats()

    return {
        "total_documents": len(registry),
        "total_chunks": vs_stats["total_chunks"],
        "modules_covered": vs_stats["modules"],
    }


def scan_documents_folder() -> List[Dict[str, Any]]:
    docs_path = Path(settings.DOCUMENTS_DIR)
    if not docs_path.exists():
        return []

    supported = {".pdf", ".docx", ".doc", ".txt", ".md", ".html", ".htm"}
    results = []

    for file_path in docs_path.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in supported:
            try:
                result = ingest_file(str(file_path))
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to ingest {file_path.name}: {e}")

    return results
