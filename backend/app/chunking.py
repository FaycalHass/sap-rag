import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

SAP_MODULE_PATTERNS: Dict[str, List[str]] = {
    "FI": [
        "fi-gl", "fi-ar", "fi-ap", "fi-aa", "fi-ca", "general ledger",
        "accounts receivable", "accounts payable", "asset accounting",
        "F-02", "F-28", "F-53", "FB01", "FB50", "FB60", "FB70", "FS10N",
        "FBL1N", "FBL3N", "FBL5N", "FBV0", "FAGLL03", "F110",
        "comptabilité générale", "fournisseurs", "clients", "immobilisations",
        "balance sheet", "profit and loss", "bilan", "résultat",
    ],
    "CO": [
        "co-pa", "co-pc", "co-om", "co-cca", "controlling",
        "cost center", "profit center", "internal order", "KA01", "KP06",
        "KB11N", "KS01", "KE30", "KSB1", "KSB5", "CJIA", "CJ20N",
        "centre de coûts", "controlling area", "ordre interne",
        "centre de profit", "analyse de rentabilité",
    ],
    "MM": [
        "mm-im", "mm-pur", "mm-srv", "material management", "purchasing",
        "inventory management", "MIGO", "ME21N", "ME31K", "MMBE", "MIRO",
        "MB51", "MB52", "MM60", "ME2M", "MSEG",
        "bon de commande", "gestion des stocks", "réception marchandise",
        "stock", "purchase order", "goods receipt",
    ],
    "SD": [
        "sd-va", "sd-bf", "sd-sl", "sales", "distribution", "VA01", "VA11",
        "VF01", "VL01N", "VF03", "VA03", "VL02N", "VT02N", "VKM1",
        "sales order", "delivery", "billing", "shipment",
        "commande client", "livraison", "facturation client",
    ],
    "PP": [
        "pp-bdp", "pp-crp", "production planning", "MRP", "MD01", "CO01",
        "PP01", "CS01", "CA01", "MD04", "MFBF", "CO15",
        "work order", "BOM", "routing", "capacity planning",
        "gamme", "nomenclature", "ordre de fabrication", "planification",
    ],
    "HR": [
        "pa-", "py-", "pt-", "human resources", "payroll", "personnel",
        "PA40", "PA30", "PA20", "PC00", "PT60", "PE51", "PU01",
        "ressources humaines", "paie", "gestion du temps", "infotype",
        "employee", "employé", "salaire",
    ],
    "ABAP": [
        "ABAP", "SE38", "SE80", "SE16", "SM30", "SM31", "SE37", "SE11",
        "abap workbench", "function module", "class", "interface",
        "debugging", "ALV", "BAPI", "user exit", "enhancement",
        "module pool", "smart forms", "adobe forms",
    ],
    "BASIS": [
        "sm21", "sm51", "st22", "sick", "spam", "suim", "SU01", "SU10",
        "system administration", "transport", "SE06", "STMS", "SCC4",
        "client copy", "mandant", "background job", "SM36", "SM37",
        "system landscape", "workload monitor",
    ],
    "S4HANA": [
        "S/4HANA", "S4HANA", "HANA", "embedded analytics", "fiori",
        "SAP S/4", "simplification", "central finance", "universal journal",
        "ACDOCA", "migration cockpit", "readiness check",
    ],
    "BTP": [
        "BTP", "SAP BTP", "business technology platform", "cloud foundry",
        "SAPUI5", "OData", "Integration Suite", "Extension Suite",
        "SAP Build", "low code", "no code", "integration flow",
    ],
}


def detect_sap_module(text: str) -> Optional[str]:
    text_lower = text.lower()
    module_scores: Dict[str, int] = {}
    for module, patterns in SAP_MODULE_PATTERNS.items():
        score = sum(1 for p in patterns if p.lower() in text_lower)
        if score > 0:
            module_scores[module] = score
    if module_scores:
        return max(module_scores, key=lambda k: module_scores[k])
    return None


def split_by_sections(text: str) -> List[Dict[str, str]]:
    section_pattern = re.compile(
        r"^(#{1,6}\s+.+|[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ][A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ\s]{8,}:?\s*$|\d+[\.\)]\s+[A-Z].{5,})",
        re.MULTILINE,
    )

    matches = list(section_pattern.finditer(text))
    if not matches:
        return [{"title": "", "content": text}]

    sections: List[Dict[str, str]] = []
    if matches[0].start() > 0:
        prefix = text[: matches[0].start()].strip()
        if prefix:
            sections.append({"title": "", "content": prefix})

    for i, match in enumerate(matches):
        title = match.group().strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()
        if content:
            sections.append({"title": title, "content": content})

    return sections if sections else [{"title": "", "content": text}]


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    words = text.split()
    if not words:
        return []

    chunks: List[str] = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = end - overlap

    return chunks


def create_chunks(
    text: str,
    source_name: str,
    page_num: int = 0,
    chunk_size: int = 500,
    overlap: int = 50,
) -> List[Dict[str, Any]]:
    sections = split_by_sections(text)
    chunks: List[Dict[str, Any]] = []

    for section in sections:
        content = section["content"].strip()
        title = section["title"]

        if not content:
            continue

        words = content.split()
        if len(words) <= chunk_size:
            module = detect_sap_module(content)
            chunks.append(
                {
                    "text": content,
                    "metadata": {
                        "source": source_name,
                        "page": page_num,
                        "section": title,
                        "module": module,
                    },
                }
            )
        else:
            sub_chunks = chunk_text(content, chunk_size, overlap)
            for i, sc in enumerate(sub_chunks):
                module = detect_sap_module(sc)
                chunks.append(
                    {
                        "text": sc,
                        "metadata": {
                            "source": source_name,
                            "page": page_num,
                            "section": title,
                            "chunk_index": i,
                            "module": module,
                        },
                    }
                )

    logger.debug(f"Created {len(chunks)} chunks from {source_name} page {page_num}")
    return chunks
