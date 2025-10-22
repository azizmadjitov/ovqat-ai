# 🚀 Инструкция по запуску Ovqat AI с новой архитектурой

## Архитектура

```
Partner Backend (родительское приложение)
    ↓ POST /api/auth/phone { phoneNumber }
Ovqat AI Backend (Node.js/Express)
    ↓ Создает/загружает пользователя в Supabase
    ↓ Генерирует JWT токен
    ↓ Возвращает { token }
Partner Backend
    ↓ Открывает webview с токеном
    ↓ http://localhost:3000/?token=xyz
Ovqat AI Frontend (React)
    ↓ Читает token из URL
    ↓ Верифицирует токен с backend
    ↓ Загружает данные пользователя
    ↓ Отображает приложение
```

## Шаг 1: Подготовка Supabase

### Отключить RLS на таблицах (или использовать политики)

Выполните в Supabase SQL Editor:

```sql
-- Отключить RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals DISABLE ROW LEVEL SECURITY;

-- Или если хотите оставить RLS, используйте политики:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON user_profiles FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON user_goals FOR ALL USING (true);
```

## Шаг 2: Запустить Backend API

```bash
# Перейти в папку server
cd server

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env

# Заполнить .env с вашими данными Supabase:
# SUPABASE_URL=https://your-url.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_key
# JWT_SECRET=your_secret

# Запустить backend
npm run dev
```

Backend запустится на `http://localhost:3001`

## Шаг 3: Запустить Frontend

В отдельном терминале:

```bash
# В корневой папке проекта
npm run dev
```

Frontend запустится на `http://localhost:3000`

## Шаг 4: Тестирование

### Вариант A: Через URL параметр (простой тест)

1. Откройте backend API в браузере:
```
http://localhost:3001/api/health
```

Должно вернуть: `{ "status": "ok" }`

2. Получите токен через curl:
```bash
curl -X POST http://localhost:3001/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'
```

Ответ:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "27a2b872-93b4-44ba-8835-75163463e903"
}
```

3. Откройте фронтенд с токеном:
```
http://localhost:3000/?token=eyJhbGciOiJIUzI1NiIs...
```

Приложение должно автоматически авторизовать пользователя!

### Вариант B: Через mock backend

Создайте простой mock сервер который имитирует родительское приложение:

```javascript
// mock-parent-app.js
const http = require('http');

const server = http.createServer(async (req, res) => {
  if (req.url === '/open-mini-app' && req.method === 'GET') {
    // Получить токен от backend
    const response = await fetch('http://localhost:3001/api/auth/phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '998997961877' })
    });
    
    const { token } = await response.json();
    
    // Перенаправить на мини-апп с токеном
    res.writeHead(302, { 'Location': `http://localhost:3000/?token=${token}` });
    res.end();
  }
});

server.listen(3002, () => {
  console.log('Mock parent app on http://localhost:3002');
  console.log('Open: http://localhost:3002/open-mini-app');
});
```

## Шаг 5: Проверка логов

### Backend логи
```
🚀 Server running on http://localhost:3001
🔍 Authenticating phone: 998997961877
✅ Existing user found: 27a2b872-93b4-44ba-8835-75163463e903
✅ Token generated
```

### Frontend логи (DevTools Console)
```
🔐 Authenticating with token...
✅ Token verified, userId: 27a2b872-93b4-44ba-8835-75163463e903
💾 Stored user_id in localStorage
✅ User data loaded
Rendering screen: HOME
```

## 🎯 Готово!

Теперь у вас есть:
- ✅ Backend API для аутентификации по номеру телефона
- ✅ Frontend который читает токен из URL
- ✅ Кроссплатформенная авторизация
- ✅ Один user_id на всех устройствах

## 📝 Следующие шаги

1. **Интегрировать с реальным родительским приложением**
   - Вместо URL параметра использовать API вызов
   - Передавать токен через webview

2. **Развернуть на production**
   - Использовать переменные окружения
   - Настроить CORS для вашего домена
   - Использовать HTTPS

3. **Добавить логирование и мониторинг**
   - Логировать все auth события
   - Отслеживать ошибки
