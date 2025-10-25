# Branch Strategy & Deployment Workflow

## 🌳 Branch Structure

```
main (production)     ← Только стабильный код
  ↑
staging               ← Тестирование перед продакшн
  ↑
develop               ← Активная разработка
  ↑
feature/*             ← Новые фичи
bugfix/*              ← Исправления багов
hotfix/*              ← Срочные исправления для прода
```

## 🔄 Workflow

### 1. Разработка новой фичи

```bash
# Создать ветку от develop
git checkout develop
git pull origin develop
git checkout -b feature/meal-history

# Разработка...
git add .
git commit -m "feat: add meal history feature"
git push origin feature/meal-history

# Создать Pull Request: feature/meal-history → develop
```

### 2. Тестирование на staging

```bash
# После мержа в develop - автоматический деплой на staging
git checkout develop
git merge feature/meal-history
git push origin develop

# → GitHub Actions деплоит на staging.ovqat-ai.vercel.app
# → Тестируем на staging
```

### 3. Релиз в продакшн

```bash
# Когда staging протестирован и стабилен
git checkout staging
git merge develop
git push origin staging

# Тестируем на staging еще раз
# Если все ОК:

git checkout main
git merge staging
git push origin main

# → GitHub Actions деплоит на ovqat-ai.vercel.app (production)
```

### 4. Hotfix (срочное исправление)

```bash
# Создать от main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Исправление...
git add .
git commit -m "hotfix: fix critical authentication bug"
git push origin hotfix/critical-bug

# Pull Request: hotfix/critical-bug → main
# После мержа - автоматический деплой

# Не забыть смержить обратно в develop!
git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

## 🚀 Deployment Environments

| Branch | Environment | URL | Auto-deploy | Purpose |
|--------|-------------|-----|-------------|---------|
| `main` | Production | ovqat-ai.vercel.app | ✅ | Стабильная версия для пользователей |
| `staging` | Staging | staging.ovqat-ai.vercel.app | ✅ | Финальное тестирование перед продакшн |
| `develop` | Development | dev.ovqat-ai.vercel.app | ✅ | Активная разработка |
| `feature/*` | Preview | pr-123.ovqat-ai.vercel.app | ✅ | Preview для PR |

## 📋 Pull Request Checklist

### Перед созданием PR:

- [ ] Код работает локально
- [ ] Нет console.errors
- [ ] Код отформатирован
- [ ] Коммиты имеют понятные сообщения
- [ ] Обновлена документация (если нужно)

### Перед мержем в develop:

- [ ] PR ревью пройдено
- [ ] CI/CD проверки прошли
- [ ] Нет конфликтов с develop

### Перед мержем в main:

- [ ] Протестировано на staging
- [ ] Нет критических багов
- [ ] Performance проверен
- [ ] Получено одобрение

## 🔒 Branch Protection Rules

### main (Production)

```yaml
Required:
  ✅ Pull request reviews (1+)
  ✅ Status checks must pass
  ✅ Branches must be up to date
  ✅ No force push
  ✅ No deletion
```

### staging

```yaml
Required:
  ✅ Status checks must pass
  ✅ Branches must be up to date
  ✅ No force push
```

### develop

```yaml
Required:
  ✅ Status checks must pass
  ⚠️ Force push allowed (для cleanup)
```

## 🎯 Commit Message Convention

```
<type>(<scope>): <subject>

Types:
  feat:     Новая фича
  fix:      Исправление бага
  docs:     Документация
  style:    Форматирование
  refactor: Рефакторинг
  test:     Тесты
  chore:    Обслуживание

Examples:
  feat(auth): add JWT token authentication
  fix(meals): prevent duplicate meal entries
  docs(readme): update deployment instructions
  refactor(api): optimize meal loading query
```

## 🐛 Rollback Strategy

### Откат production:

```bash
# Вариант 1: Revert последнего коммита
git checkout main
git revert HEAD
git push origin main

# Вариант 2: Откат к предыдущему релизу
git checkout main
git reset --hard <previous-release-commit>
git push origin main --force  # Требует разрешения!

# Вариант 3: Через Vercel Dashboard
# Vercel → Deployments → Previous → Promote to Production
```

## 📊 Deployment Status

### Проверка статуса:

```bash
# Production
curl https://ovqat-ai.vercel.app/api/health

# Staging
curl https://staging.ovqat-ai.vercel.app/api/health

# Development
curl https://dev.ovqat-ai.vercel.app/api/health
```

## 🔧 Setup Instructions

### 1. Создать ветки

```bash
# Создать develop
git checkout -b develop
git push origin develop

# Создать staging
git checkout -b staging
git push origin staging

# Установить develop как default branch в GitHub
```

### 2. Настроить GitHub Secrets

```
Settings → Secrets and variables → Actions → New repository secret

Required secrets:
  VERCEL_TOKEN              - Vercel API token
  VERCEL_ORG_ID            - Vercel organization ID
  VERCEL_PROJECT_ID        - Vercel project ID
  
  PROD_SUPABASE_URL        - Production Supabase URL
  PROD_SUPABASE_ANON_KEY   - Production Supabase anon key
  
  STAGING_SUPABASE_URL     - Staging Supabase URL
  STAGING_SUPABASE_ANON_KEY - Staging Supabase anon key
```

### 3. Настроить Branch Protection

```
Settings → Branches → Add rule

Branch name pattern: main
☑ Require pull request reviews before merging
☑ Require status checks to pass before merging
☑ Require branches to be up to date before merging
☑ Do not allow bypassing the above settings
```

### 4. Настроить Vercel

```
Vercel Dashboard → Project Settings → Git

Production Branch: main
Preview Branches: All branches
Ignored Build Step: None

Environment Variables:
  Production:
    VITE_SUPABASE_URL = <prod-url>
    VITE_SUPABASE_ANON_KEY = <prod-key>
  
  Preview (staging):
    VITE_SUPABASE_URL = <staging-url>
    VITE_SUPABASE_ANON_KEY = <staging-key>
```

## 📚 Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Vercel Git Integration](https://vercel.com/docs/git)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated:** October 25, 2025  
**Maintained by:** Ovqat AI Team
