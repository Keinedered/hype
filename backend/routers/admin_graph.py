from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import get_current_admin

router = APIRouter()


def graph_node_to_schema(node: models.GraphNode) -> schemas.GraphNode:
    """Преобразует модель GraphNode в схему GraphNode, исключая relationships"""
    return schemas.GraphNode(
        id=node.id,
        type=node.type,
        entity_id=node.entity_id,
        title=node.title or '',
        x=node.x if node.x is not None else 0.0,
        y=node.y if node.y is not None else 0.0,
        status=node.status,
        size=node.size if node.size is not None else 40
    )


def graph_edge_to_schema(edge: models.GraphEdge) -> schemas.GraphEdge:
    """Преобразует модель GraphEdge в схему GraphEdge, исключая relationships"""
    return schemas.GraphEdge(
        id=edge.id,
        source_id=edge.source_id,
        target_id=edge.target_id,
        type=edge.type
    )


@router.get('/admin/graph/nodes', response_model=List[schemas.GraphNode])
def list_graph_nodes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех узлов графа"""
    try:
        nodes = db.query(models.GraphNode).all()
        schemas_list = [graph_node_to_schema(node) for node in nodes]
        return schemas_list
    except Exception as e:
        import traceback
        print(f"Error in list_graph_nodes: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to load graph nodes: {str(e)}")


@router.post('/admin/graph/nodes', response_model=schemas.GraphNode, status_code=status.HTTP_201_CREATED)
def create_graph_node(
    node: schemas.GraphNodeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый узел графа"""
    db_node = db.query(models.GraphNode).filter(models.GraphNode.id == node.id).first()
    if db_node:
        raise HTTPException(status_code=400, detail='Node already exists')
    
    new_node = models.GraphNode(**node.dict())
    db.add(new_node)
    db.commit()
    db.refresh(new_node)
    return graph_node_to_schema(new_node)


@router.get('/admin/graph/nodes/{node_id}', response_model=schemas.GraphNode)
def get_graph_node(
    node_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить узел графа по ID"""
    node = db.query(models.GraphNode).filter(models.GraphNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail='Node not found')
    return graph_node_to_schema(node)


@router.put('/admin/graph/nodes/{node_id}', response_model=schemas.GraphNode)
def update_graph_node(
    node_id: str,
    node: schemas.GraphNodeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить узел графа (позиция, название, статус и размер)"""
    db_node = db.query(models.GraphNode).filter(models.GraphNode.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail='Node not found')
    
    update_data = node.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_node, key, value)
    
    db.commit()
    db.refresh(db_node)
    return graph_node_to_schema(db_node)


@router.put('/admin/graph/nodes/batch-update')
def batch_update_nodes(
    updates: List[dict],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Пакетное обновление узлов (для drag & drop)"""
    updated_count = 0
    for update in updates:
        node_id = update.get('id')
        if not node_id:
            continue
        
        db_node = db.query(models.GraphNode).filter(models.GraphNode.id == node_id).first()
        if db_node:
            if 'x' in update:
                db_node.x = update['x']
            if 'y' in update:
                db_node.y = update['y']
            if 'title' in update:
                db_node.title = update['title']
            if 'status' in update:
                db_node.status = update['status']
            if 'size' in update:
                db_node.size = update['size']
            updated_count += 1
    
    db.commit()
    return {'message': f'{updated_count} nodes updated successfully', 'updated_count': updated_count}


@router.delete('/admin/graph/nodes/{node_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_graph_node(
    node_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить узел графа"""
    node = db.query(models.GraphNode).filter(models.GraphNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail='Node not found')
    
    db.delete(node)
    db.commit()
    return None


# ==================== EDGES ====================

@router.get('/admin/graph/edges', response_model=List[schemas.GraphEdge])
def list_graph_edges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех связей графа"""
    try:
        edges = db.query(models.GraphEdge).all()
        return [graph_edge_to_schema(edge) for edge in edges]
    except Exception as e:
        import traceback
        print(f"Error in list_graph_edges: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to load graph edges: {str(e)}")


@router.post('/admin/graph/edges', response_model=schemas.GraphEdge, status_code=status.HTTP_201_CREATED)
def create_graph_edge(
    edge: schemas.GraphEdgeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать связь между узлами графа"""
    # Проверяем существование узлов
    source_node = db.query(models.GraphNode).filter(models.GraphNode.id == edge.source_id).first()
    target_node = db.query(models.GraphNode).filter(models.GraphNode.id == edge.target_id).first()
    
    if not source_node:
        raise HTTPException(status_code=404, detail=f'Source node {edge.source_id} not found')
    if not target_node:
        raise HTTPException(status_code=404, detail=f'Target node {edge.target_id} not found')
    
    # Проверяем, что не создаем связь узла с самим собой
    if edge.source_id == edge.target_id:
        raise HTTPException(status_code=400, detail='Cannot create edge from node to itself')
    
    # Проверяем, что связь не существует
    existing_edge = db.query(models.GraphEdge).filter(
        models.GraphEdge.source_id == edge.source_id,
        models.GraphEdge.target_id == edge.target_id
    ).first()
    if existing_edge:
        raise HTTPException(status_code=400, detail='Edge already exists')
    
    new_edge = models.GraphEdge(**edge.dict())
    db.add(new_edge)
    db.commit()
    db.refresh(new_edge)
    return graph_edge_to_schema(new_edge)


@router.get('/admin/graph/edges/{edge_id}', response_model=schemas.GraphEdge)
def get_graph_edge(
    edge_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить связь графа по ID"""
    edge = db.query(models.GraphEdge).filter(models.GraphEdge.id == edge_id).first()
    if not edge:
        raise HTTPException(status_code=404, detail='Edge not found')
    return graph_edge_to_schema(edge)


@router.put('/admin/graph/edges/{edge_id}', response_model=schemas.GraphEdge)
def update_graph_edge(
    edge_id: str,
    edge_type: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить тип связи"""
    db_edge = db.query(models.GraphEdge).filter(models.GraphEdge.id == edge_id).first()
    if not db_edge:
        raise HTTPException(status_code=404, detail='Edge not found')
    
    if edge_type:
        try:
            db_edge.type = models.EdgeType[edge_type] if isinstance(edge_type, str) else edge_type
        except (KeyError, ValueError):
            raise HTTPException(status_code=400, detail=f'Invalid edge type: {edge_type}. Must be one of: required, alternative, recommended')
    
    db.commit()
    db.refresh(db_edge)
    return graph_edge_to_schema(db_edge)


@router.delete('/admin/graph/edges/{edge_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_graph_edge(
    edge_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить связь графа"""
    edge = db.query(models.GraphEdge).filter(models.GraphEdge.id == edge_id).first()
    if not edge:
        raise HTTPException(status_code=404, detail='Edge not found')
    
    db.delete(edge)
    db.commit()
    return None
