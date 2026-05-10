# Assistant Documentation SAP — RAG

Application RAG (Retrieval-Augmented Generation) pour interroger la documentation SAP en français. Basée sur Claude (Anthropic) + ChromaDB + React.

## Fonctionnalités

- **Chat en français** sur tous les modules SAP (FI, CO, MM, SD, PP, HR, ABAP, BASIS, S/4HANA, BTP)
- **RAG sur vos docs internes** : PDF, DOCX, TXT, MD, HTML indexés automatiquement
- **Détection automatique du module SAP** pour chaque document et question
- **Streaming temps réel** des réponses (Server-Sent Events)
- **Sources citées** : docs internes (fichier, page, section) + web si besoin
- **Interface web professionnelle** avec historique des conversations
- **Upload de documents** via drag & drop ou l'interface

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé
- Une clé API Anthropic ([console.anthropic.com](https://console.anthropic.com/))

## Installation en 3 étapes

### 1. Cloner le projet

```bash
git clone <url-du-repo> sap-rag
cd sap-rag
```

### 2. Configurer la clé API

```bash
cp .env.example .env
```

Ouvrir `.env` et remplacer `sk-ant-xxxxx` par votre vraie clé API Anthropic.

### 3. Lancer l'application

```bash
docker-compose up -d
```

Le premier démarrage télécharge le modèle d'embedding (~90 MB) — cela peut prendre 3-5 minutes.

**L'application est disponible sur : http://localhost**

## Ajouter des documents SAP

### Option A : Via l'interface web (recommandée)
Cliquer sur **"📤 Ajouter docs"** dans l'interface → glisser-déposer vos fichiers PDF/DOCX.

### Option B : Via le dossier documents
Copier vos fichiers dans `backend/documents/` — ils seront indexés automatiquement au prochain redémarrage.

```bash
cp ma-documentation-sap.pdf backend/documents/
docker-compose restart backend
```

## Formats supportés

| Format | Extension | Notes |
|--------|-----------|-------|
| PDF | `.pdf` | Texte + tableaux extraits |
| Word | `.docx`, `.doc` | Texte + tableaux |
| Texte | `.txt`, `.md` | Encodage UTF-8 |
| HTML | `.html`, `.htm` | Tags HTML supprimés |

## Architecture

```
Utilisateur → React (nginx:80) → FastAPI (8000) → ChromaDB + Anthropic Claude
                                     ↑
                              Documents SAP indexés
                              (sentence-transformers)
```

- **Embeddings** : `all-MiniLM-L6-v2` (gratuit, local, ~80 MB)
- **Vector store** : ChromaDB avec persistance sur disque
- **LLM** : Claude claude-sonnet-4-20250514 avec web search
- **Chunking** : ~500 tokens avec 50 tokens d'overlap, découpage par sections

## Commandes utiles

```bash
# Démarrer
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Arrêter
docker-compose down

# Redémarrer le backend seul (après ajout de docs)
docker-compose restart backend

# Vider tous les documents indexés et recommencer
docker-compose down
rm -rf backend/chroma_data/*
docker-compose up -d
```

## Déploiement en production

### Option A : Serveur interne (données sensibles SAP)

```bash
# Sur le serveur Linux
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
git clone <repo> sap-rag && cd sap-rag
cp .env.example .env && nano .env  # Ajouter la clé API

# Lancer
docker compose up -d
```

Configurer ensuite un reverse proxy (Caddy recommandé pour HTTPS automatique) :

```
sap-docs.monentreprise.com {
    reverse_proxy localhost:80
}
```

### Option B : Railway / Render (cloud rapide)

1. Pousser sur GitHub (repo privé)
2. Connecter sur [Railway](https://railway.app) ou [Render](https://render.com)
3. Ajouter la variable `ANTHROPIC_API_KEY`
4. Déployer → URL HTTPS automatique

### Option C : VPS (Hetzner, OVH, DigitalOcean — ~5€/mois)

```bash
# Installer Caddy pour HTTPS automatique
apt install -y caddy
# Configurer /etc/caddy/Caddyfile
# Lancer docker compose up -d
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `ANTHROPIC_API_KEY` | — | **Obligatoire**. Clé API Anthropic |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Modèle Claude à utiliser |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Modèle d'embedding local |
| `MAX_CHUNKS_PER_QUERY` | `5` | Nombre de passages retournés par query |
| `CHUNK_SIZE` | `500` | Taille des chunks en tokens |
| `CHUNK_OVERLAP` | `50` | Overlap entre chunks |

## Dépannage

**Le backend ne démarre pas :**
```bash
docker-compose logs backend
# Vérifier que ANTHROPIC_API_KEY est bien définie dans .env
```

**Les réponses ne s'affichent pas en streaming :**
- Vérifier que nginx n'est pas derrière un autre proxy qui bufferise
- Ajouter `proxy_buffering off;` dans la config nginx upstream

**Erreur "Document déjà ingéré" :**
- Normal — les documents sont dédoublonnés par hash de contenu
- Pour forcer la réingestion, supprimer le doc via l'API ou l'interface

**Mémoire insuffisante :**
- Le modèle d'embedding nécessite ~500 MB RAM
- Recommandé : 2 GB RAM minimum, 4 GB pour le confort
