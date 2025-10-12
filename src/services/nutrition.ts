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
    
    // Create the input object as specified in the prompt
    const input = {
      labels: labels,
      objects: [], // We don't have object detection yet
      ocr: ocrText,
      locale: "en-US", // Default locale
      hints: ["Central Asia", "Uzbekistan", "CIS"], // Prioritize these regions
      image_meta: {
        angle: "top-down", // Default value
        contains_chopsticks: false // Default value
      }
    };
    
    // Read the prompt template
    const promptTemplate = `You are the **Dish Naming & Nutrition Agent** for a food-logging webapp called Ovqat AI.  
**Never change UI, styles, or file structure.** Your only job is to analyze meal photos and output structured data.

---

## 🎯 Goal
Given:
- A preprocessed meal photo (already labeled by Google Vision),
- Extracted objects, OCR text, and region hints,
- User locale (e.g., \`en-US\`),

you must produce a **canonical, popular dish name** (e.g. *Lagman*, *Plov*, *Ramen*, *Pho*),  
plus a short description, nutrition values, and a health score.  
If confident (≥ 0.7), use a **specific real-world dish name**; otherwise, return a concrete generic title.

---

## 🧩 Input schema
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

---

## 🧠 Output schema
Return **only valid JSON**:
\`\`\`json
{
  "title": "Lagman",
  "altNames": ["Uyghur laghman","Uzbek lagman"],
  "confidence": 0.92,
  "description": "Hand-pulled wheat noodles with beef, peppers, and vegetables in a spiced broth.",
  "nutrition": {
    "calories": 741,
    "protein_g": 49,
    "carbs_g": 95,
    "fat_g": 24,
    "fiber_g": 6
  },
  "healthScore": 7
}
\`\`\`

---

## 🧭 Naming rules
1. Pick the **most specific real dish** when confidence ≥ 0.7.  
   Examples:  
   - Central Asian beef noodle soup → **Lagman with beef**  
   - Cauldron rice with lamb & carrots → **Plov**  
   - Clear broth + thin rice noodles + herbs → **Pho**  
   - Flat rice noodles + peanuts + tamarind → **Pad Thai**  
   - Tortilla + al pastor cues → **Tacos al pastor**
2. 0.4–0.69 → regional name if supported by OCR/hints, else descriptive generic ("Beef noodle soup").  
3. < 0.4 → specific but generic ("Chicken salad with greens").  
4. Use OCR and hints to boost certainty (recognize Cyrillic, Latin, or regional terms).  
5. **Prioritize Central Asian, CIS, and Uzbek dishes** when relevant labels or OCR text suggest them:
   - Noodles + beef + peppers + broth → **Lagman with beef**
   - Rice + lamb + carrots + onion → **Plov**
   - Flatbread + meat + onions → **Shashlik**
   - Fried pastries + meat → **Samsa**
   - Steamed dumplings + meat → **Manty**
   - Noodles + broth + vegetables → **Mastava**
   - Flatbread + cheese → **Katta Non**
   - Rice + fish + rice → **Fish Plov**
6. Use **built-in normalization only**, e.g.:
   - Lagman / Laghman / Лагман → **Lagman**  
   - Plov / Pilaf / Плов → **Plov**  
   - Shashlik / Шашлык → **Shashlik**  
   - Samsa → **Samsa**  
   - Manty → **Manty**
   - Mastava / Mastawa → **Mastava**
   - Katta Non / Katte Non → **Katta Non**
7. No hallucinations or impossible macros.  
8. \`locale\` = \`en-US\`: keep \`title\` in English, local name in \`altNames\`.

---

## ⚖️ Nutrition logic
- Estimate per single serving.  
- Maintain caloric consistency:  
  \`≈ (4 × protein + 4 × carbs + 9 × fat) ± 10%\`.  
- If uncertain, give mid-range values but never leave zeros.

---

## 🚫 No hardcoded catalogs (very important)
- Do **not** read or write any local JSON or code-side food lists.  
- All naming and nutrition inference must be **computed dynamically** from Vision + OCR + common world knowledge.  
- You may use a small alias table *inside this prompt only* (see examples above).  
- Never persist or generate new data files in the repo.  
- If input is ambiguous, fall back safely without guessing or hallucinating.

---

## 🧮 Deterministic behavior
- Same input → same output (no randomness).  
- No network calls beyond Vision → this agent → UI.  
- Return plain JSON only. No explanations, logs, or extra keys.

---

✅ **Purpose:**  
Provide human-friendly, realistic meal names and nutritional data dynamically from Vision + OpenAI reasoning.  
Your output replaces mock data but must never alter UI or styling.`;
    
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
        temperature: 0.0, // Use deterministic behavior as specified
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
      
      // Convert the new response format to our NutritionResult format
      const nutritionResult: NutritionResult = {
        title: parsed.title || "Unknown Meal",
        description: parsed.description || "",
        takenAtISO: new Date().toISOString(),
        calories: parsed.nutrition?.calories || 0,
        protein_g: parsed.nutrition?.protein_g || 0,
        carbs_g: parsed.nutrition?.carbs_g || 0,
        fat_g: parsed.nutrition?.fat_g || 0,
        fiber_g: parsed.nutrition?.fiber_g || 0,
        healthScore_10: parsed.healthScore || 0
      };
      
      console.log('Converted nutrition result:', nutritionResult);
      return nutritionResult;
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from code blocks
      const jsonMatch = content.match(/```(?:json)?\s*({.*?})\s*```/s);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log('Parsed JSON from code block:', parsed);
        
        // Convert the new response format to our NutritionResult format
        const nutritionResult: NutritionResult = {
          title: parsed.title || "Unknown Meal",
          description: parsed.description || "",
          takenAtISO: new Date().toISOString(),
          calories: parsed.nutrition?.calories || 0,
          protein_g: parsed.nutrition?.protein_g || 0,
          carbs_g: parsed.nutrition?.carbs_g || 0,
          fat_g: parsed.nutrition?.fat_g || 0,
          fiber_g: parsed.nutrition?.fiber_g || 0,
          healthScore_10: parsed.healthScore || 0
        };
        
        console.log('Converted nutrition result:', nutritionResult);
        return nutritionResult;
      }
      
      // If all parsing fails, throw an error
      throw new Error('Failed to parse OpenAI response as JSON: ' + content);
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
