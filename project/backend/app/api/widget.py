from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import BotConfig, get_db
from app.models.schemas import WidgetConfigResponse, WidgetConfigUpdate

router = APIRouter(prefix="/widget")


@router.get("/config/{bot_id}", response_model=WidgetConfigResponse)
async def get_widget_config(bot_id: str, db: Session = Depends(get_db)):
    config = db.query(BotConfig).filter(BotConfig.bot_id == bot_id).first()
    if not config:
        return WidgetConfigResponse(
            welcome_message="Bună! Cu ce te pot ajuta?",
            bot_name="AI Assistant",
            bot_subtitle="AI Agent",
            primary_color="#6366f1",
            header_color="#14161a",
            bubble_color="#ffffff",
            bubble_icon_color="#14161a",
            bot_message_color="#f5f5f5",
            avatar_color="#6366f1",
            placeholder_text="Mesaj...",
            position="bottom-right",
        )
    return WidgetConfigResponse(
        welcome_message=config.welcome_message,
        bot_name=config.bot_name or "AI Assistant",
        bot_subtitle=config.bot_subtitle or "AI Agent",
        primary_color=config.primary_color,
        header_color=config.header_color or "#14161a",
        bubble_color=config.bubble_color or "#ffffff",
        bubble_icon_color=config.bubble_icon_color or "#14161a",
        bot_message_color=config.bot_message_color or "#f5f5f5",
        avatar_color=config.avatar_color or "#6366f1",
        placeholder_text=config.placeholder_text or "Mesaj...",
        position=config.position,
    )


@router.put("/config/{bot_id}", response_model=WidgetConfigResponse)
async def update_widget_config(
    bot_id: str, data: WidgetConfigUpdate, db: Session = Depends(get_db)
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
    if data.placeholder_text is not None:
        config.placeholder_text = data.placeholder_text
    if data.position is not None:
        config.position = data.position

    db.commit()
    db.refresh(config)
    return WidgetConfigResponse(
        welcome_message=config.welcome_message,
        bot_name=config.bot_name or "AI Assistant",
        bot_subtitle=config.bot_subtitle or "AI Agent",
        primary_color=config.primary_color,
        header_color=config.header_color or "#14161a",
        bubble_color=config.bubble_color or "#ffffff",
        bubble_icon_color=config.bubble_icon_color or "#14161a",
        bot_message_color=config.bot_message_color or "#f5f5f5",
        avatar_color=config.avatar_color or "#6366f1",
        placeholder_text=config.placeholder_text or "Mesaj...",
        position=config.position,
    )
