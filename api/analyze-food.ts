import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, model = 'gpt-4o-mini', language = 'en' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Map language codes to full language names
    const languageNames: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
      'uz': 'Uzbek'
    };
    const languageName = languageNames[language] || 'English';

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Master Vision Prompt for Food Detection, Portion Estimation and Nutrition Analysis
    const visionPrompt = `You are a professional food detector, nutritionist, and dietitian analyzing a food photograph.

**CRITICAL INSTRUCTION: Respond ONLY in ${languageName} language.**
**CRITICAL OUTPUT: STRICT JSON, no prose outside JSON.**

STEP 1 — Food detection:
- If NO FOOD visible (landscapes, people, animals, menus, packaging, logos, ads, drawings, empty plates, utensils only) → return:
{
  "isFood": false,
  "overallConfidence": 0,
  "items": [],
  "portion": null,
  "nutrition": null,
  "healthScore": 0,
  "description": "No food visible",
  "language": "${languageName}"
}

STEP 2 — If FOOD visible → continue.

**Context:**
- Focus on Uzbek, CIS, and Central Asian cuisines (Plov, Lagman, Manti, Shashlik, Samsa, Shurpa, Mastava, etc.)
- Also recognize international dishes
- Always prefer local dish names when possible

**MANDATORY JSON STRUCTURE:**
{
  "isFood": true,
  "overallConfidence": 0.0–1.0,
  "items": [
    {
      "title": "Dish/component name in ${languageName}",
      "bbox": [x,y,w,h],
      "confidence": 0.0–1.0
    }
  ],
  "portion": {
    "mass_g": {
      "value": number,      // e.g. 380
      "low": number,
      "high": number,
      "confidence": 0.0–1.0
    },
    "method": "plate_area_estimate|container_ref|heuristic|db_typical",
    "scaleRef": {"type":"plate|bowl|cup|fork|hand|unknown", "plate_diameter_cm": number|null, "confidence": 0.0–1.0},
    "density_used": {"class":"leafy_salad|cooked_rice|stew|grilled_meat|bread", "g_per_ml": number}
  },
  "nutrition": {            // FOR portion.mass_g.value
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number
  },
  "healthScore": int(0–10),
  "description": "≤100 chars, ${languageName}, key ingredients + method",
  "assumptions": ["short notes: oil, sauces, plate size, density"],
  "followUpQuestions": ["if confidence <0.75, add 1–3 clarifying questions"],
  "language": "${languageName}"
}

**Health score criteria:**
- 8–10: Very healthy (vegetables, lean protein, balanced, minimal processing)
- 5–7: Moderately healthy
- 0–4: Less healthy (high fat, calorie-dense, heavily processed)

**RULES:**
- Portion.mass_g is REQUIRED → used for UI badge under the food photo
- If uncertainty: provide ranges and confidence
- No impossible precision; round reasonably
- Always keep description ≤100 chars
- JSON only, no extra text

**ACCURACY RULES:**
- If overallConfidence < 0.70 → set isFood=false (no guessing).
- If portion.mass_g.confidence < 0.65 → do NOT output nutrition; instead add followUpQuestions and return minimal JSON with portion estimate only.
- Try to detect a scale reference for better accuracy
- For multiple items, focus on the **dominant** item
- Sanity checks:
  - Reject mass < 20 g or > 1200 g for a single plated portion unless explicit container_ref.
  - Reject calories > 2000 kcal for a single plated portion.`;

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a certified nutritionist and dietitian with expertise in food identification and nutritional analysis. You have deep knowledge of cuisines from around the world and can accurately estimate nutritional values based on visual assessment of food.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: visionPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';

    // Try to parse JSON directly
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse OpenAI response as JSON');
      }
    }

    // Check if food was detected
    const isFood = parsed.isFood !== false && (parsed.overallConfidence || parsed.confidence || 0) > 0;
    
    // Extract main item title (from items array or fallback to old format)
    const mainTitle = parsed.items?.[0]?.title || parsed.title || 'Unknown Meal';
    
    // Convert to our format
    const nutritionResult = {
      title: mainTitle,
      description: parsed.description || '',
      takenAtISO: new Date().toISOString(),
      calories: parsed.nutrition?.calories || 0,
      protein_g: parsed.nutrition?.protein_g || 0,
      carbs_g: parsed.nutrition?.carbs_g || 0,
      fat_g: parsed.nutrition?.fat_g || 0,
      fiber_g: parsed.nutrition?.fiber_g || 0,
      healthScore_10: parsed.healthScore || 0,
      isFood: isFood,
      portion: parsed.portion || null, // Add portion data
    };

    return res.status(200).json(nutritionResult);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      title: 'Meal',
      description: '',
      takenAtISO: new Date().toISOString(),
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      healthScore_10: 0,
      isFood: false,
    });
  }
}
