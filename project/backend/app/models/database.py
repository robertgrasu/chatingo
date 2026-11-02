import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from app.config import settings


# Clasa de baza din care mostenesc toate modelele SQLAlchemy
class Base(DeclarativeBase):
    pass


# Categoria in care sunt grupate documentele din baza de cunostinte a unui bot
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


# Un document incarcat in baza de cunostinte, cu starea procesarii si numarul de bucati
class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), nullable=False, index=True, default="bot_123")
    filename = Column(String(500), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    content = Column(Text, nullable=True)
    status = Column(String(20), default="processing")  # ready, processing sau error
    chunk_count = Column(Integer, default=0)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    category = relationship("Category", back_populates="documents")


# Configuratia unui bot: aspectul widget-ului, comportamentul AI, live chat, domeniile permise si proprietarul
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
    enable_reviews = Column(Boolean, default=True)
    enable_quick_replies = Column(Boolean, default=True)
    send_button_color = Column(String(7), nullable=True)
    user_message_color = Column(String(7), nullable=True)
    bubble_icon = Column(String(20), default="chat")
    avatar_size = Column(Integer, default=42)
    quick_replies = Column(Text, nullable=True)
    # Setarile de comportament AI
    system_prompt = Column(Text, nullable=True)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=500)
    response_style = Column(String(20), default="balanced")
    context_docs_count = Column(Integer, default=3)
    language = Column(String(10), default="auto")
    enable_live_chat = Column(Boolean, default=False)
    allowed_domains = Column(Text, nullable=True)  # JSON array: '["example.com","*.example.com"]'
    owner_id = Column(String, ForeignKey("admin_users.id"), nullable=True, index=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


# O conversatie dintre un vizitator si bot, cu starea ei (bot, waiting, live, closed) si operatorul care a preluat-o
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
    status = Column(String(20), default="bot")  # bot, waiting, live sau closed
    operator_id = Column(String, ForeignKey("admin_users.id"), nullable=True)

    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


# Un mesaj dintr-o conversatie, trimis de vizitator, bot sau operator
class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(
        String, ForeignKey("conversations.id"), nullable=False
    )
    role = Column(String(20), nullable=False)  # user sau assistant
    content = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    sender_type = Column(String(20), nullable=True)  # bot, operator, system sau user (NULL pentru mesajele vechi)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    conversation = relationship("Conversation", back_populates="messages")


# Recenzia (1-5 stele si comentariu) lasata de un vizitator la finalul unei conversatii
class ConversationFeedback(Base):
    __tablename__ = "conversation_feedback"

    id = Column(String, primary_key=True, default=lambda: f"fb_{uuid.uuid4().hex[:12]}")
    conversation_id = Column(
        String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True
    )
    bot_id = Column(String(100), nullable=False, index=True)
    session_id = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stele
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


# Notificarea afisata adminilor pentru evenimente (conversatii, recenzii, documente, sistem)
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), nullable=False, index=True)
    type = Column(String(30), nullable=False)  # conversation, feedback, document sau system
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    read = Column(Boolean, default=False)
    reference_id = Column(String, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


# Contul unui administrator; team_owner_id leaga conturile create de un proprietar de echipa
class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(200), nullable=True)
    role = Column(String(20), default="admin")
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    refresh_token = Column(String(255), nullable=True)
    team_owner_id = Column(String, ForeignKey("admin_users.id"), nullable=True)


# Mesajul lasat prin formularul de contact cand niciun operator nu este online
class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bot_id = Column(String(100), nullable=False, index=True)
    conversation_id = Column(
        String, ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )
    session_id = Column(String(100), nullable=False)
    visitor_name = Column(String(200), nullable=False)
    visitor_email = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="new")  # new, read sau replied
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


# Disponibilitatea unui operator pentru live chat
class OperatorStatus(Base):
    __tablename__ = "operator_status"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_user_id = Column(
        String, ForeignKey("admin_users.id"), unique=True, nullable=False
    )
    is_available = Column(Boolean, default=False)
    last_seen_at = Column(DateTime, nullable=True)


# Conexiunea la baza de date si fabrica de sesiuni folosita in tot backend-ul
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Creeaza tabelele, aplica migrarile simple si adauga datele implicite (botul de baza si contul admin)
def init_db():
    Base.metadata.create_all(bind=engine)

    # Migrari: coloanele noi se adauga cu ALTER TABLE, pentru ca create_all nu modifica tabelele existente
    from sqlalchemy import text
    # Fiecare comanda foloseste IF NOT EXISTS, deci poate rula la fiecare pornire fara probleme
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
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS enable_reviews BOOLEAN DEFAULT TRUE"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS enable_quick_replies BOOLEAN DEFAULT TRUE"
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
            # Multi-bot: categoriile si documentele primesc bot_id
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
            # Coloanele pentru comportamentul AI
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS system_prompt TEXT"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS temperature FLOAT DEFAULT 0.7"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 500"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS response_style VARCHAR(20) DEFAULT 'balanced'"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS context_docs_count INTEGER DEFAULT 3"
            ))
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'auto'"
            ))
            # Coloanele pentru live chat
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS enable_live_chat BOOLEAN DEFAULT FALSE"
            ))
            conn.execute(text(
                "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'bot'"
            ))
            conn.execute(text(
                "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS operator_id VARCHAR"
            ))
            conn.execute(text(
                "ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20)"
            ))
            # Licentierea pe domenii
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS allowed_domains TEXT"
            ))
            # Proprietatea botilor (izolare pe echipe)
            conn.execute(text(
                "ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS owner_id VARCHAR REFERENCES admin_users(id)"
            ))
            conn.execute(text(
                "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS team_owner_id VARCHAR REFERENCES admin_users(id)"
            ))
            conn.commit()
        # Erorile de migrare sunt ignorate, pentru ca aplicatia sa porneasca oricum
        except Exception:
            pass

    # Se pregateste sesiunea pentru crearea datelor implicite
    db = SessionLocal()
    try:
        # Se creeaza botul implicit daca nu exista
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

        # Se creeaza contul admin implicit cu o parola aleatoare, afisata o singura data in consola
        admin_exists = db.query(AdminUser).first()
        if not admin_exists:
            # Parola generata este afisata o singura data in consola
            import secrets
            import bcrypt as _bcrypt
            default_password = secrets.token_urlsafe(16)
            admin = AdminUser(
                username="admin",
                password_hash=_bcrypt.hashpw(default_password.encode(), _bcrypt.gensalt(rounds=12)).decode(),
                email="admin@localhost",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("=" * 60)
            print("  DEFAULT ADMIN ACCOUNT CREATED")
            print(f"  Username: admin")
            print(f"  Password: {default_password}")
            print("  CHANGE THIS PASSWORD IMMEDIATELY!")
            print("=" * 60)

        # Botii creati inainte de sistemul de proprietate primesc ca proprietar cel mai vechi cont admin,
        # Botii creati inainte de sistemul de proprietate primesc ca proprietar cel mai vechi cont admin, ca sa nu devina invizibili dupa actualizare
        orphan_bots = db.query(BotConfig).filter(BotConfig.owner_id.is_(None)).all()
        if orphan_bots:
            primary_admin = (
                db.query(AdminUser)
                .filter(AdminUser.role == "admin")
                .order_by(AdminUser.created_at.asc())
                .first()
            )
            if primary_admin:
                for bot in orphan_bots:
                    bot.owner_id = primary_admin.id
                db.commit()
    finally:
        db.close()


# Dependinta FastAPI care ofera o sesiune de baza de date si o inchide dupa cerere
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
