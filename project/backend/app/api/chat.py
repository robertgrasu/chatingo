import base64
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import Conversation, Message, get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag import generate_response

router = APIRouter()

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "static",
    "uploads",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_base64_image(data: str) -> str:
    """Save a base64 image and return its URL path."""
    if "," in data:
        data = data.split(",", 1)[1]
    img_bytes = base64.b64decode(data)
    filename = f"{uuid.uuid4().hex}.png"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(img_bytes)
    return f"/static/uploads/{filename}"


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Find or create conversation
    conversation = None
    if request.session_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.session_id == request.session_id,
                Conversation.bot_id == request.bot_id,
            )
            .first()
        )

    if not conversation:
        session_id = request.session_id or uuid.uuid4().hex
        conversation = Conversation(
            bot_id=request.bot_id,
            session_id=session_id,
            started_at=now,
            last_message_at=now,
            message_count=0,
        )
        db.add(conversation)
        db.flush()

    # Save image if provided
    image_url = None
    if request.image:
        image_url = _save_base64_image(request.image)

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        image_url=image_url,
        created_at=now,
    )
    db.add(user_msg)

    # Generate response
    result = generate_response(request.message)

    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=result["response"],
        created_at=datetime.now(timezone.utc),
    )
    db.add(assistant_msg)

    # Update conversation
    conversation.message_count += 2
    conversation.last_message_at = datetime.now(timezone.utc)
    db.commit()

    return ChatResponse(
        response=result["response"],
        sources=result["sources"],
        conversation_id=conversation.id,
    )
