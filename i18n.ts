const translations = {
  en: {
    'app_name': 'Ovqat AI',
    'app_subtitle': 'Your AI nutrition assistant',
    'calories_left': 'Calories left',
    'kcal_left': 'kcal left',
    'protein': 'Protein',
    'carbs': 'Carbs',
    'fat': 'Fat',
    'todays_meals': "Today's Meals",
    'no_meals_yet': 'No meals logged yet.',
    'add_first_meal_prompt': 'Tap the camera to add your first meal!',
    'meal_details': 'Meal Details',
    'retake': 'Retake',
    'add_meal': 'Add Meal',
  },
  ru: {
    'app_name': 'Ovqat AI',
    'app_subtitle': 'Ваш ИИ-помощник по питанию',
    'calories_left': 'Калорий осталось',
    'kcal_left': 'ккал осталось',
    'protein': 'Белки',
    'carbs': 'Углеводы',
    'fat': 'Жиры',
    'todays_meals': 'Приемы пищи за сегодня',
    'no_meals_yet': 'Еще нет приемов пищи.',
    'add_first_meal_prompt': 'Нажмите на камеру, чтобы добавить первую еду!',
    'meal_details': 'Детали приема пищи',
    'retake': 'Переснять',
    'add_meal': 'Добавить',
  },
  uz: {
    'app_name': 'Ovqat AI',
    'app_subtitle': 'Sizning sun\'iy intellektli oziqlanish yordamchingiz',
    'calories_left': 'Kaloriya qoldi',
    'kcal_left': 'kkal qoldi',
    'protein': 'Oqsil',
    'carbs': 'Uglevodlar',
    'fat': 'Yog\'lar',
    'todays_meals': 'Bugungi ovqatlar',
    'no_meals_yet': 'Hali ovqatlar qayd etilmagan.',
    'add_first_meal_prompt': 'Birinchi taomni qo\'shish uchun kamerani bosing!',
    'meal_details': 'Taom tafsilotlari',
    'retake': 'Qayta olish',
    'add_meal': 'Taom qo\'shish',
  },
};

// A real app would get this from user preferences or browser settings
const lang: 'en' | 'ru' | 'uz' = 'en';

export const t = (key: keyof typeof translations['en']): string => {
  return translations[lang][key] || key;
};