import io
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from threading import Thread

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.database import (
    AdminUser,
    BotConfig,
    Category,
    Conversation,
    ConversationFeedback,
    Document,
    Message,
    Notification,
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
    NotificationItem,
    NotificationListResponse,
    NotificationMarkRead,
    StatsResponse,
    UploadResponse,
)
from app.services.auth import get_current_admin
from app.services.embeddings import add_chunks, delete_bot_chunks, delete_document_chunks
from app.services.ownership import ensure_bot_accessible, get_owned_bot, owned_bot_ids, team_root_id
from app.utils.text_splitter import split_text

# Dimensiunea maxima a unui fisier incarcat in baza de cunostinte
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

router = APIRouter(prefix="/admin")


# --- Boti ---


# Lista botilor echipei, cu numarul de documente si de conversatii al fiecaruia
@router.get("/bots", response_model=BotListResponse)
async def list_bots(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    query = db.query(BotConfig)
    if admin.role != "demo":
        query = query.filter(BotConfig.owner_id == team_root_id(admin))
    bots = query.order_by(BotConfig.created_at.desc()).all()
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


# Creeaza un bot nou, cu id generat automat, care apartine echipei adminului
@router.post("/bots")
async def create_bot(data: BotCreate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    bot_id = f"bot_{uuid.uuid4().hex[:8]}"
    config = BotConfig(
        bot_id=bot_id,
        bot_name=data.bot_name,
        welcome_message=data.welcome_message,
        primary_color=data.primary_color,
        owner_id=team_root_id(admin),
    )
    db.add(config)
    db.commit()
    return {"bot_id": bot_id, "status": "created"}


# Sterge un bot si toate datele lui: vectorii din ChromaDB, notificarile, recenziile, conversatiile, documentele si categoriile
@router.delete("/bots/{bot_id}")
async def delete_bot(bot_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    config = get_owned_bot(bot_id, db, admin)

    # Se sterg vectorii botului din ChromaDB
    try:
        delete_bot_chunks(bot_id)
    except Exception:
        pass

    # Se sterg notificarile
    db.query(Notification).filter(Notification.bot_id == bot_id).delete()

    # Se sterg recenziile
    db.query(ConversationFeedback).filter(ConversationFeedback.bot_id == bot_id).delete()

    # Se sterg mesajele conversatiilor botului
    conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.bot_id == bot_id).all()]
    if conv_ids:
        db.query(Message).filter(Message.conversation_id.in_(conv_ids)).delete(synchronize_session=False)

    # Se sterg conversatiile
    db.query(Conversation).filter(Conversation.bot_id == bot_id).delete()

    # Se sterg documentele
    db.query(Document).filter(Document.bot_id == bot_id).delete()

    # Se sterg categoriile
    db.query(Category).filter(Category.bot_id == bot_id).delete()

    # La final se sterge configuratia botului
    db.delete(config)
    db.commit()
    return {"status": "deleted"}


# --- Categorii ---


# Lista categoriilor din baza de cunostinte a unui bot, cu numarul de documente
@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(bot_id: str = "bot_123", db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    ensure_bot_accessible(bot_id, db, admin)
    # Se aduc categoriile botului
    categories = db.query(Category).filter(Category.bot_id == bot_id).all()
    result = []
    for cat in categories:
        doc_count = db.query(Document).filter(Document.category_id == cat.id).count()
        result.append(
            CategoryResponse(id=cat.id, name=cat.name, document_count=doc_count)
        )
    return result


# Creeaza o categorie noua pentru un bot
@router.post("/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    ensure_bot_accessible(data.bot_id, db, admin)
    # Se salveaza categoria noua
    category = Category(name=data.name, bot_id=data.bot_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse(id=category.id, name=category.name, document_count=0)


# Redenumeste o categorie
@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str, data: CategoryUpdate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin),
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    ensure_bot_accessible(category.bot_id, db, admin)
    # Se salveaza noul nume
    category.name = data.name
    db.commit()
    db.refresh(category)
    doc_count = (
        db.query(Document).filter(Document.category_id == category.id).count()
    )
    return CategoryResponse(
        id=category.id, name=category.name, document_count=doc_count
    )


# Sterge o categorie impreuna cu documentele ei
@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    ensure_bot_accessible(category.bot_id, db, admin)

    # Se sterg vectorii tuturor documentelor din categorie
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


# --- Documente ---


# Lista documentelor unui bot, cu filtrare optionala dupa categorie
@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    category_id: str | None = None, bot_id: str | None = None, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin),
):
    # Filtrarea documentelor: dupa bot, dupa categorie sau dupa toti botii echipei
    query = db.query(Document)
    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        query = query.filter(Document.bot_id == bot_id)
    elif category_id:
        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            ensure_bot_accessible(category.bot_id, db, admin)
    else:
        ids = owned_bot_ids(db, admin)
        if ids is not None:
            query = query.filter(Document.bot_id.in_(ids))
    if category_id:
        query = query.filter(Document.category_id == category_id)
    # Documentele cele mai noi apar primele
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


# Returneaza un document cu tot continutul lui
@router.get("/documents/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    ensure_bot_accessible(doc.bot_id, db, admin)
    return DocumentDetail(
        id=doc.id,
        filename=doc.filename,
        status=doc.status,
        category_id=doc.category_id,
        content=doc.content or "",
        chunk_count=doc.chunk_count or 0,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


# Procesare in fundal: imparte textul in bucati, calculeaza embeddings si marcheaza documentul ca ready sau error
def _process_document(document_id: str, text: str, category_id: str, filename: str, bot_id: str = "bot_123"):
    db = SessionLocal()
    try:
        # Textul se imparte in bucati si se calculeaza embedding-ul fiecareia
        chunks = split_text(text)
        chunk_count = add_chunks(chunks, document_id, category_id, filename, bot_id=bot_id)

        # La succes documentul trece in starea ready, cu numarul de bucati
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "ready"
            doc.chunk_count = chunk_count
            db.commit()
    except Exception as e:
        # La eroare documentul trece in starea error
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            db.commit()
        print(f"Error processing document {document_id}: {e}")
    # Sesiunea proprie a firului de executie se inchide mereu
    finally:
        db.close()


# Incarca un fisier (txt, pdf sau docx), extrage textul si il proceseaza in fundal
@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    category_id: str = Form(...),
    bot_id: str = Form("bot_123"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    ensure_bot_accessible(bot_id, db, admin)

    # Se verifica faptul ca categoria exista
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Sunt permise doar fisiere txt, pdf si docx
    ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}
    # Fisierul trebuie sa aiba nume
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    # Se elimina caile din numele fisierului (fara path traversal)
    clean_name = file.filename.split("/")[-1].split("\\")[-1]
    # Se extrage extensia si se verifica
    _, ext = os.path.splitext(clean_name)
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tip fisier nepermis. Acceptate: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    # Extensiile duble sunt respinse
    name_without_ext = clean_name[: -len(ext)]
    if "." in name_without_ext:
        raise HTTPException(
            status_code=400,
            detail="Extensii duble nu sunt permise (ex: file.php.txt)",
        )

    # Se citeste fisierul si se verifica dimensiunea maxima
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Textul se extrage in functie de tipul fisierului
    # TXT: trebuie sa fie UTF-8 valid si fara continut binar
    if ext == ".txt":
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Fisierul .txt trebuie sa fie UTF-8 valid")
        if "\x00" in text:
            raise HTTPException(status_code=400, detail="Fisierul contine continut binar")

    # PDF: se extrage textul fiecarei pagini
    elif ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(raw))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(pages).strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Eroare la citirea PDF-ului: {str(e)}")

    # DOCX: se extrage textul fiecarui paragraf
    elif ext == ".docx":
        try:
            from docx import Document as DocxDocument
            doc = DocxDocument(io.BytesIO(raw))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            text = "\n\n".join(paragraphs).strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Eroare la citirea DOCX-ului: {str(e)}")

    # Fisierele fara text (de exemplu PDF-urile scanate) sunt respinse
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Nu s-a putut extrage text din fisier")

    # Se elimina extensia si se curata numele pentru salvare
    name_base = os.path.splitext(clean_name)[0]
    safe_filename = re.sub(r'[^\w\-\s]', '_', name_base).strip('_')[:200]

    # Se creeaza documentul in baza de date, cu starea processing
    # Id-ul documentului este generat aici, ca sa fie dat si procesarii din fundal
    document_id = str(uuid.uuid4())
    document = Document(
        id=document_id,
        bot_id=bot_id,
        filename=safe_filename,
        category_id=category_id,
        content=text,
        status="processing",
    )
    db.add(document)
    db.commit()

    # Notificare pentru documentul nou
    create_notification(db, bot_id, "document", "Document nou incarcat", f'"{safe_filename}" a fost adaugat in Knowledge Base.', document_id)
    db.commit()

    # Procesarea (bucati si embeddings) ruleaza intr-un thread separat, ca cererea sa raspunda imediat
    thread = Thread(
        target=_process_document,
        args=(document_id, text, category_id, safe_filename, bot_id),
    )
    thread.start()

    return UploadResponse(document_id=document_id, status="processing")


# Creeaza un document din text scris direct in panou si il proceseaza in fundal
@router.post("/documents/text", response_model=UploadResponse)
async def create_text_document(data: DocumentCreate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Botul se afla din categoria aleasa
    bot_id = category.bot_id or "bot_123"
    ensure_bot_accessible(bot_id, db, admin)
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

    # Notificare pentru documentul nou
    create_notification(db, bot_id, "document", "Document nou creat", f'"{data.title}" a fost adaugat in Knowledge Base.', document_id)
    db.commit()

    # Procesarea (bucati si embeddings) ruleaza intr-un thread separat, ca cererea sa raspunda imediat
    thread = Thread(
        target=_process_document,
        args=(document_id, data.content, data.category_id, data.title, bot_id),
    )
    thread.start()

    return UploadResponse(document_id=document_id, status="processing")


# Modifica un document; daca se schimba continutul, vectorii se recalculeaza
@router.put("/documents/{document_id}", response_model=DocumentDetail)
async def update_document(
    document_id: str, data: DocumentUpdate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    ensure_bot_accessible(doc.bot_id, db, admin)

    # Se retine daca s-a schimbat continutul, caz in care vectorii se recalculeaza
    content_changed = False

    if data.filename is not None:
        doc.filename = data.filename

    # Categoria noua trebuie sa existe
    if data.category_id is not None:
        category = db.query(Category).filter(Category.id == data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        doc.category_id = data.category_id

    if data.content is not None and data.content != (doc.content or ""):
        doc.content = data.content
        content_changed = True

    if content_changed:
        # Se sterg bucatile vechi si documentul se proceseaza din nou
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


# Sterge un document si bucatile lui din ChromaDB
@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    ensure_bot_accessible(document.bot_id, db, admin)

    # Se sterg vectorii documentului din ChromaDB
    try:
        delete_document_chunks(document_id)
    except Exception:
        pass

    db.delete(document)
    db.commit()
    return {"status": "deleted"}


# --- Conversatii ---


# Lista paginata de conversatii, cu cautare in mesaje si sortare
@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = 1,
    per_page: int = 20,
    sort: str = "newest",
    search: str = "",
    bot_id: str | None = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Numarul de elemente pe pagina este limitat, ca sa nu se consume memoria serverului
    per_page = max(1, min(per_page, 100))

    query = db.query(Conversation)
    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        query = query.filter(Conversation.bot_id == bot_id)
    else:
        ids = owned_bot_ids(db, admin)
        if ids is not None:
            query = query.filter(Conversation.bot_id.in_(ids))

    # Cautarea se face pe server, iar caracterele speciale SQL sunt escapate
    if search:
        safe_search = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        matching_conv_ids = (
            db.query(Message.conversation_id)
            .filter(Message.role == "user", Message.content.ilike(f"%{safe_search}%", escape="\\"))
            .distinct()
            .all()
        )
        matching_ids = [r[0] for r in matching_conv_ids]
        query = query.filter(
            (Conversation.session_id.ilike(f"%{safe_search}%", escape="\\"))
            | (Conversation.id.in_(matching_ids))
        )

    # Numarul total de rezultate, folosit la paginare
    total = query.count()

    # Sortarea listei
    if sort == "oldest":
        query = query.order_by(Conversation.last_message_at.asc())
    elif sort == "most_messages":
        query = query.order_by(Conversation.message_count.desc())
    else:
        query = query.order_by(Conversation.last_message_at.desc())

    # Paginarea: pagina este limitata la intervalul valid
    pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, pages))
    conversations = query.offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for conv in conversations:
        # Primul mesaj al vizitatorului, folosit ca previzualizare in lista
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


# Returneaza o conversatie cu toate mesajele ei
@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    # Se cauta conversatia si se verifica accesul la botul ei
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    ensure_bot_accessible(conv.bot_id, db, admin)

    # Mesajele conversatiei, de la cel mai vechi la cel mai nou
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


# Sterge o conversatie cu mesajele ei
@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    ensure_bot_accessible(conv.bot_id, db, admin)
    db.delete(conv)
    db.commit()
    return {"status": "deleted"}


# Sterge toate conversatiile (ale unui bot, daca bot_id este dat)
@router.delete("/conversations")
async def delete_all_conversations(bot_id: str | None = None, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        target_ids = [bot_id]
    else:
        target_ids = owned_bot_ids(db, admin)  # None apare doar la demo, care nu ajunge aici (scrierea e blocata de middleware)

    if target_ids is None:
        conv_ids = [c.id for c in db.query(Conversation).all()]
    else:
        conv_ids = [c.id for c in db.query(Conversation).filter(Conversation.bot_id.in_(target_ids)).all()]

    # Se sterg mai intai mesajele, apoi conversatiile, si se returneaza cate au fost sterse
    count = len(conv_ids)
    if conv_ids:
        db.query(Message).filter(Message.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
        db.query(Conversation).filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)
    db.commit()
    return {"status": "deleted", "count": count}


# --- Statistici ---


# Statisticile dashboard-ului: totaluri, activitate pe zile si distributia notelor
@router.get("/stats", response_model=StatsResponse)
async def get_stats(bot_id: str | None = None, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    # Inceputul zilei curente (UTC), folosit pentru statisticile de azi
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        ids = [bot_id]
    else:
        ids = owned_bot_ids(db, admin)  # None inseamna fara restrictii (doar rolul demo)

    # Interogarile de baza, limitate la botii permisi
    conv_q = db.query(Conversation)
    doc_q = db.query(Document)
    cat_q = db.query(Category)
    fb_q = db.query(ConversationFeedback)
    if ids is not None:
        conv_q = conv_q.filter(Conversation.bot_id.in_(ids))
        doc_q = doc_q.filter(Document.bot_id.in_(ids))
        cat_q = cat_q.filter(Category.bot_id.in_(ids))
        fb_q = fb_q.filter(ConversationFeedback.bot_id.in_(ids))

    # Totalurile generale
    total_conversations = conv_q.count()
    total_documents = doc_q.count()
    total_categories = cat_q.count()

    # Mesajele se filtreaza dupa botii echipei prin conversatiile lor
    if ids is not None:
        conv_ids = [c.id for c in conv_q.all()]
        msg_q = db.query(Message).filter(Message.conversation_id.in_(conv_ids)) if conv_ids else db.query(Message).filter(Message.id == None)
    else:
        msg_q = db.query(Message)

    total_messages = msg_q.count()
    conversations_today = conv_q.filter(Conversation.started_at >= today_start).count()
    messages_today = msg_q.filter(Message.created_at >= today_start).count()

    # Statistici pe zile pentru ultimele 7 zile
    daily = []
    # Se parcurg ultimele 7 zile, de la cea mai veche la azi
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_conv_q = db.query(Conversation).filter(
            Conversation.started_at >= day_start,
            Conversation.started_at < day_end,
        )
        if ids is not None:
            day_conv_q = day_conv_q.filter(Conversation.bot_id.in_(ids))
        day_convs = day_conv_q.count()

        day_msg_q = db.query(Message).filter(
            Message.created_at >= day_start,
            Message.created_at < day_end,
        )
        if ids is not None and conv_ids:
            day_msg_q = day_msg_q.filter(Message.conversation_id.in_(conv_ids))
        elif ids is not None:
            day_msg_q = day_msg_q.filter(Message.id == None)
        day_msgs = day_msg_q.count()

        daily.append(
            DailyStatItem(
                date=day_start.strftime("%Y-%m-%d"),
                conversations=day_convs,
                messages=day_msgs,
            )
        )

    # Media notelor
    # Functia de agregare folosita pentru media notelor
    from sqlalchemy import func as sqlfunc
    total_ratings = fb_q.count()
    avg_q = db.query(sqlfunc.avg(ConversationFeedback.rating))
    if ids is not None:
        avg_q = avg_q.filter(ConversationFeedback.bot_id.in_(ids))
    avg_result = avg_q.scalar()
    average_rating = round(float(avg_result), 1) if avg_result else 0

    # Distributia notelor, de la 1 la 5
    rating_distribution = {}
    if total_ratings > 0:
        dist_q = db.query(
            ConversationFeedback.rating,
            sqlfunc.count(ConversationFeedback.id),
        )
        if ids is not None:
            dist_q = dist_q.filter(ConversationFeedback.bot_id.in_(ids))
        dist_rows = dist_q.group_by(ConversationFeedback.rating).all()
        for r, c in dist_rows:
            rating_distribution[str(r)] = c

    # Se returneaza toate statisticile
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


# --- Recenzii ---

# Lista paginata de recenzii, cu media si distributia notelor
@router.get("/feedback", response_model=FeedbackListResponse)
async def list_feedback(
    page: int = 1,
    per_page: int = 20,
    sort: str = "newest",
    rating_filter: int | None = None,
    bot_id: str | None = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Functia de agregare folosita pentru media notelor
    from sqlalchemy import func as sqlfunc

    # Numarul de elemente pe pagina este limitat, ca sa nu se consume memoria serverului
    per_page = max(1, min(per_page, 100))

    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        ids = [bot_id]
    else:
        ids = owned_bot_ids(db, admin)

    query = db.query(ConversationFeedback)
    if ids is not None:
        query = query.filter(ConversationFeedback.bot_id.in_(ids))

    # Filtrul de nota acceptat este intre 1 si 5
    if rating_filter is not None and 1 <= rating_filter <= 5:
        query = query.filter(ConversationFeedback.rating == rating_filter)

    total = query.count()

    # Sortarea recenziilor: cele mai vechi, cele mai bune, cele mai slabe sau cele mai noi
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
        # Pentru fiecare recenzie se ia primul mesaj al conversatiei, ca previzualizare
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

    # Statisticile agregate nu depind de filtrul de nota, dar depind de bot
    agg_q = db.query(ConversationFeedback)
    if ids is not None:
        agg_q = agg_q.filter(ConversationFeedback.bot_id.in_(ids))
    all_total = agg_q.count()
    avg_q = db.query(sqlfunc.avg(ConversationFeedback.rating))
    if ids is not None:
        avg_q = avg_q.filter(ConversationFeedback.bot_id.in_(ids))
    avg_result = avg_q.scalar()
    average_rating = round(float(avg_result), 1) if avg_result else 0

    rating_distribution = {}
    if all_total > 0:
        dist_q = db.query(
            ConversationFeedback.rating,
            sqlfunc.count(ConversationFeedback.id),
        )
        if ids is not None:
            dist_q = dist_q.filter(ConversationFeedback.bot_id.in_(ids))
        dist_rows = dist_q.group_by(ConversationFeedback.rating).all()
        for r, c in dist_rows:
            rating_distribution[str(r)] = c

    # Se returneaza recenziile paginate, cu statisticile generale
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


# Sterge o recenzie
@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    fb = db.query(ConversationFeedback).filter(ConversationFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    ensure_bot_accessible(fb.bot_id, db, admin)
    db.delete(fb)
    db.commit()
    return {"status": "deleted"}


# --- Notificari ---


# Functie ajutatoare care adauga o notificare in sesiunea curenta (commit-ul il face cel care o apeleaza)
def create_notification(db: Session, bot_id: str, notif_type: str, title: str, description: str = "", reference_id: str | None = None):
    # Se creeaza notificarea; commit-ul il face cel care apeleaza functia
    notif = Notification(
        bot_id=bot_id,
        type=notif_type,
        title=title,
        description=description,
        reference_id=reference_id,
    )
    db.add(notif)


# Lista notificarilor, cu numarul celor necitite
@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    bot_id: str | None = None,
    read: bool | None = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        ids = [bot_id]
    else:
        ids = owned_bot_ids(db, admin)

    query = db.query(Notification)
    if ids is not None:
        query = query.filter(Notification.bot_id.in_(ids))
    if read is not None:
        query = query.filter(Notification.read == read)

    total = query.count()
    # Numarul de notificari necitite, afisat in bara de sus
    unread_q = db.query(Notification).filter(Notification.read == False)
    if ids is not None:
        unread_q = unread_q.filter(Notification.bot_id.in_(ids))
    unread_count = unread_q.count()

    # Se returneaza cele mai noi 50 de notificari
    notifs = query.order_by(Notification.created_at.desc()).limit(50).all()

    return NotificationListResponse(
        items=[
            NotificationItem(
                id=n.id,
                type=n.type,
                title=n.title,
                description=n.description or "",
                read=n.read,
                reference_id=n.reference_id,
                created_at=n.created_at.isoformat(),
            )
            for n in notifs
        ],
        total=total,
        unread_count=unread_count,
    )


# Marcheaza ca citita o notificare sau pe toate
@router.put("/notifications/read")
async def mark_notifications_read(
    data: NotificationMarkRead,
    bot_id: str | None = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Se marcheaza toate notificarile ca citite, sau doar una dupa id
    if data.all:
        query = db.query(Notification).filter(Notification.read == False)
        if bot_id:
            ensure_bot_accessible(bot_id, db, admin)
            query = query.filter(Notification.bot_id == bot_id)
        else:
            ids = owned_bot_ids(db, admin)
            if ids is not None:
                query = query.filter(Notification.bot_id.in_(ids))
        # Actualizare in bloc, fara a incarca notificarile
        count = query.update({Notification.read: True})
        db.commit()
        return {"status": "ok", "count": count}
    elif data.id:
        notif = db.query(Notification).filter(Notification.id == data.id).first()
        if notif:
            ensure_bot_accessible(notif.bot_id, db, admin)
            notif.read = True
            db.commit()
        return {"status": "ok"}
    # Cererea trebuie sa contina un id sau all=true
    raise HTTPException(status_code=400, detail="Provide id or all=true")


# Sterge o notificare
@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    ensure_bot_accessible(notif.bot_id, db, admin)
    db.delete(notif)
    db.commit()
    return {"status": "deleted"}


# Sterge toate notificarile
@router.delete("/notifications")
async def delete_all_notifications(
    bot_id: str | None = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    query = db.query(Notification)
    if bot_id:
        ensure_bot_accessible(bot_id, db, admin)
        query = query.filter(Notification.bot_id == bot_id)
    else:
        ids = owned_bot_ids(db, admin)
        if ids is not None:
            query = query.filter(Notification.bot_id.in_(ids))
    # Stergere in bloc, cu numarul de notificari sterse
    count = query.delete()
    db.commit()
    return {"status": "deleted", "count": count}
