from database import db
from sqlalchemy import Column, String, Integer, DateTime, JSON

class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))  

class Agent(db.Model):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    instructions = Column(String, nullable=True)
    welcome_message = Column(String, nullable=True)
    suggested_prompts = Column(JSON, nullable=True)
    files = Column(JSON, nullable=True) 
    status = Column(String, nullable=True) 
    embeddings_status = Column(String, nullable=True) 
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))