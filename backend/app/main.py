from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .database import engine
from .models import Base
from .routers import grupos, personas

STATIC_DIR = Path(__file__).resolve().parent / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="cloud-emergente API",
    description="Gestión de contactos: grupos y personas (UUID). BD: DATABASE_URL o SQLite local por defecto.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    personas.set_upload_dir(UPLOAD_DIR)


app.include_router(grupos.router)
app.include_router(personas.router)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if FRONTEND_DIR.is_dir():
    app.mount("/ui", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="ui")


@app.get("/api/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"ok": True, "db": "conectado"}
    except Exception as e:
        return {"ok": False, "db": "error", "detail": str(e)}


@app.get("/")
def root():
    if FRONTEND_DIR.is_dir():
        return RedirectResponse(url="/ui/", status_code=302)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "mensaje": "API activa. Base de datos conectada.",
            "docs": "/docs",
            "ui": "/ui/",
        }
    except Exception as e:
        return {"error": str(e)}
