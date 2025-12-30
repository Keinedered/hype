from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
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


@router.get("/full")
def get_full_graph(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получить полный граф с информацией об уроках и модулях"""
    nodes = crud.get_graph_nodes(db, user_id=current_user.id)
    edges = crud.get_graph_edges(db)
    
    # Обогащаем узлы информацией об уроках/модулях/курсах
    enriched_nodes = []
    for node in nodes:
        node_data = {
            "id": node.id,
            "type": node.type.value if hasattr(node.type, 'value') else node.type,
            "entityId": node.entity_id,
            "title": node.title,
            "x": node.x,
            "y": node.y,
            "status": node.status.value if node.status and hasattr(node.status, 'value') else (node.status if node.status else None),
            "size": node.size
        }
        
        # Добавляем информацию об уроке/модуле/курсе
        if node.type == models.NodeType.lesson:
            lesson = crud.get_lesson(db, node.entity_id)
            if lesson:
                node_data["lesson"] = {
                    "id": lesson.id,
                    "title": lesson.title,
                    "description": lesson.description,
                    "module_id": lesson.module_id
                }
        elif node.type == models.NodeType.module:
            module = crud.get_module(db, node.entity_id)
            if module:
                node_data["module"] = {
                    "id": module.id,
                    "title": module.title,
                    "course_id": module.course_id
                }
        elif node.type == models.NodeType.course:
            course = crud.get_course(db, node.entity_id)
            if course:
                node_data["course"] = {
                    "id": course.get("id"),
                    "title": course.get("title"),
                    "track_id": course.get("track_id")
                }
        
        enriched_nodes.append(node_data)
    
    return {
        "nodes": enriched_nodes,
        "edges": [{
            "id": edge.id,
            "sourceId": edge.source_id,
            "targetId": edge.target_id,
            "type": edge.type.value if hasattr(edge.type, 'value') else edge.type
        } for edge in edges]
    }

