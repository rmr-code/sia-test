from sqlalchemy.orm import Session
from models import User
from security import verify_password

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, username: str, hashed_password: str):
    new_user = User(username=username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if user and verify_password(password, user.hashed_password):
        return user
    return False

def update_user_password(db: Session, user: User, new_hashed_password: str):
    user.hashed_password = new_hashed_password
    db.commit()
    db.refresh(user)
    return user