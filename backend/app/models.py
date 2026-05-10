from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    module_filter: Optional[str] = None
    use_web_search: bool = True
    language: str = 'fr'


class Source(BaseModel):
    type: str  # "internal" or "web"
    title: str
    url: Optional[str] = None
    file: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    module: Optional[str] = None
    score: Optional[float] = None


class DocumentInfo(BaseModel):
    id: str
    name: str
    chunks: int
    module: Optional[str] = None
    ingested_at: str
    size_bytes: int = 0


class UploadResponse(BaseModel):
    message: str
    document_id: str
    chunks_created: int
    module_detected: Optional[str] = None


class StatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    modules_covered: List[str]


class DeleteResponse(BaseModel):
    message: str
    document_id: str
