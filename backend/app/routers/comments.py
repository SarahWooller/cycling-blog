from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Comment, Post, User
from ..schemas import CommentCreate, CommentResponse
from ..auth import get_current_user, get_current_user_optional, require_blogger

router = APIRouter(tags=["Comments"])

@router.get("/posts/{slug}/comments", response_model=List[CommentResponse])
def get_comments(
    slug: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    query = db.query(Comment).filter(Comment.post_id == post.id)

    # If author or admin, show pending comments too. Otherwise only approved comments.
    is_owner_or_admin = current_user and (current_user.role == "admin" or post.author_id == current_user.id)
    if not is_owner_or_admin:
        query = query.filter(Comment.is_approved == True)

    return query.order_by(Comment.created_at.asc()).all()

@router.post("/posts/{slug}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    slug: str,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked by the administrator."
        )

    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.status == "archived":
        raise HTTPException(status_code=400, detail="Comments are closed on archived posts")

    # Honeypot check for spam bots
    if comment_in.hp_field:
        raise HTTPException(status_code=400, detail="Invalid submission")

    # Author/Admin comments are auto-approved. Otherwise depend on post.approve_comments
    is_owner_or_admin = current_user.role == "admin" or post.author_id == current_user.id
    if is_owner_or_admin:
        is_approved = True
    else:
        is_approved = not post.approve_comments

    author_name = comment_in.author_name.strip() if comment_in.author_name else current_user.display_name

    comment = Comment(
        post_id=post.id,
        user_id=current_user.id,
        author_name=author_name or "Fellow Cyclist",
        content=comment_in.content.strip(),
        is_approved=is_approved
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.patch("/comments/{comment_id}/approve", response_model=CommentResponse)
def approve_comment(
    comment_id: str,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if current_user.role != "admin" and (not post or post.author_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to moderate this comment")

    comment.is_approved = True
    db.commit()
    db.refresh(comment)
    return comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: str,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if current_user.role != "admin" and (not post or post.author_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return None
