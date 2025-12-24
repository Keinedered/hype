from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import schemas
import crud
from auth import get_current_active_user
import models

router = APIRouter(prefix="/graph")


@router.get("/nodes", response_model=List[schemas.GraphNode])
def get_graph_nodes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получить все узлы графа"""
    return crud.get_graph_nodes(db, user_id=current_user.id)


@router.get("/edges", response_model=List[schemas.GraphEdge])
def get_graph_edges(db: Session = Depends(get_db)):
    """Получить все ребра графа"""
    return crud.get_graph_edges(db)

