# 🚀 Деплой Backend на Railway

Инструкция по развертыванию Ovqat AI Backend на Railway.

---

## 📋 Требования

- GitHub аккаунт
- Railway аккаунт (https://railway.app)
- Git установлен локально

---

## 🎯 Шаг 1: Подготовить репозиторий

### 1.1 Убедитесь что код в Git

```bash
cd /Users/azizmadjitov/windsurf/ovqat-ai
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 1.2 Проверьте структуру

```
ovqat-ai/
├── server/
│   ├── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── src/
├── components/
└── ...
```

---

## 🎯 Шаг 2: Создать проект на Railway

### 2.1 Откройте Railway

1. Перейдите на https://railway.app
2. Нажмите "New Project"
3. Выберите "Deploy from GitHub"

### 2.2 Подключите GitHub репозиторий

1. Авторизуйтесь с GitHub
2. Выберите репозиторий `ovqat-ai`
3. Нажмите "Deploy"

### 2.3 Настройте сервис

1. Railway автоматически обнаружит `Dockerfile`
2. Выберите `server/Dockerfile`
3. Нажмите "Deploy"

---

## 🎯 Шаг 3: Настроить Environment Variables

### 3.1 В Railway Dashboard

1. Откройте ваш проект
2. Перейдите в "Variables"
3. Добавьте переменные:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
PORT=3001
```

### 3.2 Где найти значения

**SUPABASE_URL:**
- Supabase Dashboard → Project Settings → API → URL

**SUPABASE_SERVICE_ROLE_KEY:**
- Supabase Dashboard → Project Settings → API → Service Role Key

**JWT_SECRET:**
- Генерируем сами (любая длинная строка)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎯 Шаг 4: Деплой

### 4.1 Railway автоматически деплоит

После добавления переменных:
1. Railway автоматически перестроит образ
2. Деплоит приложение
3. Выдает публичный URL

### 4.2 Получить URL

1. В Railway Dashboard откройте сервис
2. Перейдите в "Deployments"
3. Скопируйте URL (например: `https://ovqat-ai-backend-production.up.railway.app`)

---

## 🎯 Шаг 5: Обновить Frontend

### 5.1 Обновить authService.ts

В `src/services/authService.ts` измените:

```typescript
// ДО:
const response = await fetch('http://localhost:3001/api/auth/verify', {

// ПОСЛЕ:
const response = await fetch('https://ovqat-ai-backend-production.up.railway.app/api/auth/verify', {
```

### 5.2 Создать environment variable

Создайте `.env.production`:

```
VITE_BACKEND_URL=https://ovqat-ai-backend-production.up.railway.app
```

Используйте в коде:

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
```

### 5.3 Деплоить Frontend

```bash
npm run build
# Vercel автоматически деплоит из Git
git add .
git commit -m "Update backend URL for production"
git push origin main
```

---

## 🧪 Шаг 6: Тестировать

### 6.1 Health Check

```bash
curl https://ovqat-ai-backend-production.up.railway.app/api/health
```

Ответ:
```json
{ "status": "ok" }
```

### 6.2 Authenticate

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

### 6.3 Открыть приложение

```
https://ovqat-ai.vercel.app/?token=YOUR_TOKEN
```

---

## 🔐 Безопасность

### Рекомендации

1. **Никогда не коммитьте .env файлы**
   ```bash
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Используйте Railway Secrets**
   - Все переменные хранятся зашифрованными
   - Не видны в логах

3. **Включите CORS для вашего домена**
   ```javascript
   app.use(cors({
     origin: ['https://ovqat-ai.vercel.app', 'https://partner-app.com']
   }));
   ```

4. **Добавьте Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

---

## 📊 Мониторинг

### Railway Dashboard

1. **Logs** - смотрите логи приложения
2. **Metrics** - CPU, память, сеть
3. **Deployments** - история деплоев
4. **Environment** - переменные окружения

### Типичные логи

```
🚀 Server running on http://0.0.0.0:3001
🔍 Authenticating phone: 998997961877
✅ Existing user found: 27a2b872-93b4-44ba-8835-75163463e903
✅ Token generated
```

---

## 🆘 Troubleshooting

### Проблема: "Build failed"

**Решение:**
```bash
# Проверьте что Dockerfile в правильном месте
ls -la server/Dockerfile

# Проверьте что package.json существует
ls -la server/package.json
```

### Проблема: "Connection refused to Supabase"

**Решение:**
```bash
# Проверьте SUPABASE_URL
echo $SUPABASE_URL

# Проверьте что Supabase проект активен
# Supabase Dashboard → Project Settings
```

### Проблема: "Token verification failed"

**Решение:**
```bash
# Проверьте JWT_SECRET совпадает везде
# Railway Variables → JWT_SECRET
# authService.ts → JWT_SECRET (должен быть одинаковый)
```

---

## 🚀 Готово!

Ваш backend теперь работает на Railway! 🎉

**Проверьте:**
- ✅ Health check работает
- ✅ Auth endpoint работает
- ✅ Frontend может подключиться
- ✅ Логи в Railway Dashboard

---

## 📞 Поддержка

- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support
- Наша документация: API_README.md
