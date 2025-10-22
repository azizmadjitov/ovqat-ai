# 🔗 Пример интеграции для Partner Backend

Это пример того, как интегрировать Ovqat AI в ваше родительское приложение.

---

## 📋 Быстрый старт

### 1. Получить токен

```javascript
async function getOvqatAIToken(phoneNumber) {
  const response = await fetch('https://ovqat-ai.example.com/api/auth/phone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phoneNumber })
  });

  if (!response.ok) {
    throw new Error('Failed to get token');
  }

  const { token } = await response.json();
  return token;
}
```

### 2. Открыть мини-приложение

```javascript
async function openOvqatAI(phoneNumber) {
  try {
    const token = await getOvqatAIToken(phoneNumber);
    const miniAppUrl = `https://ovqat-ai.example.com/?token=${token}`;
    
    // Открыть в новой вкладке
    window.open(miniAppUrl, '_blank');
    
    // Или открыть в iframe
    // document.getElementById('mini-app-frame').src = miniAppUrl;
  } catch (error) {
    console.error('Error opening Ovqat AI:', error);
  }
}
```

---

## 🎯 Примеры для разных платформ

### Node.js/Express Backend

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint для открытия мини-приложения
app.post('/api/open-ovqat-ai', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Запрос к Ovqat AI API
    const response = await fetch('https://ovqat-ai.example.com/api/auth/phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber })
    });

    if (!response.ok) {
      throw new Error('Failed to get token from Ovqat AI');
    }

    const { token, userId } = await response.json();

    // Вернуть URL для открытия мини-приложения
    res.json({
      success: true,
      miniAppUrl: `https://ovqat-ai.example.com/?token=${token}`,
      userId,
      token
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Partner Backend running on http://localhost:3000');
});
```

### React Frontend

```jsx
import React, { useState } from 'react';

