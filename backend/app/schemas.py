from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, model_validator

# ----------------- User Schemas -----------------

class UserBase(BaseModel):
    username: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str
    role: str  # 'reader', 'blogger', 'admin'
    is_blocked: bool = False
    bio_paragraphs: List[str] = []
    photos: List[Dict[str, Any]] = []
    backdrop_index: int = 0
    links: List[Dict[str, Any]] = []
    location: Optional[str] = None
    cycling_style: Optional[str] = None
    bike_setup: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Blocked Email Schemas -----------------

class BlockedEmailCreate(BaseModel):
    email: str
    reason: Optional[str] = "Hate speech / harassment"

class BlockedEmailResponse(BaseModel):
    id: str
    email: str
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Comment Schemas -----------------

class CommentCreate(BaseModel):
    content: str
    author_name: Optional[str] = None
    hp_field: Optional[str] = None  # Honeypot field for bot prevention

class CommentResponse(BaseModel):
    id: str
    post_id: str
    user_id: Optional[str] = None
    author_name: str
    content: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Post Schemas -----------------

class PostBase(BaseModel):
    title: str
    slug: Optional[str] = None
    tour_id: Optional[str] = None
    day_number: Optional[int] = None
    status: str = "draft"  # 'draft', 'published', 'archived'
    is_public: bool = True
    approve_comments: bool = False
    doc_url: Optional[str] = None
    photos_album_url: Optional[str] = None
    backdrop_index: int = 0
    backdrop_photo_url: Optional[str] = None
    paragraphs: List[str] = []
    photos: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {}
    links: List[Dict[str, Any]] = []
    route_map_url: Optional[str] = None
    gpx_url: Optional[str] = None
    gpx_id: Optional[str] = None
    tags: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            mapping = {
                "routeMapUrl": "route_map_url",
                "docUrl": "doc_url",
                "photosAlbumUrl": "photos_album_url",
                "backdropIndex": "backdrop_index",
                "backdropPhotoUrl": "backdrop_photo_url",
                "gpxUrl": "gpx_url",
                "gpxId": "gpx_id",
            }
            for camel, snake in mapping.items():
                if camel in data and snake not in data:
                    data[snake] = data[camel]
        return data

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    tour_id: Optional[str] = None
    day_number: Optional[int] = None
    status: Optional[str] = None  # 'draft', 'published', 'archived'
    is_public: Optional[bool] = None
    approve_comments: Optional[bool] = None
    doc_url: Optional[str] = None
    photos_album_url: Optional[str] = None
    backdrop_index: Optional[int] = None
    backdrop_photo_url: Optional[str] = None
    paragraphs: Optional[List[str]] = None
    photos: Optional[List[Dict[str, Any]]] = None
    summary: Optional[Dict[str, Any]] = None
    links: Optional[List[Dict[str, Any]]] = None
    route_map_url: Optional[str] = None
    gpx_url: Optional[str] = None
    gpx_id: Optional[str] = None
    tags: Optional[List[str]] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case(cls, data: Any) -> Any:
        if isinstance(data, dict):
            mapping = {
                "routeMapUrl": "route_map_url",
                "docUrl": "doc_url",
                "photosAlbumUrl": "photos_album_url",
                "backdropIndex": "backdrop_index",
                "backdropPhotoUrl": "backdrop_photo_url",
                "gpxUrl": "gpx_url",
                "gpxId": "gpx_id",
            }
            for camel, snake in mapping.items():
                if camel in data and snake not in data:
                    data[snake] = data[camel]
        return data

class PostAuthorSummary(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- GPX Schemas -----------------

class GpxFileSummary(BaseModel):
    id: str
    filename: str
    file_size: int
    created_at: datetime
    download_url: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class GpxFileDetail(GpxFileSummary):
    content: str
    uploader_id: Optional[str] = None
    updated_at: datetime

class GpxFileUploadResponse(BaseModel):
    success: bool
    id: str
    filename: str
    file_size: int
    download_url: str
    summary: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

class TourSummary(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: str
    slug: str
    title: str
    author_id: str
    author: Optional[PostAuthorSummary] = None
    tour_id: Optional[str] = None
    tour: Optional[TourSummary] = None
    day_number: Optional[int] = None
    status: str
    is_public: bool
    approve_comments: bool
    doc_url: Optional[str] = None
    photos_album_url: Optional[str] = None
    backdrop_index: int = 0
    backdrop_photo_url: Optional[str] = None
    paragraphs: List[str] = []
    photos: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {}
    links: List[Dict[str, Any]] = []
    route_map_url: Optional[str] = None
    gpx_url: Optional[str] = None
    gpx_files: List[GpxFileSummary] = []
    tags: List[str] = []
    likes_count: int = 0
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ----------------- Tour Schemas -----------------

class TourBase(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None

class TourCreate(TourBase):
    pass

class TourUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None

class TourResponse(TourBase):
    id: str
    author_id: str
    author: Optional[PostAuthorSummary] = None
    created_at: datetime
    posts: List[PostResponse] = []

    class Config:
        from_attributes = True

# ----------------- Author Profile Schemas -----------------

class AuthorProfileResponse(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    role: str
    bio_paragraphs: List[str] = []
    photos: List[Dict[str, Any]] = []
    backdrop_index: int = 0
    links: List[Dict[str, Any]] = []
    location: Optional[str] = None
    cycling_style: Optional[str] = None
    bike_setup: Optional[str] = None
    created_at: datetime
    posts: List[PostResponse] = []

    class Config:
        from_attributes = True

class AuthorProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio_paragraphs: Optional[List[str]] = None
    photos: Optional[List[Dict[str, Any]]] = None
    backdrop_index: Optional[int] = None
    links: Optional[List[Dict[str, Any]]] = None
    location: Optional[str] = None
    cycling_style: Optional[str] = None
    bike_setup: Optional[str] = None

# ----------------- Site Settings Schemas -----------------

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str
    updated_at: datetime

    class Config:
        from_attributes = True
