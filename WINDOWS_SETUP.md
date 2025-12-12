# Подробная инструкция по запуску на Windows через PowerShell

## Требования

- Windows 10/11
- Node.js версии 16 или выше
- npm (устанавливается вместе с Node.js)
- PowerShell (встроен в Windows)

## Шаг 1: Проверка установки Node.js

Откройте PowerShell (нажмите `Win + X` и выберите "Windows PowerShell" или "Терминал")

Проверьте версию Node.js:
```powershell
node --version
```

Проверьте версию npm:
```powershell
npm --version
```

Если команды не работают, установите Node.js с официального сайта: https://nodejs.org/

## Шаг 2: Открытие проекта

Перейдите в папку проекта. Если проект находится в `C:\Users\лёха\.cursor\worktrees\jjssfgdfhj\lrh`, выполните:

```powershell
cd "C:\Users\лёха\.cursor\worktrees\jjssfgdfhj\lrh"
```

Или если вы уже находитесь в папке проекта, проверьте текущую директорию:
```powershell
pwd
```

## Шаг 3: Установка зависимостей для фронтенда

В корневой папке проекта выполните:

```powershell
npm install
```

Эта команда установит все зависимости для React приложения. Дождитесь завершения установки (может занять несколько минут).

## Шаг 4: Установка зависимостей для бэкенда

Перейдите в папку server:

```powershell
cd server
```

Установите зависимости для бэкенда:

```powershell
npm install
```

Дождитесь завершения установки.

## Шаг 5: Настройка переменных окружения

### 5.1. Настройка бэкенда

В папке `server` создайте файл `.env`. В PowerShell выполните:

```powershell
cd ..
cd server
New-Item -Path ".env" -ItemType File -Force
```

Откройте файл `.env` в любом текстовом редакторе (Notepad, VS Code) и добавьте следующее содержимое:

```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DB_PATH=./database.sqlite
NODE_ENV=development
```

**Важно:** Измените `JWT_SECRET` на свой уникальный секретный ключ для безопасности.

### 5.2. Настройка фронтенда

Вернитесь в корневую папку проекта:

```powershell
cd ..
```

Создайте файл `.env` в корне проекта:

```powershell
New-Item -Path ".env" -ItemType File -Force
```

Откройте файл `.env` и добавьте:

```
REACT_APP_API_URL=http://localhost:3001/api
```

## Шаг 6: Запуск проекта

Проект состоит из двух частей: бэкенд (сервер) и фронтенд (React приложение). Их нужно запускать в **отдельных окнах PowerShell**.

### 6.1. Запуск бэкенда (Окно PowerShell #1)

Откройте **первое окно PowerShell** и выполните:

```powershell
cd "C:\Users\лёха\.cursor\worktrees\jjssfgdfhj\lrh\server"
npm run dev
```

Вы должны увидеть сообщения:
```
Connected to SQLite database
Database tables initialized
Admin user created: admin@example.com / admin123
Student user created: student@example.com / student123
Database seeded successfully
Server is running on port 3001
```

**Оставьте это окно открытым!** Сервер должен работать постоянно.

### 6.2. Запуск фронтенда (Окно PowerShell #2)

Откройте **второе окно PowerShell** (новое окно, не закрывая первое!) и выполните:

```powershell
cd "C:\Users\лёха\.cursor\worktrees\jjssfgdfhj\lrh"
npm start
```

Вы должны увидеть сообщение:
```
Compiled successfully!

You can now view edtech-project in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Браузер должен автоматически открыться с адресом `http://localhost:3000`. Если не открылся, откройте браузер вручную и перейдите по адресу `http://localhost:3000`.

## Шаг 7: Проверка работы

### Проверка бэкенда

В браузере или PowerShell (используя `Invoke-WebRequest`) проверьте:

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing
```

Должен вернуться ответ: `{"status":"ok","message":"Server is running"}`

### Проверка фронтенда

Откройте браузер и перейдите на `http://localhost:3000`. Вы должны увидеть главную страницу платформы.

