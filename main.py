"""
FastAPI backend for Virtual Tabletop (VTT) application
Provides REST API for managing tables, tokens, chat messages, and dice rolls
"""
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import get_db, engine
from models import (
    Base, Table, Token, ChatMessage,
    TableCreate, TableResponse, TokenCreate, TokenUpdate, TokenResponse,
    DiceRollRequest, DiceRollResponse, ChatMessageResponse, TableSnapshot,
    HealthResponse
)
from dice_utils import roll_dice, validate_dice_expression

# Create all database tables
print("🔧 Initializing database...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully")
print("🚀 Database initialization complete")

app = FastAPI(
    title="VTT API",
    description="Virtual Tabletop REST API for managing game tables, tokens, and dice rolls",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(ok=True)


# Table endpoints
@app.post("/tables", response_model=TableResponse)
async def create_table(table_data: TableCreate, db: Session = Depends(get_db)):
    """Create a new table"""
    db_table = Table(name=table_data.name)
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table


@app.get("/tables/{table_id}", response_model=TableResponse)
async def get_table(table_id: int, db: Session = Depends(get_db)):
    """Get a table by ID"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


@app.delete("/tables/{table_id}")
async def delete_table(table_id: int, db: Session = Depends(get_db)):
    """Delete a table"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    db.delete(table)
    db.commit()
    return {"message": "Table deleted successfully"}


@app.get("/tables", response_model=List[TableResponse])
async def list_tables(db: Session = Depends(get_db)):
    """List all tables"""
    tables = db.query(Table).all()
    return tables


# Table snapshot endpoint
@app.get("/tables/{table_id}/snapshot", response_model=TableSnapshot)
async def get_table_snapshot(table_id: int, db: Session = Depends(get_db)):
    """Get complete table state (tokens + chat)"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Get tokens
    tokens = db.query(Token).filter(Token.table_id == table_id).all()
    tokens_dict = {}
    for token in tokens:
        tokens_dict[token.id] = {
            "id": token.id,
            "name": token.name,
            "x": token.x,
            "y": token.y,
            "color": token.color,
            "locked": token.locked
        }
    
    # Get chat messages
    messages = db.query(ChatMessage).filter(ChatMessage.table_id == table_id).order_by(ChatMessage.timestamp).all()
    chat_list = []
    for msg in messages:
        try:
            payload = json.loads(msg.payload)
        except json.JSONDecodeError:
            payload = {"message": msg.payload}
        
        chat_list.append({
            "id": msg.id,
            "type": msg.message_type,
            "payload": payload,
            "timestamp": msg.timestamp.isoformat(),
            "user": msg.user
        })
    
    return TableSnapshot(tokens=tokens_dict, chat=chat_list)


# Token endpoints
@app.post("/tables/{table_id}/tokens", response_model=TokenResponse)
async def create_token(table_id: int, token_data: TokenCreate, db: Session = Depends(get_db)):
    """Create a new token on a table"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    token_id = str(uuid.uuid4())
    db_token = Token(
        id=token_id,
        table_id=table_id,
        name=token_data.name,
        x=token_data.x,
        y=token_data.y,
        color=token_data.color
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


@app.get("/tables/{table_id}/tokens", response_model=List[TokenResponse])
async def get_table_tokens(table_id: int, db: Session = Depends(get_db)):
    """Get all tokens for a table"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    tokens = db.query(Token).filter(Token.table_id == table_id).all()
    return tokens


@app.put("/tables/{table_id}/tokens/{token_id}", response_model=TokenResponse)
async def update_token(table_id: int, token_id: str, token_update: TokenUpdate, db: Session = Depends(get_db)):
    """Update a token"""
    token = db.query(Token).filter(Token.id == token_id, Token.table_id == table_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    # Update only provided fields
    if token_update.name is not None:
        token.name = token_update.name
    if token_update.x is not None:
        token.x = token_update.x
    if token_update.y is not None:
        token.y = token_update.y
    if token_update.color is not None:
        token.color = token_update.color
    if token_update.locked is not None:
        token.locked = token_update.locked
    
    token.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(token)
    return token


@app.delete("/tables/{table_id}/tokens/{token_id}")
async def delete_token(table_id: int, token_id: str, db: Session = Depends(get_db)):
    """Delete a token"""
    token = db.query(Token).filter(Token.id == token_id, Token.table_id == table_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    db.delete(token)
    db.commit()
    return {"message": "Token deleted successfully"}


# Dice rolling endpoints
@app.post("/tables/{table_id}/rolls", response_model=DiceRollResponse)
async def roll_dice_endpoint(table_id: int, roll_request: DiceRollRequest, db: Session = Depends(get_db)):
    """Roll dice and save to chat"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    if not validate_dice_expression(roll_request.expression):
        raise HTTPException(status_code=400, detail="Invalid dice expression")
    
    try:
        result, breakdown, expression = roll_dice(roll_request.expression)
        timestamp = datetime.utcnow()
        
        # Save to chat
        roll_payload = {
            "expression": expression,
            "result": result,
            "breakdown": breakdown
        }
        
        message_id = str(uuid.uuid4())
        chat_message = ChatMessage(
            id=message_id,
            table_id=table_id,
            message_type="roll",
            payload=json.dumps(roll_payload),
            timestamp=timestamp,
            user=None  # TODO: Add user authentication
        )
        db.add(chat_message)
        db.commit()
        
        return DiceRollResponse(
            expression=expression,
            result=result,
            breakdown=breakdown,
            timestamp=timestamp
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Chat endpoints
@app.get("/tables/{table_id}/chat", response_model=List[ChatMessageResponse])
async def get_table_chat(table_id: int, db: Session = Depends(get_db)):
    """Get chat messages for a table"""
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    messages = db.query(ChatMessage).filter(ChatMessage.table_id == table_id).order_by(ChatMessage.timestamp).all()
    
    result = []
    for msg in messages:
        try:
            payload = json.loads(msg.payload)
        except json.JSONDecodeError:
            payload = {"message": msg.payload}
        
        result.append(ChatMessageResponse(
            id=msg.id,
            message_type=msg.message_type,
            payload=payload,
            timestamp=msg.timestamp,
            user=msg.user
        ))
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)