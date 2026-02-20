import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), nullable=False, index=True, default="bot_123")
    name = Column(String(255), nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    documents = relationship(
        "Document", back_populates="category", cascade="all, delete-orphan"
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), nullable=False, index=True, default="bot_123")
    filename = Column(String(500), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    content = Column(Text, nullable=True)
    status = Column(String(20), default="processing")  # ready, processing, error
    chunk_count = Column(Integer, default=0)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    category = relationship("Category", back_populates="documents")


class BotConfig(Base):
    __tablename__ = "bot_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), unique=True, nullable=False)
    welcome_message = Column(Text, default="Bună! Cu ce te pot ajuta?")
    bot_name = Column(String(100), default="AI Assistant")
    bot_subtitle = Column(String(200), default="AI Agent")
    primary_color = Column(String(7), default="#6366f1")
    header_color = Column(String(7), default="#14161a")
    bubble_color = Column(String(7), default="#ffffff")
    bubble_icon_color = Column(String(7), default="#14161a")
    bot_message_color = Column(String(7), default="#f5f5f5")
    avatar_color = Column(String(7), default="#6366f1")
    avatar_url = Column(Text, nullable=True)
    gradient_end_color = Column(Text, nullable=True)
    gradient_angle = Column(Integer, default=135)
    placeholder_text = Column(String(200), default="Mesaj...")
    position = Column(String(20), default="bottom-right")
    widget_theme = Column(String(20), default="default")
    show_online_status = Column(Boolean, default=True)
    show_subtitle = Column(Boolean, default=True)
    enable_emoji = Column(Boolean, default=True)
    enable_attachments = Column(Boolean, default=True)
    enable_voice = Column(Boolean, default=False)
    send_button_color = Column(String(7), nullable=True)
    user_message_color = Column(String(7), nullable=True)
    bubble_icon = Column(String(20), default="chat")
    avatar_size = Column(Integer, default=42)
    quick_replies = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), nullable=False)
    session_id = Column(String(100), nullable=False)
    started_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    last_message_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    message_count = Column(Integer, default=0)

    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(
        String, ForeignKey("conversations.id"), nullable=False
    )
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    conversation = relationship("Conversation", back_populates="messages")


class ConversationFeedback(Base):
    __tablename__ = "conversation_feedback"

    id = Column(String, primary_key=True, default=lambda: f"fb_{uuid.uuid4().hex[:12]}")
    conversation_id = Column(
        String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True
    )
    bot_id = Column(String(100), nullable=False, index=True)
    session_id = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)

    # Migrations: add columns that create_all won't add to existing tables
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS widget_theme VARCHAR(20) DEFAULT 'default'"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS avatar_url TEXT"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS gradient_end_color TEXT"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS gradient_angle INTEGER DEFAULT 135"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS show_subtitle BOOLEAN DEFAULT TRUE"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS enable_emoji BOOLEAN DEFAULT TRUE"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS enable_attachments BOOLEAN DEFAULT TRUE"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS enable_voice BOOLEAN DEFAULT FALSE"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS send_button_color VARCHAR(7)"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS user_message_color VARCHAR(7)"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS bubble_icon VARCHAR(20) DEFAULT 'chat'"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS avatar_size INTEGER DEFAULT 42"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS quick_replies TEXT"
            ))
            conn.execute(text(
                "ALTER TABLE conversation_feedback ADD COLUMN IF NOT EXISTS comment TEXT"
            ))
            # Multi-bot: add bot_id to categories and documents
            conn.execute(text(
                "ALTER TABLE categories ADD COLUMN IF NOT EXISTS bot_id VARCHAR(100) DEFAULT 'bot_123'"
            ))
            conn.execute(text(
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS bot_id VARCHAR(100) DEFAULT 'bot_123'"
            ))
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_categories_bot_id ON categories (bot_id)"
            ))
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_documents_bot_id ON documents (bot_id)"
            ))
            conn.commit()
        except Exception:
            pass

    db = SessionLocal()
    try:
        existing = db.query(BotConfig).filter_by(bot_id="bot_123").first()
        if not existing:
            default_bot = BotConfig(
                bot_id="bot_123",
                welcome_message="Bună! Cu ce te pot ajuta?",
                primary_color="#6366f1",
                position="bottom-right",
            )
            db.add(default_bot)
            db.commit()
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