function OvqatAIButton({ phoneNumber }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenOvqatAI = async () => {
    setLoading(true);
    setError(null);

    try {
      // Запрос к Partner Backend
      const response = await fetch('/api/open-ovqat-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to open Ovqat AI');
      }

      const { miniAppUrl } = await response.json();

      // Открыть в новой вкладке
      window.open(miniAppUrl, '_blank');
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleOpenOvqatAI}
        disabled={loading}
      >
        {loading ? 'Загрузка...' : 'Открыть Ovqat AI'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default OvqatAIButton;
```

### React Native (Мобильное приложение)

```javascript
import React, { useState } from 'react';
import { View, Button, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

export function OvqatAIScreen({ phoneNumber }) {
  const [miniAppUrl, setMiniAppUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpenOvqatAI = async () => {
    setLoading(true);

    try {
      // Запрос к Partner Backend
      const response = await fetch('https://partner-api.example.com/api/open-ovqat-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to get mini app URL');
      }

      const { miniAppUrl } = await response.json();
      setMiniAppUrl(miniAppUrl);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (miniAppUrl) {
    return (
      <WebView
        source={{ uri: miniAppUrl }}
        style={{ flex: 1 }}
      />
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Открыть Ovqat AI"
        onPress={handleOpenOvqatAI}
        disabled={loading}
      />
      {loading && <ActivityIndicator size="large" />}
    </View>
  );
}
```

### Flutter (Мобильное приложение)

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class OvqatAIScreen extends StatefulWidget {
  final String phoneNumber;

  const OvqatAIScreen({required this.phoneNumber});

  @override
  _OvqatAIScreenState createState() => _OvqatAIScreenState();
}

class _OvqatAIScreenState extends State<OvqatAIScreen> {
  late WebViewController _webViewController;
  String? _miniAppUrl;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _openOvqatAI();
  }

  Future<void> _openOvqatAI() async {
    setState(() => _loading = true);

    try {
      // Запрос к Partner Backend
      final response = await http.post(
        Uri.parse('https://partner-api.example.com/api/open-ovqat-ai'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phoneNumber': widget.phoneNumber}),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to get mini app URL');
      }

      final data = jsonDecode(response.body);
      setState(() => _miniAppUrl = data['miniAppUrl']);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_miniAppUrl == null) {
      return Scaffold(
        body: Center(
          child: ElevatedButton(
            onPressed: _openOvqatAI,
            child: const Text('Открыть Ovqat AI'),
          ),
        ),
      );
    }

    return Scaffold(
      body: WebView(
        initialUrl: _miniAppUrl!,
        javascriptMode: JavascriptMode.unrestricted,
        onWebViewCreated: (WebViewController webViewController) {
          _webViewController = webViewController;
        },
      ),
    );
  }
}
```

### Python Backend

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

OVQAT_AI_API_URL = 'https://ovqat-ai.example.com/api/auth/phone'

@app.route('/api/open-ovqat-ai', methods=['POST'])
def open_ovqat_ai():
    try:
        data = request.get_json()
        phone_number = data.get('phoneNumber')

        if not phone_number:
            return jsonify({'error': 'Phone number is required'}), 400

        # Запрос к Ovqat AI API
        response = requests.post(
            OVQAT_AI_API_URL,
            json={'phoneNumber': phone_number},
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code != 200:
            raise Exception('Failed to get token from Ovqat AI')

        data = response.json()
        token = data['token']
        user_id = data['userId']

        mini_app_url = f'https://ovqat-ai.example.com/?token={token}'

        return jsonify({
            'success': True,
            'miniAppUrl': mini_app_url,
            'userId': user_id,
            'token': token
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

---

## 🔐 Безопасность

### Рекомендации

1. **Никогда не передавайте токен в URL** (если это не необходимо)
   - Используйте POST запросы
   - Передавайте токен в заголовке или body

2. **Используйте HTTPS** в production
   ```javascript
   const apiUrl = process.env.NODE_ENV === 'production'
     ? 'https://ovqat-ai.example.com'
     : 'http://localhost:3001';
   ```

3. **Добавьте API Key** для защиты
   ```javascript
   const response = await fetch('https://ovqat-ai.example.com/api/auth/phone', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-API-Key': process.env.OVQAT_AI_API_KEY
     },
     body: JSON.stringify({ phoneNumber })
   });
   ```

4. **Логируйте все запросы**
   ```javascript
   console.log(`[${new Date().toISOString()}] Auth request for phone: ${phoneNumber}`);
   ```

5. **Обработайте ошибки**
   ```javascript
   try {
     // запрос
   } catch (error) {
     console.error('Error:', error);
     // Отправить на сервис мониторинга (Sentry, etc)
   }
   ```

---

## 🧪 Тестирование

### Используя cURL

```bash
# Получить токен
curl -X POST http://localhost:3001/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'

# Ответ:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "userId": "27a2b872-93b4-44ba-8835-75163463e903",
#   "expiresIn": 604800
# }

# Верифицировать токен
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOiJIUzI1NiIs..."}'
```

### Используя Postman

1. Импортируйте `postman_collection.json`
2. Установите переменную `base_url` = `http://localhost:3001`
3. Запустите запросы

---

## 📊 Обработка ошибок

```javascript
async function handleOvqatAIError(error) {
  if (error.response) {
    // Ошибка от сервера
    console.error('Server error:', error.response.status, error.response.data);
    
    switch (error.response.status) {
      case 400:
        return 'Invalid phone number';
      case 401:
        return 'Unauthorized - check API key';
      case 500:
        return 'Server error - try again later';
      default:
        return 'Unknown error';
    }
  } else if (error.request) {
    // Нет ответа от сервера
    console.error('No response:', error.request);
    return 'No response from server';
  } else {
    // Ошибка при подготовке запроса
    console.error('Error:', error.message);
    return error.message;
  }
}
```

---

## 📞 Поддержка

Если у вас есть вопросы:
- Документация: https://docs.ovqat-ai.example.com
- Email: support@ovqat-ai.example.com
- GitHub Issues: https://github.com/ovqat-ai/api-docs/issues
