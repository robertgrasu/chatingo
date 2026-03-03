from pydantic import BaseModel, Field


# ── Auth Schemas ──────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1, max_length=500)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


class UserResponse(BaseModel):
    id: str
    username: str
    email: str | None = None
    role: str


# ── Chat Schemas ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    bot_id: str = Field(default="bot_123", max_length=50)
    session_id: str | None = Field(default=None, max_length=100)
    image: str | None = Field(default=None, max_length=10_000_000)  # ~7MB base64


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    conversation_id: str | None = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    image_url: str | None = None
    created_at: str


class ConversationListItem(BaseModel):
    id: str
    session_id: str
    started_at: str
    last_message_at: str
    message_count: int
    first_message: str = ""


class ConversationListResponse(BaseModel):
    items: list[ConversationListItem]
    total: int
    page: int
    per_page: int
    pages: int


class ConversationDetail(BaseModel):
    id: str
    session_id: str
    started_at: str
    last_message_at: str
    message_count: int
    messages: list[MessageResponse] = []


class DailyStatItem(BaseModel):
    date: str
    conversations: int
    messages: int


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


# ── Feedback Schemas ──────────────────────────────────────────

class FeedbackCreate(BaseModel):
    session_id: str = Field(..., max_length=100)
    bot_id: str = Field(default="bot_123", max_length=50)
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class FeedbackListItem(BaseModel):
    id: str
    rating: int
    comment: str | None = None
    created_at: str
    conversation_id: str | None = None
    first_message: str = ""


class FeedbackListResponse(BaseModel):
    items: list[FeedbackListItem]
    total: int
    page: int
    per_page: int
    pages: int
    average_rating: float = 0
    total_ratings: int = 0
    rating_distribution: dict = {}


# ── Notification Schemas ──────────────────────────────────────

class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    description: str = ""
    read: bool
    reference_id: str | None = None
    created_at: str


class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    total: int
    unread_count: int


class NotificationMarkRead(BaseModel):
    id: str | None = None
    all: bool = False


# ── Bot Schemas ───────────────────────────────────────────────

class BotCreate(BaseModel):
    bot_name: str = Field(default="AI Assistant", max_length=100)
    welcome_message: str = Field(default="Buna! Cu ce te pot ajuta?", max_length=500)
    primary_color: str = Field(default="#6366f1", max_length=20)


class BotListItem(BaseModel):
    bot_id: str
    bot_name: str
    primary_color: str
    created_at: str = ""
    document_count: int = 0
    conversation_count: int = 0


class BotListResponse(BaseModel):
    bots: list[BotListItem]


# ── Category Schemas ──────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    bot_id: str = Field(default="bot_123", max_length=50)


class CategoryUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: str
    name: str
    document_count: int = 0


# ── Document Schemas ──────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    category_id: str
    chunk_count: int = 0
    created_at: str = ""


class DocumentDetail(BaseModel):
    id: str
    filename: str
    status: str
    category_id: str
    content: str = ""
    chunk_count: int = 0
    created_at: str = ""


class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=500_000)
    category_id: str = Field(..., max_length=100)


class DocumentUpdate(BaseModel):
    filename: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=500_000)
    category_id: str | None = Field(default=None, max_length=100)


class UploadResponse(BaseModel):
    document_id: str
    status: str


# ── Widget Config Schemas ─────────────────────────────────────

class WidgetConfigPublic(BaseModel):
    """Public widget config - NO sensitive AI fields (system_prompt, temperature, etc.)"""
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
    send_button_color: str | None = None
    user_message_color: str | None = None
    bubble_icon: str = "chat"
    avatar_size: int = 42
    quick_replies: str | None = None
    language: str = "auto"


class WidgetConfigResponse(WidgetConfigPublic):
    """Full widget config with AI behavior - ADMIN ONLY"""
    system_prompt: str | None = None
    temperature: float = 0.7
    max_tokens: int = 500
    response_style: str = "balanced"
    context_docs_count: int = 3


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
    send_button_color: str | None = Field(default=None, max_length=30)
    user_message_color: str | None = Field(default=None, max_length=30)
    bubble_icon: str | None = Field(default=None, max_length=20)
    avatar_size: int | None = Field(default=None, ge=20, le=200)
    quick_replies: str | None = Field(default=None, max_length=5000)
    # AI Behavior
    system_prompt: str | None = Field(default=None, max_length=5000)
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=50, le=4096)
    response_style: str | None = Field(default=None, max_length=20)
    context_docs_count: int | None = Field(default=None, ge=1, le=10)
    language: str | None = Field(default=None, max_length=10)
