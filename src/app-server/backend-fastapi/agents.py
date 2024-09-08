from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from models import Agent  
from database import get_db
from auth import get_current_user

router = APIRouter()

# List all agents
@router.get("/list")
def list_agents(user=Depends(get_current_user), db: Session = Depends(get_db)):
    print("list")
    agents = db.query(Agent).all()
    return agents

# Get an individual agent's details
@router.get("/agents/{agent_id}")
def get_agent(agent_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

# Create a new agent
@router.post("/save")
async def save_new_agent(
    name: str = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    files: Optional[List[UploadFile]] = Form(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    print("save")
    # Ensure agent name is unique
    existing_agent = db.query(Agent).filter(Agent.name == name).first()
    print(2, existing_agent)
    if existing_agent:
        print(2.5)
        return JSONResponse(status_code=400, content={"detail": "Agent name must be unique"})

    print(3)
    # Create an empty list if no files are uploaded
    document_filenames = []
    # If files are provided, handle them
    if files:
        document_filenames = [file.filename for file in files]
    print(4)
    # Save agent to the database
    new_agent = Agent(name=name, description=description, status=status, documents=document_filenames)    
    print(5)
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    print(6)
    # Create directory for the agent's files
    agent_dir = os.path.join('data', new_agent.name)
    os.makedirs(agent_dir, exist_ok=True)

    # Save files to the agent directory
    if document_filenames:
        agent_dir = os.path.join('data', new_agent.name)
        os.makedirs(agent_dir, exist_ok=True)

        # Save files to the agent directory
        for file in files:
            file_path = os.path.join(agent_dir, file.filename)
            with open(file_path, "wb") as buffer:
                buffer.write(file.file.read())

    return {"message": "Agent created successfully", "agent_id": new_agent.id}

# Update an existing agent
@router.put("/save/{agent_id}")
async def update_agent(
    agent_id: int,
    name: str = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    deleted_files: List[str] = Form(...),  # Expecting a list of file names to delete
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Retrieve the agent from the database
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if the name is being changed and ensure the new name is unique
    if agent.name != name:
        existing_agent = db.query(Agent).filter(Agent.name == name).first()
        if existing_agent:
            raise HTTPException(status_code=400, detail="Agent name must be unique")

    # Update agent details
    agent.name = name
    agent.description = description
    agent.status = status

    # Update documents - remove old ones and add new ones
    agent_dir = os.path.join('data', agent.name)

    # Remove deleted files
    for file_name in deleted_files:
        file_path = os.path.join(agent_dir, file_name)
        if os.path.exists(file_path):
            os.remove(file_path)
        else:
            raise HTTPException(status_code=404, detail=f"File {file_name} not found")

    # Add new files and update document list
    new_files = [file.filename for file in files]
    agent.documents = [file for file in agent.documents if file not in deleted_files] + new_files

    # Ensure the directory exists
    os.makedirs(agent_dir, exist_ok=True)

    # Save the new files
    for file in files:
        file_path = os.path.join(agent_dir, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

    # Save the changes to the database
    db.commit()
    db.refresh(agent)

    return {"message": "Agent updated successfully", "agent_id": agent.id}

# Delete an agent
@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Retrieve the agent from the database
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Delete agent directory and files
    agent_dir = os.path.join('data', agent.name)
    if os.path.exists(agent_dir):
        for file_name in os.listdir(agent_dir):
            file_path = os.path.join(agent_dir, file_name)
            os.remove(file_path)
        os.rmdir(agent_dir)

    # Delete agent from the database
    db.delete(agent)
    db.commit()

    return {"message": "Agent deleted successfully"}
