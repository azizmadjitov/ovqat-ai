# 📚 Ovqat AI - Документация API

Полная документация для интеграции Ovqat AI мини-приложения с родительским приложением.

---

## 📖 Документация

### Для Partner Backend (родительское приложение)

1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - Полная спецификация API
   - Все endpoints
   - Request/Response примеры
   - Диаграммы интеграции
   - Примеры безопасности

2. **[PARTNER_INTEGRATION_EXAMPLE.md](./PARTNER_INTEGRATION_EXAMPLE.md)** - Примеры интеграции
   - Node.js/Express
   - React
   - React Native
   - Flutter
   - Python
   - Обработка ошибок

3. **[postman_collection.json](./postman_collection.json)** - Postman коллекция
   - Готовые запросы для тестирования
   - Импортируйте в Postman

### Для разработчиков Ovqat AI

4. **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Инструкция по запуску
   - Запуск backend
   - Запуск frontend
   - Тестирование

5. **[server/README.md](./server/README.md)** - Backend документация
   - Установка зависимостей
   - Конфигурация
   - API endpoints

---

## 🚀 Быстрый старт

### Для Partner Backend

```bash
# 1. Получить токен
curl -X POST https://ovqat-ai.example.com/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'

# 2. Открыть мини-приложение
https://ovqat-ai.example.com/?token=YOUR_TOKEN
```

### Для разработчиков

```bash
# 1. Запустить backend
cd server
npm install
npm run dev

# 2. Запустить frontend
npm run dev

# 3. Тестировать
http://localhost:3000/?token=YOUR_TOKEN
```

---

## 📋 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|---------|
| POST | `/api/auth/phone` | Получить токен по номеру телефона |
| POST | `/api/auth/verify` | Верифицировать токен |
| GET | `/api/health` | Health check |

---

## 🔄 Интеграционный Flow

```
Partner App
    ↓ Пользователь нажимает кнопку
    ↓
Partner Backend
    ↓ POST /api/auth/phone { phoneNumber }
    ↓
Ovqat AI Backend
    ↓ Создает/загружает пользователя
    ↓ Генерирует JWT токен
    ↓ Возвращает { token }
    ↓
Partner Backend
    ↓ Открывает webview/iframe
    ↓ https://ovqat-ai.example.com/?token=xyz
    ↓
Ovqat AI Frontend
    ↓ Читает token из URL
    ↓ Верифицирует токен
    ↓ Загружает данные пользователя
    ↓ Отображает приложение
```

---

## 🛠️ Технический стек

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase PostgreSQL
- **Auth:** JWT (HS256)

### Frontend
- **Framework:** React
- **Language:** TypeScript
- **Build:** Vite
- **Database Client:** Supabase JS

---

## 🔐 Безопасность

- ✅ JWT токены с expiration (7 дней)
- ✅ HTTPS в production
- ✅ API Key для защиты endpoints
- ✅ CORS настройки
- ✅ Rate limiting
- ✅ Логирование всех операций

---

## 📊 Примеры

### JavaScript/Node.js

```javascript
const response = await fetch('https://ovqat-ai.example.com/api/auth/phone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '998997961877' })
});

const { token } = await response.json();
window.location.href = `https://ovqat-ai.example.com/?token=${token}`;
```

### Python

```python
import requests

response = requests.post(
    'https://ovqat-ai.example.com/api/auth/phone',
    json={'phoneNumber': '998997961877'}
)

token = response.json()['token']
redirect_url = f'https://ovqat-ai.example.com/?token={token}'
```

### cURL

```bash
curl -X POST https://ovqat-ai.example.com/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'
```

---

## 🧪 Тестирование

### Используя Postman

1. Импортируйте `postman_collection.json`
2. Установите переменные:
   - `base_url` = `http://localhost:3001` (dev) или `https://ovqat-ai.example.com` (prod)
3. Запустите запросы

### Используя cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Authenticate
curl -X POST http://localhost:3001/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'

# Verify token
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN"}'
```

---

## 📈 Мониторинг

### Логи

Backend логирует все операции:
```
🚀 Server running on http://localhost:3001
🔍 Authenticating phone: 998997961877
✅ Existing user found: 27a2b872-93b4-44ba-8835-75163463e903
✅ Token generated
```

### Метрики

Рекомендуется отслеживать:
- Количество успешных авторизаций
- Количество ошибок
- Время ответа API
- Использование токенов

---

## 🚀 Развертывание

### Production

```bash
# 1. Установить зависимости
npm install

# 2. Собрать frontend
npm run build

# 3. Запустить backend
npm start
```

### Environment Variables

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
API_KEY=your_api_key
PORT=3001
NODE_ENV=production
```

---

## 📞 Поддержка

- **Документация:** https://docs.ovqat-ai.example.com
- **Email:** support@ovqat-ai.example.com
- **GitHub:** https://github.com/ovqat-ai
- **Issues:** https://github.com/ovqat-ai/api-docs/issues

---

## 📝 История версий

| Версия | Дата | Изменения |
|--------|------|----------|
| 1.0.0 | 2025-10-22 | Первая версия API |

---

## 📄 Лицензия

MIT License - см. LICENSE файл

---

**Версия:** 1.0.0  
**Последнее обновление:** 2025-10-22  
**Статус:** Production Ready ✅
