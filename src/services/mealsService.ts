import { supabase } from '../lib/supabase';
import { Meal } from '../../types';

export const mealsService = {
  /**
   * Save a meal to the database
   */
  async saveMeal(userId: string, meal: Meal): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_meals')
        .insert({
          user_id: userId,
          meal_id: meal.id,
          date: meal.date,
          time: meal.time,
          name: meal.name,
          description: meal.description,
          image_url: meal.imageUrl,
          calories: meal.calories,
          protein_g: meal.macros.protein,
          carbs_g: meal.macros.carbs,
          fat_g: meal.macros.fat,
          fiber_g: meal.macros.fiber,
          health_score: meal.healthScore,
          language: meal.language || 'en',
        });

      if (error) {
        console.error('Error saving meal:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error saving meal:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Load meals for the last 4 days (today and 3 days back)
   * Optimized with proper indexing and minimal data transfer
   */
  async loadMeals(userId: string): Promise<{ success: boolean; meals?: Meal[]; error?: string }> {
    try {
      // Calculate date range: today and 3 days back (for calendar strip -3 to 0)
      // Use local date to avoid timezone issues
      const today = new Date();
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(today.getDate() - 3);

      // Format dates in local timezone
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startDate = formatLocalDate(fourDaysAgo);
      const endDate = formatLocalDate(today);

      console.log(`📅 Loading meals from ${startDate} to ${endDate}`);

      const { data, error } = await supabase
        .from('user_meals')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: false })
        .limit(80); // Max 20 meals per day * 4 days

      if (error) {
        console.error('Error loading meals:', error);
        return { success: false, error: error.message };
      }

      // Transform database records to Meal objects
      const meals: Meal[] = (data || []).map((record: any) => ({
        id: record.meal_id,
        date: record.date,
        time: record.time,
        name: record.name,
        description: record.description,
        imageUrl: record.image_url,
        calories: record.calories,
        macros: {
          protein: record.protein_g,
          carbs: record.carbs_g,
          fat: record.fat_g,
          fiber: record.fiber_g,
        },
        healthScore: record.health_score,
        language: record.language || 'en',
      }));

      return { success: true, meals };
    } catch (error) {
      console.error('Unexpected error loading meals:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Delete a meal
   */
  async deleteMeal(userId: string, mealId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_meals')
        .delete()
        .eq('user_id', userId)
        .eq('meal_id', mealId);

      if (error) {
        console.error('Error deleting meal:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting meal:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};
