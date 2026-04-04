import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

_here = Path(__file__).resolve()
_env_candidates = [
    _here.parent.parent / ".env",
    _here.parent / ".env",
    _here.parent.parent.parent / ".env",
    Path.cwd() / ".env",
]
for _p in _env_candidates:
    if _p.is_file():
        load_dotenv(_p, override=True)

DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
if not DATABASE_URL:
    _sqlite_path = _here.parent.parent / "contactos.db"
    DATABASE_URL = f"sqlite:///{_sqlite_path.resolve().as_posix()}"

_engine_kwargs: dict = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
