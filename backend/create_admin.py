from sqlalchemy.orm import Session
from database import SessionLocal
import models
from auth import get_password_hash

def create_admin():
    """Создать администратора (если еще не существует)"""
    db = SessionLocal()
    
    try:
        # Проверяем, существует ли уже админ
        existing_admin = db.query(models.User).filter(models.User.username == 'admin').first()
        if existing_admin:
            print('Admin уже существует!')
            print(f'Username: admin')
            print(f'Email: {existing_admin.email}')
            return
        
        # Создаем нового админа
        admin_user = models.User(
            id='admin-001',
            email='admin@graph.ru',
            username='admin',
            hashed_password=get_password_hash('admin123'),
            full_name='Administrator',
            is_active=True,
            role=models.UserRole.admin
        )
        
        db.add(admin_user)
        db.commit()
        
        print('\n✅ Админ успешно создан!')
        print(f'Username: admin')
        print(f'Password: admin123')
        print(f'Email: admin@graph.ru')
        print('\nТеперь вы можете войти в систему с этими учетными данными.')
        
    except Exception as e:
        print(f'❌ Ошибка при создании админа: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    create_admin()
