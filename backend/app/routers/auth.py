from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, BlockedEmail
from ..schemas import (
    UserCreate, UserResponse, TokenResponse, UserLogin,
    ChangePasswordRequest, ResetPasswordRequest
)
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

def check_email_blocked(email: str, db: Session):
    normalized = email.strip().lower()
    blocked = db.query(BlockedEmail).filter(BlockedEmail.email.ilike(normalized)).first()
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email address has been blocked by the administrator."
        )

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    check_email_blocked(user_in.email, db)

    # Check if username or email exists
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # First user is admin, otherwise default role is 'reader'
    total_users = db.query(User).count()
    role = "admin" if total_users == 0 else "reader"

    user = User(
        username=user_in.username,
        email=user_in.email.strip().lower(),
        display_name=user_in.display_name,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        is_blocked=False,
        avatar_url=user_in.avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked by the administrator."
        )
    check_email_blocked(user.email, db)

    token = create_access_token(data={"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login-json", response_model=TokenResponse)
def login_json(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == user_login.username) | (User.email == user_login.username)
    ).first()
    
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked by the administrator."
        )
    check_email_blocked(user.email, db)

    token = create_access_token(data={"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    check_email_blocked(req.email, db)
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with that email address")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="This account has been blocked by the administrator")

    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in with your new password."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
