// @ts-nocheck
// Deno runtime environment - TypeScript checks are disabled for this file
// This file runs on Supabase Edge Functions (Deno), not Node.js
// Supabase Edge Function: analyze-food
// Deploy this to: supabase/functions/analyze-food/index.ts

// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, model = 'gpt-4o-mini' } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Missing image data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare the vision prompt for nutritionist analysis
    const visionPrompt = `You are a professional nutritionist and dietitian analyzing a food photograph.

**CRITICAL FIRST STEP: Is this actually food?**

Before any analysis, answer: "Is there any food visible in this image?"

- If you see NO FOOD (landscapes, people, objects, animals, etc.) → Return: {"title": "No food detected", "confidence": 0, "description": "No food visible in image", "nutrition": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0}, "healthScore": 0}
- If you see FOOD → Continue with full analysis below

**Important context:**
- Primary focus: Uzbek, CIS, and Central Asian cuisines
- Common dishes: Plov, Lagman, Manti, Shashlik, Samsa, Shurpa, Mastava, etc.
- Also recognize dishes from other world cuisines

**Your nutritional analysis:**
As a professional dietitian, calculate:
- Total calories
- Protein (grams)
- Carbohydrates (grams)
- Fats (grams)
- Fiber (grams)
- Overall health score (0-10 scale)

**Health score criteria:**
- 8-10: Very healthy (high protein, vegetables, balanced, minimal processing)
- 5-7: Moderately healthy (balanced but may have some concerns)
- 0-4: Less healthy (high in calories, fats, or heavily processed)

**Description requirements:**
- Keep description brief: maximum 90-100 characters
- Include only key ingredients and cooking method
- Be concise and informative

Return your analysis as JSON:
{
  "title": "Dish name or description",
  "confidence": 0.95,
  "description": "Brief description max 100 chars",
  "nutrition": {
    "calories": 520,
    "protein_g": 28,
    "carbs_g": 45,
    "fat_g": 22,
    "fiber_g": 6
  },
  "healthScore": 7
}`

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
            content: 'You are a certified nutritionist and dietitian with expertise in food identification and nutritional analysis. You have deep knowledge of cuisines from around the world and can accurately estimate nutritional values based on visual assessment of food.'
          },
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
                  url: image,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || '{}'

    // Try to parse JSON directly
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Could not parse OpenAI response as JSON')
      }
    }

    // Convert to our format
    const nutritionResult = {
      title: parsed.title || "Unknown Meal",
      description: parsed.description || "",
      takenAtISO: new Date().toISOString(),
      calories: parsed.nutrition?.calories || 0,
      protein_g: parsed.nutrition?.protein_g || 0,
      carbs_g: parsed.nutrition?.carbs_g || 0,
      fat_g: parsed.nutrition?.fat_g || 0,
      fiber_g: parsed.nutrition?.fiber_g || 0,
      healthScore_10: parsed.healthScore || 0
    }

    return new Response(
      JSON.stringify(nutritionResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        title: "Meal",
        description: "",
        takenAtISO: new Date().toISOString(),
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        healthScore_10: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
