# 🔗 Ovqat AI - API Спецификация для Partner Backend

Это API спецификация для интеграции Ovqat AI мини-приложения с родительским приложением.

---

## 📌 Обзор

Ovqat AI предоставляет REST API для аутентификации пользователей по номеру телефона. Родительское приложение передает номер телефона, получает JWT токен, и открывает мини-приложение с этим токеном.

**Base URL:** `https://ovqat-ai.example.com` (или `http://localhost:3001` для разработки)

---

## 🔐 Аутентификация

Все запросы должны содержать заголовок:
```
Content-Type: application/json
```

Для защиты API рекомендуется добавить API Key в заголовок (опционально):
```
X-API-Key: your-api-key
```

---

## 📡 API Endpoints

### 1. POST /api/auth/phone
**Аутентификация по номеру телефона**

Этот endpoint создает или загружает пользователя и возвращает JWT токен для открытия мини-приложения.

#### Request

```http
POST /api/auth/phone HTTP/1.1
Host: ovqat-ai.example.com
Content-Type: application/json

{
  "phoneNumber": "998997961877"
}
```

#### Request Parameters

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|---------|
| `phoneNumber` | string | ✅ Да | Номер телефона пользователя (с или без +) |

#### Response (Success - 200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyN2EyYjg3Mi05M2I0LTQ0YmEtODgzNS03NTE2MzQ2M2U5MDMiLCJwaG9uZU51bWJlciI6Ijk5ODk5Nzk2MTg3NyIsImlhdCI6MTcwMzI1MjAwMCwiZXhwIjoxNzAzODU2ODAwfQ.abc123...",
  "userId": "27a2b872-93b4-44ba-8835-75163463e903",
  "expiresIn": 604800
}
```

#### Response Parameters

| Параметр | Тип | Описание |
|----------|-----|---------|
| `token` | string | JWT токен для открытия мини-приложения |
| `userId` | string | Уникальный ID пользователя в системе |
| `expiresIn` | number | Время жизни токена в секундах (7 дней = 604800) |

#### Response (Error - 400)

```json
{
  "error": "Phone number is required"
}
```

#### Response (Error - 500)

```json
{
  "error": "Database error"
}
```

#### Example (cURL)

```bash
curl -X POST https://ovqat-ai.example.com/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "998997961877"
  }'
```

#### Example (JavaScript)

```javascript
const response = await fetch('https://ovqat-ai.example.com/api/auth/phone', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '998997961877'
  })
});

const { token, userId, expiresIn } = await response.json();

// Открыть мини-приложение с токеном
window.location.href = `https://ovqat-ai.example.com/?token=${token}`;
```

#### Example (Python)

```python
import requests

response = requests.post(
    'https://ovqat-ai.example.com/api/auth/phone',
    json={'phoneNumber': '998997961877'}
)

data = response.json()
token = data['token']
user_id = data['userId']

# Открыть мини-приложение
redirect_url = f'https://ovqat-ai.example.com/?token={token}'
```

---

### 2. POST /api/auth/verify
**Верификация JWT токена**

Этот endpoint используется для проверки валидности токена (опционально).

#### Request

```http
POST /api/auth/verify HTTP/1.1
Host: ovqat-ai.example.com
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (Success - 200)

```json
{
  "valid": true,
  "userId": "27a2b872-93b4-44ba-8835-75163463e903"
}
```

#### Response (Error - 401)

```json
{
  "valid": false,
  "error": "Invalid token"
}
```

---

### 3. GET /api/health
**Health Check**

Проверка доступности API.

#### Request

```http
GET /api/health HTTP/1.1
Host: ovqat-ai.example.com
```

#### Response (Success - 200)

```json
{
  "status": "ok"
}
```

---

## 🔄 Интеграционный Flow

### Диаграмма

```
┌─────────────────────┐
│  Родительское       │
│  приложение         │
└──────────┬──────────┘
           │
           │ 1. Пользователь нажимает "Открыть Ovqat AI"
           │
           ▼
┌─────────────────────────────────────────┐
│ Partner Backend                         │
│ POST /api/auth/phone                    │
│ Body: { phoneNumber: "998997961877" }   │
└──────────┬──────────────────────────────┘
           │
           │ 2. Запрос к Ovqat AI API
           │
           ▼
┌─────────────────────────────────────────┐
│ Ovqat AI Backend                        │
│ - Проверяет/создает пользователя        │
│ - Генерирует JWT токен                  │
│ - Возвращает { token, userId }          │
└──────────┬──────────────────────────────┘
           │
           │ 3. Ответ с токеном
           │
           ▼
┌─────────────────────────────────────────┐
│ Partner Backend                         │
│ Открывает webview/iframe:               │
│ https://ovqat-ai.example.com/?token=... │
└──────────┬──────────────────────────────┘
           │
           │ 4. Загружает мини-приложение
           │
           ▼
┌─────────────────────────────────────────┐
│ Ovqat AI Frontend                       │
│ - Читает token из URL                   │
│ - Верифицирует токен                    │
│ - Загружает данные пользователя         │
│ - Отображает приложение                 │
└─────────────────────────────────────────┘
```

