# Инструкция по запуску проекта

> **Для Windows пользователей:** См. подробную инструкцию с командами PowerShell в [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)

## Быстрый старт

### 1. Установка зависимостей

#### Бэкенд
```bash
cd server
npm install
```

#### Фронтенд
```bash
npm install
```

### 2. Настройка переменных окружения

#### Бэкенд (server/.env)
```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
DB_PATH=./database.sqlite
NODE_ENV=development
```

#### Фронтенд (.env в корне)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 3. Запуск

#### Терминал 1 - Бэкенд
```bash
cd server
npm run dev
```

#### Терминал 2 - Фронтенд
```bash
npm start
```

### 4. Доступ к приложению

- Фронтенд: http://localhost:3000
- Бэкенд API: http://localhost:3001/api

### 5. Тестовые аккаунты

После первого запуска бэкенда автоматически создаются:

- **Администратор**: 
  - Email: `admin@example.com`
  - Пароль: `admin123`
  
- **Студент**: 
  - Email: `student@example.com`
  - Пароль: `student123`

## Структура админ-панели

После входа как администратор, доступны разделы:

1. **Дашборд** (`/admin`) - статистика платформы
2. **Треки** (`/admin/tracks`) - управление треками
3. **Курсы** (`/admin/courses`) - управление курсами
4. **Модули** (`/admin/courses/:id/modules`) - управление модулями курса
5. **Уроки** (`/admin/modules/:id/lessons`) - управление уроками модуля
6. **Задания** (`/admin/assignments`) - управление заданиями
7. **Проверка заданий** (`/admin/submissions`) - проверка решений студентов
8. **Граф знаний** (`/admin/graph`) - управление графом

## API Документация

Все API endpoints требуют авторизации через JWT токен (кроме `/api/auth/register` и `/api/auth/login`).

Токен передается в заголовке:
```
Authorization: Bearer <token>
```

Полный список endpoints см. в `server/README.md`
