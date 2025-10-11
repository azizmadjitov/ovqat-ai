
export enum Screen {
  Home = 'HOME',
  Camera = 'CAMERA',
  Result = 'RESULT',
}

export interface Macros {
  protein: number;
  fat: number;
  carbs: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  macros: Macros;
  imageUrl: string;
}

export interface DailyGoal {
  calories: number;
  macros: Macros;
}
