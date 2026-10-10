import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Tour, User, Post
from ..schemas import TourCreate, TourUpdate, TourResponse
from ..auth import require_blogger, get_current_user

router = APIRouter(prefix="/tours", tags=["Tours"])

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = text.strip("-")
    return text or "tour"

@router.get("", response_model=List[TourResponse])
def get_tours(db: Session = Depends(get_db)):
    tours = db.query(Tour).order_by(Tour.created_at.desc()).all()
    # Sort posts in each tour by day_number
    for t in tours:
        t.posts.sort(key=lambda p: (p.day_number is None, p.day_number or 0, p.created_at))
    return tours

@router.get("/{identifier}", response_model=TourResponse)
def get_tour(identifier: str, db: Session = Depends(get_db)):
    tour = db.query(Tour).filter(
        or_(Tour.slug == identifier, Tour.id == identifier)
    ).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    # Filter published public posts and sort by day_number
    public_posts = [p for p in tour.posts if p.status == "published" and p.is_public]
    public_posts.sort(key=lambda p: (p.day_number is None, p.day_number or 0, p.created_at))
    tour.posts = public_posts
    return tour

@router.post("", response_model=TourResponse, status_code=status.HTTP_201_CREATED)
def create_tour(
    tour_in: TourCreate,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    base_slug = tour_in.slug or slugify(tour_in.title)
    slug = base_slug
    counter = 1
    while db.query(Tour).filter(Tour.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    tour = Tour(
        title=tour_in.title.strip(),
        slug=slug,
        description=tour_in.description,
        author_id=current_user.id
    )
    db.add(tour)
    db.commit()
    db.refresh(tour)
    return tour

@router.put("/{tour_id}", response_model=TourResponse)
def update_tour(
    tour_id: str,
    tour_update: TourUpdate,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    tour = db.query(Tour).filter(
        or_(Tour.id == tour_id, Tour.slug == tour_id)
    ).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    if current_user.id != tour.author_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this tour")

    if tour_update.title is not None:
        tour.title = tour_update.title.strip()
        if not tour_update.slug:
            # Dynamically update slug
            base_slug = slugify(tour.title)
            slug = base_slug
            counter = 1
            while db.query(Tour).filter(Tour.slug == slug, Tour.id != tour.id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            tour.slug = slug

    if tour_update.slug is not None:
        tour.slug = tour_update.slug.strip()

    if tour_update.description is not None:
        tour.description = tour_update.description

    db.commit()
    db.refresh(tour)
    return tour
