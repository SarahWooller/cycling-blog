from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import User, Post
from ..schemas import AuthorProfileResponse, AuthorProfileUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/authors", tags=["Authors"])

@router.get("", response_model=List[AuthorProfileResponse])
def get_authors(db: Session = Depends(get_db)):
    """List all authors who are bloggers or administrators with their published posts."""
    authors = db.query(User).filter(
        User.role.in_(["blogger", "admin"]),
        User.is_blocked == False
    ).order_by(User.display_name.asc()).all()

    # Filter posts to only public and published for each author
    result = []
    for author in authors:
        public_posts = [p for p in author.posts if p.status == "published" and p.is_public]
        author_dict = {
            "id": author.id,
            "username": author.username,
            "display_name": author.display_name,
            "avatar_url": author.avatar_url,
            "role": author.role,
            "bio_paragraphs": author.bio_paragraphs or [],
            "photos": author.photos or [],
            "backdrop_index": author.backdrop_index or 0,
            "links": author.links or [],
            "location": author.location,
            "cycling_style": author.cycling_style,
            "bike_setup": author.bike_setup,
            "created_at": author.created_at,
            "posts": public_posts
        }
        result.append(author_dict)
    return result

@router.get("/{identifier}", response_model=AuthorProfileResponse)
def get_author(identifier: str, db: Session = Depends(get_db)):
    """Get public author profile by UUID or username with their published chronicles."""
    author = db.query(User).filter(
        or_(
            User.id == identifier,
            User.username == identifier
        ),
        User.is_blocked == False
    ).first()

    if not author:
        raise HTTPException(status_code=404, detail="Author profile not found")

    public_posts = [
        p for p in author.posts
        if p.status == "published" and p.is_public
    ]
    # Sort posts latest first
    public_posts.sort(key=lambda p: p.created_at, reverse=True)

    return {
        "id": author.id,
        "username": author.username,
        "display_name": author.display_name,
        "avatar_url": author.avatar_url,
        "role": author.role,
        "bio_paragraphs": author.bio_paragraphs or [],
        "photos": author.photos or [],
        "backdrop_index": author.backdrop_index or 0,
        "links": author.links or [],
        "location": author.location,
        "cycling_style": author.cycling_style,
        "bike_setup": author.bike_setup,
        "created_at": author.created_at,
        "posts": public_posts
    }

@router.put("/{author_id}", response_model=AuthorProfileResponse)
def update_author(
    author_id: str,
    update_data: AuthorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update author bio, photos, backdrop, links, and personal setup."""
    # Permission check: author can only edit own profile; admin can edit any
    if current_user.id != author_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this author profile"
        )

    author = db.query(User).filter(User.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    if update_data.display_name is not None:
        author.display_name = update_data.display_name.strip()
    if update_data.avatar_url is not None:
        author.avatar_url = update_data.avatar_url
    if update_data.bio_paragraphs is not None:
        author.bio_paragraphs = update_data.bio_paragraphs
    if update_data.photos is not None:
        author.photos = update_data.photos
    if update_data.backdrop_index is not None:
        author.backdrop_index = update_data.backdrop_index
    if update_data.links is not None:
        author.links = update_data.links
    if update_data.location is not None:
        author.location = update_data.location
    if update_data.cycling_style is not None:
        author.cycling_style = update_data.cycling_style
    if update_data.bike_setup is not None:
        author.bike_setup = update_data.bike_setup

    db.commit()
    db.refresh(author)

    public_posts = [p for p in author.posts if p.status == "published" and p.is_public]
    public_posts.sort(key=lambda p: p.created_at, reverse=True)

    return {
        "id": author.id,
        "username": author.username,
        "display_name": author.display_name,
        "avatar_url": author.avatar_url,
        "role": author.role,
        "bio_paragraphs": author.bio_paragraphs or [],
        "photos": author.photos or [],
        "backdrop_index": author.backdrop_index or 0,
        "links": author.links or [],
        "location": author.location,
        "cycling_style": author.cycling_style,
        "bike_setup": author.bike_setup,
        "created_at": author.created_at,
        "posts": public_posts
    }
