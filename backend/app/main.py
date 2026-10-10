from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import auth, posts, comments, tours, admin, gpx, authors

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if not present (SQLite local or PostgreSQL on startup)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(posts.router, prefix=settings.API_V1_STR)
app.include_router(comments.router, prefix=settings.API_V1_STR)
app.include_router(tours.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(gpx.router, prefix=settings.API_V1_STR)
app.include_router(authors.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to VeloTales Cycling Blog API",
        "docs": "/docs"
    }
