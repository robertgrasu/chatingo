"""REST endpoints for live chat admin management."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import (
    AdminUser, ContactSubmission, Conversation, Message, OperatorStatus, get_db,
)
from app.models.schemas import ContactSubmissionListResponse, ContactSubmissionOut
from app.services.auth import get_current_admin
from app.services.connection_manager import manager

router = APIRouter(prefix="/admin/livechat")


@router.get("/conversations")
async def get_live_conversations(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Get waiting + live + recently closed conversations."""
    conversations = (
        db.query(Conversation)
        .filter(Conversation.status.in_(["waiting", "live", "closed"]))
        .order_by(Conversation.last_message_at.desc())
        .limit(50)
        .all()
    )

    items = []
    for conv in conversations:
        first_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id, Message.role == "user")
            .order_by(Message.created_at)
            .first()
        )
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


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    """Get full message history for a conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversatie negasita")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

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


@router.get("/operator/status")
async def get_operator_status(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    op_status = (
        db.query(OperatorStatus)
        .filter(OperatorStatus.admin_user_id == admin.id)
        .first()
    )
    return {
        "is_available": op_status.is_available if op_status else False,
        "is_connected": admin.id in manager.operator_connections,
    }


@router.put("/operator/status")
async def update_operator_status(
    data: dict,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    is_available = data.get("is_available", False)

    op_status = (
        db.query(OperatorStatus)
        .filter(OperatorStatus.admin_user_id == admin.id)
        .first()
    )
    if not op_status:
        op_status = OperatorStatus(admin_user_id=admin.id)
        db.add(op_status)

    op_status.is_available = is_available
    op_status.last_seen_at = datetime.now(timezone.utc)
    db.commit()

    return {"is_available": is_available}


@router.get("/contacts", response_model=ContactSubmissionListResponse)
async def get_contact_submissions(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    submissions = (
        db.query(ContactSubmission)
        .order_by(ContactSubmission.created_at.desc())
        .limit(100)
        .all()
    )

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


@router.put("/contacts/{contact_id}/read")
async def mark_contact_read(
    contact_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == contact_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Formular negasit")
    submission.status = "read"
    db.commit()
    return {"status": "ok"}


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == contact_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Formular negasit")
    db.delete(submission)
    db.commit()
    return {"status": "deleted"}
