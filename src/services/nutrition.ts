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
    console.log('Using OpenAI Vision API for analysis');
    
    // Compress the image to ≤1024 px
    const compressedFile = await compressImage(file);
    console.log('Image compressed successfully');
    
    // Call OpenAI Vision API to analyze the image and get nutritional information
    const nutritionData = await callOpenAIVisionAPI(compressedFile);
    console.log('OpenAI Vision API response received:', nutritionData);
    
    // Return the raw nutrition data (serving amount multiplication handled at display level)
    console.log('Final result:', nutritionData);
    return nutritionData;
  } catch (error) {
    console.error('Error analyzing meal image:', error);
    
    // Handle specific API errors
    if (error instanceof Error && (error.message.includes('billing') || error.message.includes('quota'))) {
      // Return a result that indicates the API issue
      return {
        title: "Service Unavailable",
        description: "OpenAI Vision API is not available. Please check your API configuration.",
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
 * Call OpenAI Vision API to analyze food image and get nutritional information
 * @param file Image file to analyze
 * @returns Promise<NutritionResult> Nutritional information
 */
async function callOpenAIVisionAPI(file: File): Promise<NutritionResult> {
  try {
    const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result); // Keep data URL format for OpenAI Vision
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    console.log('🖼️ Calling OpenAI Vision API for food analysis...');
    
    // Create the prompt for OpenAI Vision
    const visionPrompt = `You are an expert nutritionist and global culinary specialist analyzing a food photograph.

**Your task:**
1. Identify the specific dish(es) in the image
2. Describe all visible ingredients and preparation methods
3. Estimate the portion size
4. Calculate nutritional values based on visible ingredients
5. Assign a health score (0-10)

**Analysis Guidelines:**
- Examine ALL visual elements: ingredients, colors, textures, arrangement, cooking method
- Read any visible text (menu items, labels, packaging)
- Recognize dishes from ALL cuisines worldwide (Asian, European, American, African, Middle Eastern, Oceanian)
- Base identification on visual evidence ONLY
- If confident (≥0.7), provide specific dish name; otherwise, use descriptive generic name
- Calculate nutrition dynamically using your professional knowledge
- Consider portion size, cooking oils, sauces, and hidden ingredients

**Return ONLY valid JSON in this exact format:**
{
  "title": "Specific Dish Name or Generic Description",
  "confidence": 0.85,
  "description": "Detailed description of the dish, ingredients, and preparation",
  "nutrition": {
    "calories": 580,
    "protein_g": 28,
    "carbs_g": 72,
    "fat_g": 18,
    "fiber_g": 4
  },
  "healthScore": 7
}

**Critical Rules:**
- NO regional bias - analyze based on what you SEE
- Visual evidence takes priority over assumptions
- Be globally aware of all world cuisines
- Calculate nutrition using food science: calories ≈ (4×protein + 4×carbs + 9×fat)
- Be honest about confidence - use generic names when uncertain`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o which has vision capabilities
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: visionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Data,
                  detail: 'high' // High detail for better food recognition
                }
              }
            ]
          }
        ],
        temperature: 0.0, // Deterministic behavior
        max_tokens: 800,
      }),
    });
    
    console.log('✅ OpenAI Vision API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI Vision API error response:', errorText);
      throw new Error(`OpenAI Vision API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🤖 OpenAI Vision Raw Response:', data);
    const content = data?.choices?.[0]?.message?.content || '{}';
    console.log('📄 OpenAI Vision JSON Content:', content);
    
    // Try to parse JSON directly
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Parsed AI Result:', {
        title: parsed.title,
        confidence: parsed.confidence,
        description: parsed.description?.substring(0, 100) + '...',
        calories: parsed.nutrition?.calories,
        healthScore: parsed.healthScore
      });
      console.log('🎯 Full Parsed JSON:', parsed);
      
      // Convert the response format to our NutritionResult format
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
      
      return nutritionResult;
    } catch (parseError) {
      console.error('Failed to parse OpenAI Vision response as JSON:', parseError);
      console.log('Raw content:', content);
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
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
        return nutritionResult;
      }
      
      throw new Error('Could not parse nutrition data from OpenAI Vision response');
    }
  } catch (error) {
    console.error('Error calling OpenAI Vision API:', error);
    throw error;
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
      hints: [], // No regional bias - let AI analyze based on visual evidence only
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

you must use your **world knowledge and visual reasoning** to:
1. Identify the specific dish from the photo based on visual evidence
2. Calculate realistic nutritional values based on visible ingredients and portion size
3. Provide an accurate description
4. Assign a health score

**Be globally aware**: Recognize dishes from ALL cuisines worldwide (Asian, European, American, African, Middle Eastern, etc.)

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
  "title": "Tonkotsu Ramen",
  "altNames": ["豚骨ラーメン","Japanese Pork Ramen"],
  "confidence": 0.92,
  "description": "Japanese noodle soup with rich pork bone broth, topped with sliced pork, soft-boiled egg, and green onions.",
  "nutrition": {
    "calories": 580,
    "protein_g": 28,
    "carbs_g": 72,
    "fat_g": 18,
    "fiber_g": 4
  },
  "healthScore": 7
}
\`\`\`

---

## 🔍 Analysis Methodology

As a professional nutritionist and global culinary expert, follow this process:

### Step 1: Visual Analysis from Labels
- **Examine ALL visual elements** thoroughly
- Analyze the Google Vision labels to understand ingredients
- Identify preparation methods from label context (fried, steamed, grilled, raw, etc.)
- Estimate portion size from object detection
- Look for distinctive visual markers (colors, textures, arrangement)

### Step 2: OCR Context
- Check OCR text for dish names in ANY language/script
- Menu descriptions or ingredient lists provide strong evidence
- Use this to inform your identification confidence

### Step 3: Regional Awareness (Contextual Only)
- **IMPORTANT**: Regional hints are SUGGESTIONS, not requirements
- Consider hints to think about relevant cuisines
- **BUT**: Visual evidence ALWAYS takes priority
- **NEVER** force a regional dish if visual evidence doesn't support it
- A dish from Japan can appear in Italy, and vice versa

### Step 4: Global Expert Identification
- Use your comprehensive culinary knowledge across ALL cuisines:
  - Asian: Japanese, Chinese, Korean, Thai, Vietnamese, Indian, etc.
  - European: Italian, French, Spanish, Greek, Turkish, etc.
  - American: USA, Mexican, Brazilian, Argentinian, etc.
  - African: Ethiopian, Moroccan, Nigerian, etc.
  - Middle Eastern: Lebanese, Persian, Israeli, etc.
  - Oceanian: Australian, Polynesian, etc.
- **Be specific** when visual evidence clearly indicates a dish (e.g., "Margherita Pizza", "Pad Thai", "Plov")
- **Be descriptive** when uncertain (e.g., "Grilled chicken with rice", "Vegetable stir-fry")
- **Prioritize accuracy** over specificity
- Consider cultural variations of the same dish

### Step 5: Professional Nutrition Calculation
- Apply your nutritionist expertise to calculate macros
- Consider visible ingredients, cooking methods, and portion size
- Account for cooking oils, sauces, and hidden ingredients
- Use the fundamental energy equation: calories ≈ (4×protein + 4×carbs + 9×fat)
- Assign health score based on nutritional balance, vegetables, processing level

---

## 🚫 Critical Rules

1. **NO hardcoded data** - Use your nutritionist and dietitian knowledge to calculate everything
2. **NO regional bias** - Don't favor any particular cuisine over others
3. **Visual evidence first** - What you SEE in labels trumps regional hints
4. **NO hallucinations** - Only identify what the labels/OCR actually suggest
5. **Be globally aware** - Every dish analysis must consider worldwide cuisines
6. **CALCULATE dynamically** - Use your knowledge of food science to estimate nutrition
7. **Confidence honesty** - If unsure, use generic description and lower confidence

### Your Role:

You are a **professional nutritionist, dietitian, and world cuisine expert** analyzing food photos.

- Use your expertise to identify ingredients from labels
- Apply your global culinary knowledge to recognize dishes from ANY cuisine
- Consider preparation methods, plating styles, and cultural contexts
- Estimate portion sizes from visual context
- Calculate calories using your understanding of macronutrient energy values
- Assign health scores based on nutritional balance

**Remember**: 
- You have complete nutritional knowledge - use it, don't rely on prompts!
- You know dishes from ALL world cuisines - use that breadth!
- Visual evidence is your PRIMARY source - hints are secondary!

---

## 🎯 Deterministic Behavior

- Same input → same output (temperature = 0.0)
- Return **only valid JSON**, no explanations
- All calculations must be reflected in the output
- No random variations in responses

---

✅ **Your Mission:**  
Analyze each image using AI reasoning and comprehensive world knowledge.  
Identify dishes accurately from ANY global cuisine.  
Calculate nutrition dynamically from visual evidence.  
Never use pre-programmed templates or hardcoded values.  
Be accurate, globally aware, honest about confidence, and provide realistic estimations.`;
    
    console.log('🔍 === FOOD IDENTIFICATION DEBUG ===');
    console.log('📋 Google Vision Labels:', labels);
    console.log('📝 OCR Text:', ocrText);
    console.log('🌍 Regional Hints:', input.hints);
    console.log('📊 Input Object:', JSON.stringify(input, null, 2));
    
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
    console.log('🤖 OpenAI Raw Response:', data);
    const content = data?.choices?.[0]?.message?.content || '{}';
    console.log('📄 OpenAI JSON Content:', content);
    
    // Try to parse JSON directly
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Parsed AI Result:', {
        title: parsed.title,
        confidence: parsed.confidence,
        description: parsed.description?.substring(0, 100) + '...',
        calories: parsed.nutrition?.calories,
        healthScore: parsed.healthScore
      });
      console.log('🎯 Full Parsed JSON:', parsed);
      
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
