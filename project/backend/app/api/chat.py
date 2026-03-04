import base64
import io
import os
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from PIL import Image
from sqlalchemy.orm import Session

from app.models.database import BotConfig, Conversation, ConversationFeedback, Message, Notification, get_db
from app.models.schemas import ChatRequest, ChatResponse, FeedbackCreate
from app.rate_limiter import limiter
from app.services.rag import generate_response

router = APIRouter()

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "static",
    "uploads",
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB decoded

# Only allow real raster image formats (reject SVG, TIFF, BMP which can carry payloads)
ALLOWED_IMAGE_FORMATS = {"PNG", "JPEG", "GIF", "WEBP"}
FORMAT_TO_EXT = {"PNG": ".png", "JPEG": ".jpg", "GIF": ".gif", "WEBP": ".webp"}


def _sanitize_text(text: str) -> str:
    """Strip HTML tags from user input. Everything is treated as plain text."""
    # Remove any HTML tags (defense-in-depth, React already escapes)
    clean = re.sub(r'<[^>]+>', '', text)
    # Remove null bytes (binary injection)
    clean = clean.replace('\x00', '')
    return clean


def _save_base64_image(data: str) -> str:
    """Save a base64 image and return its URL path. Validates image content."""
    if "," in data:
        data = data.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Date base64 invalide")

    # Size check
    if len(img_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Imaginea prea mare (max 5MB)")

    # Reject files with null bytes in first 16 bytes (binary polyglot detection)
    # Also reject files starting with common script signatures
    header = img_bytes[:32]
    if b'<script' in header.lower() or b'<?php' in header.lower() or b'<html' in header.lower():
        raise HTTPException(status_code=400, detail="Fisierul nu este o imagine valida")

    # Validate it's actually an image using PIL
    try:
        img = Image.open(io.BytesIO(img_bytes))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Fisierul nu este o imagine valida")

    # Re-open to get format (verify() invalidates the object)
    img_reopened = Image.open(io.BytesIO(img_bytes))

    # Only allow safe raster formats (reject SVG, TIFF, BMP, ICO etc.)
    if img_reopened.format not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Format imagine nepermis. Permise: PNG, JPEG, GIF, WEBP",
        )

    ext = FORMAT_TO_EXT[img_reopened.format]

    # Re-encode the image to strip EXIF metadata and embedded payloads
    clean_buffer = io.BytesIO()
    # Convert to RGB for JPEG (JPEG doesn't support alpha)
    if img_reopened.format == "JPEG":
        img_clean = img_reopened.convert("RGB")
        img_clean.save(clean_buffer, format="JPEG", quality=90)
    else:
        img_reopened.save(clean_buffer, format=img_reopened.format)
    clean_bytes = clean_buffer.getvalue()

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Verify no path traversal
    real_upload = os.path.realpath(UPLOAD_DIR)
    real_file = os.path.realpath(filepath)
    if not real_file.startswith(real_upload):
        raise HTTPException(status_code=400, detail="Filename invalid")

    with open(filepath, "wb") as f:
        f.write(clean_bytes)
    return f"/static/uploads/{filename}"


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, data: ChatRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Sanitize user message - treat as plain text only
    safe_message = _sanitize_text(data.message)
    if not safe_message.strip():
        raise HTTPException(status_code=400, detail="Mesajul nu poate fi gol")

    # Validate bot exists
    bot = db.query(BotConfig).filter(BotConfig.bot_id == data.bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot inexistent")

    # Find or create conversation
    conversation = None
    if data.session_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.session_id == data.session_id,
                Conversation.bot_id == data.bot_id,
            )
            .first()
        )

    is_new_conversation = False
    if not conversation:
        is_new_conversation = True
        session_id = data.session_id or uuid.uuid4().hex
        conversation = Conversation(
            bot_id=data.bot_id,
            session_id=session_id,
            started_at=now,
            last_message_at=now,
            message_count=0,
        )
        db.add(conversation)
        db.flush()

    # Save image if provided
    image_url = None
    if data.image:
        image_url = _save_base64_image(data.image)

    # Save user message (sanitized)
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=safe_message,
        image_url=image_url,
        created_at=now,
    )
    db.add(user_msg)

    # Generate response
    result = generate_response(safe_message, bot_id=data.bot_id, db=db)

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

    # Notification for new conversation
    if is_new_conversation:
        preview = safe_message[:80] + ("..." if len(safe_message) > 80 else "")
        notif = Notification(
            bot_id=data.bot_id,
            type="conversation",
            title="Conversatie noua",
            description=preview,
            reference_id=conversation.id,
        )
        db.add(notif)

    db.commit()

    return ChatResponse(
        response=result["response"],
        sources=result["sources"],
        conversation_id=conversation.id,
    )


@router.post("/chat/feedback")
@limiter.limit("10/minute")
async def submit_feedback(request: Request, data: FeedbackCreate, db: Session = Depends(get_db)):
    # Sanitize comment if provided
    safe_comment = _sanitize_text(data.comment) if data.comment else None

    # Find conversation by session_id + bot_id
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.session_id == data.session_id,
            Conversation.bot_id == data.bot_id,
        )
        .first()
    )

    feedback = ConversationFeedback(
        conversation_id=conversation.id if conversation else None,
        bot_id=data.bot_id,
        session_id=data.session_id,
        rating=max(1, min(5, data.rating)),
        comment=safe_comment,
    )
    db.add(feedback)

    # Notification for feedback
    stars = "\u2605" * data.rating + "\u2606" * (5 - data.rating)
    desc = stars
    if safe_comment:
        desc += f" - {safe_comment[:80]}"
    notif = Notification(
        bot_id=data.bot_id,
        type="feedback",
        title="Feedback nou primit",
        description=desc,
        reference_id=feedback.id,
    )
    db.add(notif)

    db.commit()
    return {"status": "ok"}
