from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Standard JSON body validation (strict)
    email = login_data.email.strip().lower()
    password = login_data.password

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Fallback to check id (like EMP-001) in case they login with ID
        user = db.query(models.User).filter(models.User.id == email.upper()).first()
        
    if not user or not auth.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/ID or password",
        )
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id
    }

@router.post("/swagger-login", response_model=schemas.Token)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Swagger Auth Flow (x-www-form-urlencoded)
    username = form_data.username.strip().lower()
    password = form_data.password

    user = db.query(models.User).filter(models.User.email == username).first()
    if not user:
        user = db.query(models.User).filter(models.User.id == username.upper()).first()
        
    if not user or not auth.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/ID or password",
        )
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id
    }

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(register_data: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing = db.query(models.User).filter(models.User.email == register_data.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    # Calculate next employee ID
    count = db.query(models.User).count()
    while True:
        new_id = f"EMP-{count + 1:03d}"
        if not db.query(models.User).filter(models.User.id == new_id).first():
            break
        count += 1
        
    # Get initials for avatar
    name_parts = register_data.name.strip().split()
    initials = "".join([w[0].upper() for w in name_parts if w])[:2]
    if not initials:
        initials = "U"
        
    new_user = models.User(
        id=new_id,
        email=register_data.email.strip().lower(),
        password_hash=auth.get_password_hash(register_data.password),
        title=register_data.title,
        name=register_data.name.strip(),
        designation=register_data.designation,
        institution=register_data.institution,
        branch=register_data.branch,
        mobile=register_data.mobile,
        role="admin" if count == 0 else (register_data.role or "user"),
        avatar=initials
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/users", response_model=List[schemas.UserResponse])
def get_public_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
