import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.api import admin, auth, chat, livechat, widget, ws_operator, ws_visitor
from app.config import settings
from app.models.database import init_db
from app.rate_limiter import limiter
from app.services.auth import validate_secret_key

app = FastAPI(title="RAG Chatbot API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# CORS - widget must work embedded on any customer site
# Admin endpoints are protected by JWT auth, not CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(widget.router, prefix="/api", tags=["Widget"])
app.include_router(livechat.router, prefix="/api", tags=["LiveChat"])
app.include_router(ws_visitor.router, tags=["WebSocket"])
app.include_router(ws_operator.router, tags=["WebSocket"])

# Serve static files (compiled widget)
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
async def startup():
    # Validate security config
    validate_secret_key()

    init_db()
    # Migrate existing ChromaDB chunks to include bot_id
    from app.services.embeddings import migrate_chunks_add_bot_id
    try:
        count = migrate_chunks_add_bot_id()
        if count > 0:
            print(f"Migrated {count} ChromaDB chunks to include bot_id")
    except Exception as e:
        print(f"ChromaDB migration note: {e}")


@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}
