from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    bot_id: str = "bot_123"
    session_id: str | None = None
    image: str | None = None  # base64 image data


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


class FeedbackCreate(BaseModel):
    session_id: str
    bot_id: str = "bot_123"
    rating: int  # 1-5
    comment: str | None = None


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


class BotCreate(BaseModel):
    bot_name: str = "AI Assistant"
    welcome_message: str = "Buna! Cu ce te pot ajuta?"
    primary_color: str = "#6366f1"


class BotListItem(BaseModel):
    bot_id: str
    bot_name: str
    primary_color: str
    created_at: str = ""
    document_count: int = 0
    conversation_count: int = 0


class BotListResponse(BaseModel):
    bots: list[BotListItem]


class CategoryCreate(BaseModel):
    name: str
    bot_id: str = "bot_123"


class CategoryUpdate(BaseModel):
    name: str


class CategoryResponse(BaseModel):
    id: str
    name: str
    document_count: int = 0


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
    title: str
    content: str
    category_id: str


class DocumentUpdate(BaseModel):
    filename: str | None = None
    content: str | None = None
    category_id: str | None = None


class UploadResponse(BaseModel):
    document_id: str
    status: str


class WidgetConfigResponse(BaseModel):
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
    send_button_color: str | None = None
    user_message_color: str | None = None
    bubble_icon: str = "chat"
    avatar_size: int = 42
    quick_replies: str | None = None


class WidgetConfigUpdate(BaseModel):
    welcome_message: str | None = None
    bot_name: str | None = None
    bot_subtitle: str | None = None
    primary_color: str | None = None
    header_color: str | None = None
    bubble_color: str | None = None
    bubble_icon_color: str | None = None
    bot_message_color: str | None = None
    avatar_color: str | None = None
    avatar_url: str | None = None
    gradient_end_color: str | None = None
    gradient_angle: int | None = None
    placeholder_text: str | None = None
    position: str | None = None
    widget_theme: str | None = None
    show_online_status: bool | None = None
    show_subtitle: bool | None = None
    enable_emoji: bool | None = None
    enable_attachments: bool | None = None
    enable_voice: bool | None = None
    send_button_color: str | None = None
    user_message_color: str | None = None
    bubble_icon: str | None = None
    avatar_size: int | None = None
    quick_replies: str | None = None
