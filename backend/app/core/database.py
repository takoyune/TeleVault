"""
SQLAlchemy database setup
"""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

_PROJECT_ROOT = Path(__file__).resolve().parents[2]

_db_url = settings.DATABASE_URL
if _db_url.startswith("sqlite+aiosqlite"):
    _db_url = _db_url.replace("sqlite+aiosqlite", "sqlite", 1)
if _db_url.startswith("sqlite:///./"):
    # Resolve relative sqlite path from project root
    db_name = _db_url.replace("sqlite:///./", "")
    _db_url = f"sqlite:///{(_PROJECT_ROOT / db_name).as_posix()}"

_connect_args = {"check_same_thread": False} if _db_url.startswith("sqlite") else {}

engine = create_engine(
    _db_url,
    echo=settings.DEBUG,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
