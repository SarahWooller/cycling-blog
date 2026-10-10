import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, Text, DateTime, ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    # Roles: 'reader' (likes & comments), 'blogger' (authors posts), 'admin' (moderation & management)
    role = Column(String(20), nullable=False, default="reader", index=True)
    is_blocked = Column(Boolean, nullable=False, default=False, index=True)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(Text, nullable=True)
    bio_paragraphs = Column(JSON, nullable=False, default=list)
    photos = Column(JSON, nullable=False, default=list)
    backdrop_index = Column(Integer, default=0)
    links = Column(JSON, nullable=False, default=list)
    location = Column(String(100), nullable=True)
    cycling_style = Column(String(100), nullable=True)
    bike_setup = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    tours = relationship("Tour", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    gpx_files = relationship("GpxFile", back_populates="uploader")

class BlockedEmail(Base):
    __tablename__ = "blocked_emails"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    blocked_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

class Tour(Base):
    __tablename__ = "tours"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    author = relationship("User", back_populates="tours")
    posts = relationship("Post", back_populates="tour", order_by="Post.day_number")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    author_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tour_id = Column(String(36), ForeignKey("tours.id", ondelete="SET NULL"), nullable=True)
    day_number = Column(Integer, nullable=True)  # e.g., 1 for Day 1

    # Post Lifecycle: 'draft', 'published', 'archived'
    status = Column(String(20), nullable=False, default="draft", index=True)
    is_public = Column(Boolean, nullable=False, default=True, index=True)
    approve_comments = Column(Boolean, nullable=False, default=False)

    # Source Links
    doc_url = Column(Text, nullable=True)
    photos_album_url = Column(Text, nullable=True)
    backdrop_index = Column(Integer, default=0)
    backdrop_photo_url = Column(Text, nullable=True)

    # Content & Media (JSON objects - Zero local file storage)
    paragraphs = Column(JSON, nullable=False, default=list)
    photos = Column(JSON, nullable=False, default=list)
    summary = Column(JSON, nullable=False, default=dict)
    links = Column(JSON, nullable=False, default=list)
    route_map_url = Column(Text, nullable=True)
    gpx_url = Column(Text, nullable=True)
    tags = Column(JSON, nullable=False, default=list)  # list of strings: ["gravel", "kent"]

    # Metrics
    likes_count = Column(Integer, nullable=False, default=0, index=True)

    # Timestamps
    published_at = Column(DateTime, nullable=True, index=True)
    archived_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    author = relationship("User", back_populates="posts")
    tour = relationship("Tour", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan", order_by="Comment.created_at")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    gpx_links = relationship("PostGpx", back_populates="post", cascade="all, delete-orphan")
    gpx_files = relationship("GpxFile", secondary="post_gpx", back_populates="posts", overlaps="gpx_links")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    is_approved = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Like(Base):
    __tablename__ = "likes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_user_like"),
    )

class GpxFile(Base):
    __tablename__ = "gpx_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)  # Raw XML string stored directly in database
    file_size = Column(Integer, nullable=False, default=0)
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    summary = Column(JSON, nullable=True)  # {"distance_km": ..., "elevation_gain_m": ..., "trackpoints": ...}
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    uploader = relationship("User", back_populates="gpx_files")
    post_links = relationship("PostGpx", back_populates="gpx_file", cascade="all, delete-orphan")
    posts = relationship("Post", secondary="post_gpx", back_populates="gpx_files", overlaps="post_links,gpx_links")

    @property
    def download_url(self) -> str:
        return f"/api/v1/gpx/{self.id}/download"


class PostGpx(Base):
    __tablename__ = "post_gpx"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    gpx_id = Column(String(36), ForeignKey("gpx_files.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="gpx_links", overlaps="gpx_files,posts")
    gpx_file = relationship("GpxFile", back_populates="post_links", overlaps="gpx_files,posts")

    __table_args__ = (
        UniqueConstraint("post_id", "gpx_id", name="uq_post_gpx"),
    )

class SiteSetting(Base):
    __tablename__ = "site_settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    updated_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

