"""
WebSocket endpoint for operator (admin) live chat.

Authenticated via JWT token in query parameter.
Handles: accept conversation, send messages, close, transfer to bot.
"""

import re
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import (
    AdminUser, BotConfig, Conversation, Message, OperatorStatus, SessionLocal,
)
from app.services.connection_manager import manager

router = APIRouter()


def _sanitize(text: str) -> str:
    clean = re.sub(r'<[^>]+>', '', text)
    return clean.replace('\x00', '')


def _get_db() -> Session:
    return SessionLocal()


def _validate_ws_token(token: str) -> dict | None:
    """Validate JWT for WebSocket (can't use Depends)."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def _get_operator_bot_ids(db: Session, user_id: str) -> list[str]:
    """Get all bot_ids this operator can handle (for now: all bots)."""
    bots = db.query(BotConfig.bot_id).all()
    return [b[0] for b in bots]


@router.websocket("/ws/operator")
async def operator_ws(websocket: WebSocket):
    # Auth via query param
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = _validate_ws_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")

    db = _get_db()
    try:
        admin = db.query(AdminUser).filter(AdminUser.id == user_id, AdminUser.is_active == True).first()
        if not admin:
            await websocket.close(code=4001)
            return

        bot_ids = _get_operator_bot_ids(db, user_id)
        operator_name = admin.username

        # Update operator_status
        op_status = db.query(OperatorStatus).filter(OperatorStatus.admin_user_id == user_id).first()
        if not op_status:
            op_status = OperatorStatus(admin_user_id=user_id, is_available=True)
            db.add(op_status)
        op_status.is_available = True
        op_status.last_seen_at = datetime.now(timezone.utc)
        db.commit()
    finally:
        db.close()

    await websocket.accept()
    manager.connect_operator(user_id, websocket, bot_ids)

    # Send initial state
    await _send_initial_state(websocket, user_id, bot_ids)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "accept_conversation":
                await _handle_accept(websocket, user_id, operator_name, data)
            elif msg_type == "message":
                await _handle_operator_message(user_id, operator_name, data)
            elif msg_type == "close_conversation":
                await _handle_close(user_id, data)
            elif msg_type == "transfer_to_bot":
                await _handle_transfer_to_bot(user_id, data)
            elif msg_type == "typing":
                await _handle_operator_typing(data)

    except WebSocketDisconnect:
        await _handle_disconnect(user_id)
    except Exception:
        await _handle_disconnect(user_id)


async def _send_initial_state(ws: WebSocket, user_id: str, bot_ids: list[str]):
    db = _get_db()
    try:
        # Get waiting + live conversations for operator's bots
        conversations = (
            db.query(Conversation)
            .filter(
                Conversation.bot_id.in_(bot_ids),
                Conversation.status.in_(["waiting", "live"]),
            )
            .order_by(Conversation.last_message_at.desc())
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
                "conversation_id": conv.id,
                "session_id": conv.session_id,
                "bot_id": conv.bot_id,
                "status": conv.status,
                "preview": first_msg.content[:100] if first_msg else "",
                "message_count": conv.message_count,
                "started_at": conv.started_at.isoformat() + "Z",
                "last_message_at": conv.last_message_at.isoformat() + "Z",
                "operator_id": conv.operator_id,
            })

        await ws.send_json({
            "type": "init",
            "conversations": items,
        })
    finally:
        db.close()


async def _handle_accept(ws: WebSocket, user_id: str, operator_name: str, data: dict):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    db = _get_db()
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation or conversation.status not in ("waiting", "bot"):
            return

        conversation.status = "live"
        conversation.operator_id = user_id
        manager.assign_conversation(conversation_id, user_id)

        # System message
        sys_msg = Message(
            conversation_id=conversation_id, role="assistant",
            content=f"Esti acum conectat cu {operator_name}.",
            sender_type="system", created_at=datetime.now(timezone.utc),
        )
        db.add(sys_msg)
        conversation.message_count += 1
        db.commit()

        # Notify visitor
        await manager.send_to_visitor(conversation.session_id, {
            "type": "operator_connected",
            "operator_name": operator_name,
        })

        # Notify other operators
        await manager.broadcast_to_operators(conversation.bot_id, {
            "type": "conversation_accepted",
            "conversation_id": conversation_id,
            "operator_id": user_id,
            "operator_name": operator_name,
        })
    finally:
        db.close()


async def _handle_operator_message(user_id: str, operator_name: str, data: dict):
    conversation_id = data.get("conversation_id")
    content = _sanitize(data.get("content", "")).strip()
    if not conversation_id or not content or len(content) > 10000:
        return

    db = _get_db()
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation or conversation.status != "live":
            return

        now = datetime.now(timezone.utc)
        msg = Message(
            conversation_id=conversation_id, role="assistant",
            content=content, sender_type="operator", created_at=now,
        )
        db.add(msg)
        conversation.message_count += 1
        conversation.last_message_at = now
        db.commit()

        # Send to visitor
        await manager.send_to_visitor(conversation.session_id, {
            "type": "operator_message",
            "content": content,
            "operator_name": operator_name,
            "created_at": now.isoformat() + "Z",
        })
    finally:
        db.close()


async def _handle_close(user_id: str, data: dict):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    db = _get_db()
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return

        conversation.status = "closed"
        conversation.operator_id = None
        manager.unassign_conversation(conversation_id)

        sys_msg = Message(
            conversation_id=conversation_id, role="assistant",
            content="Operatorul a incheiat conversatia.",
            sender_type="system", created_at=datetime.now(timezone.utc),
        )
        db.add(sys_msg)
        conversation.message_count += 1
        db.commit()

        await manager.send_to_visitor(conversation.session_id, {
            "type": "conversation_closed",
        })

        # Notify operators
        await manager.broadcast_to_operators(conversation.bot_id, {
            "type": "conversation_closed_update",
            "conversation_id": conversation_id,
        })
    finally:
        db.close()


async def _handle_transfer_to_bot(user_id: str, data: dict):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    db = _get_db()
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return

        conversation.status = "bot"
        conversation.operator_id = None
        manager.unassign_conversation(conversation_id)

        sys_msg = Message(
            conversation_id=conversation_id, role="assistant",
            content="Ati fost transferat inapoi la asistentul AI.",
            sender_type="system", created_at=datetime.now(timezone.utc),
        )
        db.add(sys_msg)
        conversation.message_count += 1
        db.commit()

        await manager.send_to_visitor(conversation.session_id, {
            "type": "transferred_to_bot",
        })

        await manager.broadcast_to_operators(conversation.bot_id, {
            "type": "conversation_transferred",
            "conversation_id": conversation_id,
        })
    finally:
        db.close()


async def _handle_operator_typing(data: dict):
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    db = _get_db()
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation and conversation.status == "live":
            await manager.send_to_visitor(conversation.session_id, {
                "type": "operator_typing",
            })
    finally:
        db.close()


async def _handle_disconnect(user_id: str):
    # Get conversations assigned to this operator
    conv_ids = manager.get_conversations_for_operator(user_id)
    manager.disconnect_operator(user_id)

    # Mark conversations back to waiting
    if conv_ids:
        db = _get_db()
        try:
            for cid in conv_ids:
                conv = db.query(Conversation).filter(Conversation.id == cid).first()
                if conv and conv.status == "live":
                    conv.status = "waiting"
                    conv.operator_id = None
                    manager.unassign_conversation(cid)

                    sys_msg = Message(
                        conversation_id=cid, role="assistant",
                        content="Operatorul s-a deconectat. Asteptati un alt operator...",
                        sender_type="system", created_at=datetime.now(timezone.utc),
                    )
                    db.add(sys_msg)

                    await manager.send_to_visitor(conv.session_id, {
                        "type": "operator_disconnected",
                    })

                    await manager.broadcast_to_operators(conv.bot_id, {
                        "type": "new_waiting_conversation",
                        "conversation_id": conv.id,
                        "session_id": conv.session_id,
                        "bot_id": conv.bot_id,
                        "preview": "",
                        "message_count": conv.message_count,
                        "started_at": conv.started_at.isoformat() + "Z",
                    })
            db.commit()
        finally:
            db.close()

    # Update operator_status
    db = _get_db()
    try:
        op_status = db.query(OperatorStatus).filter(OperatorStatus.admin_user_id == user_id).first()
        if op_status:
            op_status.is_available = False
            op_status.last_seen_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()
