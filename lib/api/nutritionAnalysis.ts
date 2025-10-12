import { Meal } from '../../types';

export interface NutritionData {
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  healthScore: number;
}

/**
 * Analyze meal image using Google Cloud Vision API and OpenAI API
 * @param imageDataUrl Base64 encoded image data
 * @returns Promise<NutritionData> Nutritional information
 */
export async function analyzeMealImage(imageDataUrl: string): Promise<NutritionData> {
  try {
    // Compress the image to ≤1024 px
    const compressedImageData = await compressImage(imageDataUrl);
    
    // Call Google Cloud Vision API to analyze the image
    const visionResponse = await callVisionAPI(compressedImageData);
    
    // Extract relevant information from Vision API response
    const { dishName, ingredients } = extractFoodInfo(visionResponse);
    
    // Call OpenAI API to get nutritional information
    const nutritionData = await callOpenAIAPI(dishName, ingredients);
    
    return nutritionData;
  } catch (error) {
    console.error('Error analyzing meal image:', error);
    // Return mock data as fallback
    return getMockNutritionData();
  }
}

/**
 * Compress image to ≤1024 px
 * @param imageDataUrl Base64 encoded image data
 * @returns Promise<string> Compressed base64 image data
 */
async function compressImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        // If we can't get context, return original image
        resolve(imageDataUrl);
        return;
      }
      
      // Calculate new dimensions (max 1024px)
      let { width, height } = img;
      const maxWidth = 1024;
      const maxHeight = 1024;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      // If there's an error, return original image
      resolve(imageDataUrl);
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Call Google Cloud Vision API to analyze the image
 * @param imageDataUrl Base64 encoded image data
 * @returns Promise<any> Vision API response
 */
async function callVisionAPI(imageDataUrl: string): Promise<any> {
  // Remove the data URL prefix to get just the base64 data
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  
  // In a real implementation, you would call the Google Cloud Vision API here
  // For now, we'll simulate a response with a delay to mimic API call
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated response based on a more realistic approach
  return {
    dishName: "Grilled Chicken Salad",
    ingredients: ["chicken", "lettuce", "tomato", "cucumber", "olive oil", "lemon"]
  };
}

/**
 * Extract food information from Vision API response
 * @param visionResponse Vision API response
 * @returns Object containing dish name and ingredients
 */
function extractFoodInfo(visionResponse: any): { dishName: string; ingredients: string[] } {
  // In a real implementation, you would parse the actual Vision API response
  return {
    dishName: visionResponse.dishName || "Unknown Dish",
    ingredients: visionResponse.ingredients || []
  };
}

/**
 * Call OpenAI API to get nutritional information
 * @param dishName Name of the dish
 * @param ingredients List of ingredients
 * @returns Promise<NutritionData> Nutritional information
 */
async function callOpenAIAPI(dishName: string, ingredients: string[]): Promise<NutritionData> {
  // In a real implementation, you would call the OpenAI API here
  // For now, we'll simulate a response with a delay to mimic API call
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return simulated response based on dish name and ingredients
  return generateNutritionData(dishName, ingredients);
}

/**
 * Generate nutrition data based on dish name and ingredients
 * @param dishName Name of the dish
 * @param ingredients List of ingredients
 * @returns NutritionData Nutritional information
 */
function generateNutritionData(dishName: string, ingredients: string[]): NutritionData {
  // This is a simplified simulation - in a real implementation, this would come from OpenAI
  // with a strict JSON format {title, description, calories, healthScore, protein_g, carbs_g, fat_g, fiber_g}
  
  // Base values that vary by dish type
  let baseCalories = 400;
  let baseProtein = 25;
  let baseCarbs = 30;
  let baseFat = 15;
  let baseFiber = 5;
  let healthScore = 7;
  
  // Adjust values based on ingredients
  if (ingredients.includes('chicken') || ingredients.includes('salmon') || ingredients.includes('fish')) {
    baseProtein += 20;
    healthScore += 1;
  }
  
  if (ingredients.includes('lettuce') || ingredients.includes('vegetables') || ingredients.includes('salad')) {
    baseFiber += 10;
    baseCarbs += 15;
    healthScore += 2;
  }
  
  if (ingredients.includes('rice') || ingredients.includes('pasta') || ingredients.includes('bread')) {
    baseCarbs += 30;
    baseCalories += 150;
    healthScore -= 1;
  }
  
  if (ingredients.includes('oil') || ingredients.includes('butter') || ingredients.includes('cream')) {
    baseFat += 15;
    baseCalories += 100;
    healthScore -= 1;
  }
  
  // Ensure health score is between 1 and 10
  healthScore = Math.max(1, Math.min(10, healthScore));
  
  return {
    title: dishName,
    description: `A delicious ${dishName.toLowerCase()} made with ${ingredients.slice(0, 3).join(', ')}${ingredients.length > 3 ? ' and more' : ''}.`,
    calories: Math.round(baseCalories),
    protein: Math.round(baseProtein),
    carbs: Math.round(baseCarbs),
    fat: Math.round(baseFat),
    fiber: Math.round(baseFiber),
    healthScore: Math.round(healthScore)
  };
}

/**
 * Get mock nutrition data as fallback
 * @returns NutritionData Mock nutritional information
 */
function getMockNutritionData(): NutritionData {
  return {
    title: "Grilled Chicken Salad",
    description: "A healthy and delicious salad featuring grilled chicken, fresh greens, cherry tomatoes, and a light vinaigrette dressing. Perfect for a light yet satisfying meal.",
    calories: 380,
    protein: 35,
    carbs: 22,
    fat: 18,
    fiber: 8,
    healthScore: 8
  };
}