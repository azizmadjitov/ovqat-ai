# Ovqat AI Backend API

Backend сервер для аутентификации и управления пользователями.

## Установка

```bash
cd server
npm install
```

## Конфигурация

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Заполните переменные окружения:
```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Сервер запустится на `http://localhost:3001`

## API Endpoints

### POST /api/auth/phone
Аутентификация по номеру телефона

**Request:**
```json
{
  "phoneNumber": "998997961877"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "27a2b872-93b4-44ba-8835-75163463e903"
}
```

### POST /api/auth/verify
Верификация JWT токена

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "valid": true,
  "userId": "27a2b872-93b4-44ba-8835-75163463e903"
}
```

### GET /api/health
Health check

**Response:**
```json
{
  "status": "ok"
}
```

## Использование с фронтенд приложением

1. Запустите backend: `npm run dev`
2. Запустите фронтенд: `npm run dev` (в корневой папке)
3. Откройте: `http://localhost:3000/?token=YOUR_TOKEN`

Фронтенд автоматически прочитает токен из URL и авторизует пользователя.
