import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, Post, SiteSetting
from backend.app.auth import get_password_hash

def seed_database():
    print("Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Creating default admin user: admin / velotales2026!")
            admin_user = User(
                username="admin",
                email="admin@velotales.local",
                display_name="VeloTales Admin",
                hashed_password=get_password_hash("velotales2026!"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        else:
            print("Admin user already exists.")

        # 2. Seed Default Blogger
        blogger_user = db.query(User).filter(User.username == "sarah").first()
        if not blogger_user:
            print("Creating default blogger user: sarah / cycling2026!")
            blogger_user = User(
                username="sarah",
                email="sarah@velotales.local",
                display_name="Sarah Wooller",
                hashed_password=get_password_hash("cycling2026!"),
                role="blogger"
            )
            db.add(blogger_user)
            db.commit()
            db.refresh(blogger_user)
        else:
            print("Blogger user 'sarah' already exists.")

        # 3. Seed Default Site Backdrop Setting
        backdrop_setting = db.query(SiteSetting).filter(SiteSetting.key == "home_backdrop_url").first()
        if not backdrop_setting:
            print("Setting default home backdrop URL...")
            backdrop_setting = SiteSetting(
                key="home_backdrop_url",
                value="https://photos.app.goo.gl/DkjZjzt6AeBzVdge8",
                updated_by=admin_user.id
            )
            db.add(backdrop_setting)
            db.commit()
        else:
            print("Site backdrop setting already configured.")

        # 4. Migrate existing posts from src/data/posts.json
        posts_count = db.query(Post).count()
        if posts_count == 0:
            posts_json_path = Path(__file__).resolve().parent.parent / "src" / "data" / "posts.json"
            if posts_json_path.exists():
                print(f"Importing initial posts from {posts_json_path}...")
                with open(posts_json_path, "r", encoding="utf-8") as f:
                    posts_data = json.load(f)

                for item in posts_data:
                    post = Post(
                        title=item.get("title", "Untitled Post"),
                        slug=item.get("slug"),
                        author_id=blogger_user.id,
                        status="published",
                        is_public=True,
                        approve_comments=False,
                        doc_url=item.get("docUrl"),
                        photos_album_url=item.get("photosAlbumUrl"),
                        backdrop_index=item.get("backdropIndex", 0),
                        backdrop_photo_url=item.get("backdropPhotoUrl"),
                        paragraphs=item.get("paragraphs", []),
                        photos=item.get("photos", []),
                        summary=item.get("summary", {}),
                        links=item.get("links", []),
                        route_map_url=item.get("routeMapUrl"),
                        tags=["gravel", "kent"] if "kent" in item.get("slug", "").lower() else ["cycling"],
                        likes_count=12,
                        published_at=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc)
                    )
                    db.add(post)
                db.commit()
                print(f"Successfully imported {len(posts_data)} initial posts.")
        else:
            print(f"Database already has {posts_count} posts. Skipping import.")

        print("Database seed completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
