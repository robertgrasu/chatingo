import uuid
from datetime import datetime, timedelta, timezone
from threading import Thread

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.database import (
    BotConfig,
    Category,
    Conversation,
    ConversationFeedback,
    Document,
    Message,
    SessionLocal,
    get_db,
)
from app.models.schemas import (
    BotCreate,
    BotListItem,
    BotListResponse,
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
    FeedbackListItem,
    FeedbackListResponse,
    MessageResponse,
    StatsResponse,
    UploadResponse,
)
from app.services.embeddings import add_chunks, delete_bot_chunks, delete_document_chunks
from app.utils.text_splitter import split_text

router = APIRouter(prefix="/admin")


# --- Bots ---


@router.get("/bots", response_model=BotListResponse)
async def list_bots(db: Session = Depends(get_db)):
    bots = db.query(BotConfig).order_by(BotConfig.created_at.desc()).all()
    result = []
    for bot in bots:
        doc_count = db.query(Document).filter(Document.bot_id == bot.bot_id).count()
        conv_count = db.query(Conversation).filter(Conversation.bot_id == bot.bot_id).count()
        result.append(
            BotListItem(
                bot_id=bot.bot_id,
                bot_name=bot.bot_name or "AI Assistant",
                primary_color=bot.primary_color or "#6366f1",
                created_at=bot.created_at.isoformat() if bot.created_at else "",
                document_count=doc_count,
                conversation_count=conv_count,
            )
        )
    return BotListResponse(bots=result)


@router.post("/bots")
async def create_bot(data: BotCreate, db: Session = Depends(get_db)):
    bot_id = f"bot_{uuid.uuid4().hex[:8]}"
    config = BotConfig(
        bot_id=bot_id,
        bot_name=data.bot_name,
        welcome_message=data.welcome_message,
        primary_color=data.primary_color,
    )
    db.add(config)
    db.commit()
    return {"bot_id": bot_id, "status": "created"}


@router.delete("/bots/{bot_id}")
async def delete_bot(bot_id: str, db: Session = Depends(get_db)):
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Delete ChromaDB chunks
    try:
        delete_bot_chunks(bot_id)
    except Exception:
        pass

    # Delete feedback
    db.query(ConversationFeedback).filter(ConversationFeedback.bot_id == bot_id).delete()

    # Delete messages via conversations
    conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.bot_id == bot_id).all()]
    if conv_ids:
        db.query(Message).filter(Message.conversation_id.in_(conv_ids)).delete(synchronize_session=False)

    # Delete conversations
    db.query(Conversation).filter(Conversation.bot_id == bot_id).delete()

    # Delete documents
    db.query(Document).filter(Document.bot_id == bot_id).delete()

    # Delete categories
    db.query(Category).filter(Category.bot_id == bot_id).delete()

    # Delete config
    db.delete(config)
    db.commit()
    return {"status": "deleted"}


# --- Categories ---


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(bot_id: str = "bot_123", db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.bot_id == bot_id).all()
    result = []
    for cat in categories:
        doc_count = db.query(Document).filter(Document.category_id == cat.id).count()
        result.append(
            CategoryResponse(id=cat.id, name=cat.name, document_count=doc_count)
        )
    return result


@router.post("/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    category = Category(name=data.name, bot_id=data.bot_id)
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
    category_id: str | None = None, bot_id: str | None = None, db: Session = Depends(get_db)
):
    query = db.query(Document)
    if bot_id:
        query = query.filter(Document.bot_id == bot_id)
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


def _process_document(document_id: str, text: str, category_id: str, filename: str, bot_id: str = "bot_123"):
    """Background processing: split text, create embeddings, update status."""
    db = SessionLocal()
    try:
        chunks = split_text(text)
        chunk_count = add_chunks(chunks, document_id, category_id, filename, bot_id=bot_id)

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
    bot_id: str = Form("bot_123"),
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
        bot_id=bot_id,
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
        args=(document_id, text, category_id, file.filename, bot_id),
    )
    thread.start()

    return UploadResponse(document_id=document_id, status="processing")


