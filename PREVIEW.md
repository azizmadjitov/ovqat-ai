# Preview Deployments

## 🌐 URLs

### Development (develop branch)
```
https://ovqat-ai-git-develop-azizmadjitov.vercel.app
```
**Обновляется:** При каждом push в `develop`

### Staging (staging branch)
```
https://ovqat-ai-git-staging-azizmadjitov.vercel.app
```
**Обновляется:** При каждом push в `staging`

### Production (main branch)
```
https://ovqat-ai.vercel.app
```
**Обновляется:** При каждом push в `main`

## ⚡ Быстрое открытие

### Через скрипт:
```bash
./open-preview.sh dev      # Открыть dev
./open-preview.sh staging  # Открыть staging
./open-preview.sh prod     # Открыть production
```

### Через браузер:
```bash
# Development
open https://ovqat-ai-git-develop-azizmadjitov.vercel.app

# Staging
open https://ovqat-ai-git-staging-azizmadjitov.vercel.app

# Production
open https://ovqat-ai.vercel.app
```

## 🔍 Проверка статуса

```bash
# Development
curl https://ovqat-ai-git-develop-azizmadjitov.vercel.app/api/health

# Staging
curl https://ovqat-ai-git-staging-azizmadjitov.vercel.app/api/health

# Production
curl https://ovqat-ai.vercel.app/api/health
```

## 📊 Workflow

```
1. Работаешь в develop
   ↓
2. Пушишь: git push origin develop
   ↓
3. Открываешь dev preview
   ↓
4. Проверяешь что всё работает
   ↓
5. Если ОК → мержишь в staging
   ↓
6. Проверяешь staging preview
   ↓
7. Если ОК → мержишь в main (продакшн)
```

## 🧪 Тестирование с токеном

### Development:
```bash
# 1. Получить токен от backend
curl -X POST http://localhost:3001/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'

# 2. Открыть с токеном
open "https://ovqat-ai-git-develop-azizmadjitov.vercel.app/?token=YOUR_TOKEN"
```

### Staging:
```bash
open "https://ovqat-ai-git-staging-azizmadjitov.vercel.app/?token=YOUR_TOKEN"
```

### Production:
```bash
open "https://ovqat-ai.vercel.app/?token=YOUR_TOKEN"
```

## 📱 Тестирование на мобильном

### QR код для быстрого доступа:

1. Открой: https://www.qr-code-generator.com/
2. Вставь URL с токеном
3. Сканируй QR на телефоне

### Или используй ngrok для локального тестирования:
```bash
npm run dev
ngrok http 3000
# Получишь публичный URL для тестирования
```

## 🔗 Vercel Dashboard

Все деплои: https://vercel.com/azizmadjitov/ovqat-ai/deployments

## 💡 Полезные команды

```bash
# Посмотреть последний коммит
git log --oneline -1

# Посмотреть текущую ветку
git branch

# Посмотреть статус
git status

# Быстрый деплой в dev
git add . && git commit -m "update" && git push origin develop

# Открыть dev preview
./open-preview.sh dev
```

## 🐛 Troubleshooting

### Preview не обновляется?
1. Проверь что push прошёл: `git log --oneline -1`
2. Проверь Vercel Dashboard: https://vercel.com/dashboard
3. Подожди 30-60 секунд для билда
4. Обнови страницу с Ctrl+Shift+R (hard refresh)

### 404 ошибка?
- Проверь что ветка существует: `git branch -a`
- Проверь что был хотя бы один push в эту ветку
- URL формат: `https://ovqat-ai-git-BRANCH-azizmadjitov.vercel.app`

### Старая версия показывается?
- Очисти кеш браузера
- Открой в режиме инкогнито
- Проверь что последний коммит задеплоен в Vercel Dashboard

---

**Быстрый доступ:**
- Dev: https://ovqat-ai-git-develop-azizmadjitov.vercel.app
- Staging: https://ovqat-ai-git-staging-azizmadjitov.vercel.app
- Prod: https://ovqat-ai.vercel.app
