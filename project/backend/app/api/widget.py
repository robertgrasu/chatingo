import io
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from PIL import Image
from sqlalchemy.orm import Session

from fastapi import Request

from app.models.database import AdminUser, BotConfig, get_db
from app.models.schemas import WidgetConfigPublic, WidgetConfigResponse, WidgetConfigUpdate
from app.rate_limiter import limiter
from app.services.auth import get_current_admin

router = APIRouter(prefix="/widget")

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
AVATARS_DIR = os.path.join(STATIC_DIR, "avatars")
os.makedirs(AVATARS_DIR, exist_ok=True)

MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB


def _config_to_public(config: BotConfig) -> WidgetConfigPublic:
    """Public config - only UI fields, NO AI behavior secrets."""
    return WidgetConfigPublic(
        welcome_message=config.welcome_message,
        bot_name=config.bot_name or "AI Assistant",
        bot_subtitle=config.bot_subtitle or "AI Agent",
        primary_color=config.primary_color,
        header_color=config.header_color or "#14161a",
        bubble_color=config.bubble_color or "#ffffff",
        bubble_icon_color=config.bubble_icon_color or "#14161a",
        bot_message_color=config.bot_message_color or "#f5f5f5",
        avatar_color=config.avatar_color or "#6366f1",
        avatar_url=config.avatar_url,
        gradient_end_color=config.gradient_end_color,
        gradient_angle=config.gradient_angle if config.gradient_angle is not None else 135,
        placeholder_text=config.placeholder_text or "Mesaj...",
        position=config.position,
        widget_theme=config.widget_theme or "default",
        show_online_status=config.show_online_status if config.show_online_status is not None else True,
        show_subtitle=config.show_subtitle if config.show_subtitle is not None else True,
        enable_emoji=config.enable_emoji if config.enable_emoji is not None else True,
        enable_attachments=config.enable_attachments if config.enable_attachments is not None else True,
        enable_voice=config.enable_voice if config.enable_voice is not None else False,
        enable_reviews=config.enable_reviews if config.enable_reviews is not None else True,
        enable_quick_replies=config.enable_quick_replies if config.enable_quick_replies is not None else True,
        send_button_color=config.send_button_color,
        user_message_color=config.user_message_color,
        bubble_icon=config.bubble_icon or "chat",
        avatar_size=config.avatar_size if config.avatar_size is not None else 42,
        quick_replies=config.quick_replies,
        language=config.language or "auto",
    )


def _config_to_full(config: BotConfig) -> WidgetConfigResponse:
    """Full config with AI behavior - ADMIN ONLY."""
    public = _config_to_public(config)
    return WidgetConfigResponse(
        **public.model_dump(),
        system_prompt=config.system_prompt,
        temperature=config.temperature if config.temperature is not None else 0.7,
        max_tokens=config.max_tokens if config.max_tokens is not None else 500,
        response_style=config.response_style or "balanced",
        context_docs_count=config.context_docs_count if config.context_docs_count is not None else 3,
    )


def _safe_delete_file(filepath: str):
    """Delete file only if it's inside AVATARS_DIR (path traversal prevention)."""
    real_path = os.path.realpath(filepath)
    real_avatars = os.path.realpath(AVATARS_DIR)
    if real_path.startswith(real_avatars + os.sep) and os.path.exists(real_path):
        os.remove(real_path)


# GET config = PUBLIC (widget needs it) - NO AI secrets exposed
@router.get("/config/{bot_id}", response_model=WidgetConfigPublic)
@limiter.limit("60/minute")
async def get_widget_config(request: Request, bot_id: str, db: Session = Depends(get_db)):
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if not config:
        return WidgetConfigPublic(
            welcome_message="Bună! Cu ce te pot ajuta?",
            bot_name="AI Assistant",
            bot_subtitle="AI Agent",
            primary_color="#6366f1",
            header_color="#14161a",
            bubble_color="#ffffff",
            bubble_icon_color="#14161a",
            bot_message_color="#f5f5f5",
            avatar_color="#6366f1",
            avatar_url=None,
            gradient_end_color=None,
            gradient_angle=135,
            placeholder_text="Mesaj...",
            position="bottom-right",
            widget_theme="default",
            show_online_status=True,
            show_subtitle=True,
            enable_emoji=True,
            enable_attachments=True,
            enable_voice=False,
            enable_reviews=True,
            enable_quick_replies=True,
            send_button_color=None,
            user_message_color=None,
            bubble_icon="chat",
            avatar_size=42,
            quick_replies=None,
            language="auto",
        )
    return _config_to_public(config)


