from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud

router = APIRouter(prefix="/modules")


@router.get("/course/{course_id}", response_model=List[schemas.Module])
def get_course_modules(course_id: str, db: Session = Depends(get_db)):
    """Получить все модули курса"""
    return crud.get_modules(db, course_id)


@router.get("/{module_id}", response_model=schemas.Module)
def get_module(module_id: str, db: Session = Depends(get_db)):
    """Получить модуль по ID"""
    module = crud.get_module(db, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

