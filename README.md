# 🎓 GRAPH — Образовательная платформа

Современная образовательная платформа с интерактивной визуализацией знаний в виде графа.

![Tech Stack](https://img.shields.io/badge/React-18-blue)
![Tech Stack](https://img.shields.io/badge/FastAPI-0.109-green)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-15-blue)
![Tech Stack](https://img.shields.io/badge/Docker-Compose-blue)

---

## ⚡ Быстрый старт (Docker)

### Предварительные требования
- **Docker Desktop** (Windows/Mac) или **Docker Engine + Docker Compose** (Linux)
- **Git**

### Запуск полного стека за 3 команды

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd graph-hype

# 2. Запустить все сервисы (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 3. Добавить данные для тестирования (необязательно)
docker-compose exec backend python init_db.py
```

**Готово!** Откройте http://localhost:3000

### Демо-доступ
```
Username: demo
Password: demo123
```

---

## 🏗️ Архитектура проекта

### Полный стек

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Frontend      │      │    Backend       │      │   PostgreSQL     │
│   React + TS    │◄────►│   FastAPI        │◄────►│   База данных    │
│   Port: 3000    │      │   Port: 8000     │      │   Port: 5432     │
└─────────────────┘      └──────────────────┘      └──────────────────┘
```

### Технологии

**Frontend:**
- React 18 + TypeScript
- Vite — быстрая сборка
- Tailwind CSS — стилизация
- Radix UI — компоненты
- SVG — интерактивный граф знаний

**Backend:**
- FastAPI — современный Python фреймворк
- SQLAlchemy — ORM для работы с БД
- PostgreSQL — надежная СУБД
- JWT — безопасная аутентификация
- Pydantic — валидация данных
- Uvicorn — ASGI сервер

**DevOps:**
- Docker + Docker Compose
- PostgreSQL 15 Alpine

---

## 🚀 Запуск приложения

### Вариант 1: Docker (Рекомендуется)

**Преимущества:**
- ✅ Автоматическая настройка всех сервисов
- ✅ Изолированное окружение
- ✅ Одинаковая работа на всех ОС
- ✅ Простое управление

#### Шаг 1: Запуск всех сервисов

```bash
docker-compose up -d
```

Эта команда запустит:
- **PostgreSQL** — база данных (порт 5432)
- **Backend API** — FastAPI сервер (порт 8000)
- **Frontend** — React приложение (порт 3000)

#### Шаг 2: Заполнение базы данных для тестирования (НЕОБЯЗАТЕЛЬНО)

```bash
docker-compose exec backend python init_db.py
```

Создаст:
- 4 трека обучения
- Курсы по каждому треку
- Граф знаний с узлами и связями
- Демо-пользователя (demo/demo123)

#### Шаг 3: Проверка работы

```bash
# Проверить статус всех контейнеров
docker-compose ps

# Проверить логи backend
docker-compose logs backend

# Проверить логи frontend
docker-compose logs frontend

# Проверить логи PostgreSQL
docker-compose logs postgres
```

#### Шаг 4: Открыть приложение

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Документация:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

---

### Вариант 2: Локальная разработка (без Docker)

Для разработки и отладки можно запустить сервисы локально.

#### Backend

```bash
# 1. Установить PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# 2. Создать базу данных
psql -U postgres
CREATE DATABASE graph_db;
CREATE USER graph_user WITH PASSWORD 'graph_password';
GRANT ALL PRIVILEGES ON DATABASE graph_db TO graph_user;
\q

# 3. Перейти в директорию backend
cd backend

# 4. Создать виртуальное окружение
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 5. Установить зависимости
pip install -r requirements.txt

# 6. Создать файл .env (опционально)
# DATABASE_URL=postgresql://graph_user:graph_password@localhost:5432/graph_db

# 7. Заполнение базы данных для тестирования (НЕОБЯЗАТЕЛЬНО)
python init_db.py

# 8. Запустить сервер
uvicorn main:app --reload --port 8000
```

Backend будет доступен на: http://localhost:8000

#### Frontend

```bash
# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер
npm run dev

Frontend будет доступен на: http://localhost:3000

---

## 📁 Структура проекта

```
graph-hype/
├── backend/                    # Python Backend
│   ├── routers/               # API endpoints
│   │   ├── auth.py           # Аутентификация
│   │   ├── courses.py        # Курсы
│   │   ├── lessons.py        # Уроки
│   │   ├── graph.py          # Граф знаний
│   │   └── ...
│   ├── models.py             # SQLAlchemy модели
│   ├── schemas.py            # Pydantic схемы
│   ├── crud.py               # Операции с БД
│   ├── auth.py               # JWT токены
│   ├── database.py           # Подключение к БД
│   ├── main.py               # Точка входа FastAPI
│   ├── init_db.py            # Заполнение базы данных для тестирования (НЕОБЯЗАТЕЛЬНО)
│   ├── requirements.txt      # Python зависимости
│   └── Dockerfile            # Backend Dockerfile
│
├── src/                       # React Frontend
│   ├── api/                  # API клиент
│   │   └── client.ts        # HTTP клиент для API
│   ├── components/           # React компоненты
│   │   ├── Header.tsx       # Навигация
│   │   ├── CourseCatalog.tsx # Каталог курсов
│   │   ├── KnowledgeGraph.tsx # Граф знаний
│   │   └── ...
│   ├── context/              # React контексты
│   │   └── AuthContext.tsx  # Контекст авторизации
│   ├── types/                # TypeScript типы
│   └── main.tsx              # Точка входа
│
├── docker-compose.yml         # Оркестрация сервисов
├── Dockerfile.frontend        # Frontend Dockerfile
└── README.md                 # Этот файл
```

---

## 🐳 Docker команды

### Основные команды

```bash
# Запустить все сервисы в фоне
docker-compose up -d

# Остановить все сервисы
docker-compose down

# Перезапустить все сервисы
docker-compose restart

# Просмотреть статус
docker-compose ps

# Просмотреть логи всех сервисов
docker-compose logs -f

# Просмотреть логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Пересборка после изменений

```bash
# Пересобрать и перезапустить все сервисы
docker-compose up -d --build

# Пересобрать только backend
docker-compose up -d --build backend

# Пересобрать только frontend
docker-compose up -d --build frontend
```

### Работа с базой данных

```bash
# Заполнение базы данных для тестирования (НЕОБЯЗАТЕЛЬНО)
docker-compose exec backend python init_db.py

# Подключиться к PostgreSQL
docker-compose exec postgres psql -U graph_user -d graph_db

# Выполнить команду в backend контейнере
docker-compose exec backend python -c "print('Hello')"

# Войти в контейнер backend
docker-compose exec backend bash
```

### Очистка

```bash
# Остановить и удалить контейнеры
docker-compose down

# Остановить, удалить контейнеры и volumes (БД будет удалена!)
docker-compose down -v

# Очистить все неиспользуемые Docker ресурсы
docker system prune -a
```

---

## 🔧 Как работает Backend

### Архитектура

Backend построен на **FastAPI** и использует многослойную архитектуру:

```
HTTP Request
    ↓
FastAPI Router (routers/*.py)
    ↓
CRUD Operations (crud.py)
    ↓
SQLAlchemy Models (models.py)
    ↓
PostgreSQL Database
```

### Основные компоненты

**1. `main.py`** — Точка входа
- Создает FastAPI приложение
- Настраивает CORS для работы с фронтендом
- Подключает все роутеры
- Автоматически создает таблицы БД

**2. `models.py`** — Модели данных (SQLAlchemy)
- Определяет структуру таблиц PostgreSQL
- Связи между таблицами (relationships)
- Enums для ограничения значений

**3. `schemas.py`** — Схемы валидации (Pydantic)
- Валидация входящих данных
- Сериализация исходящих данных
- Автоматическая документация API

**4. `crud.py`** — Операции с БД
- Бизнес-логика работы с данными
- SQL запросы через SQLAlchemy
- Объединение данных из нескольких таблиц

**5. `auth.py`** — Аутентификация
- Хеширование паролей (Bcrypt)
- Создание и проверка JWT токенов
- Dependency для защиты роутов

**6. `routers/`** — API Endpoints
- Определение HTTP endpoints
- Обработка запросов
- Возврат JSON ответов

### Поток обработки запроса

**Пример: Получение курсов**

```
1. Клиент → GET /api/v1/courses
   Headers: Authorization: Bearer <token>

2. FastAPI → Router (courses.py)
   → Dependency: get_current_user() проверяет токен
   → Dependency: get_db() создает сессию БД

3. CRUD → crud.get_courses(db, user_id)
   → SQLAlchemy запрос к PostgreSQL
   → Объединение данных из courses + user_courses

4. Pydantic → Валидация и сериализация
   → JSON ответ клиенту
```

### Аутентификация

**Регистрация:**
1. Пользователь отправляет username, email, password
2. Backend проверяет уникальность
3. Хеширует пароль (Bcrypt)
4. Сохраняет в БД

**Вход:**
1. Пользователь отправляет username, password
2. Backend проверяет учетные данные
3. Создает JWT токен (срок жизни 30 минут)
4. Возвращает токен клиенту

**Защищенные роуты:**
- Требуют токен в заголовке `Authorization: Bearer <token>`
- Автоматически извлекают пользователя из токена
- Возвращают 401 если токен невалидный

### Работа с базой данных

**Типы операций:**
- **SELECT** — чтение данных (GET запросы)
- **INSERT** — создание записей (POST запросы)
- **UPDATE** — обновление записей (PUT/PATCH запросы)
- **DELETE** — удаление записей (DELETE запросы)

**Связи между таблицами:**
- One-to-Many: Course → Modules (один курс, много модулей)
- Many-to-One: Module → Course (много модулей, один курс)
- Relationships автоматически загружаются через SQLAlchemy

**Подробная документация:** См. `backend/ARCHITECTURE.md`

---

## 📡 API Endpoints

### Аутентификация
```
POST   /api/v1/auth/register      Регистрация нового пользователя
POST   /api/v1/auth/login         Вход (получение JWT токена)
```

### Пользователи
```
GET    /api/v1/users/me           Информация о текущем пользователе
```

### Треки и курсы
```
GET    /api/v1/tracks/            Получить все треки
GET    /api/v1/tracks/{id}        Получить трек по ID
GET    /api/v1/courses/           Получить все курсы (с прогрессом)
GET    /api/v1/courses/{id}       Получить курс по ID
POST   /api/v1/courses/{id}/progress   Обновить прогресс по курсу
```

### Модули и уроки
```
GET    /api/v1/modules/course/{id}     Модули курса
GET    /api/v1/modules/{id}            Модуль по ID
GET    /api/v1/lessons/module/{id}     Уроки модуля
GET    /api/v1/lessons/{id}            Урок по ID
POST   /api/v1/lessons/{id}/progress   Обновить прогресс по уроку
```

### Граф знаний
```
GET    /api/v1/graph/nodes        Узлы графа
GET    /api/v1/graph/edges        Связи графа
```

### Задания и уведомления
```
POST   /api/v1/submissions/       Отправить задание
GET    /api/v1/submissions/       Мои задания
GET    /api/v1/notifications/     Уведомления пользователя
POST   /api/v1/notifications/{id}/read   Отметить как прочитанное
```

**Полная интерактивная документация:** http://localhost:8000/docs

---

## 🔧 Переменные окружения

### Backend (.env)

Создайте файл `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://graph_user:graph_password@postgres:5432/graph_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_STR=/api/v1
PROJECT_NAME=GRAPH Educational Platform

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

**Примечание:** В Docker эти переменные уже настроены в `docker-compose.yml`

### Frontend

API base URL derives from the frontend URL: <url>/api/v1.

---

## 🎯 Возможности платформы

### Для студентов
- 📚 **4 направления обучения** — Ивент, Digital, Коммуникации, Дизайн
- 🗺️ **Интерактивная карта знаний** — визуализация связей между курсами
- 📊 **Отслеживание прогресса** — личная статистика обучения
- ✍️ **Система заданий** — отправка работ и получение фидбека
- 📖 **Хендбук** — справочные материалы по каждому курсу
- 🔔 **Уведомления** — автоматические напоминания

### Для администраторов
- 👥 **Управление пользователями** — регистрация и аутентификация
- 📈 **Аналитика прогресса** — отслеживание успеваемости
- 🎨 **Настройка графа** — гибкая структура курсов

---

## 🎨 Особенности дизайна

- **Минимализм** — черно-белая палитра с цветовыми акцентами
- **Моноширинный шрифт** — технический стиль
- **Геометрия** — четкие границы и углы
- **Адаптивность** — работает на всех устройствах
- **Интерактивность** — плавные анимации и переходы

### Цвета треков
- 🎭 **Ивент** — `#E2B6C8` (розовый)
- 💻 **Digital** — `#B6E2C8` (зеленый)
- 📢 **Коммуникации** — `#B6C8E2` (синий)
- 🎨 **Дизайн** — `#C8B6E2` (фиолетовый)

---

## 🔒 Безопасность

- **JWT токены** — безопасная аутентификация
- **Bcrypt** — хеширование паролей
- **CORS** — контроль доступа
- **SQL Injection** — защита через ORM
- **XSS** — экранирование данных

---

## 🛠️ Troubleshooting

### Проблема: Порт уже занят

```bash
# Windows - найти процесс
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Остановить процесс
taskkill /PID <номер_процесса> /F

# Mac/Linux - найти процесс
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Остановить процесс
kill -9 <номер_процесса>
```

### Проблема: Docker контейнеры не запускаются

```bash
# Проверить статус
docker-compose ps

# Просмотреть логи ошибок
docker-compose logs

# Пересоздать контейнеры
docker-compose down
docker-compose up -d --build

# Очистить все и пересоздать
docker-compose down -v
docker-compose up -d --build
```

### Проблема: PostgreSQL не подключается

```bash
# Проверить что PostgreSQL контейнер запущен
docker-compose ps postgres

# Проверить логи PostgreSQL
docker-compose logs postgres

# Перезапустить PostgreSQL
docker-compose restart postgres

# Проверить подключение
docker-compose exec postgres psql -U graph_user -d graph_db -c "SELECT 1;"
```

### Проблема: Backend не отвечает

```bash
# Проверить логи backend
docker-compose logs backend

# Проверить что backend запущен
docker-compose ps backend

# Перезапустить backend
docker-compose restart backend

# Проверить health endpoint
curl http://localhost:8000/health
```

### Проблема: Frontend не загружается

```bash
# Проверить логи frontend
docker-compose logs frontend

# Проверить что frontend запущен
docker-compose ps frontend

# Перезапустить frontend
docker-compose restart frontend

# Проверить доступность
curl http://localhost:3000
```

### Проблема: Ошибки при инициализации БД

```bash
# Очистить БД и переинициализировать
docker-compose exec postgres psql -U graph_user -d graph_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose exec backend python init_db.py # необязательно
```

---

## 📊 Статистика проекта

- **20+ курсов** по 4 направлениям
- **60+ модулей** обучающего контента
- **Интерактивный граф** с 20+ узлами
- **REST API** с 15+ эндпоинтами
- **PostgreSQL схема** с 15+ таблицами

---

## 🚀 Деплой в продакшн

### Подготовка

1. **Обновите переменные окружения:**
   - Измените `SECRET_KEY` на случайную строку
   - Обновите `DATABASE_URL` на продакшн БД
   - Настройте `BACKEND_CORS_ORIGINS` на домен фронтенда

2. **Создайте production docker-compose:**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    # ... production config
  backend:
    # ... production config
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend.prod
    # ... production config
```

3. **Запуск:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Лицензия

MIT License - используйте свободно для любых целей.

---

## 📧 Контакты

По вопросам и предложениям создавайте **Issues** в репозитории.

---

**Сделано с ❤️ для образования**




























## Migrating database

Run alembic from the docker container like this:

```bash
# create a new revision and edit it manually afterwards
docker compose backend alembic revision -m "message"

# generate a new revision automatically (still check it afterwards just in case ;) )
docker compose backend alembic revision --autogenerate -m "message"

# update to latest revision
docker compose backend alembic upgrade head

# mark environment as up-to-date
docker compose exec backend alembic stamp head
```