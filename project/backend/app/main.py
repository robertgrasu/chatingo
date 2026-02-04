from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import admin, chat, widget
from app.models.database import init_db

app = FastAPI(title="RAG Chatbot API", version="1.0.0")

# CORS - allow all for MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(widget.router, prefix="/api", tags=["Widget"])

# Serve static files (compiled widget)
import os

static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}
