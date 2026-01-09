# GRAPH Educational Platform

**GRAPH** — это современная образовательная платформа, которая визуализирует процесс обучения в виде интерактивного графа знаний. Проект объединяет продвинутый UX для студентов и мощную админ-панель для авторов курсов.

---

## 🚀 Основные Возможности

### 🎓 Для студентов
- **Интерактивный граф знаний**: Визуализация связей между темами, модулями и уроками (React Flow).
- **Трековая система обучения**: Четкие направления развития (Event, Digital, Communication, Design).
- **Многоформатные уроки**: Видео, лонгриды, интерактивные задания.
- **Личный кабинет**: Отслеживание прогресса, статистика, уведомления.
- **Handbook**: Встроенная база знаний и цифровые конспекты.

### 🛡️ Безопасность и Технологии
- **JWT Аутентификация**: Access (15 мин) + Refresh (7 дней) токены.
- **Role-Based Access Control (RBAC)**: Разграничение прав (Студент, Преподаватель, Админ).
- **Rate Limiting**: Защита API от перегрузок и Brute-force атак.
- **Audit Logging**: Логирование всех ключевых действий пользователей.

---

## 🛠️ Технический Стек

### Backend (Python/FastAPI)
- **Framework**: FastAPI (Async)
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy (Optimized queries)
- **Validation**: Pydantic v2
- **Auth**: Passlib (Bcrypt), PyJWT
- **Docs**: Swagger UI (`/docs`) & ReDoc (`/redoc`)

### Frontend (React/TypeScript)
- **Build Tool**: Vite
- **UI Framework**: React 18
- **Styling**: Tailwind CSS + Radix UI
- **Visualization**: React Flow (Графы), Recharts (Аналитика)
- **State**: React Context API + Custom Hooks

### Infrastructure
- **Docker Compose**: Оркестрация полного стека (DB + Backend + Frontend).
- **CI/CD Friendly**: Раздельные Dockerfile для фронта и бэка.

---

## 📂 Структура Проекта

```
graph-platform/
├── backend/                 # API сервер (FastAPI)
│   ├── routers/             # Роутеры API (users, courses, graph, и т.д.)
│   ├── models.py            # SQLAlchemy модели базы данных
│   ├── schemas.py           # Pydantic схемы для валидации данных
│   ├── main.py              # Точка входа приложения
│   └── database.py          # Настройки подключения к БД
├── src/                     # Frontend приложение (React)
│   ├── components/          # UI компоненты (Atom/Molecule/Organism)
│   ├── pages/               # Страницы приложения
│   ├── api/                 # Типизированные клиенты API
│   ├── context/             # Глобальное состояние (AuthContext)
│   └── App.tsx              # Корневая логика и роутинг
├── docker-compose.yml       # Конфигурация Docker окружения
└── README.md                # Эта документация
```

---

## ⚡ Быстрый Старт

### Предварительные требования
- Docker Desktop & Docker Compose
- Git
- Node.js 18+ (только для локальной разработки без Docker)
- Python 3.10+ (только для локальной разработки без Docker)

### Запуск в Docker (Рекомендуется)

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd hype
   ```

2. **Запустите проект:**
   ```bash
   docker-compose up -d --build
   ```
   *Первая сборка может занять 2-5 минут.*

3. **Откройте приложение:**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **Документация API**: [http://localhost:8000/docs](http://localhost:8000/docs)

4. **Тестовые аккаунты:**
   - **Администратор**:
     *   Email/Login: `admin`
     *   Password: `admin123`
   - **Демо студент**:
     *   Email/Login: `demo`
     *   Password: `demo123`

---

## 🔧 Локальная Разработка (без Docker)

Если вы хотите запускать сервисы отдельно:

### Backend
1. Перейдите в папку: `cd backend`
2. Создайте и активируйте venv:
   ```bash
   python -m venv .venv
   .venv\Scripts\Activate  # Windows
   # source .venv/bin/activate  # Linux/Mac
   ```
3. Установите зависимости: `pip install -r requirements.txt`
4. Запустите БД (Postgres) локально и укажите URL в `.env` или `config.py`.
5. Запустите сервер: `uvicorn main:app --reload`

### Frontend
1. Перейдите в корень проекта (где `package.json`).
2. Установите зависимости: `npm install`
3. Запустите сервер разработки: `npm run dev`
   *Убедитесь, что Backend запущен на порту 8000.*

---

## 🚑 Troubleshooting

| Проблема | Решение |
|----------|---------|
| **Connection Refused (DB)** | Проверьте статус контейнера `graph_db`. Попробуйте `docker-compose down -v` (удалит данные!) и снова `up`. |
| **CORS Errors** | Проверьте `BACKEND_CORS_ORIGINS` в `backend/config.py`. |
| **Styles not loading** | Убедитесь, что `tailwind.config.js` настроен верно и `index.css` подключен. |
| **Backend 401 Unauthorized** | Проверьте время жизни токена в `backend/config.py`. Перелогиньтесь. |

---

## 📝 Статус Синхронизации
- **Схема БД**: Актуализирована (`main.py` применяет миграции при старте).
- **API Типы**: TypeScript интерфейсы в `src/types` соответствуют Pydantic схемах в `backend/schemas.py`.
- **Роутинг**: Настроен через API Gateway (Nginx не используется, прямой доступ к FastAPI через порт 8000).

---
© 2026 GRAPH Education. MIT License.
