import uuid
from datetime import datetime, timezone

from sqlalchemy import (
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
    placeholder_text = Column(String(200), default="Mesaj...")
    position = Column(String(20), default="bottom-right")
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


engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)
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
