from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(prefix="/tracks")


@router.get("/", response_model=List[schemas.Track])
def get_tracks(db: Session = Depends(get_db)):
    """Получить все треки"""
    return crud.get_tracks(db)


@router.get("/{track_id}", response_model=schemas.Track)
def get_track(track_id: str, db: Session = Depends(get_db)):
    """Получить трек по ID"""
    track = crud.get_track(db, track_id)
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return track

