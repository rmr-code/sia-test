from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt, ExpiredSignatureError
from config import settings
from models import User
from database import get_db
from services import get_user, create_user, update_user_password
from security import get_password_hash, verify_password, create_access_token
from datetime import timedelta

router = APIRouter()

class SetPasswordRequest(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    

@router.get("/is-admin-password-set")
def is_admin_password_set(db: Session = Depends(get_db)):
    # Check if the admin user exists in the database
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        return {"admin_password_set": True}
    return {"admin_password_set": False}

@router.get("/check-jwt-token")
async def check_jwt_token(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return JSONResponse(status_code=401, content={"detail": "Token not found"})
    # Check if the token is missing or malformed
    if not token or token.count('.') != 2:
        return JSONResponse(status_code=401, content={"detail": "Token malformed or not found"})

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return {"message": "Token valid"}
    except jwt.ExpiredSignatureError:
        return JSONResponse(status_code=401, content={"detail": "Token expired"})
    except JWTError as e:
        return JSONResponse(status_code=401, content={"detail":"Invalid token"})

@router.post("/set-password")
def set_admin_password(request: SetPasswordRequest, db: Session = Depends(get_db)):
    user = get_user(db, username="admin")
    if user:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail":"Admin password already set."})
    
    hashed_password = get_password_hash(request.password)
    create_user(db, username="admin", hashed_password=hashed_password)
    return {"message": "Admin password set successfully."}

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = get_user(db, username=request.username)
    if not user or not verify_password(request.password, user.hashed_password):
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail":"Invalid credentials."})

    # Set the expiration time for the token
    access_token_expires = timedelta(hours=24)
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    
    # Set the JWT token in an HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,  # Store only the JWT, not "Bearer {token}"
        httponly=True,
        max_age=60*60*24,  # 24 hours in seconds
        expires=60*60*24,
        secure=True,  # Set to True in production (with HTTPS)
        samesite="lax"
    )
    return {"message": "Login successful"}

@router.post("/logout")
def logout(response: Response):
    # Clear the JWT token cookie by setting it to expire immediately
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Since the user is always admin, verify the old password and update
    if not verify_password(request.current_password, user.hashed_password):
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail":"Incorrect current password"})

    # Hash the new password
    hashed_password = get_password_hash(request.new_password)
    
    # Update the admin user's password
    admin_user = db.query(User).filter(User.username == "admin").first()
    admin_user.hashed_password = hashed_password
    db.commit()
    db.refresh(admin_user)

    return {"message": "Password updated successfully"}
