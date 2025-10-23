export enum Screen {
  Login = 'LOGIN',
  Questionnaire = 'QUESTIONNAIRE',
  Home = 'HOME',
  Camera = 'CAMERA',
  Result = 'RESULT',
  Settings = 'SETTINGS',
}

export interface Macros {
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number; // Optional for backward compatibility
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  macros: Macros;
  imageUrl: string;
  date: string; // ISO date string (YYYY-MM-DD)
  description?: string; // Optional for backward compatibility
  healthScore?: number; // Health score out of 10
  language?: 'en' | 'ru' | 'uz'; // Language when meal was added
}

export interface DailyGoal {
  calories: number;
  macros: Macros;
}

// User profile data from questionnaire
export interface UserProfile {
  id: string;
  phone_number: string;
  name?: string;
  age: number;
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight';
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fat: number;
  language: 'en' | 'ru' | 'uz';
  questionnaire_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Questionnaire form data (8 steps)
export interface QuestionnaireData {
  gender: 'male' | 'female';
  birth_year: number;
  workout_freq: 'rarely' | 'regularly' | 'very_active';
  weight: number; // kg
  height: number; // cm
  primary_goal: 'lose' | 'maintain' | 'gain';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active';
  diet_type: 'balanced' | 'pescetarian' | 'vegetarian' | 'vegan';
}

// Database types
export interface DBUser {
  id: string;
  phone: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface DBUserProfile {
  user_id: string;
  gender: 'male' | 'female';
  birth_year: number;
  weight_kg: number;
  height_cm: number;
  workout_freq: 'rarely' | 'regularly' | 'very_active';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active';
  primary_goal: 'lose' | 'maintain' | 'gain';
  diet_type: 'balanced' | 'pescetarian' | 'vegetarian' | 'vegan';
  bmi: number;
  updated_at: string;
}

export interface DBUserGoals {
  user_id: string;
  goal_calories: number;
  goal_protein_g: number;
  goal_fat_g: number;
  goal_carbs_g: number;
  bmr: number;
  tdee: number;
  updated_at: string;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}