@router.post("/documents/text", response_model=UploadResponse)
async def create_text_document(data: DocumentCreate, db: Session = Depends(get_db)):
    """Create a document from text input (no file upload)."""
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    bot_id = category.bot_id or "bot_123"
    document_id = str(uuid.uuid4())
    document = Document(
        id=document_id,
        bot_id=bot_id,
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
        args=(document_id, data.content, data.category_id, data.title, bot_id),
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
            args=(document_id, data.content, doc.category_id, doc.filename, doc.bot_id),
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
    bot_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Conversation)
    if bot_id:
        query = query.filter(Conversation.bot_id == bot_id)

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
async def delete_all_conversations(bot_id: str | None = None, db: Session = Depends(get_db)):
    if bot_id:
        conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.bot_id == bot_id).all()]
        count = len(conv_ids)
        if conv_ids:
            db.query(Message).filter(Message.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
            db.query(Conversation).filter(Conversation.bot_id == bot_id).delete()
    else:
        count = db.query(Conversation).count()
        db.query(Message).delete()
        db.query(Conversation).delete()
    db.commit()
    return {"status": "deleted", "count": count}


# --- Stats ---


@router.get("/stats", response_model=StatsResponse)
async def get_stats(bot_id: str | None = None, db: Session = Depends(get_db)):
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    conv_q = db.query(Conversation)
    doc_q = db.query(Document)
    cat_q = db.query(Category)
    fb_q = db.query(ConversationFeedback)
    if bot_id:
        conv_q = conv_q.filter(Conversation.bot_id == bot_id)
        doc_q = doc_q.filter(Document.bot_id == bot_id)
        cat_q = cat_q.filter(Category.bot_id == bot_id)
        fb_q = fb_q.filter(ConversationFeedback.bot_id == bot_id)

    total_conversations = conv_q.count()
    total_documents = doc_q.count()
    total_categories = cat_q.count()

    # Messages need join through conversations for bot_id filtering
    if bot_id:
        conv_ids = [c.id for c in conv_q.all()]
        msg_q = db.query(Message).filter(Message.conversation_id.in_(conv_ids)) if conv_ids else db.query(Message).filter(Message.id == None)
    else:
        msg_q = db.query(Message)

    total_messages = msg_q.count()
    conversations_today = conv_q.filter(Conversation.started_at >= today_start).count()
    messages_today = msg_q.filter(Message.created_at >= today_start).count()

    # Daily stats for last 7 days
    daily = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_conv_q = db.query(Conversation).filter(
            Conversation.started_at >= day_start,
            Conversation.started_at < day_end,
        )
        if bot_id:
            day_conv_q = day_conv_q.filter(Conversation.bot_id == bot_id)
        day_convs = day_conv_q.count()

        day_msg_q = db.query(Message).filter(
            Message.created_at >= day_start,
            Message.created_at < day_end,
        )
        if bot_id and conv_ids:
            day_msg_q = day_msg_q.filter(Message.conversation_id.in_(conv_ids))
        elif bot_id:
            day_msg_q = day_msg_q.filter(Message.id == None)
        day_msgs = day_msg_q.count()

        daily.append(
            DailyStatItem(
                date=day_start.strftime("%Y-%m-%d"),
                conversations=day_convs,
                messages=day_msgs,
            )
        )

    # Feedback stats
    from sqlalchemy import func as sqlfunc
    total_ratings = fb_q.count()
    avg_q = db.query(sqlfunc.avg(ConversationFeedback.rating))
    if bot_id:
        avg_q = avg_q.filter(ConversationFeedback.bot_id == bot_id)
    avg_result = avg_q.scalar()
    average_rating = round(float(avg_result), 1) if avg_result else 0

    # Rating distribution
    rating_distribution = {}
    if total_ratings > 0:
        dist_q = db.query(
            ConversationFeedback.rating,
            sqlfunc.count(ConversationFeedback.id),
        )
        if bot_id:
            dist_q = dist_q.filter(ConversationFeedback.bot_id == bot_id)
        dist_rows = dist_q.group_by(ConversationFeedback.rating).all()
        for r, c in dist_rows:
            rating_distribution[str(r)] = c

    return StatsResponse(
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_documents=total_documents,
        total_categories=total_categories,
        conversations_today=conversations_today,
        messages_today=messages_today,
        daily=daily,
        average_rating=average_rating,
        total_ratings=total_ratings,
        rating_distribution=rating_distribution,
    )


# --- Feedback / Reviews ---

@router.get("/feedback", response_model=FeedbackListResponse)
async def list_feedback(
    page: int = 1,
    per_page: int = 20,
    sort: str = "newest",
    rating_filter: int | None = None,
    bot_id: str | None = None,
    db: Session = Depends(get_db),
):
    from sqlalchemy import func as sqlfunc

    query = db.query(ConversationFeedback)
    if bot_id:
        query = query.filter(ConversationFeedback.bot_id == bot_id)

    if rating_filter is not None and 1 <= rating_filter <= 5:
        query = query.filter(ConversationFeedback.rating == rating_filter)

    total = query.count()

    if sort == "oldest":
        query = query.order_by(ConversationFeedback.created_at.asc())
    elif sort == "highest":
        query = query.order_by(
            ConversationFeedback.rating.desc(),
            ConversationFeedback.created_at.desc(),
        )
    elif sort == "lowest":
        query = query.order_by(
            ConversationFeedback.rating.asc(),
            ConversationFeedback.created_at.desc(),
        )
    else:
        query = query.order_by(ConversationFeedback.created_at.desc())

    pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, pages))
    feedbacks = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for fb in feedbacks:
        first_message = ""
        if fb.conversation_id:
            first_msg = (
                db.query(Message)
                .filter(
                    Message.conversation_id == fb.conversation_id,
                    Message.role == "user",
                )
                .order_by(Message.created_at.asc())
                .first()
            )
            if first_msg:
                first_message = (first_msg.content or "")[:150]

        items.append(
            FeedbackListItem(
                id=fb.id,
                rating=fb.rating,
                comment=fb.comment,
                created_at=fb.created_at.isoformat(),
                conversation_id=fb.conversation_id,
                first_message=first_message,
            )
        )

    # Aggregate stats (unfiltered by rating_filter, but scoped by bot_id)
    agg_q = db.query(ConversationFeedback)
    if bot_id:
        agg_q = agg_q.filter(ConversationFeedback.bot_id == bot_id)
    all_total = agg_q.count()
    avg_q = db.query(sqlfunc.avg(ConversationFeedback.rating))
    if bot_id:
        avg_q = avg_q.filter(ConversationFeedback.bot_id == bot_id)
    avg_result = avg_q.scalar()
    average_rating = round(float(avg_result), 1) if avg_result else 0

    rating_distribution = {}
    if all_total > 0:
        dist_q = db.query(
            ConversationFeedback.rating,
            sqlfunc.count(ConversationFeedback.id),
        )
        if bot_id:
            dist_q = dist_q.filter(ConversationFeedback.bot_id == bot_id)
        dist_rows = dist_q.group_by(ConversationFeedback.rating).all()
        for r, c in dist_rows:
            rating_distribution[str(r)] = c

    return FeedbackListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        average_rating=average_rating,
        total_ratings=all_total,
        rating_distribution=rating_distribution,
    )
