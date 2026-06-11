from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import (
    AdminUser, ContactSubmission, Conversation, Message, OperatorStatus, get_db,
)
from app.models.schemas import ContactSubmissionListResponse, ContactSubmissionOut
from app.services.auth import get_current_admin
from app.services.connection_manager import manager
from app.services.ownership import ensure_bot_accessible, owned_bot_ids

router = APIRouter(prefix="/admin/livechat")


# Conversatiile pentru live chat (in asteptare, live si inchise recent), ale botilor echipei
@router.get("/conversations")
async def get_live_conversations(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Doar conversatiile botilor echipei
    ids = owned_bot_ids(db, admin)
    # Conversatii in asteptare, live sau inchise
    query = db.query(Conversation).filter(Conversation.status.in_(["waiting", "live", "closed"]))
    if ids is not None:
        query = query.filter(Conversation.bot_id.in_(ids))
    # Cele mai recente 50 de conversatii
    conversations = query.order_by(Conversation.last_message_at.desc()).limit(50).all()

    items = []
    for conv in conversations:
        # Primul mesaj al vizitatorului, folosit ca previzualizare
        first_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id, Message.role == "user")
            .order_by(Message.created_at)
            .first()
        )
        # Datele unei conversatii in forma trimisa panoului
        items.append({
            "id": conv.id,
            "session_id": conv.session_id,
            "bot_id": conv.bot_id,
            "status": conv.status,
            "preview": first_msg.content[:100] if first_msg else "",
            "message_count": conv.message_count,
            "started_at": conv.started_at.isoformat(),
            "last_message_at": conv.last_message_at.isoformat(),
            "operator_id": conv.operator_id,
        })

    return {"items": items}


# Istoricul complet de mesaje al unei conversatii
@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversatie negasita")
    ensure_bot_accessible(conversation.bot_id, db, admin)

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

    # Operatorul este disponibil daca asa a setat, si conectat daca are un WebSocket deschis
    return {
        "conversation_id": conversation.id,
        "session_id": conversation.session_id,
        "bot_id": conversation.bot_id,
        "status": conversation.status,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sender_type": m.sender_type,
                "image_url": m.image_url,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


# Starea operatorului curent: disponibil si conectat prin WebSocket
@router.get("/operator/status")
async def get_operator_status(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Se citeste statusul operatorului curent
    op_status = (
        db.query(OperatorStatus)
        .filter(OperatorStatus.admin_user_id == admin.id)
        .first()
    )
    return {
        "is_available": op_status.is_available if op_status else False,
        "is_connected": admin.id in manager.operator_connections,
    }


# Operatorul se marcheaza ca disponibil sau indisponibil
@router.put("/operator/status")
async def update_operator_status(
    data: dict,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Disponibilitatea ceruta de operator
    is_available = data.get("is_available", False)

    op_status = (
        db.query(OperatorStatus)
        .filter(OperatorStatus.admin_user_id == admin.id)
        .first()
    )
    # Prima data statusul se creeaza
    if not op_status:
        op_status = OperatorStatus(admin_user_id=admin.id)
        db.add(op_status)

    # Se salveaza disponibilitatea si momentul ultimei activitati
    op_status.is_available = is_available
    op_status.last_seen_at = datetime.now(timezone.utc)
    db.commit()

    return {"is_available": is_available}


# Ultimele 100 de mesaje din formularul de contact
@router.get("/contacts", response_model=ContactSubmissionListResponse)
async def get_contact_submissions(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Doar mesajele de contact ale botilor echipei
    ids = owned_bot_ids(db, admin)
    query = db.query(ContactSubmission)
    if ids is not None:
        query = query.filter(ContactSubmission.bot_id.in_(ids))
    submissions = query.order_by(ContactSubmission.created_at.desc()).limit(100).all()

    return ContactSubmissionListResponse(
        items=[
            ContactSubmissionOut(
                id=s.id,
                bot_id=s.bot_id,
                session_id=s.session_id,
                visitor_name=s.visitor_name,
                visitor_email=s.visitor_email,
                message=s.message,
                status=s.status,
                created_at=s.created_at.isoformat(),
                conversation_id=s.conversation_id,
            )
            for s in submissions
        ],
        total=len(submissions),
    )


# Marcheaza un mesaj de contact ca citit
@router.put("/contacts/{contact_id}/read")
async def mark_contact_read(
    contact_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == contact_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Formular negasit")
    ensure_bot_accessible(submission.bot_id, db, admin)
    submission.status = "read"
    db.commit()
    return {"status": "ok"}


# Sterge un mesaj de contact
@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == contact_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Formular negasit")
    ensure_bot_accessible(submission.bot_id, db, admin)
    db.delete(submission)
    db.commit()
    return {"status": "deleted"}
