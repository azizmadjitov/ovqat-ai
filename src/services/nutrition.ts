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
 * Analyze meal image using Google Cloud Vision API and OpenAI API
 * @param file Image file to analyze
 * @param servingCount Number of servings
 * @returns Promise<NutritionResult> Nutritional information
 */
export async function analyzeMeal(file: File, servingCount: number = 1): Promise<NutritionResult> {
  // Check if we should use mock data
  const useMock = import.meta.env?.VITE_USE_MOCK === "1";
  
  console.log('analyzeMeal called with:', { useMock, servingCount, fileName: file.name, fileSize: file.size });
  
  if (useMock) {
    // Return mock data for testing
    const mockData = {
      title: "Grilled Chicken Salad",
      description: "A healthy and delicious salad featuring grilled chicken, fresh greens, cherry tomatoes, and a light vinaigrette dressing. Perfect for a light yet satisfying meal.",
      takenAtISO: new Date().toISOString(),
      calories: 380,
      protein_g: 35,
      carbs_g: 22,
      fat_g: 18,
      fiber_g: 8,
      healthScore_10: 8
    };
    console.log('Returning mock data:', mockData);
    return mockData;
  }

  try {
    console.log('Using real APIs for analysis');
    
    // Compress the image to ≤1024 px
    const compressedFile = await compressImage(file);
    console.log('Image compressed successfully');
    
    // Call Google Cloud Vision API to analyze the image
    const visionResponse = await callVisionAPI(compressedFile);
    console.log('Vision API response received:', JSON.stringify(visionResponse, null, 2));
    
    // Extract relevant information from Vision API response
    const { labels, ocrText } = extractFoodInfo(visionResponse);
    console.log('Extracted food info:', { labels, ocrText });
    
    // Check if we have any labels, if not, return a minimal result
    if (labels.length === 0) {
      console.warn('No labels detected in image, returning minimal result');
      return {
        title: "Unidentified Meal",
        description: "Could not identify the food items in the image. Please try another photo.",
        takenAtISO: new Date().toISOString(),
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        healthScore_10: 0
      };
    }
    
    // Call OpenAI API to get nutritional information
    const nutritionData = await callOpenAIAPI(labels, ocrText);
    console.log('OpenAI API response received:', nutritionData);
    
    // Return the raw nutrition data (serving amount multiplication handled at display level)
    console.log('Final result:', nutritionData);
    return nutritionData;
  } catch (error) {
    console.error('Error analyzing meal image:', error);
    
    // Handle specific billing error
    if (error instanceof Error && error.message.includes('billing')) {
      // Return a result that indicates the billing issue
      return {
        title: "Service Unavailable",
        description: "Google Vision API billing is not enabled. Please contact the administrator to enable billing.",
        takenAtISO: new Date().toISOString(),
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        healthScore_10: 0
      };
    }
    
    // Return minimal result as fallback
    return {
      title: "Meal",
      description: "",
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
 * Compress image to ≤1024 px
 * @param file Image file to compress
 * @returns Promise<File> Compressed image file
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
      console.log('Image loaded, original dimensions:', img.width, 'x', img.height);
      
      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        // If we can't get context, return original file
        console.log('Could not get canvas context, returning original file');
        resolve(file);
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
      
      console.log('Compressed dimensions:', width, 'x', height);
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob and create new file
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
          console.log('Image compressed successfully, new size:', compressedFile.size);
          resolve(compressedFile);
        } else {
          // If blob creation fails, return original file
          console.log('Blob creation failed, returning original file');
          resolve(file);
        }
      }, 'image/jpeg', 0.85);
    };
    
    img.onerror = () => {
      // If there's an error, return original file
      console.log('Image loading error, returning original file');
      resolve(file);
    };
  });
}

/**
 * Call Google Cloud Vision API to analyze the image
 * @param file Image file to analyze
 * @returns Promise<any> Vision API response
 */
