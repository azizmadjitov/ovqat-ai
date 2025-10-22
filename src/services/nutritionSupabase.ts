import { supabase } from '../lib/supabase';

export type NutritionResult = {
  title: string;
  description: string;
  takenAtISO: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  healthScore_10: number;
};

/**
 * Analyze meal image using Supabase Edge Function + OpenAI Vision API
 * @param file Image file to analyze
 * @param servingCount Number of servings (not used in initial analysis)
 * @returns Promise<NutritionResult> Nutritional information
 */
export async function analyzeMeal(file: File, servingCount: number = 1): Promise<NutritionResult> {
  // Check if we should use mock data
  const useMock = import.meta.env?.VITE_USE_MOCK === "1" || import.meta.env?.VITE_USE_MOCK === "true";
  
  console.log('🍽️ analyzeMeal called with:', { useMock, servingCount, fileName: file.name, fileSize: file.size });
  
  if (useMock) {
    // Return mock data for testing
    const mockData = {
      title: "Grilled Chicken Salad",
      description: "A healthy and delicious salad featuring grilled chicken, fresh greens, cherry tomatoes, and a light vinaigrette dressing.",
      takenAtISO: new Date().toISOString(),
      calories: 380,
      protein_g: 35,
      carbs_g: 22,
      fat_g: 18,
      fiber_g: 8,
      healthScore_10: 8
    };
    console.log('✅ Returning mock data:', mockData);
    return mockData;
  }

  try {
    console.log('🚀 Using Vercel API for analysis');
    
    // Compress the image to ≤1024 px
    const compressedFile = await compressImage(file);
    console.log('✅ Image compressed successfully');
    
    // Convert to base64
    const base64Data = await fileToBase64(compressedFile);
    console.log('✅ Image converted to base64');
    
    // Call Vercel API
    const response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        model: 'gpt-4o-mini'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Vercel API error:', errorData);
      
      // Check if it's an API key error
      if (errorData.error && errorData.error.includes('invalid_api_key')) {
        throw new Error('OpenAI API key is invalid or expired. Please update your API key at https://platform.openai.com/api-keys');
      }
      
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ Vercel API response:', data);
    
    // Return the nutrition data
    return data as NutritionResult;
    
  } catch (error) {
    console.error('❌ ERROR in analyzeMeal:', error);
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    
    // Return minimal result as fallback
    return {
      title: "Meal",
      description: error instanceof Error ? `Error: ${error.message}` : "Analysis failed",
      takenAtISO: new Date().toISOString(),
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      healthScore_10: 0
    };
  }
}

/**
 * Convert file to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image to ≤1024 px
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
    
    img.onload = () => {
      console.log('📐 Image loaded, original dimensions:', img.width, 'x', img.height);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.log('⚠️ Could not get canvas context, returning original file');
        resolve(file);
        return;
      }
      
      // Calculate new dimensions (max 1024px)
      let { width, height } = img;
      const maxSize = 1024;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      console.log('📏 Compressed dimensions:', width, 'x', height);
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
          console.log('✅ Image compressed, new size:', compressedFile.size);
          resolve(compressedFile);
        } else {
          console.log('⚠️ Blob creation failed, returning original file');
          resolve(file);
        }
      }, 'image/jpeg', 0.85);
    };
    
    img.onerror = () => {
      console.log('⚠️ Image loading error, returning original file');
      resolve(file);
    };
  });
}