## Шаг 8: Тестовые аккаунты

После первого запуска бэкенда автоматически создаются тестовые пользователи:

### Администратор:
- **Email:** `admin@example.com`
- **Пароль:** `admin123`

### Студент:
- **Email:** `student@example.com`
- **Пароль:** `student123`

## Решение проблем

### Проблема: "npm не является внутренней или внешней командой"

**Решение:** Node.js не установлен или не добавлен в PATH. Установите Node.js с https://nodejs.org/ и перезапустите PowerShell.

### Проблема: "Порт 3001 уже используется"

**Решение:** Другой процесс использует порт 3001. Найдите и закройте его:

```powershell
netstat -ano | findstr :3001
```

Затем завершите процесс по PID:
```powershell
taskkill /PID <номер_процесса> /F
```

Или измените порт в `server/.env`:
```
PORT=3002
```

И обновите `REACT_APP_API_URL` в корневом `.env`:
```
REACT_APP_API_URL=http://localhost:3002/api
```

### Проблема: "Порт 3000 уже используется"

**Решение:** Другой React приложение использует порт 3000. Закройте его или используйте другой порт:

```powershell
$env:PORT=3002; npm start
```

### Проблема: "Error: Cannot find module"

**Решение:** Зависимости не установлены. Выполните:

```powershell
npm install
```

В папке, где возникает ошибка (корень проекта или `server`).

### Проблема: "Database error" или проблемы с SQLite

**Решение:** Убедитесь, что в `server/.env` указан правильный путь:
```
DB_PATH=./database.sqlite
```

База данных создастся автоматически при первом запуске.

### Проблема: "CORS error" в браузере

**Решение:** Убедитесь, что:
1. Бэкенд запущен на порту 3001
2. В корневом `.env` указан правильный URL: `REACT_APP_API_URL=http://localhost:3001/api`
3. Перезапустите фронтенд после изменения `.env`

### Проблема: Страница не загружается или показывает ошибки

**Решение:**
1. Проверьте, что оба сервера запущены (бэкенд и фронтенд)
2. Откройте консоль разработчика в браузере (F12) и проверьте ошибки
3. Проверьте, что файл `.env` в корне проекта содержит правильный URL API

## Остановка серверов

Чтобы остановить серверы:

1. В окне PowerShell с бэкендом нажмите `Ctrl + C`
2. В окне PowerShell с фронтендом нажмите `Ctrl + C`

Подтвердите остановку, если потребуется.

## Полезные команды PowerShell

### Просмотр текущей директории:
```powershell
pwd
```

### Переход в папку:
```powershell
cd "путь\к\папке"
```

### Просмотр содержимого папки:
```powershell
ls
```
или
```powershell
dir
```

### Создание файла:
```powershell
New-Item -Path "имя_файла" -ItemType File
```

### Редактирование файла в PowerShell:
```powershell
notepad .env
```

### Очистка экрана:
```powershell
cls
```

## Структура проекта

```
lrh/
├── src/                    # React фронтенд
│   ├── components/         # React компоненты
│   ├── services/           # API сервисы
│   └── ...
├── server/                 # Express бэкенд
│   ├── src/
│   │   ├── routes/         # API маршруты
│   │   ├── db/             # База данных
│   │   └── ...
│   └── package.json
├── .env                    # Переменные окружения фронтенда
├── package.json            # Зависимости фронтенда
└── README.md
```

## Дополнительная информация

- **Бэкенд API:** http://localhost:3001/api
- **Фронтенд:** http://localhost:3000
- **Health check:** http://localhost:3001/api/health

## Быстрый старт (краткая версия)

Если вы уже настроили проект ранее:

1. **Окно 1 - Бэкенд:**
```powershell
cd server
npm run dev
```

2. **Окно 2 - Фронтенд:**
```powershell
npm start
```

3. Откройте браузер: http://localhost:3000

---

**Готово!** Теперь вы можете использовать платформу для обучения.
