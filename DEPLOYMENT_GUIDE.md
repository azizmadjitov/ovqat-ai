# 🚀 Полное руководство по деплою Ovqat AI

Пошаговое руководство по развертыванию Ovqat AI на production.

---

## 📋 Архитектура Production

```
Partner App (2млн пользователей)
    ↓ Отправляет phoneNumber
    ↓
Ovqat AI Backend (Railway)
    ↓ Генерирует JWT токен
    ↓ Проверяет/создает пользователя
    ↓
Supabase PostgreSQL
    ↓ Хранит данные
    ↓
Ovqat AI Frontend (Vercel)
    ↓ Загружает данные пользователя
    ↓
Пользователь видит приложение
```

---

## 🎯 Этап 1: Подготовка

### 1.1 Проверьте что всё готово

```bash
# Frontend
ls -la src/services/authService.ts
ls -la App.tsx

# Backend
ls -la server/index.js
ls -la server/Dockerfile
ls -la server/package.json

# Документация
ls -la API_README.md
ls -la DEPLOY_RAILWAY.md
```

### 1.2 Убедитесь что код в Git

```bash
cd /Users/azizmadjitov/windsurf/ovqat-ai
git status
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## 🎯 Этап 2: Деплой Backend на Railway

### 2.1 Создайте аккаунт Railway

1. Перейдите на https://railway.app
2. Нажмите "Sign Up"
3. Авторизуйтесь через GitHub

### 2.2 Создайте новый проект

1. Нажмите "New Project"
2. Выберите "Deploy from GitHub"
3. Авторизуйтесь с GitHub
4. Выберите репозиторий `ovqat-ai`

### 2.3 Настройте сервис

1. Railway обнаружит `Dockerfile`
2. Выберите `server/Dockerfile`
3. Нажмите "Deploy"

### 2.4 Добавьте Environment Variables

В Railway Dashboard:

1. Откройте проект
2. Перейдите в "Variables"
3. Добавьте:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PORT=3001
```

### 2.5 Получите URL

1. В "Deployments" скопируйте URL
2. Пример: `https://ovqat-ai-backend-production.up.railway.app`

---

## 🎯 Этап 3: Обновить Frontend

### 3.1 Создайте .env.production

```bash
cp .env.production.example .env.production
```

Отредактируйте:

```
VITE_BACKEND_URL=https://ovqat-ai-backend-production.up.railway.app
```

### 3.2 Коммитьте изменения

```bash
git add .env.production
git commit -m "Add production environment variables"
git push origin main
```

### 3.3 Vercel автоматически деплоит

1. Vercel обнаружит изменения в Git
2. Автоматически перестроит приложение
3. Деплоит на https://ovqat-ai.vercel.app

---

## 🧪 Этап 4: Тестирование

### 4.1 Health Check Backend

```bash
curl https://ovqat-ai-backend-production.up.railway.app/api/health
```

Ответ:
```json
{ "status": "ok" }
```

### 4.2 Authenticate

```bash
curl -X POST https://ovqat-ai-backend-production.up.railway.app/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'
```

Ответ:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "27a2b872-93b4-44ba-8835-75163463e903",
  "expiresIn": 604800
}
```

### 4.3 Откройте приложение

```
https://ovqat-ai.vercel.app/?token=YOUR_TOKEN
```

Должны увидеть:
- ✅ Приложение загружается
- ✅ Пользователь авторизован
- ✅ Данные загружаются из Supabase

### 4.4 Проверьте логи

**Railway:**
```bash
# В Railway Dashboard → Logs
🚀 Server running on http://0.0.0.0:3001
🔍 Authenticating phone: 998997961877
✅ Token generated
```

**Vercel:**
```bash
# В Vercel Dashboard → Deployments → Logs
🔐 Authenticating with token...
✅ Token verified, userId: 27a2b872-93b4-44ba-8835-75163463e903
```

---

## 🔐 Этап 5: Безопасность

### 5.1 Настройте CORS

В `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'https://ovqat-ai.vercel.app',
    'https://partner-app.com',
    'http://localhost:3000' // для разработки
  ]
}));
```

### 5.2 Добавьте Rate Limiting

```bash
cd server
npm install express-rate-limit
```

В `server/index.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит 100 запросов за 15 минут
});

app.use('/api/', limiter);
```

### 5.3 Добавьте API Key (опционально)

```javascript
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
});
```

---

## 📊 Этап 6: Мониторинг

### 6.1 Railway Dashboard

- **Logs** - смотрите логи в реальном времени
- **Metrics** - CPU, память, сеть
- **Deployments** - история деплоев
- **Environment** - переменные окружения

### 6.2 Vercel Dashboard

- **Deployments** - история деплоев
- **Analytics** - производительность
- **Logs** - логи функций
- **Environment** - переменные окружения

### 6.3 Supabase Dashboard

- **Database** - данные пользователей
- **Logs** - логи запросов
- **Monitoring** - производительность

---

## 🆘 Troubleshooting

### Проблема: "Backend не отвечает"

**Решение:**
```bash
# 1. Проверьте что Railway деплой успешен
# Railway Dashboard → Deployments

# 2. Проверьте environment variables
# Railway Dashboard → Variables

# 3. Проверьте логи
# Railway Dashboard → Logs

# 4. Проверьте health check
curl https://ovqat-ai-backend-production.up.railway.app/api/health
```

### Проблема: "CORS error"

**Решение:**
```javascript
// server/index.js
app.use(cors({
  origin: 'https://ovqat-ai.vercel.app'
}));
```

### Проблема: "Token verification failed"

**Решение:**
```bash
# 1. Проверьте JWT_SECRET в Railway
# Railway Dashboard → Variables

# 2. Проверьте что JWT_SECRET одинаковый везде
# Railway Variables
# authService.ts (должен быть одинаковый)

# 3. Проверьте что токен не истек (7 дней)
```

### Проблема: "Supabase connection error"

**Решение:**
```bash
# 1. Проверьте SUPABASE_URL в Railway
# Railway Dashboard → Variables

# 2. Проверьте SUPABASE_SERVICE_ROLE_KEY
# Supabase Dashboard → Project Settings → API

# 3. Проверьте что Supabase проект активен
```

---

## 📈 Масштабирование

Когда будет большая нагрузка (2млн пользователей):

### Railway Scaling

1. **Увеличьте CPU/Memory**
   - Railway Dashboard → Settings → Resources

2. **Добавьте несколько инстансов**
   - Railway Dashboard → Settings → Replicas

3. **Используйте Redis для кэша**
   - Railway → Add Service → Redis

### Supabase Scaling

1. **Upgrade план**
   - Supabase Dashboard → Billing

2. **Добавьте индексы на БД**
   - Supabase Dashboard → SQL Editor

3. **Используйте Connection Pooling**
   - Supabase Dashboard → Project Settings → Database

---

## ✅ Финальный чек-лист

- ✅ Backend деплоен на Railway
- ✅ Frontend деплоен на Vercel
- ✅ Environment variables настроены
- ✅ Health check работает
- ✅ Auth работает
- ✅ Данные загружаются из Supabase
- ✅ CORS настроен
- ✅ Логи работают
- ✅ Мониторинг включен
- ✅ Безопасность настроена

---

## 🎉 Готово!

Ваше приложение теперь работает на production! 🚀

**URLs:**
- Frontend: https://ovqat-ai.vercel.app
- Backend: https://ovqat-ai-backend-production.up.railway.app
- API Docs: https://ovqat-ai.vercel.app/api-docs

---

## 📞 Поддержка

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- API Docs: API_README.md
