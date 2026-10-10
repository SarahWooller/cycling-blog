import re
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import GpxFile, PostGpx, Post, User
from ..schemas import GpxFileUploadResponse, GpxFileSummary
from ..auth import require_blogger

router = APIRouter(prefix="/gpx", tags=["GPX Routes"])

def extract_gpx_summary(xml_str: str) -> Dict[str, Any]:
    """Extract lightweight metadata from raw GPX XML without heavy dependencies."""
    summary = {}
    try:
        # Route or Track Name
        name_match = re.search(r"<name>(.*?)</name>", xml_str, re.IGNORECASE)
        if name_match:
            summary["name"] = name_match.group(1).strip()

        # Count track points
        trkpt_count = len(re.findall(r"<trkpt\b", xml_str, re.IGNORECASE))
        rtept_count = len(re.findall(r"<rtept\b", xml_str, re.IGNORECASE))
        wpt_count = len(re.findall(r"<wpt\b", xml_str, re.IGNORECASE))
        total_points = trkpt_count or rtept_count or wpt_count
        summary["points_count"] = total_points

        # Elevation bounds if present
        elevations = [float(e) for e in re.findall(r"<ele>([0-9.-]+)</ele>", xml_str, re.IGNORECASE)]
        if elevations:
            summary["min_elevation_m"] = round(min(elevations), 1)
            summary["max_elevation_m"] = round(max(elevations), 1)
    except Exception:
        pass
    return summary

@router.post("/upload", response_model=GpxFileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_gpx(
    file: UploadFile = File(...),
    post_slug: Optional[str] = Form(None),
    post_id: Optional[str] = Form(None),
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    """
    Upload a GPX route track file.
    Stores raw GPX XML content directly in the database (gpx_files table)
    and optionally links it to a post via post_gpx linking table.
    """
    filename = file.filename or "route.gpx"
    if not filename.lower().endswith(".gpx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .gpx files are allowed"
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > 20 * 1024 * 1024:  # 20MB upper bound
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GPX file exceeds maximum allowed size of 20MB"
        )

    try:
        content_str = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = raw_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode GPX text content"
            )

    if "<gpx" not in content_str.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GPX file format: missing <gpx> root element"
        )

    # Extract metadata summary
    summary_data = extract_gpx_summary(content_str)

    # Create GpxFile record in DB
    gpx_record = GpxFile(
        filename=filename,
        content=content_str,
        file_size=len(raw_bytes),
        uploader_id=current_user.id,
        summary=summary_data
    )
    db.add(gpx_record)
    db.commit()
    db.refresh(gpx_record)

    # Link to post if post_slug or post_id is provided
    target_post = None
    if post_slug:
        target_post = db.query(Post).filter(Post.slug == post_slug).first()
    elif post_id:
        target_post = db.query(Post).filter(Post.id == post_id).first()

    if target_post:
        # Check authorization
        if current_user.role != "admin" and target_post.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to attach GPX to this post")
        
        # Add link in post_gpx
        post_gpx = PostGpx(
            post_id=target_post.id,
            gpx_id=gpx_record.id,
            is_primary=True
        )
        db.add(post_gpx)
        db.commit()

    return GpxFileUploadResponse(
        success=True,
        id=gpx_record.id,
        filename=gpx_record.filename,
        file_size=gpx_record.file_size,
        download_url=gpx_record.download_url,
        summary=gpx_record.summary,
        message="GPX file uploaded and stored in database successfully"
    )

@router.get("/{gpx_id}", response_model=GpxFileSummary)
def get_gpx_metadata(
    gpx_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve GPX file metadata."""
    gpx = db.query(GpxFile).filter(GpxFile.id == gpx_id).first()
    if not gpx:
        raise HTTPException(status_code=404, detail="GPX file not found")
    return gpx

@router.get("/{gpx_id}/download")
def download_gpx(
    gpx_id: str,
    db: Session = Depends(get_db)
):
    """
    Download raw GPX XML file directly from database.
    Publicly accessible so blog readers can download route tracks for Garmin/Wahoo/Komoot.
    """
    gpx = db.query(GpxFile).filter(GpxFile.id == gpx_id).first()
    if not gpx:
        raise HTTPException(status_code=404, detail="GPX file not found")

    return Response(
        content=gpx.content,
        media_type="application/gpx+xml; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{gpx.filename}"',
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.delete("/{gpx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gpx(
    gpx_id: str,
    current_user: User = Depends(require_blogger),
    db: Session = Depends(get_db)
):
    """Delete a GPX file and associated links."""
    gpx = db.query(GpxFile).filter(GpxFile.id == gpx_id).first()
    if not gpx:
        raise HTTPException(status_code=404, detail="GPX file not found")

    if current_user.role != "admin" and gpx.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this GPX file")

    db.delete(gpx)
    db.commit()
    return None
