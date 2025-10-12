# Миграция на OpenAI Vision API

## 📋 Обзор изменений

Приложение **Ovqat AI** теперь использует **OpenAI Vision API (GPT-4o)** вместо Google Cloud Vision API для распознавания еды и анализа питания.

## 🎯 Причины миграции

1. **Лучшее распознавание еды** - GPT-4o Vision напрямую анализирует изображения и лучше понимает контекст блюд
2. **Глобальное распознавание кухонь** - более точная идентификация блюд из разных стран мира
3. **Упрощенная архитектура** - один API вместо двух (Google Vision + OpenAI)
4. **Более точные результаты** - прямой анализ изображения без промежуточных меток

## 🔄 Что изменилось

### Удалено
- ❌ Google Cloud Vision API интеграция
- ❌ Функция `callVisionAPI()`
- ❌ Функция `extractFoodInfo()`
- ❌ Двухэтапный процесс (метки → анализ)

### Добавлено
- ✅ OpenAI Vision API интеграция
- ✅ Функция `callOpenAIVisionAPI()`
- ✅ Прямой анализ изображения одним вызовом API
- ✅ Улучшенный промпт для GPT-4o Vision

### Файлы
- **Изменено**: `src/services/nutrition.ts` - основная логика анализа
- **Обновлено**: `README.md` - документация API
- **Обновлено**: `prompts/prompt.nutrition-expert.md` - промпт для AI

## 🛠️ Настройка

### 1. Переменные окружения

Теперь нужен только **один API ключ**:

```bash
# .env.local или .env
VITE_OPENAI_API_KEY=sk-...        # Ваш OpenAI API ключ
VITE_USE_MOCK=0                    # 0 = реальный API, 1 = моковые данные
```

**Можно удалить** (больше не используется):
```bash
VITE_GOOGLE_VISION_API_KEY=...    # ❌ Не нужен
VITE_GOOGLE_CLOUD_API_KEY=...     # ❌ Не нужен
```

### 2. Модель

Используется модель **GPT-4o** с поддержкой vision:

```typescript
model: 'gpt-4o'  // GPT-4o с vision capabilities
```

### 3. Стоимость

- **Google Vision**: ~$1.50 за 1000 запросов (Label Detection) + OpenAI API
- **OpenAI Vision (GPT-4o)**: ~$0.01 за изображение (зависит от размера)

## 📊 Улучшения качества

### Распознавание
- ✅ Лучше определяет сложные блюда
- ✅ Понимает культурный контекст
- ✅ Распознает региональные вариации
- ✅ Анализирует способ приготовления

### Глобальная осведомленность
- 🌏 Азиатская кухня (японская, китайская, корейская, тайская, индийская)
- 🌍 Европейская кухня (итальянская, французская, испанская, греческая)
- 🌎 Американская кухня (США, мексиканская, бразильская, аргентинская)
- 🌍 Африканская кухня (эфиопская, марокканская)
- 🌏 Ближневосточная кухня (ливанская, персидская, израильская)
- 🌏 Океанская кухня (австралийская, полинезийская)

### Точность
- **Confidence-based naming**: 
  - Confidence ≥ 0.7 → конкретное название блюда
  - Confidence < 0.7 → описательное название

## 🔍 Как это работает

### Старый подход (Google Vision + OpenAI)
```
Изображение → Google Vision → Метки → OpenAI → Анализ питания
```

### Новый подход (OpenAI Vision)
```
Изображение → GPT-4o Vision → Анализ питания
```

## 📝 Пример использования

```typescript
// В src/services/nutrition.ts
export async function analyzeMeal(file: File): Promise<NutritionResult> {
  const compressedFile = await compressImage(file);
  const nutritionData = await callOpenAIVisionAPI(compressedFile);
  return nutritionData;
}
```

## 🐛 Отладка

Консоль браузера показывает детальную информацию:

```
🖼️ Calling OpenAI Vision API for food analysis...
✅ OpenAI Vision API response status: 200
🤖 OpenAI Vision Raw Response: {...}
📄 OpenAI Vision JSON Content: {...}
✅ Parsed AI Result: { title, confidence, calories, ... }
🎯 Full Parsed JSON: {...}
```

## ⚠️ Важные заметки

1. **API ключ**: Убедитесь, что у вас есть доступ к GPT-4o модели
2. **Тестирование**: Установите `VITE_USE_MOCK=1` для тестирования без API
3. **Размер изображения**: Автоматически сжимается до ≤1024px
4. **Формат**: Поддерживаются JPEG, PNG
5. **Temperature**: Установлено 0.0 для детерминированных результатов

## 📚 Дополнительные ресурсы

- [OpenAI Vision API Documentation](https://platform.openai.com/docs/guides/vision)
- [GPT-4o Model Card](https://openai.com/index/hello-gpt-4o/)

---

**Дата миграции**: 2025-10-12  
**Версия**: 1.0.0 → 2.0.0 (OpenAI Vision)
