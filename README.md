---
title: SAP RAG Assistant
emoji: 📚
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Assistant IA pour la documentation SAP — RAG + Llama 3.3
---

# Assistant Documentation SAP — RAG

Application RAG (Retrieval-Augmented Generation) open source pour interroger la documentation SAP en français. Basée sur **Llama 3.3 70B via Groq** (gratuit) + ChromaDB + React.

## Fonctionnalités

- **Chat en français** sur tous les modules SAP (FI, CO, MM, SD, PP, HR, ABAP, BASIS, S/4HANA, BTP)
- **RAG sur vos docs internes** : PDF, DOCX, TXT, MD, HTML indexés automatiquement
- **Détection automatique du module SAP** pour chaque document et question
- **Streaming temps réel** des réponses (Server-Sent Events)
- **Sources citées** : docs internes (fichier, page, section)
- **Interface web professionnelle** avec historique des conversations
- **Upload de documents** via drag & drop

## Stack technique

- **Backend** : Python 3.11 + FastAPI + ChromaDB + sentence-transformers (`all-MiniLM-L6-v2`)
- **LLM** : Llama 3.3 70B via [Groq](https://console.groq.com) (API gratuite)
- **Frontend** : React 18 + Vite
- **Déploiement** : Docker (un seul container — backend + frontend statique)

## Démarrage local

### Prérequis
- Docker Desktop installé
- Une clé API Groq gratuite — [console.groq.com/keys](https://console.groq.com/keys)

### Lancer en 3 étapes

```bash
git clone https://github.com/FaycalHass/sap-rag.git
cd sap-rag
cp backend/.env.example .env
# Éditer .env et coller votre clé Groq
docker-compose up -d
```

L'application est disponible sur **http://localhost** (premier démarrage : ~3 min pour télécharger le modèle d'embedding).

## Déploiement Hugging Face Spaces (gratuit)

1. Crée un compte sur [huggingface.co](https://huggingface.co)
2. **New Space** → SDK : **Docker** → Hardware : **CPU basic (gratuit)**
3. Lie ton dépôt GitHub ou copie les fichiers
4. Dans **Settings → Variables and secrets**, ajoute le secret : `GROQ_API_KEY`
5. L'app se construit automatiquement → URL publique partageable

## Ajouter des documents SAP

### Via l'interface web
Cliquer sur **"📤 Ajouter docs"** → glisser-déposer vos PDF/DOCX.

### Via le dossier documents (en local)
```bash
cp ma-doc-sap.pdf backend/documents/
docker-compose restart backend
```

## Formats supportés

| Format | Extension |
|--------|-----------|
| PDF | `.pdf` |
| Word | `.docx`, `.doc` |
| Texte | `.txt`, `.md` |
| HTML | `.html`, `.htm` |

Limite : 50 MB par fichier.

## Architecture

```
Utilisateur → FastAPI (port 7860) → ChromaDB + Groq (Llama 3.3 70B)
                  ↑
            Frontend React (statique servi par FastAPI)
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `GROQ_API_KEY` | — | **Obligatoire**. Clé API Groq |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Modèle Groq |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Modèle d'embedding local |
| `MAX_CHUNKS_PER_QUERY` | `5` | Passages retournés par query |
| `CHUNK_SIZE` | `500` | Taille des chunks (tokens) |
| `CHUNK_OVERLAP` | `50` | Overlap entre chunks |

## Licence

MIT — libre de réutilisation, modification et distribution.