# GET full config = ADMIN ONLY (includes system_prompt, temperature, etc.)
@router.get("/config/{bot_id}/full", response_model=WidgetConfigResponse)
async def get_widget_config_full(
    bot_id: str, db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return _config_to_full(config)


# PUT config = ADMIN AUTH REQUIRED
@router.put("/config/{bot_id}", response_model=WidgetConfigResponse)
async def update_widget_config(
    bot_id: str, data: WidgetConfigUpdate, db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if not config:
        config = BotConfig(bot_id=bot_id)
        db.add(config)

    if data.welcome_message is not None:
        config.welcome_message = data.welcome_message
    if data.bot_name is not None:
        config.bot_name = data.bot_name
    if data.bot_subtitle is not None:
        config.bot_subtitle = data.bot_subtitle
    if data.primary_color is not None:
        config.primary_color = data.primary_color
    if data.header_color is not None:
        config.header_color = data.header_color
    if data.bubble_color is not None:
        config.bubble_color = data.bubble_color
    if data.bubble_icon_color is not None:
        config.bubble_icon_color = data.bubble_icon_color
    if data.bot_message_color is not None:
        config.bot_message_color = data.bot_message_color
    if data.avatar_color is not None:
        config.avatar_color = data.avatar_color
    if data.avatar_url is not None:
        config.avatar_url = data.avatar_url if data.avatar_url != "" else None
    if data.gradient_end_color is not None:
        config.gradient_end_color = data.gradient_end_color if data.gradient_end_color != "" else None
    if data.gradient_angle is not None:
        config.gradient_angle = data.gradient_angle
    if data.placeholder_text is not None:
        config.placeholder_text = data.placeholder_text
    if data.position is not None:
        config.position = data.position
    if data.widget_theme is not None:
        config.widget_theme = data.widget_theme
    if data.show_online_status is not None:
        config.show_online_status = data.show_online_status
    if data.show_subtitle is not None:
        config.show_subtitle = data.show_subtitle
    if data.enable_emoji is not None:
        config.enable_emoji = data.enable_emoji
    if data.enable_attachments is not None:
        config.enable_attachments = data.enable_attachments
    if data.enable_voice is not None:
        config.enable_voice = data.enable_voice
    if data.enable_reviews is not None:
        config.enable_reviews = data.enable_reviews
    if data.enable_quick_replies is not None:
        config.enable_quick_replies = data.enable_quick_replies
    if data.send_button_color is not None:
        config.send_button_color = data.send_button_color if data.send_button_color != "" else None
    if data.user_message_color is not None:
        config.user_message_color = data.user_message_color if data.user_message_color != "" else None
    if data.bubble_icon is not None:
        config.bubble_icon = data.bubble_icon
    if data.avatar_size is not None:
        config.avatar_size = data.avatar_size
    if data.quick_replies is not None:
        config.quick_replies = data.quick_replies if data.quick_replies != "" else None
    # AI Behavior
    if data.system_prompt is not None:
        config.system_prompt = data.system_prompt if data.system_prompt != "" else None
    if data.temperature is not None:
        config.temperature = data.temperature
    if data.max_tokens is not None:
        config.max_tokens = data.max_tokens
    if data.response_style is not None:
        config.response_style = data.response_style
    if data.context_docs_count is not None:
        config.context_docs_count = data.context_docs_count
    if data.language is not None:
        config.language = data.language

    db.commit()
    db.refresh(config)
    return _config_to_full(config)


# POST avatar = ADMIN AUTH REQUIRED + file security
@router.post("/avatar/{bot_id}")
async def upload_avatar(
    bot_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    # Reject SVG (XSS vector)
    if file.content_type == "image/svg+xml":
        raise HTTPException(status_code=400, detail="SVG nu este permis (risc XSS)")

    allowed = {"image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Tip de fisier invalid. Doar PNG, JPG, GIF, WebP.")

    # Read with size limit
    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=413, detail="Fisier prea mare (max 2MB)")

    # Validate actual image content with PIL (magic bytes check)
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Fisierul nu este o imagine valida")

    # Determine safe extension from actual format
    allowed_formats = {"PNG", "JPEG", "GIF", "WEBP"}
    format_to_ext = {"PNG": ".png", "JPEG": ".jpg", "GIF": ".gif", "WEBP": ".webp"}
    img_reopened = Image.open(io.BytesIO(contents))

    if img_reopened.format not in allowed_formats:
        raise HTTPException(status_code=400, detail="Format imagine nepermis")

    ext = format_to_ext[img_reopened.format]

    # Re-encode to strip EXIF metadata and any embedded payloads
    clean_buf = io.BytesIO()
    if img_reopened.format == "JPEG":
        img_reopened.convert("RGB").save(clean_buf, format="JPEG", quality=90)
    else:
        img_reopened.save(clean_buf, format=img_reopened.format)
    clean_bytes = clean_buf.getvalue()

    filename = f"avatar_{bot_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(AVATARS_DIR, filename)

    # Path traversal check
    real_path = os.path.realpath(filepath)
    if not real_path.startswith(os.path.realpath(AVATARS_DIR) + os.sep):
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Remove old avatar file
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if config and config.avatar_url:
        old_filename = config.avatar_url.split("/")[-1]
        _safe_delete_file(os.path.join(AVATARS_DIR, old_filename))

    with open(filepath, "wb") as f:
        f.write(clean_bytes)

    avatar_url = f"/static/avatars/{filename}"
    if not config:
        config = BotConfig(bot_id=bot_id, avatar_url=avatar_url)
        db.add(config)
    else:
        config.avatar_url = avatar_url

    db.commit()
    return {"avatar_url": avatar_url}


# DELETE avatar = ADMIN AUTH REQUIRED
@router.delete("/avatar/{bot_id}")
async def delete_avatar(
    bot_id: str, db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    if config.avatar_url:
        old_filename = config.avatar_url.split("/")[-1]
        _safe_delete_file(os.path.join(AVATARS_DIR, old_filename))

    config.avatar_url = None
    db.commit()
    return {"status": "deleted"}
