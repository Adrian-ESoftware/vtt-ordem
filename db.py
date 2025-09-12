"""
Database configuration and session management
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from models import Base

# Database URL - using SQLite for simplicity
DATABASE_URL = "sqlite:///./vtt_tables.db"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL query logging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    """Create all tables in the database"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except SQLAlchemyError as e:
        print(f"❌ Error creating tables: {e}")
        raise


def get_db() -> Session:
    """
    Dependency to get database session
    This will be used with FastAPI's dependency injection
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db():
    """Initialize the database"""
    print("🔧 Initializing database...")
    create_tables()
    print("🚀 Database initialization complete")


# For testing purposes - you can remove this in production
if __name__ == "__main__":
    init_db()