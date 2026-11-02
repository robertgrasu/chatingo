from pydantic import BaseModel, Field


# ── Scheme pentru autentificare ──────────────────────────

# Datele trimise la autentificare
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)


# Perechea de token-uri returnata dupa autentificare
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Cererea de reinnoire a token-ului de acces folosind token-ul de refresh
class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1, max_length=500)


# Schimbarea parolei proprii, cu verificarea parolei curente
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


# Datele de baza ale utilizatorului autentificat
class UserResponse(BaseModel):
    id: str
    username: str
    email: str | None = None
    role: str


# Datele complete ale unui utilizator, afisate in managementul utilizatorilor
class UserDetailResponse(BaseModel):
    id: str
    username: str
    email: str | None = None
    role: str
    is_active: bool
    created_at: str
    last_login: str | None = None


# Datele necesare pentru crearea unui utilizator nou
class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=128)
    email: str | None = Field(None, max_length=200)
    role: str = Field("admin", max_length=20)


# Campurile care pot fi modificate de un admin la un utilizator
class UserUpdateRequest(BaseModel):
    username: str | None = Field(None, min_length=2, max_length=50)
    email: str | None = Field(None, max_length=200)
    role: str | None = Field(None, max_length=20)
    is_active: bool | None = None


# Campurile pe care utilizatorul si le poate modifica singur
class ProfileUpdateRequest(BaseModel):
    username: str | None = Field(None, min_length=2, max_length=50)
    email: str | None = Field(None, max_length=200)


# Resetarea parolei unui utilizator de catre un admin
class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=4, max_length=128)


# ── Scheme pentru chat ─────────────────────────────────

# Mesajul trimis de vizitator din widget, cu botul, sesiunea si imaginea optionala (base64)
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    bot_id: str = Field(default="bot_123", max_length=50)
    session_id: str | None = Field(default=None, max_length=100)
    image: str | None = Field(default=None, max_length=10_000_000)  # aproximativ 7MB in base64


# Raspunsul botului, cu sursele folosite si id-ul conversatiei
class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    conversation_id: str | None = None


# Un mesaj dintr-o conversatie, in forma returnata de API
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    image_url: str | None = None
    sender_type: str | None = None
    created_at: str


# Un rand din lista de conversatii, cu primul mesaj ca previzualizare
class ConversationListItem(BaseModel):
    id: str
    session_id: str
    started_at: str
    last_message_at: str
    message_count: int
    first_message: str = ""


# Lista paginata de conversatii
class ConversationListResponse(BaseModel):
    items: list[ConversationListItem]
    total: int
    page: int
    per_page: int
    pages: int


# Conversatia completa, cu toate mesajele ei
class ConversationDetail(BaseModel):
    id: str
    session_id: str
    started_at: str
    last_message_at: str
    message_count: int
    messages: list[MessageResponse] = []


# Numarul de conversatii si mesaje dintr-o zi, folosit la graficul de activitate
class DailyStatItem(BaseModel):
    date: str
    conversations: int
    messages: int


# Statisticile afisate pe dashboard
class StatsResponse(BaseModel):
    total_conversations: int
    total_messages: int
    total_documents: int
    total_categories: int
    conversations_today: int
    messages_today: int
    daily: list[DailyStatItem] = []
    average_rating: float = 0
    total_ratings: int = 0
    rating_distribution: dict = {}


# ── Scheme pentru recenzii ───────────────────────────

# Recenzia trimisa de vizitator din widget
class FeedbackCreate(BaseModel):
    session_id: str = Field(..., max_length=100)
    bot_id: str = Field(default="bot_123", max_length=50)
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


# O recenzie din lista afisata adminilor
class FeedbackListItem(BaseModel):
    id: str
    rating: int
    comment: str | None = None
    created_at: str
    conversation_id: str | None = None
    first_message: str = ""


# Lista paginata de recenzii, cu media si distributia notelor
class FeedbackListResponse(BaseModel):
    items: list[FeedbackListItem]
    total: int
    page: int
    per_page: int
    pages: int
    average_rating: float = 0
    total_ratings: int = 0
    rating_distribution: dict = {}


# ── Scheme pentru notificari ───────────────────────

# O notificare din lista
class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    description: str = ""
    read: bool
    reference_id: str | None = None
    created_at: str


# Lista de notificari, cu numarul celor necitite
class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    total: int
    unread_count: int


# Marcarea ca citita a unei notificari sau a tuturor
class NotificationMarkRead(BaseModel):
    id: str | None = None
    all: bool = False


# ── Scheme pentru boti ───────────────────────────────────

# Datele necesare pentru crearea unui bot nou
class BotCreate(BaseModel):
    bot_name: str = Field(default="AI Assistant", max_length=100)
    welcome_message: str = Field(default="Buna! Cu ce te pot ajuta?", max_length=500)
    primary_color: str = Field(default="#6366f1", max_length=20)


# Un bot din lista, cu numarul de documente si de conversatii
class BotListItem(BaseModel):
    bot_id: str
    bot_name: str
    primary_color: str
    created_at: str = ""
    document_count: int = 0
    conversation_count: int = 0


