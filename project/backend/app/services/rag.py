from sqlalchemy.orm import Session

from app.models.database import BotConfig
from app.services.embeddings import search_similar
from app.services.openai_client import get_chat_completion

DEFAULT_PROMPT_WITH_CONTEXT = """Ești un asistent virtual prietenos și util. Răspunde la întrebări bazându-te pe contextul furnizat.
Dacă întrebarea e un salut sau conversație generală, răspunde natural și prietenos.
Dacă nu găsești informația în context, spune politicos că nu ai informații despre asta.
Formatează răspunsurile clar - folosește liste și paragrafe scurte pentru lizibilitate.
Răspunde în limba în care ți se pune întrebarea.

Context din knowledge base:
{context}
"""

DEFAULT_PROMPT_NO_CONTEXT = """Ești un asistent virtual prietenos și util.
Răspunde natural la saluturi și conversații generale.
Dacă utilizatorul pune o întrebare specifică, spune-i politicos că nu ai informații în baza de cunoștințe despre asta, dar că poate reformula întrebarea.
Fii concis și prietenos.
Răspunde în limba în care ți se pune întrebarea.
"""

STYLE_INSTRUCTIONS = {
    "concise": "\nRăspunde foarte scurt și concis, maxim 2-3 propoziții.",
    "balanced": "",
    "detailed": "\nOferă răspunsuri detaliate și complete, cu explicații și exemple unde e posibil.",
}

LANGUAGE_INSTRUCTIONS = {
    "ro": "\nRăspunde DOAR în limba română.",
    "en": "\nRespond ONLY in English.",
    "fr": "\nRéponds UNIQUEMENT en français.",
    "de": "\nAntworte NUR auf Deutsch.",
    "es": "\nResponde SOLO en español.",
}


def _build_system_prompt(config, context=None):
    """Build the system prompt based on bot config and context."""
    style = getattr(config, "response_style", "balanced") or "balanced"
    language = getattr(config, "language", "auto") or "auto"
    custom_prompt = getattr(config, "system_prompt", None)

    if custom_prompt:
        if context:
            if "{context}" in custom_prompt:
                prompt = custom_prompt.replace("{context}", context)
            else:
                prompt = custom_prompt + f"\n\nContext din knowledge base:\n{context}"
        else:
            if "{context}" in custom_prompt:
                prompt = custom_prompt.replace("{context}", "").strip()
            else:
                prompt = custom_prompt
    else:
        if context:
            prompt = DEFAULT_PROMPT_WITH_CONTEXT.format(context=context)
        else:
            prompt = DEFAULT_PROMPT_NO_CONTEXT

    prompt += STYLE_INSTRUCTIONS.get(style, "")
    if language != "auto" and language in LANGUAGE_INSTRUCTIONS:
        prompt += LANGUAGE_INSTRUCTIONS[language]

    return prompt


def generate_response(user_message: str, bot_id: str = None, db: Session = None) -> dict:
    """Search knowledge base and generate a response using per-bot config."""
    config = None
    if db and bot_id:
        config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()

    top_k = getattr(config, "context_docs_count", 3) or 3
    temperature = getattr(config, "temperature", 0.7) or 0.7
    max_tokens = getattr(config, "max_tokens", 500) or 500

    matches = search_similar(user_message, top_k=top_k, bot_id=bot_id)

    if not matches:
        system_prompt = _build_system_prompt(config, context=None)
        response_text = get_chat_completion(system_prompt, user_message, temperature=temperature, max_tokens=max_tokens)
        return {
            "response": response_text,
            "sources": [],
        }

    # Build context from matches
    context_parts = []
    sources = []
    for match in matches:
        context_parts.append(match["text"])
        filename = match["metadata"].get("filename", "unknown")
        if filename not in sources:
            sources.append(filename)

    context = "\n\n---\n\n".join(context_parts)
    system_prompt = _build_system_prompt(config, context=context)

    response_text = get_chat_completion(system_prompt, user_message, temperature=temperature, max_tokens=max_tokens)

    return {
        "response": response_text,
        "sources": sources,
    }
