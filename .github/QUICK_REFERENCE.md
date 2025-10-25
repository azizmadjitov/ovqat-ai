# Quick Reference - Deployment Workflow

## 🚨 Золотое правило: НЕ ПУШИТЬ В MAIN!

```bash
# ❌ НЕПРАВИЛЬНО
git push origin main  # Сразу в продакшн!

# ✅ ПРАВИЛЬНО
git push origin develop  # Сначала в develop
```

## 📋 Ежедневный workflow

### 1. Начать новую задачу

```bash
git checkout develop
git pull origin develop
git checkout -b feature/task-name
```

### 2. Работа и коммиты

```bash
# Работаем...
git add .
git commit -m "feat: add new feature"
git push origin feature/task-name
```

### 3. Создать Pull Request

```
GitHub → Pull Requests → New PR
Base: develop ← Compare: feature/task-name
```

### 4. После мержа в develop

```
Автоматически деплоится на:
https://dev.ovqat-ai.vercel.app
```

## 🚀 Релиз в продакшн

### Когда готов к релизу:

```bash
# 1. Мержим develop → staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# 2. Тестируем на staging
# https://staging.ovqat-ai.vercel.app

# 3. Если все ОК → мержим в main
git checkout main
git pull origin main
git merge staging
git push origin main

# 4. Продакшн обновлён!
# https://ovqat-ai.vercel.app
```

## 🐛 Hotfix (срочное исправление)

```bash
# 1. От main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Исправление
git add .
git commit -m "hotfix: fix critical bug"
git push origin hotfix/critical-bug

# 3. PR в main
# После мержа - автодеплой

# 4. Не забыть смержить в develop!
git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

## 📊 Проверка статуса

```bash
# Какая ветка сейчас?
git branch

# Статус изменений
git status

# История коммитов
git log --oneline -10

# Проверить что задеплоено
curl https://ovqat-ai.vercel.app/api/health
curl https://staging.ovqat-ai.vercel.app/api/health
curl https://dev.ovqat-ai.vercel.app/api/health
```

## 🔄 Откат продакшн

### Вариант 1: Через Vercel (быстро!)

```
1. Vercel Dashboard → Deployments
2. Найти предыдущий стабильный
3. "Promote to Production"
```

### Вариант 2: Через Git

```bash
git checkout main
git revert HEAD
git push origin main
```

## 📝 Commit message format

```
<type>: <subject>

Types:
  feat     - Новая фича
  fix      - Исправление бага
  docs     - Документация
  refactor - Рефакторинг
  chore    - Обслуживание

Examples:
  feat: add meal history calendar
  fix: prevent duplicate meal entries
  docs: update deployment guide
```

## 🌳 Структура веток

```
main (production)     ← Только стабильный код
  ↑
staging               ← Финальное тестирование
  ↑
develop               ← Активная разработка
  ↑
feature/*             ← Ваши задачи
```

## ⚡ Быстрые команды

```bash
# Переключиться на develop
git checkout develop

# Обновить develop
git pull origin develop

# Создать feature ветку
git checkout -b feature/my-task

# Запушить изменения
git push origin feature/my-task

# Посмотреть все ветки
git branch -a

# Удалить локальную ветку
git branch -d feature/old-task

# Синхронизировать с remote
git fetch --all --prune
```

## 🔗 Полезные ссылки

- [Полная документация](.github/BRANCH_STRATEGY.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [GitHub Repository](https://github.com/azizmadjitov/ovqat-ai)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**Помни:** develop → staging → main  
**Никогда:** напрямую в main!
