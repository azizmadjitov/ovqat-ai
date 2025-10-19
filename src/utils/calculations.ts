export interface CalculationInput {
  gender: 'male' | 'female';
  birth_year: number;
  weight_kg: number;
  height_cm: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active';
  primary_goal: 'lose' | 'maintain' | 'gain';
}

export interface CalculationResult {
  age: number;
  bmi: number;
  bmr: number;
  tdee: number;
  goal_calories: number;
  goal_protein_g: number;
  goal_fat_g: number;
  goal_carbs_g: number;
}

// Calculate age from birth year
export const calculateAge = (birthYear: number): number => {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

// Calculate BMI
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
};

// Calculate BMR using Mifflin-St Jeor formula
export const calculateBMR = (
  gender: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  age: number
): number => {
  const baseCalc = 10 * weightKg + 6.25 * heightCm - 5 * age;
  
  if (gender === 'male') {
    return Math.round(baseCalc + 5);
  } else {
    return Math.round(baseCalc - 161);
  }
};

// Get activity multiplier
export const getActivityMultiplier = (activityLevel: string): number => {
  const multipliers: Record<string, number> = {
    sedentary: 1.20,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };
  return multipliers[activityLevel] || 1.2;
};

// Calculate TDEE
export const calculateTDEE = (bmr: number, activityLevel: string): number => {
  const multiplier = getActivityMultiplier(activityLevel);
  return Math.round(bmr * multiplier);
};

// Adjust calories by goal
export const adjustCaloriesByGoal = (tdee: number, goal: 'lose' | 'maintain' | 'gain'): number => {
  const adjustments: Record<string, number> = {
    lose: 0.85,
    maintain: 1.0,
    gain: 1.12,
  };
  return Math.round(tdee * adjustments[goal]);
};

// Calculate macronutrient breakdown
export const calculateMacros = (
  goalCalories: number,
  weightKg: number,
  goal: 'lose' | 'maintain' | 'gain'
): { protein_g: number; fat_g: number; carbs_g: number } => {
  // Protein per kg
  const proteinPerKg: Record<string, number> = {
    lose: 2.0,
    maintain: 1.6,
    gain: 1.8,
  };
  
  const fatPerKg = 0.8;
  
  // Calculate protein and fat
  const protein_g = Math.round(weightKg * proteinPerKg[goal]);
  const fat_g = Math.round(weightKg * fatPerKg);
  
  // Calculate remaining calories for carbs
  const protein_cal = protein_g * 4;
  const fat_cal = fat_g * 9;
  const carb_cal = goalCalories - (protein_cal + fat_cal);
  const carbs_g = Math.round(carb_cal / 4);
  
  return {
    protein_g,
    fat_g,
    carbs_g,
  };
};

// Main calculation function
export const calculateUserGoals = (input: CalculationInput): CalculationResult => {
  const age = calculateAge(input.birth_year);
  const bmi = calculateBMI(input.weight_kg, input.height_cm);
  const bmr = calculateBMR(input.gender, input.weight_kg, input.height_cm, age);
  const tdee = calculateTDEE(bmr, input.activity_level);
  const goal_calories = adjustCaloriesByGoal(tdee, input.primary_goal);
  const macros = calculateMacros(goal_calories, input.weight_kg, input.primary_goal);
  
  return {
    age,
    bmi,
    bmr,
    tdee,
    goal_calories,
    goal_protein_g: macros.protein_g,
    goal_fat_g: macros.fat_g,
    goal_carbs_g: macros.carbs_g,
  };
};