### Пошаговая реализация

#### Шаг 1: Пользователь нажимает кнопку

```javascript
// На стороне родительского приложения
function openOvqatAI() {
  const phoneNumber = getUserPhoneNumber(); // "998997961877"
  
  // Отправить запрос на Partner Backend
  fetch('/api/open-mini-app', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
}
```

#### Шаг 2: Partner Backend получает запрос

```javascript
// На стороне Partner Backend
app.post('/api/open-mini-app', async (req, res) => {
  const { phoneNumber } = req.body;
  
  // Запрос к Ovqat AI API
  const response = await fetch('https://ovqat-ai.example.com/api/auth/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  
  const { token } = await response.json();
  
  // Вернуть URL для открытия мини-приложения
  res.json({
    miniAppUrl: `https://ovqat-ai.example.com/?token=${token}`
  });
});
```

#### Шаг 3: Открыть мини-приложение

```javascript
// На стороне родительского приложения
const response = await fetch('/api/open-mini-app', {
  method: 'POST',
  body: JSON.stringify({ phoneNumber })
});

const { miniAppUrl } = await response.json();

// Открыть в webview или новой вкладке
window.open(miniAppUrl, '_blank');
// или
webview.loadUrl(miniAppUrl);
```

---

## 🛡️ Безопасность

### JWT Токен

- **Алгоритм:** HS256
- **Время жизни:** 7 дней
- **Содержит:** userId, phoneNumber, iat, exp

### Рекомендации

1. **HTTPS только** - все запросы должны быть через HTTPS в production
2. **API Key** - рекомендуется добавить API Key для защиты endpoint
3. **Rate Limiting** - ограничить количество запросов с одного IP
4. **CORS** - настроить CORS для вашего домена
5. **Логирование** - логировать все auth события

### Пример с API Key

```bash
curl -X POST https://ovqat-ai.example.com/api/auth/phone \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"phoneNumber": "998997961877"}'
```

---

## 📊 Примеры использования

### Пример 1: React Native (Мобильное приложение)

```javascript
import { WebView } from 'react-native-webview';

function OvqatAIScreen({ phoneNumber }) {
  const [miniAppUrl, setMiniAppUrl] = useState(null);

  useEffect(() => {
    // Получить токен от Partner Backend
    fetch('https://partner-api.example.com/api/open-mini-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    })
      .then(res => res.json())
      .then(data => setMiniAppUrl(data.miniAppUrl));
  }, [phoneNumber]);

  return (
    <WebView
      source={{ uri: miniAppUrl }}
      style={{ flex: 1 }}
    />
  );
}
```

### Пример 2: Flutter (Мобильное приложение)

```dart
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;

class OvqatAIScreen extends StatefulWidget {
  final String phoneNumber;

  @override
  _OvqatAIScreenState createState() => _OvqatAIScreenState();
}

class _OvqatAIScreenState extends State<OvqatAIScreen> {
  late WebViewController _webViewController;
  String? _miniAppUrl;

  @override
  void initState() {
    super.initState();
    _getToken();
  }

  Future<void> _getToken() async {
    final response = await http.post(
      Uri.parse('https://partner-api.example.com/api/open-mini-app'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phoneNumber': widget.phoneNumber}),
    );

    final data = jsonDecode(response.body);
    setState(() => _miniAppUrl = data['miniAppUrl']);
  }

  @override
  Widget build(BuildContext context) {
    return WebView(
      initialUrl: _miniAppUrl,
      javascriptMode: JavascriptMode.unrestricted,
    );
  }
}
```

### Пример 3: Web (Веб-приложение)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Ovqat AI Integration</title>
</head>
<body>
  <button onclick="openOvqatAI()">Открыть Ovqat AI</button>
  <iframe id="ovqat-frame" style="width: 100%; height: 100%; border: none;"></iframe>

  <script>
    async function openOvqatAI() {
      const phoneNumber = '998997961877'; // Получить от пользователя
      
      // Запрос к Partner Backend
      const response = await fetch('/api/open-mini-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      
      const { miniAppUrl } = await response.json();
      
      // Открыть в iframe
      document.getElementById('ovqat-frame').src = miniAppUrl;
    }
  </script>
</body>
</html>
```

---

## 🚀 Развертывание

### Production URL

```
https://ovqat-ai.example.com
```

### Environment Variables

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
API_KEY=your_api_key
PORT=3001
```

---

## 📞 Поддержка

Если у вас есть вопросы по интеграции, свяжитесь с нами:
- Email: support@ovqat-ai.example.com
- Документация: https://docs.ovqat-ai.example.com
- GitHub: https://github.com/ovqat-ai/api-docs

---

## 📝 История изменений

| Версия | Дата | Изменения |
|--------|------|----------|
| 1.0.0 | 2025-10-22 | Первая версия API |

---

**Версия API:** 1.0.0  
**Последнее обновление:** 2025-10-22
