import uuid
from datetime import datetime, timedelta, timezone
from threading import Thread

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.database import (
    Category,
    Conversation,
    Document,
    Message,
    SessionLocal,
    get_db,
)
from app.models.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ConversationDetail,
    ConversationListItem,
    ConversationListResponse,
    DailyStatItem,
    DocumentCreate,
    DocumentDetail,
    DocumentResponse,
    DocumentUpdate,
    MessageResponse,
    StatsResponse,
    UploadResponse,
)
from app.services.embeddings import add_chunks, delete_document_chunks
from app.utils.text_splitter import split_text

router = APIRouter(prefix="/admin")


# --- Categories ---


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    result = []
    for cat in categories:
        doc_count = db.query(Document).filter(Document.category_id == cat.id).count()
        result.append(
            CategoryResponse(id=cat.id, name=cat.name, document_count=doc_count)
        )
    return result


@router.post("/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    category = Category(name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse(id=category.id, name=category.name, document_count=0)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str, data: CategoryUpdate, db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = data.name
    db.commit()
    db.refresh(category)
    doc_count = (
        db.query(Document).filter(Document.category_id == category.id).count()
    )
    return CategoryResponse(
        id=category.id, name=category.name, document_count=doc_count
    )


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Delete all document embeddings in this category
    documents = (
        db.query(Document).filter(Document.category_id == category_id).all()
    )
    for doc in documents:
        try:
            delete_document_chunks(doc.id)
        except Exception:
            pass

    db.delete(category)
    db.commit()
    return {"status": "deleted"}


# --- Documents ---


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    category_id: str | None = None, db: Session = Depends(get_db)
):
    query = db.query(Document)
    if category_id:
        query = query.filter(Document.category_id == category_id)
    documents = query.order_by(Document.created_at.desc()).all()
    return [
        DocumentResponse(
            id=doc.id,
            filename=doc.filename,
            status=doc.status,
            category_id=doc.category_id,
            chunk_count=doc.chunk_count or 0,
            created_at=doc.created_at.isoformat() if doc.created_at else "",
        )
        for doc in documents
    ]


@router.get("/documents/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentDetail(
        id=doc.id,
        filename=doc.filename,
        status=doc.status,
        category_id=doc.category_id,
        content=doc.content or "",
        chunk_count=doc.chunk_count or 0,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


def _process_document(document_id: str, text: str, category_id: str, filename: str):
    """Background processing: split text, create embeddings, update status."""
    db = SessionLocal()
    try:
        chunks = split_text(text)
        chunk_count = add_chunks(chunks, document_id, category_id, filename)

        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "ready"
            doc.chunk_count = chunk_count
            db.commit()
    except Exception as e:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            db.commit()
        print(f"Error processing document {document_id}: {e}")
    finally:
        db.close()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    category_id: str = Form(...),
    db: Session = Depends(get_db),
):
    # Validate category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Validate file type
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only TXT files are supported")

    # Read file content
    raw = await file.read()
    text = raw.decode("utf-8")

    # Create document record with content
    document_id = str(uuid.uuid4())
    document = Document(
        id=document_id,
        filename=file.filename,
        category_id=category_id,
        content=text,
        status="processing",
    )
    db.add(document)
    db.commit()

    # Process in background thread
    thread = Thread(
        target=_process_document,
        args=(document_id, text, category_id, file.filename),
    )
    thread.start()

    return UploadResponse(document_id=document_id, status="processing")


@router.post("/documents/text", response_model=UploadResponse)
async def create_text_document(data: DocumentCreate, db: Session = Depends(get_db)):
    """Create a document from text input (no file upload)."""
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    document_id = str(uuid.uuid4())
    document = Document(
        id=document_id,
        filename=data.title,
        category_id=data.category_id,
        content=data.content,
        status="processing",
    )
    db.add(document)
    db.commit()

    # Process in background thread
    thread = Thread(
        target=_process_document,
        args=(document_id, data.content, data.category_id, data.title),
    )
    thread.start()

    return UploadResponse(document_id=document_id, status="processing")


