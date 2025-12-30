from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas
from auth import get_current_admin

router = APIRouter()


# ==================== HANDBOOKS ====================

@router.post('/admin/handbooks', status_code=status.HTTP_201_CREATED)
def create_handbook(
    handbook: schemas.HandbookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новый handbook"""
    new_handbook = models.Handbook(**handbook.dict())
    db.add(new_handbook)
    db.commit()
    db.refresh(new_handbook)
    return new_handbook


@router.get('/admin/handbooks')
def list_handbooks(
    module_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех handbooks"""
    query = db.query(models.Handbook)
    if module_id:
        query = query.filter(models.Handbook.module_id == module_id)
    return query.all()


@router.get('/admin/handbooks/{handbook_id}')
def get_handbook(
    handbook_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить handbook по ID"""
    handbook = db.query(models.Handbook).filter(models.Handbook.id == handbook_id).first()
    if not handbook:
        raise HTTPException(status_code=404, detail='Handbook not found')
    return handbook


@router.put('/admin/handbooks/{handbook_id}')
def update_handbook(
    handbook_id: str,
    handbook: schemas.HandbookUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить handbook"""
    db_handbook = db.query(models.Handbook).filter(models.Handbook.id == handbook_id).first()
    if not db_handbook:
        raise HTTPException(status_code=404, detail='Handbook not found')
    
    update_data = handbook.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_handbook, key, value)
    
    db.commit()
    db.refresh(db_handbook)
    return db_handbook


@router.delete('/admin/handbooks/{handbook_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_handbook(
    handbook_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить handbook"""
    handbook = db.query(models.Handbook).filter(models.Handbook.id == handbook_id).first()
    if not handbook:
        raise HTTPException(status_code=404, detail='Handbook not found')
    
    db.delete(handbook)
    db.commit()
    return None


# ==================== SECTIONS ====================

@router.post('/admin/handbook-sections', status_code=status.HTTP_201_CREATED)
def create_section(
    section: schemas.HandbookSectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новую секцию handbook"""
    new_section = models.HandbookSection(**section.dict())
    db.add(new_section)
    db.commit()
    db.refresh(new_section)
    return new_section


@router.get('/admin/handbook-sections')
def list_sections(
    handbook_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех секций handbook"""
    query = db.query(models.HandbookSection)
    if handbook_id:
        query = query.filter(models.HandbookSection.handbook_id == handbook_id)
    return query.order_by(models.HandbookSection.order_index).all()


@router.get('/admin/handbook-sections/{section_id}')
def get_section(
    section_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить секцию handbook по ID"""
    section = db.query(models.HandbookSection).filter(models.HandbookSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail='Section not found')
    return section


@router.put('/admin/handbook-sections/{section_id}')
def update_section(
    section_id: str,
    section: schemas.HandbookSectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить секцию handbook"""
    db_section = db.query(models.HandbookSection).filter(models.HandbookSection.id == section_id).first()
    if not db_section:
        raise HTTPException(status_code=404, detail='Section not found')
    
    update_data = section.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_section, key, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section


@router.delete('/admin/handbook-sections/{section_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить секцию handbook"""
    section = db.query(models.HandbookSection).filter(models.HandbookSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail='Section not found')
    
    db.delete(section)
    db.commit()
    return None


# ==================== ARTICLES ====================

@router.post('/admin/handbook-articles', status_code=status.HTTP_201_CREATED)
def create_article(
    article: schemas.HandbookArticleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Создать новую статью handbook"""
    new_article = models.HandbookArticle(**article.dict())
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article


@router.get('/admin/handbook-articles')
def list_articles(
    section_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить список всех статей"""
    query = db.query(models.HandbookArticle)
    if section_id:
        query = query.filter(models.HandbookArticle.section_id == section_id)
    return query.all()


@router.get('/admin/handbook-articles/{article_id}')
def get_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Получить статью по ID"""
    article = db.query(models.HandbookArticle).filter(models.HandbookArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail='Article not found')
    return article


@router.put('/admin/handbook-articles/{article_id}')
def update_article(
    article_id: str,
    article: schemas.HandbookArticleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Обновить статью"""
    db_article = db.query(models.HandbookArticle).filter(models.HandbookArticle.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail='Article not found')
    
    update_data = article.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_article, key, value)
    
    db.commit()
    db.refresh(db_article)
    return db_article


@router.delete('/admin/handbook-articles/{article_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """Удалить статью"""
    article = db.query(models.HandbookArticle).filter(models.HandbookArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail='Article not found')
    
    db.delete(article)
    db.commit()
    return None
