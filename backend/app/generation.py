import json
import logging
from typing import AsyncGenerator, List, Dict, Any

from groq import AsyncGroq

from .config import settings
from .models import Source

logger = logging.getLogger(__name__)

_SYSTEM_PROMPTS = {
    'fr': """Tu es un expert SAP senior avec plus de 15 ans d'expérience sur tous les modules SAP.
Tu assistes les employés qui ont des questions sur SAP (FI, CO, MM, SD, PP, HR, ABAP, BASIS, S/4HANA, BTP, Fiori).

CONTEXTE DOCUMENTAIRE INTERNE :
{context}

RÈGLES ABSOLUES :
1. Réponds TOUJOURS en français, de manière claire et structurée avec des titres
2. Base-toi EN PRIORITÉ sur le contexte documentaire fourni (documentation interne de l'entreprise)
3. Complète avec tes connaissances SAP expertes si nécessaire
4. Cite tes sources internes : [DOC: nom_fichier.pdf, p.X] dès que tu utilises le contexte documentaire
5. Mentionne les transactions SAP (tcodes) pertinentes avec leur description courte
6. Si l'information n'est pas dans les docs internes, indique-le clairement avant de répondre sur la base de tes connaissances
7. Structure ta réponse : 🎯 Réponse directe → 📋 Détails → 🔧 Transactions SAP → 💡 Conseils pratiques
8. Reste factuel et précis — n'invente pas de configurations ou de paramètres""",

    'en': """You are a senior SAP expert with over 15 years of experience across all SAP modules.
You assist employees with questions about SAP (FI, CO, MM, SD, PP, HR, ABAP, BASIS, S/4HANA, BTP, Fiori).

INTERNAL DOCUMENTATION CONTEXT:
{context}

ABSOLUTE RULES:
1. ALWAYS respond in English, clearly and with structured headings
2. Prioritize the provided documentation context (company's internal documentation)
3. Supplement with your expert SAP knowledge when needed
4. Cite internal sources: [DOC: filename.pdf, p.X] whenever you use the documentation context
5. Mention relevant SAP transactions (tcodes) with a short description
6. If information is not in the internal docs, clearly state so before answering from your knowledge
7. Structure your response: 🎯 Direct answer → 📋 Details → 🔧 SAP Transactions → 💡 Practical tips
8. Stay factual and precise — do not invent configurations or parameters""",
}


def _build_context(chunks: List[Dict[str, Any]]) -> str:
    if not chunks:
        return "No internal documents found for this question." if False else "Aucun document interne trouvé pour cette question."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("metadata", {})
        source = meta.get("source", "Unknown")
        page = meta.get("page", "N/A")
        section = meta.get("section", "")
        score = chunk.get("final_score", chunk.get("score", 0))

        header = f"[SOURCE {i}: {source}"
        if page and page != "N/A":
            header += f", page {page}"
        if section:
            header += f" — {section}"
        header += f" (relevance: {score:.0%})]"

        parts.append(f"{header}\n{chunk['text']}")

    return "\n\n---\n\n".join(parts)


def _build_sources(chunks: List[Dict[str, Any]]) -> List[Source]:
    sources = []
    seen: set = set()

    for chunk in chunks:
        meta = chunk.get("metadata", {})
        source_name = meta.get("source", "")
        page = meta.get("page")
        key = f"{source_name}:{page}"

        if key not in seen and source_name:
            seen.add(key)
            sources.append(
                Source(
                    type="internal",
                    title=source_name,
                    file=source_name,
                    page=page if page and page != "N/A" else None,
                    section=meta.get("section") or None,
                    module=meta.get("module") or None,
                    score=round(chunk.get("final_score", chunk.get("score", 0)), 3),
                )
            )

    return sources


async def generate_stream(
    question: str,
    chunks: List[Dict[str, Any]],
    use_web_search: bool = True,
    language: str = 'fr',
) -> AsyncGenerator[str, None]:
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    context = _build_context(chunks)
    prompt_template = _SYSTEM_PROMPTS.get(language, _SYSTEM_PROMPTS['fr'])
    system_prompt = prompt_template.format(context=context)
    internal_sources = _build_sources(chunks)

    try:
        stream = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            max_tokens=4096,
            stream=True,
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield f"data: {json.dumps({'type': 'delta', 'content': content})}\n\n"

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        return

    sources_data = [s.model_dump(exclude_none=True) for s in internal_sources]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources_data})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
