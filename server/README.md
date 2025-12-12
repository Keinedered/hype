# EdTech Backend

Backend сервер для платформы обучения.

## Установка

```bash
npm install
```

## Настройка

Скопируйте `.env.example` в `.env` и настройте переменные окружения:

```bash
cp .env.example .env
```

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь

### Треки
- `GET /api/tracks` - Список треков
- `GET /api/tracks/:id` - Трек по ID
- `POST /api/tracks` - Создать трек (admin)
- `PUT /api/tracks/:id` - Обновить трек (admin)
- `DELETE /api/tracks/:id` - Удалить трек (admin)

### Курсы
- `GET /api/courses` - Список курсов
- `GET /api/courses/:id` - Курс по ID
- `POST /api/courses` - Создать курс (admin)
- `PUT /api/courses/:id` - Обновить курс (admin)
- `DELETE /api/courses/:id` - Удалить курс (admin)

### Модули
- `GET /api/modules/course/:courseId` - Модули курса
- `GET /api/modules/:id` - Модуль по ID
- `POST /api/modules` - Создать модуль (admin)
- `PUT /api/modules/:id` - Обновить модуль (admin)
- `DELETE /api/modules/:id` - Удалить модуль (admin)

### Уроки
- `GET /api/lessons/course/:courseId` - Уроки курса
- `GET /api/lessons/:id` - Урок по ID
- `POST /api/lessons` - Создать урок (admin)
- `PUT /api/lessons/:id` - Обновить урок (admin)
- `DELETE /api/lessons/:id` - Удалить урок (admin)

### Задания
- `GET /api/assignments/lesson/:lessonId` - Задание урока
- `POST /api/assignments` - Создать задание (admin)
- `PUT /api/assignments/:id` - Обновить задание (admin)

### Отправки решений
- `GET /api/submissions/my` - Мои отправки
- `GET /api/submissions/assignment/:assignmentId` - Отправки по заданию (curator/admin)
- `POST /api/submissions` - Отправить решение
- `PUT /api/submissions/:id/review` - Проверить задание (curator/admin)

### Граф знаний
- `GET /api/graph/course/:courseId` - Граф курса
- `POST /api/graph/progress` - Обновить прогресс
- `POST /api/graph/nodes` - Создать вершину (admin)
- `POST /api/graph/edges` - Создать связь (admin)

### Админка
- `GET /api/admin/submissions/pending` - Задания на проверке
- `GET /api/admin/dashboard/stats` - Статистика дашборда
