"""
Models and schemas for the VTT API
"""
from datetime import datetime
from typing import Optional, Dict, List, Any
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

Base = declarative_base()


class Table(Base):
    """
    Table model for storing game tables in the database
    """
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tokens = relationship("Token", back_populates="table", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="table", cascade="all, delete-orphan")


class Token(Base):
    """
    Token model for storing tokens on tables
    """
    __tablename__ = "tokens"

    id = Column(String, primary_key=True)  # UUID string
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    name = Column(String, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    color = Column(String, nullable=True)
    locked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    table = relationship("Table", back_populates="tokens")


class ChatMessage(Base):
    """
    Chat message model for storing chat and dice rolls
    """
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True)  # UUID string
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    message_type = Column(String, nullable=False)  # "roll" or "msg"
    payload = Column(Text, nullable=False)  # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String, nullable=True)

    # Relationships
    table = relationship("Table", back_populates="chat_messages")


# Pydantic schemas for request/response
class TableCreate(BaseModel):
    """Schema for creating a new table"""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the table")


class TableResponse(BaseModel):
    """Schema for table response"""
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenCreate(BaseModel):
    """Schema for creating a new token"""
    name: str = Field(..., min_length=1, max_length=50)
    x: float
    y: float
    color: Optional[str] = None


class TokenUpdate(BaseModel):
    """Schema for updating a token"""
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    color: Optional[str] = None
    locked: Optional[bool] = None


class TokenResponse(BaseModel):
    """Schema for token response"""
    id: str
    name: str
    x: float
    y: float
    color: Optional[str] = None
    locked: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiceRollRequest(BaseModel):
    """Schema for dice roll request"""
    expression: str = Field(..., min_length=1, max_length=100)


class DiceRollResponse(BaseModel):
    """Schema for dice roll response"""
    expression: str
    result: int
    breakdown: str
    timestamp: datetime


class ChatMessageResponse(BaseModel):
    """Schema for chat message response"""
    id: str
    message_type: str
    payload: Dict[str, Any]
    timestamp: datetime
    user: Optional[str] = None

    class Config:
        from_attributes = True


class TableSnapshot(BaseModel):
    """Schema for table snapshot"""
    tokens: Dict[str, Dict[str, Any]]
    chat: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    """Schema for health check response"""
    ok: bool = True