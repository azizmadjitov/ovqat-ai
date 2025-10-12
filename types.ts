export enum Screen {
  Home = 'HOME',
  Camera = 'CAMERA',
  Result = 'RESULT',
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
}

export interface DailyGoal {
  calories: number;
  macros: Macros;
}