# Lista de boti ai echipei
class BotListResponse(BaseModel):
    bots: list[BotListItem]


# ── Scheme pentru categorii ────────────────────────────

# Crearea unei categorii in baza de cunostinte a unui bot
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    bot_id: str = Field(default="bot_123", max_length=50)


# Redenumirea unei categorii
class CategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


# O categorie, cu numarul de documente din ea
class CategoryResponse(BaseModel):
    id: str
    name: str
    document_count: int = 0


# ── Scheme pentru documente ────────────────────────────

# Un document din lista, fara continut
class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    category_id: str
    chunk_count: int = 0
    created_at: str = ""


# Un document cu tot continutul lui
class DocumentDetail(BaseModel):
    id: str
    filename: str
    status: str
    category_id: str
    content: str = ""
    chunk_count: int = 0
    created_at: str = ""


# Crearea unui document din text scris direct in panou
class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=500_000)
    category_id: str = Field(..., max_length=100)


# Campurile modificabile ale unui document
class DocumentUpdate(BaseModel):
    filename: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=500_000)
    category_id: str | None = Field(default=None, max_length=100)


# Raspunsul dupa incarcarea unui fisier
class UploadResponse(BaseModel):
    document_id: str
    status: str


# ── Scheme pentru configuratia widget-ului ──────────────

# Configuratia publica a widget-ului, fara campurile sensibile ale AI-ului
class WidgetConfigPublic(BaseModel):
    welcome_message: str
    bot_name: str
    bot_subtitle: str
    primary_color: str
    header_color: str
    bubble_color: str
    bubble_icon_color: str
    bot_message_color: str
    avatar_color: str
    avatar_url: str | None = None
    gradient_end_color: str | None = None
    gradient_angle: int = 135
    placeholder_text: str
    position: str
    widget_theme: str
    show_online_status: bool = True
    show_subtitle: bool = True
    enable_emoji: bool = True
    enable_attachments: bool = True
    enable_voice: bool = False
    enable_reviews: bool = True
    enable_quick_replies: bool = True
    enable_live_chat: bool = False
    send_button_color: str | None = None
    user_message_color: str | None = None
    bubble_icon: str = "chat"
    avatar_size: int = 42
    quick_replies: str | None = None
    language: str = "auto"


# Configuratia completa a botului, cu setarile AI, returnata doar adminilor
class WidgetConfigResponse(WidgetConfigPublic):
    system_prompt: str | None = None
    temperature: float = 0.7
    max_tokens: int = 500
    response_style: str = "balanced"
    context_docs_count: int = 3
    allowed_domains: list[str] = []


# Campurile de configurare care pot fi modificate; doar cele trimise se actualizeaza
class WidgetConfigUpdate(BaseModel):
    welcome_message: str | None = Field(default=None, max_length=500)
    bot_name: str | None = Field(default=None, max_length=100)
    bot_subtitle: str | None = Field(default=None, max_length=200)
    primary_color: str | None = Field(default=None, max_length=30)
    header_color: str | None = Field(default=None, max_length=30)
    bubble_color: str | None = Field(default=None, max_length=30)
    bubble_icon_color: str | None = Field(default=None, max_length=30)
    bot_message_color: str | None = Field(default=None, max_length=30)
    avatar_color: str | None = Field(default=None, max_length=30)
    avatar_url: str | None = Field(default=None, max_length=500)
    gradient_end_color: str | None = Field(default=None, max_length=30)
    gradient_angle: int | None = Field(default=None, ge=0, le=360)
    placeholder_text: str | None = Field(default=None, max_length=200)
    position: str | None = Field(default=None, max_length=20)
    widget_theme: str | None = Field(default=None, max_length=20)
    show_online_status: bool | None = None
    show_subtitle: bool | None = None
    enable_emoji: bool | None = None
    enable_attachments: bool | None = None
    enable_voice: bool | None = None
    enable_reviews: bool | None = None
    enable_quick_replies: bool | None = None
    enable_live_chat: bool | None = None
    send_button_color: str | None = Field(default=None, max_length=30)
    user_message_color: str | None = Field(default=None, max_length=30)
    bubble_icon: str | None = Field(default=None, max_length=20)
    avatar_size: int | None = Field(default=None, ge=20, le=200)
    quick_replies: str | None = Field(default=None, max_length=5000)
    # Setarile de comportament AI
    system_prompt: str | None = Field(default=None, max_length=5000)
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=50, le=4096)
    response_style: str | None = Field(default=None, max_length=20)
    context_docs_count: int | None = Field(default=None, ge=1, le=10)
    language: str | None = Field(default=None, max_length=10)
    allowed_domains: list[str] | None = None


# ── Scheme pentru formularul de contact ─────────────

# Un mesaj din formularul de contact
class ContactSubmissionOut(BaseModel):
    id: str
    bot_id: str
    session_id: str
    visitor_name: str
    visitor_email: str
    message: str
    status: str
    created_at: str
    conversation_id: str | None = None


# Lista paginata de mesaje din formularul de contact
class ContactSubmissionListResponse(BaseModel):
    items: list[ContactSubmissionOut]
    total: int
