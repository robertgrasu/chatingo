import chromadb

from app.config import settings
from app.services.openai_client import get_embedding

_client = None
_collection = None


def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(
    chunks: list[str],
    document_id: str,
    category_id: str,
    filename: str,
) -> int:
    """Embed and store text chunks in ChromaDB."""
    collection = get_collection()

    ids = []
    embeddings = []
    metadatas = []
    documents = []

    for i, chunk in enumerate(chunks):
        chunk_id = f"{document_id}_chunk_{i}"
        embedding = get_embedding(chunk)

        ids.append(chunk_id)
        embeddings.append(embedding)
        metadatas.append(
            {
                "document_id": document_id,
                "category_id": category_id,
                "filename": filename,
                "chunk_index": i,
            }
        )
        documents.append(chunk)

    if ids:
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
        )

    return len(ids)


def search_similar(query: str, top_k: int = 3) -> list[dict]:
    """Search for similar chunks using query embedding."""
    collection = get_collection()

    if collection.count() == 0:
        return []

    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    matches = []
    for i in range(len(results["ids"][0])):
        distance = results["distances"][0][i]
        # Cosine distance: 0 = identical, 2 = opposite. Convert to similarity.
        similarity = 1 - distance
        if similarity >= 0.2:
            matches.append(
                {
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity": similarity,
                }
            )

    return matches


def delete_document_chunks(document_id: str):
    """Delete all chunks belonging to a document."""
    collection = get_collection()

    # Get all chunk IDs for this document
    results = collection.get(where={"document_id": document_id})

    if results["ids"]:
        collection.delete(ids=results["ids"])
