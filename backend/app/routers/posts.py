import hashlib
import re
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ..database import get_db
from ..models import Post, User, Like, GpxFile, PostGpx
from ..schemas import PostCreate, PostUpdate, PostResponse
from ..auth import get_current_user, get_current_user_optional, require_blogger

router = APIRouter(prefix="/posts", tags=["Posts"])

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = text.strip("-")
    return text or "untitled-post"

def get_client_ip_hash(request: Request) -> str:
    # Check X-Forwarded-For header or direct client host
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()

@router.get("", response_model=List[PostResponse])
def get_posts(
    filter_by: Optional[str] = Query("latest", pattern="^(latest|favourites|all)$"),
    search: Optional[str] = None,
    tag: Optional[str] = None,
    tour_id: Optional[str] = None,
    author: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Post)

    # Visibility rules based on auth
    if not current_user:
        # Public readers: only public, published posts
        query = query.filter(Post.status == "published", Post.is_public == True)
    elif current_user.role == "admin":
        # Admin can view all statuses, or filter by status
        if status_filter:
            query = query.filter(Post.status == status_filter)
    elif current_user.role == "blogger":
        # Blogger: can view published posts + their own drafts/archived/private posts
        if status_filter:
            if status_filter in ["draft", "archived"]:
                # Only see own drafts/archived
                query = query.filter(Post.status == status_filter, Post.author_id == current_user.id)
            else:
                query = query.filter(
                    (Post.status == status_filter) &
                    (
                        (Post.author_id == current_user.id) |
                        ((Post.status == "published") & (Post.is_public == True))
                    )
                )
        else:
            query = query.filter(
                (Post.status == "published") | (Post.author_id == current_user.id)
            )
    else:
        # Reader role: strictly published and public posts only
        query = query.filter(Post.status == "published", Post.is_public == True)

    # Tag filter
    if tag:
        # JSON array string match
        query = query.filter(Post.tags.contains([tag]))

    # Tour filter
    if tour_id:
        query = query.filter(Post.tour_id == tour_id)

    # Author filter
    if author:
        query = query.join(User, Post.author_id == User.id).filter(
            or_(
                Post.author_id == author,
                User.username.ilike(author),
                User.display_name.ilike(author)
            )
        )

    # Search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Post.title.ilike(search_pattern),
                Post.slug.ilike(search_pattern)
            )
        )

    # Ordering based on filter_by
    if filter_by == "favourites":
        query = query.order_by(desc(Post.likes_count), desc(Post.created_at))
    elif filter_by == "latest":
        query = query.order_by(Post.published_at.desc().nulls_last(), desc(Post.created_at))
    else:
        query = query.order_by(desc(Post.created_at))

    return query.offset(offset).limit(limit).all()

@router.get("/{slug}", response_model=PostResponse)
def get_post(
    slug: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Permission check
    if post.status != "published" or not post.is_public:
        if not current_user:
            raise HTTPException(status_code=404, detail="Post not found")
        if current_user.role != "admin" and post.author_id != current_user.id:
            # Allow bloggers to view other bloggers' private posts if published
            if not (current_user.role == "blogger" and post.status == "published" and not post.is_public):
                raise HTTPException(status_code=403, detail="Not authorized to view this post")

    return post

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    base_slug = post_in.slug or slugify(post_in.title)
    slug = base_slug
    counter = 1
    while db.query(Post).filter(Post.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    now = datetime.now(timezone.utc)
    published_at = now if post_in.status == "published" else None

    post = Post(
        title=post_in.title,
        slug=slug,
        author_id=current_user.id,
        tour_id=post_in.tour_id,
        day_number=post_in.day_number,
        status=post_in.status,
        is_public=post_in.is_public,
        approve_comments=post_in.approve_comments,
        doc_url=post_in.doc_url,
        photos_album_url=post_in.photos_album_url,
        backdrop_index=post_in.backdrop_index,
        backdrop_photo_url=post_in.backdrop_photo_url,
        paragraphs=post_in.paragraphs,
        photos=post_in.photos,
        summary=post_in.summary,
        links=post_in.links,
        route_map_url=post_in.route_map_url,
        gpx_url=post_in.gpx_url,
        tags=post_in.tags,
        published_at=published_at,
        created_at=now,
        updated_at=now
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Link GPX file if provided
    if post_in.gpx_id:
        gpx = db.query(GpxFile).filter(GpxFile.id == post_in.gpx_id).first()
        if gpx:
            post_gpx = PostGpx(post_id=post.id, gpx_id=gpx.id, is_primary=True)
            db.add(post_gpx)
            db.commit()
            db.refresh(post)

    return post

@router.put("/{slug}", response_model=PostResponse)
def update_post(
    slug: str,
    post_update: PostUpdate,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Author or Admin can update
    if current_user.role != "admin" and post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    update_data = post_update.model_dump(exclude_unset=True)

    # Handle status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "published" and post.status != "published":
            post.published_at = datetime.now(timezone.utc)
        elif new_status == "archived" and post.status != "archived":
            post.archived_at = datetime.now(timezone.utc)

    # Handle title to slug synchronization
    if "title" in update_data and update_data["title"]:
        new_title = update_data["title"].strip()
        if ("slug" not in update_data or not update_data["slug"]) and new_title != post.title:
            base_slug = slugify(new_title)
            new_slug = base_slug
            counter = 1
            while db.query(Post).filter(Post.slug == new_slug, Post.id != post.id).first():
                new_slug = f"{base_slug}-{counter}"
                counter += 1
            update_data["slug"] = new_slug

    # Handle GPX file linking changes
    if "gpx_id" in update_data:
        new_gpx_id = update_data.pop("gpx_id")
        # Remove existing links for this post
        db.query(PostGpx).filter(PostGpx.post_id == post.id).delete()
        if new_gpx_id:
            gpx = db.query(GpxFile).filter(GpxFile.id == new_gpx_id).first()
            if gpx:
                db.add(PostGpx(post_id=post.id, gpx_id=gpx.id, is_primary=True))

    # Update fields
    for field, value in update_data.items():
        setattr(post, field, value)

    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post

@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    slug: str,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if current_user.role != "admin" and post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.delete(post)
    db.commit()
    return None

@router.post("/{slug}/like")
def like_post(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_blocked:
        raise HTTPException(status_code=403, detail="Your account has been blocked by the administrator.")

    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(Like).filter(Like.post_id == post.id, Like.user_id == current_user.id).first()
    if existing:
        return {"likes_count": post.likes_count, "already_liked": True}

    like = Like(
        post_id=post.id,
        user_id=current_user.id
    )
    post.likes_count = (post.likes_count or 0) + 1
    db.add(like)
    db.commit()

    return {"likes_count": post.likes_count, "already_liked": False}
