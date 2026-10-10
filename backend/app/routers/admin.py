from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from ..models import SiteSetting, User, Post, BlockedEmail
from ..schemas import (
    SettingResponse, SettingUpdate, UserResponse, PostResponse,
    BlockedEmailCreate, BlockedEmailResponse
)
from ..auth import require_admin

router = APIRouter(tags=["Admin & Moderation"])

# Public endpoint for reading site settings like home backdrop
@router.get("/settings/public", response_model=Dict[str, str])
def get_public_settings(db: Session = Depends(get_db)):
    settings = db.query(SiteSetting).all()
    return {s.key: s.value for s in settings}

@router.get("/admin/settings", response_model=List[SettingResponse])
def get_all_settings(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(SiteSetting).all()

@router.put("/admin/settings/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    setting_in: SettingUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    setting = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if not setting:
        setting = SiteSetting(
            key=key,
            value=setting_in.value,
            updated_by=current_user.id,
            updated_at=datetime.now(timezone.utc)
        )
        db.add(setting)
    else:
        setting.value = setting_in.value
        setting.updated_by = current_user.id
        setting.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(setting)
    return setting

@router.get("/admin/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/admin/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    role: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if role not in ["reader", "blogger", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'reader', 'blogger', or 'admin'")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.role = role
    db.commit()
    db.refresh(target_user)
    return target_user

# Block or Unblock a User Account
@router.patch("/admin/users/{user_id}/block", response_model=UserResponse)
def toggle_user_block(
    user_id: str,
    blocked: bool,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block your own admin account")

    target_user.is_blocked = blocked

    # Also automatically add/remove from BlockedEmail table for comprehensive policing
    norm_email = target_user.email.strip().lower()
    existing_blocked = db.query(BlockedEmail).filter(BlockedEmail.email.ilike(norm_email)).first()
    if blocked and not existing_blocked:
        db.add(BlockedEmail(
            email=norm_email,
            reason=f"Blocked by {current_user.username}",
            blocked_by=current_user.id
        ))
    elif not blocked and existing_blocked:
        db.delete(existing_blocked)

    db.commit()
    db.refresh(target_user)
    return target_user

# Blocked Emails Management (Prevents Registration, Login, Comments & Likes)
@router.get("/admin/blocked-emails", response_model=List[BlockedEmailResponse])
def list_blocked_emails(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(BlockedEmail).order_by(BlockedEmail.created_at.desc()).all()

@router.post("/admin/blocked-emails", response_model=BlockedEmailResponse, status_code=status.HTTP_201_CREATED)
def block_email(
    block_in: BlockedEmailCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    norm_email = block_in.email.strip().lower()
    existing = db.query(BlockedEmail).filter(BlockedEmail.email.ilike(norm_email)).first()
    if existing:
        return existing

    blocked = BlockedEmail(
        email=norm_email,
        reason=block_in.reason or "Hate speech / harassment",
        blocked_by=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(blocked)

    # If a user already exists with this email, flag their account as blocked immediately
    existing_user = db.query(User).filter(User.email.ilike(norm_email)).first()
    if existing_user and existing_user.id != current_user.id:
        existing_user.is_blocked = True

    db.commit()
    db.refresh(blocked)
    return blocked

@router.delete("/admin/blocked-emails/{email}", status_code=status.HTTP_204_NO_CONTENT)
def unblock_email(
    email: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    norm_email = email.strip().lower()
    blocked = db.query(BlockedEmail).filter(BlockedEmail.email.ilike(norm_email)).first()
    if blocked:
        db.delete(blocked)

    existing_user = db.query(User).filter(User.email.ilike(norm_email)).first()
    if existing_user:
        existing_user.is_blocked = False

    db.commit()
    return None

@router.get("/admin/posts", response_model=List[PostResponse])
def list_all_posts_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(Post).order_by(Post.created_at.desc()).all()
