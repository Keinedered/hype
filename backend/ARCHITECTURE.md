# 🏗️ Архитектура Backend

Подробное описание работы backend приложения GRAPH Educational Platform.

---

## 📋 Обзор

Backend построен на **FastAPI** — современном Python фреймворке для создания REST API. Использует **SQLAlchemy** как ORM для работы с **PostgreSQL** базой данных.

### Технологический стек
- **FastAPI** — веб-фреймворк
- **SQLAlchemy** — ORM для работы с БД
- **PostgreSQL** — реляционная СУБД
- **Pydantic** — валидация данных
- **JWT** — аутентификация (python-jose)
- **Bcrypt** — хеширование паролей (passlib)
- **Uvicorn** — ASGI сервер

---

## 🏛️ Архитектура

### Слои приложения

```
┌─────────────────────────────────────────┐
│         FastAPI Application              │
│  (main.py - точка входа)                │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Routers (API Endpoints)         │
│  (routers/*.py)                         │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         CRUD Operations                 │
│  (crud.py)                              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         SQLAlchemy Models               │
│  (models.py)                            │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
└─────────────────────────────────────────┘
```

---

## 📂 Структура файлов

### `main.py` — Точка входа

**Назначение:** Создание и настройка FastAPI приложения

**Что делает:**
1. Создает таблицы БД из моделей (`Base.metadata.create_all`)
2. Инициализирует FastAPI приложение
3. Настраивает CORS middleware
4. Подключает все роутеры
5. Определяет базовые endpoints (`/`, `/health`)

**Ключевые моменты:**
```python
# Автоматическое создание таблиц при старте
Base.metadata.create_all(bind=engine)

# CORS для работы с фронтендом
app.add_middleware(CORSMiddleware, ...)

# Подключение роутеров с префиксом /api/v1
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
```

---

### `config.py` — Конфигурация

**Назначение:** Централизованное хранение настроек

**Использует:** `pydantic-settings` для загрузки из `.env` файла

