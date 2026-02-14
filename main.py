from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from src.utils.db import engine,Base
from src.users.models import UserModel
from src.subject.models import SubjectModel
from src.notes.models import NotesModel
from src.subject.router import subject_routes
from src.users.router import userrouter
from src.notes.router import notes_routes
from fastapi.middleware.cors import CORSMiddleware
from src.chatbot.router import chat_router
Base.metadata.create_all(engine)



app=FastAPI(title="AI-Based Notes Management System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dir = Path(__file__).parent / "frontend-partner-main" / "dist"
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=frontend_dir), name="frontend")

@app.get("/")
def home():
    if frontend_dir.exists():
        return FileResponse(frontend_dir / "index.html")
    return {
        "message": "Backend is running. Frontend dev server expected at http://127.0.0.1:8080"
    }

app.include_router(subject_routes)
app.include_router(userrouter)
app.include_router(notes_routes)
app.include_router(chat_router)
