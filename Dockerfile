# Stage 1 — Build frontend React
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2 — Backend FastAPI + frontend statique
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libglib2.0-0 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pré-télécharge le modèle d'embedding ONNX
RUN python -c "from chromadb.utils.embedding_functions import DefaultEmbeddingFunction; DefaultEmbeddingFunction()(['warmup'])"

# Code backend
COPY backend/app ./app

# Build frontend depuis le stage 1
COPY --from=frontend-builder /frontend/dist ./static

# Stockage éphémère (réinitialisé à chaque restart sur HF Spaces gratuit)
RUN mkdir -p /tmp/documents /tmp/chroma_data && chmod 777 /tmp/documents /tmp/chroma_data

ENV CHROMA_PERSIST_DIR=/tmp/chroma_data
ENV DOCUMENTS_DIR=/tmp/documents
ENV HF_HOME=/tmp/hf_cache

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