**Параметры:**
- `DATABASE_URL` — строка подключения к PostgreSQL
- `SECRET_KEY` — секретный ключ для JWT
- `ALGORITHM` — алгоритм шифрования (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — время жизни токена
- `BACKEND_CORS_ORIGINS` — разрешенные источники для CORS

**Пример:**
```python
settings = Settings()  # Автоматически загружает из .env
DATABASE_URL = settings.DATABASE_URL
```

---

### `database.py` — Подключение к БД

**Назначение:** Настройка подключения к PostgreSQL

**Компоненты:**
1. **Engine** — пул соединений с БД
2. **SessionLocal** — фабрика сессий
3. **Base** — базовый класс для моделей
4. **get_db()** — dependency для FastAPI

**Как работает:**
```python
# Создание engine с пулом соединений
engine = create_engine(settings.DATABASE_URL)

# Фабрика сессий
SessionLocal = sessionmaker(bind=engine)

# Dependency injection для FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db  # Передает сессию в endpoint
    finally:
        db.close()  # Закрывает после использования
```

**Использование в роутерах:**
```python
@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    # db автоматически создается и закрывается
    return crud.get_courses(db)
```

---

### `models.py` — Модели данных (SQLAlchemy)

**Назначение:** Определение структуры таблиц БД

**Принцип работы:**
- Каждый класс = таблица в БД
- Атрибуты класса = колонки таблицы
- Relationships = связи между таблицами

**Пример модели:**
```python
class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True)
    track_id = Column(String, ForeignKey("tracks.id"))
    title = Column(String, nullable=False)
    
    # Relationship - связь с другими таблицами
    track = relationship("Track", back_populates="courses")
    modules = relationship("Module", back_populates="course")
```

**Типы связей:**
- **One-to-Many:** `Course` → `Module` (один курс, много модулей)
- **Many-to-One:** `Module` → `Course` (много модулей, один курс)
- **Many-to-Many:** через промежуточную таблицу

**Enums:**
- Используются для ограничения значений (например, `CourseStatus`)

---

### `schemas.py` — Схемы валидации (Pydantic)

**Назначение:** Валидация входных и выходных данных API

**Типы схем:**
1. **Request schemas** — для входящих данных (POST, PUT)
2. **Response schemas** — для исходящих данных (GET)
3. **Base schemas** — базовые классы для переиспользования

**Пример:**
```python
class CourseBase(BaseModel):
    id: str
    title: str
    level: CourseLevel

class Course(CourseBase):
    created_at: datetime
    class Config:
        from_attributes = True  # Позволяет создавать из SQLAlchemy моделей
```

**Преимущества:**
- Автоматическая валидация типов
- Сериализация в JSON
- Документация API (Swagger)

---

### `crud.py` — Операции с БД

**Назначение:** Бизнес-логика работы с данными

**Принцип работы:**
- Функции принимают `db: Session` и параметры
- Выполняют SQL запросы через SQLAlchemy
- Возвращают модели или словари

**Пример:**
```python
def get_courses(db: Session, track_id: Optional[str] = None):
    query = db.query(models.Course)
    
    if track_id:
        query = query.filter(models.Course.track_id == track_id)
    
    return query.all()
```

**Особенности:**
- Использует `joinedload` для eager loading связей
- Объединяет данные из нескольких таблиц
- Добавляет прогресс пользователя к курсам

---

### `auth.py` — Аутентификация

**Назначение:** Управление пользователями и JWT токенами

**Компоненты:**

#### 1. Хеширование паролей
```python
pwd_context = CryptContext(schemes=["bcrypt"])
get_password_hash(password)  # Хеширует пароль
verify_password(plain, hashed)  # Проверяет пароль
```

#### 2. JWT токены
```python
create_access_token(data)  # Создает токен с данными пользователя
get_current_user(token)  # Извлекает пользователя из токена
```

#### 3. Dependency для защиты роутов
```python
@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_active_user)):
    # Только для авторизованных пользователей
    return {"user": current_user}
```

**Поток аутентификации:**
1. Пользователь отправляет username/password
2. Backend проверяет в БД
3. Если верно → создает JWT токен
4. Токен возвращается клиенту
5. Клиент отправляет токен в заголовке `Authorization: Bearer <token>`
6. Backend проверяет токен при каждом запросе

---

### `routers/` — API Endpoints

**Назначение:** Определение HTTP endpoints

**Структура роутера:**
```python
from fastapi import APIRouter, Depends
router = APIRouter(prefix="/courses")

@router.get("/", response_model=List[Course])
def get_courses(db: Session = Depends(get_db)):
    return crud.get_courses(db)
```

**Роутеры:**
- `auth.py` — регистрация, вход
- `tracks.py` — треки обучения
- `courses.py` — курсы
- `modules.py` — модули курсов
- `lessons.py` — уроки
- `graph.py` — граф знаний
- `submissions.py` — задания
- `notifications.py` — уведомления
- `users.py` — информация о пользователе

---

## 🔄 Поток обработки запроса

### Пример: GET /api/v1/courses

```
1. Клиент отправляет запрос
   GET http://localhost:8000/api/v1/courses
   Headers: Authorization: Bearer <token>

2. FastAPI получает запрос
   main.py → CORS middleware → Router

3. Роутер обрабатывает
   routers/courses.py → get_courses()

4. Dependency Injection
   get_db() → создает сессию БД
   get_current_user() → проверяет токен, получает пользователя

5. CRUD операция
   crud.get_courses(db, user_id=current_user.id)

6. SQLAlchemy запрос
   db.query(Course).filter(...).all()

7. PostgreSQL выполняет SQL
   SELECT * FROM courses WHERE ...

8. Результат возвращается
   SQLAlchemy → Pydantic schema → JSON → Клиент
```

---

## 🗄️ Работа с базой данных

### Создание таблиц

**Автоматически при старте:**
```python
# main.py
Base.metadata.create_all(bind=engine)
```

**Создает все таблицы из моделей:**
- users
- tracks
- courses
- modules
- lessons
- graph_nodes
- graph_edges
- submissions
- notifications
- и связанные таблицы

### Типы запросов

**SELECT (чтение):**
```python
# Все записи
db.query(Course).all()

# С фильтром
db.query(Course).filter(Course.track_id == "event").all()

# Одна запись
db.query(Course).filter(Course.id == "course-1").first()

# С eager loading (загружает связи)
db.query(Course).options(joinedload(Course.authors)).all()
```

**INSERT (создание):**
```python
course = Course(id="new-course", title="New Course")
db.add(course)
db.commit()
db.refresh(course)  # Обновляет объект из БД
```

**UPDATE (обновление):**
```python
course = db.query(Course).filter(Course.id == "course-1").first()
course.progress = 50.0
db.commit()
```

**DELETE (удаление):**
```python
course = db.query(Course).filter(Course.id == "course-1").first()
db.delete(course)
db.commit()
```

### Транзакции

```python
try:
    # Операции с БД
    db.add(new_course)
    db.commit()
except Exception:
    db.rollback()  # Откат при ошибке
    raise
```

---

## 🔐 Аутентификация и авторизация

### Регистрация пользователя

```
1. POST /api/v1/auth/register
   Body: {username, email, password, full_name}

2. Роутер проверяет существование пользователя
   auth.get_user_by_username()
   auth.get_user_by_email()

3. Создается новый пользователь
   crud.create_user()
   - Генерируется UUID
   - Пароль хешируется (bcrypt)
   - Сохраняется в БД

4. Возвращается User объект
```

### Вход пользователя

```
1. POST /api/v1/auth/login
   Body: {username, password} (form-data)

2. Проверка учетных данных
   auth.authenticate_user()
   - Ищет пользователя по username
   - Проверяет пароль (bcrypt.verify)

3. Создание JWT токена
   auth.create_access_token()
   - Включает username в payload
   - Устанавливает время жизни (30 минут)
   - Подписывает SECRET_KEY

4. Возвращается токен
   {access_token: "...", token_type: "bearer"}
```

### Защищенные роуты

```python
@router.get("/courses")
def get_courses(
    current_user: User = Depends(get_current_active_user)
):
    # Только для авторизованных пользователей
    # current_user автоматически извлекается из токена
    return crud.get_courses(db, user_id=current_user.id)
```

**Как работает:**
1. Клиент отправляет `Authorization: Bearer <token>`
2. `get_current_user()` извлекает токен
3. Декодирует JWT и получает username
4. Ищет пользователя в БД
5. Возвращает объект User
6. Если токен невалидный → 401 Unauthorized

---

## 📊 Примеры работы

### Получение курсов с прогрессом

```python
# Запрос
GET /api/v1/courses?track_id=event
Headers: Authorization: Bearer <token>

# Обработка
1. courses.router.get_courses()
2. Извлекает current_user из токена
3. crud.get_courses(db, track_id="event", user_id=current_user.id)
4. SQL запрос:
   SELECT * FROM courses WHERE track_id = 'event'
5. Для каждого курса:
   SELECT * FROM user_courses 
   WHERE user_id = ? AND course_id = ?
6. Объединяет данные
7. Возвращает JSON с прогрессом
```

### Обновление прогресса

```python
# Запрос
POST /api/v1/courses/course-1/progress
Body: {progress: 50.0, status: "in_progress"}

# Обработка
1. courses.router.update_course_progress()
2. crud.update_course_progress()
3. Ищет или создает UserCourse запись
4. Обновляет progress и status
5. Если status="completed" → устанавливает completed_at
6. db.commit()
```

### Получение графа знаний

```python
# Запрос
GET /api/v1/graph/nodes
Headers: Authorization: Bearer <token>

# Обработка
1. graph.router.get_graph_nodes()
2. crud.get_graph_nodes(db, user_id=current_user.id)
3. SQL: SELECT * FROM graph_nodes
4. Возвращает все узлы графа
```

---

## 🔧 Особенности реализации

### 1. Dependency Injection

FastAPI использует dependency injection для:
- Сессий БД (`get_db`)
- Текущего пользователя (`get_current_user`)
- Валидации данных (Pydantic schemas)

**Преимущества:**
- Автоматическое управление ресурсами
- Легкое тестирование
- Переиспользование кода

### 2. Автоматическая документация

FastAPI автоматически генерирует:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

На основе:
- Типов параметров
- Pydantic schemas
- Docstrings функций

### 3. Валидация данных

**Входящие данные:**
- Автоматически валидируются Pydantic
- Неверные данные → 422 Validation Error

**Исходящие данные:**
- Автоматически сериализуются в JSON
- Используют `response_model` для форматирования

### 4. Обработка ошибок

```python
# HTTPException для пользовательских ошибок
raise HTTPException(status_code=404, detail="Course not found")

# Автоматическая обработка:
# - 422 - Validation Error
# - 401 - Unauthorized (неверный токен)
# - 500 - Internal Server Error
```

### 5. CORS

```python
# Разрешает запросы с фронтенда
CORS Middleware:
- allow_origins: ["http://localhost:3000"]
- allow_credentials: True
- allow_methods: ["*"]
```

---

## 🚀 Производительность

### Оптимизации

1. **Eager Loading:**
   ```python
   # Загружает связи одним запросом
   query.options(joinedload(Course.authors))
   ```

2. **Connection Pooling:**
   ```python
   # SQLAlchemy автоматически управляет пулом
   engine = create_engine(DATABASE_URL, pool_size=10)
   ```

3. **Индексы:**
   ```python
   # Автоматически создаются для primary_key и ForeignKey
   id = Column(String, primary_key=True, index=True)
   ```

---

## 📝 Инициализация данных

### `init_db.py` — Скрипт инициализации

**Назначение:** Заполнение БД начальными данными

**Что делает:**
1. Создает треки (4 направления)
2. Создает курсы с авторами
3. Создает узлы и связи графа
4. Создает демо-пользователя

**Запуск:**
```bash
python init_db.py
```

**Безопасность:**
- Проверяет существование данных
- Не перезаписывает при повторном запуске
- Использует транзакции (rollback при ошибке)

---

## 🔍 Отладка

### Логирование

FastAPI автоматически логирует:
- Входящие запросы
- Ошибки
- Время выполнения

### Проверка работы

```bash
# Health check
curl http://localhost:8000/health

# Проверка API
curl http://localhost:8000/api/v1/tracks/

# С токеном
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/courses/
```

---

## 📚 Дополнительные ресурсы

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **SQLAlchemy Docs:** https://docs.sqlalchemy.org
- **Pydantic Docs:** https://docs.pydantic.dev
- **JWT:** https://jwt.io

---

**Архитектура обеспечивает:**
- ✅ Масштабируемость
- ✅ Безопасность
- ✅ Производительность
- ✅ Поддерживаемость
- ✅ Тестируемость
