"""
WebSocket endpoint for widget visitors.

Handles real-time chat when enable_live_chat is active.
Messages flow: visitor → bot (RAG) or visitor ↔ operator.
"""

import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.models.database import (
    BotConfig, Conversation, ContactSubmission, Message, Notification, SessionLocal,
)
from app.services.connection_manager import manager
from app.services.domain_check import is_origin_allowed
from app.services.rag import generate_response

router = APIRouter()





def _sanitize(text: str) -> str:
    clean = re.sub(r'<[^>]+>', '', text)
    return clean.replace('\x00', '')


def _get_db() -> Session:
    return SessionLocal()


@router.websocket("/ws/chat/{bot_id}/{session_id}")
async def visitor_ws(websocket: WebSocket, bot_id: str, session_id: str):
    # Validate inputs
    if len(bot_id) > 50 or len(session_id) > 100:
        await websocket.close(code=4000)
        return

    # Domain licensing check
    origin = websocket.headers.get("origin", "")
    db = _get_db()
    try:
        bot_config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
        if bot_config and bot_config.allowed_domains:
            if not is_origin_allowed(bot_config.allowed_domains, origin):
                await websocket.close(code=4403)
                return
    finally:
        db.close()

    await websocket.accept()
    manager.connect_visitor(session_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "message":
                await _handle_message(websocket, bot_id, session_id, data)

            elif msg_type == "request_human":
                await _handle_request_human(websocket, bot_id, session_id)

            elif msg_type == "contact_form":
                await _handle_contact_form(websocket, bot_id, session_id, data)

            elif msg_type == "typing":
                await _handle_visitor_typing(bot_id, session_id)

    except WebSocketDisconnect:
        manager.disconnect_visitor(session_id)
    except Exception:
        manager.disconnect_visitor(session_id)


async def _handle_message(ws: WebSocket, bot_id: str, session_id: str, data: dict):
    content = _sanitize(data.get("content", "")).strip()
    if not content or len(content) > 10000:
        return

    db = _get_db()
    try:
        # Find or create conversation
        conversation = (
            db.query(Conversation)
            .filter(Conversation.session_id == session_id, Conversation.bot_id == bot_id)
            .first()
        )

        now = datetime.now(timezone.utc)
        is_new = False
        if not conversation:
            is_new = True
            conversation = Conversation(
                bot_id=bot_id, session_id=session_id,
                started_at=now, last_message_at=now, message_count=0,
            )
            db.add(conversation)
            db.flush()

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id, role="user",
            content=content, sender_type="user", created_at=now,
        )
        db.add(user_msg)

        if conversation.status == "live":
            # Route to assigned operator
            operator_id = manager.get_operator_for_conversation(conversation.id)
            if operator_id:
                conversation.message_count += 1
                conversation.last_message_at = now
                db.commit()
                await manager.send_to_operator(operator_id, {
                    "type": "visitor_message",
                    "conversation_id": conversation.id,
                    "content": content,
                    "session_id": session_id,
                    "created_at": now.isoformat() + "Z",
                })
                return
            # Operator disconnected — fall back to bot
            conversation.status = "bot"

        # Bot mode — generate RAG response
        bot_config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
        enable_live_chat = bot_config.enable_live_chat if bot_config else False

        result = generate_response(content, bot_id=bot_id, db=db)
        confidence = result.get("confidence", 1.0)

        # Save bot message
        bot_msg = Message(
            conversation_id=conversation.id, role="assistant",
            content=result["response"], sender_type="bot",
            created_at=datetime.now(timezone.utc),
        )
        db.add(bot_msg)

        conversation.message_count += 2
        conversation.last_message_at = datetime.now(timezone.utc)

        # Notification for new conversation
        if is_new:
            preview = content[:80] + ("..." if len(content) > 80 else "")
            notif = Notification(
                bot_id=bot_id, type="conversation",
                title="Conversatie noua", description=preview,
                reference_id=conversation.id,
            )
            db.add(notif)

        db.commit()

        # Send bot response to visitor
        await ws.send_json({
            "type": "bot_message",
            "content": result["response"],
            "sources": result["sources"],
            "confidence": confidence,
        })

        # Suggest escalation only when bot explicitly can't help
        if enable_live_chat and result.get("needs_escalation", False):
            operators_online = manager.is_any_operator_online(bot_id)
            await ws.send_json({
                "type": "escalation_suggestion",
                "operators_online": operators_online,
            })

    finally:
        db.close()


async def _handle_request_human(ws: WebSocket, bot_id: str, session_id: str):
    db = _get_db()
    try:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.session_id == session_id, Conversation.bot_id == bot_id)
            .first()
        )
        if not conversation:
            await ws.send_json({"type": "show_contact_form"})
            return

        if manager.is_any_operator_online(bot_id):
            conversation.status = "waiting"
            # System message
            sys_msg = Message(
                conversation_id=conversation.id, role="assistant",
                content="Vizitatorul a solicitat un operator uman.",
                sender_type="system", created_at=datetime.now(timezone.utc),
            )
            db.add(sys_msg)
            conversation.message_count += 1
            db.commit()

            # Get conversation preview
            first_msg = (
                db.query(Message)
                .filter(Message.conversation_id == conversation.id, Message.role == "user")
                .order_by(Message.created_at)
                .first()
            )
            preview = first_msg.content[:100] if first_msg else ""

            # Notify all operators for this bot
            await manager.broadcast_to_operators(bot_id, {
                "type": "new_waiting_conversation",
                "conversation_id": conversation.id,
                "session_id": session_id,
                "bot_id": bot_id,
                "preview": preview,
                "message_count": conversation.message_count,
                "started_at": conversation.started_at.isoformat() + "Z",
            })

            await ws.send_json({"type": "waiting_for_operator"})
        else:
            await ws.send_json({"type": "show_contact_form"})
    finally:
        db.close()


async def _handle_contact_form(ws: WebSocket, bot_id: str, session_id: str, data: dict):
    name = _sanitize(data.get("name", "")).strip()[:200]
    email = _sanitize(data.get("email", "")).strip()[:300]
    message = _sanitize(data.get("message", "")).strip()[:5000]

    if not name or not email or not message:
        await ws.send_json({"type": "error", "message": "Toate campurile sunt obligatorii."})
        return

    db = _get_db()
    try:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.session_id == session_id, Conversation.bot_id == bot_id)
            .first()
        )

        submission = ContactSubmission(
            bot_id=bot_id,
            conversation_id=conversation.id if conversation else None,
            session_id=session_id,
            visitor_name=name,
            visitor_email=email,
            message=message,
        )
        db.add(submission)

        # Notification
        notif = Notification(
            bot_id=bot_id, type="contact",
            title=f"Formular contact: {name}",
            description=message[:100],
            reference_id=submission.id,
        )
        db.add(notif)
        db.commit()

        await ws.send_json({"type": "contact_form_submitted"})
    finally:
        db.close()


async def _handle_visitor_typing(bot_id: str, session_id: str):
    db = _get_db()
    try:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.session_id == session_id, Conversation.bot_id == bot_id)
            .first()
        )
        if conversation and conversation.status == "live":
            operator_id = manager.get_operator_for_conversation(conversation.id)
            if operator_id:
                await manager.send_to_operator(operator_id, {
                    "type": "visitor_typing",
                    "conversation_id": conversation.id,
                })
    finally:
        db.close()