async function callVisionAPI(file: File): Promise<any> {
  try {
    // Use the correct environment variable name as per instructions
    const apiKey = import.meta.env?.VITE_GOOGLE_VISION_API_KEY || import.meta.env?.VITE_GOOGLE_CLOUD_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Vision API key not found in environment variables');
    }
    
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    console.log('Calling Google Vision API with API key:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10,
                },
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 5,
                },
              ],
            },
          ],
        }),
      }
    );
    
    console.log('Google Vision API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API error response:', errorText);
      
      // Handle specific billing error
      if (response.status === 403 && errorText.includes('billing')) {
        throw new Error('Google Vision API billing is not enabled. Please enable billing on your Google Cloud project.');
      }
      
      throw new Error(`Google Vision API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    
    const responseData = await response.json();
    console.log('Google Vision API response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error calling Google Vision API:', error);
    throw error;
  }
}

/**
 * Extract food information from Vision API response
 * @param visionResponse Vision API response
 * @returns Object containing labels and OCR text
 */
function extractFoodInfo(visionResponse: any): { labels: string[]; ocrText: string } {
  try {
    console.log('Extracting food info from vision response:', JSON.stringify(visionResponse, null, 2));
    
    const labels: string[] = [];
    const labelAnnotations = visionResponse?.responses?.[0]?.labelAnnotations;
    
    if (Array.isArray(labelAnnotations)) {
      labelAnnotations.slice(0, 10).forEach((label: any) => {
        if (label?.description) {
          labels.push(label.description);
        }
      });
    }
    
    console.log('Extracted labels:', labels);
    
    let ocrText = '';
    const textAnnotations = visionResponse?.responses?.[0]?.textAnnotations;
    
    if (Array.isArray(textAnnotations) && textAnnotations.length > 0) {
      ocrText = textAnnotations[0]?.description || '';
    }
    
    console.log('Extracted OCR text:', ocrText);
    
    return { labels, ocrText };
  } catch (error) {
    console.error('Error extracting food info from Vision response:', error);
    return { labels: [], ocrText: '' };
  }
}

/**
 * Call OpenAI API to get nutritional information
 * @param labels Image labels from Vision API
 * @param ocrText OCR text from Vision API
 * @returns Promise<NutritionResult> Nutritional information
 */
async function callOpenAIAPI(labels: string[], ocrText: string): Promise<NutritionResult> {
  try {
    const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    // Read the prompt template
    const promptTemplate = `You are a nutrition expert AI assistant. Analyze the food image content and provide detailed nutritional information.

Image Analysis Data:
- Labels: ${labels.join(', ')}
- Text detected in image: ${ocrText}

Based on this information, provide a comprehensive nutritional analysis in the following JSON format:

{
  "title": "Descriptive name of the dish",
  "description": "Brief description of the dish and its nutritional value",
  "takenAtISO": "Current ISO timestamp",
  "calories": 0,
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "fiber_g": 0,
  "healthScore_10": 0
}

Instructions:
1. Provide realistic nutritional values based on the food items identified
2. Estimate portion sizes reasonably (assume standard serving size if not specified)
3. Health score should reflect nutritional balance (1-10, where 10 is very healthy)
4. If food cannot be clearly identified, provide a minimal result with zeros
5. Respond ONLY with the JSON object, no additional text`;
    
    console.log('Calling OpenAI API with labels:', labels);
    console.log('Calling OpenAI API with OCR text:', ocrText);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: promptTemplate,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('OpenAI API response data:', data);
    const content = data?.choices?.[0]?.message?.content || '{}';
    console.log('OpenAI API response content:', content);
    
    // Try to parse JSON directly
    try {
      const parsed = JSON.parse(content);
      console.log('Parsed JSON from OpenAI:', parsed);
      return parsed;
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from code blocks
      const jsonMatch = content.match(/```(?:json)?\s*({.*?})\s*```/s);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log('Parsed JSON from code block:', parsed);
        return parsed;
      }
      
      // If all parsing fails, throw an error
      throw new Error('Failed to parse OpenAI response as JSON: ' + content);
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
