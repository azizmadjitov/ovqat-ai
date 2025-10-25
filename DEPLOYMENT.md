# Deployment Guide

## 🚨 Важно: Не пушить напрямую в main!

**Текущая проблема:** Все коммиты в `main` автоматически деплоятся в продакшн.

**Решение:** Используйте branch-based workflow.

## 🌳 Quick Start

### Ежедневная разработка

```bash
# 1. Создать feature ветку от develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Разработка и коммиты
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 3. Создать Pull Request на GitHub
# feature/my-feature → develop

# 4. После мержа - автоматический деплой на staging
```

### Релиз в продакшн

```bash
# 1. Протестировать на staging
# URL: staging.ovqat-ai.vercel.app

# 2. Если все ОК - мержить в main
git checkout main
git pull origin main
git merge staging
git push origin main

# 3. Автоматический деплой в продакшн
# URL: ovqat-ai.vercel.app
```

## 🔧 Первоначальная настройка

### 1. Создать ветки

```bash
# Создать develop (если нет)
git checkout -b develop
git push origin develop

# Создать staging (если нет)
git checkout -b staging
git push origin staging
```

### 2. Настроить GitHub

1. **Settings → Branches → Add rule**
   - Branch name: `main`
   - ☑ Require pull request reviews
   - ☑ Require status checks to pass
   - ☑ No force push

2. **Settings → Secrets → Actions**
   ```
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   PROD_SUPABASE_URL
   PROD_SUPABASE_ANON_KEY
   STAGING_SUPABASE_URL
   STAGING_SUPABASE_ANON_KEY
   ```

### 3. Настроить Vercel

1. **Project Settings → Git**
   - Production Branch: `main`
   - Preview Branches: All branches

2. **Environment Variables**
   - Production: prod credentials
   - Preview: staging credentials

## 📊 Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Production** | `main` | ovqat-ai.vercel.app | Для пользователей |
| **Staging** | `staging` | staging.ovqat-ai.vercel.app | Финальное тестирование |
| **Development** | `develop` | dev.ovqat-ai.vercel.app | Активная разработка |

## 🐛 Откат (Rollback)

### Через Vercel (быстро)

1. Vercel Dashboard → Deployments
2. Найти предыдущий стабильный деплой
3. Нажать "Promote to Production"

### Через Git

```bash
git checkout main
git revert HEAD
git push origin main
```

## 📋 Checklist перед продакшн

- [ ] Протестировано на staging
- [ ] Нет console.errors
- [ ] Performance проверен
- [ ] Mobile версия работает
- [ ] Backend API работает
- [ ] База данных миграции применены

## 🔗 Полная документация

См. [.github/BRANCH_STRATEGY.md](.github/BRANCH_STRATEGY.md)

---

**Важно:** Всегда разрабатывайте в `develop`, тестируйте в `staging`, деплойте в `main`!