@router.put("/documents/{document_id}", response_model=DocumentDetail)
async def update_document(
    document_id: str, data: DocumentUpdate, db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    content_changed = False

    if data.filename is not None:
        doc.filename = data.filename

    if data.category_id is not None:
        category = db.query(Category).filter(Category.id == data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        doc.category_id = data.category_id

    if data.content is not None and data.content != (doc.content or ""):
        doc.content = data.content
        content_changed = True

    if content_changed:
        # Delete old chunks and re-process
        try:
            delete_document_chunks(document_id)
        except Exception:
            pass
        doc.status = "processing"
        doc.chunk_count = 0
        db.commit()

        thread = Thread(
            target=_process_document,
            args=(document_id, data.content, doc.category_id, doc.filename),
        )
        thread.start()
    else:
        db.commit()

    db.refresh(doc)
    return DocumentDetail(
        id=doc.id,
        filename=doc.filename,
        status=doc.status,
        category_id=doc.category_id,
        content=doc.content or "",
        chunk_count=doc.chunk_count or 0,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete embeddings from ChromaDB
    try:
        delete_document_chunks(document_id)
    except Exception:
        pass

    db.delete(document)
    db.commit()
    return {"status": "deleted"}


# --- Conversations ---


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = 1,
    per_page: int = 20,
    sort: str = "newest",
    search: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(Conversation)

    # Server-side search
    if search:
        # Search in session_id or first user message
        matching_conv_ids = (
            db.query(Message.conversation_id)
            .filter(Message.role == "user", Message.content.ilike(f"%{search}%"))
            .distinct()
            .all()
        )
        matching_ids = [r[0] for r in matching_conv_ids]
        query = query.filter(
            (Conversation.session_id.ilike(f"%{search}%"))
            | (Conversation.id.in_(matching_ids))
        )

    total = query.count()

    # Sort
    if sort == "oldest":
        query = query.order_by(Conversation.last_message_at.asc())
    elif sort == "most_messages":
        query = query.order_by(Conversation.message_count.desc())
    else:
        query = query.order_by(Conversation.last_message_at.desc())

    # Paginate
    pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, pages))
    conversations = query.offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for conv in conversations:
        first_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id, Message.role == "user")
            .order_by(Message.created_at.asc())
            .first()
        )
        result.append(
            ConversationListItem(
                id=conv.id,
                session_id=conv.session_id,
                started_at=conv.started_at.isoformat(),
                last_message_at=conv.last_message_at.isoformat(),
                message_count=conv.message_count,
                first_message=first_msg.content[:100] if first_msg else "",
            )
        )

    return ConversationListResponse(
        items=result,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return ConversationDetail(
        id=conv.id,
        session_id=conv.session_id,
        started_at=conv.started_at.isoformat(),
        last_message_at=conv.last_message_at.isoformat(),
        message_count=conv.message_count,
        messages=[
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                image_url=msg.image_url,
                created_at=msg.created_at.isoformat(),
            )
            for msg in messages
        ],
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "deleted"}


@router.delete("/conversations")
async def delete_all_conversations(db: Session = Depends(get_db)):
    count = db.query(Conversation).count()
    db.query(Message).delete()
    db.query(Conversation).delete()
    db.commit()
    return {"status": "deleted", "count": count}


# --- Stats ---


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    total_conversations = db.query(Conversation).count()
    total_messages = db.query(Message).count()
    total_documents = db.query(Document).count()
    total_categories = db.query(Category).count()
    conversations_today = (
        db.query(Conversation)
        .filter(Conversation.started_at >= today_start)
        .count()
    )
    messages_today = (
        db.query(Message).filter(Message.created_at >= today_start).count()
    )

    # Daily stats for last 7 days
    daily = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_convs = (
            db.query(Conversation)
            .filter(
                Conversation.started_at >= day_start,
                Conversation.started_at < day_end,
            )
            .count()
        )
        day_msgs = (
            db.query(Message)
            .filter(
                Message.created_at >= day_start,
                Message.created_at < day_end,
            )
            .count()
        )
        daily.append(
            DailyStatItem(
                date=day_start.strftime("%Y-%m-%d"),
                conversations=day_convs,
                messages=day_msgs,
            )
        )

    return StatsResponse(
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_documents=total_documents,
        total_categories=total_categories,
        conversations_today=conversations_today,
        messages_today=messages_today,
        daily=daily,
    )
