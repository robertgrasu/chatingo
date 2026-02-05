from app.services.embeddings import search_similar
from app.services.openai_client import get_chat_completion

SYSTEM_PROMPT_WITH_CONTEXT = """Ești un asistent virtual prietenos și util. Răspunde la întrebări bazându-te pe contextul furnizat.
Dacă întrebarea e un salut sau conversație generală, răspunde natural și prietenos.
Dacă nu găsești informația în context, spune politicos că nu ai informații despre asta.
Formatează răspunsurile clar - folosește liste și paragrafe scurte pentru lizibilitate.
Răspunde în limba în care ți se pune întrebarea.

Context din knowledge base:
{context}
"""

SYSTEM_PROMPT_NO_CONTEXT = """Ești un asistent virtual prietenos și util.
Răspunde natural la saluturi și conversații generale.
Dacă utilizatorul pune o întrebare specifică, spune-i politicos că nu ai informații în baza de cunoștințe despre asta, dar că poate reformula întrebarea.
Fii concis și prietenos.
Răspunde în limba în care ți se pune întrebarea.
"""


def generate_response(user_message: str) -> dict:
    """Search knowledge base and generate a response."""
    matches = search_similar(user_message, top_k=3)

    if not matches:
        # Still send to GPT for greetings and general conversation
        response_text = get_chat_completion(SYSTEM_PROMPT_NO_CONTEXT, user_message)
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
    system_prompt = SYSTEM_PROMPT_WITH_CONTEXT.format(context=context)

    response_text = get_chat_completion(system_prompt, user_message)

    return {
        "response": response_text,
        "sources": sources,
    }
