<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/117ORxNHIybMBWxguGL5xr-ZszgMOAeXT

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## AI-Powered Nutrition Analysis

This app uses **OpenAI GPT-4o-mini multimodal** with professional nutritionist expertise:

- **Advanced Vision Analysis**: GPT-4o-mini analyzes food images with high detail recognition
- **Regional Focus**: Optimized for **Uzbek, CIS, and Central Asian cuisines** (Plov, Lagman, Manti, Shashlik, Samsa, etc.)
- **Cost-Effective**: More affordable than GPT-4o while maintaining excellent vision capabilities
- **Professional Nutritionist Role**: AI acts as a certified nutritionist and dietitian
- **Accurate Dish Identification**: Recognizes dishes with regional priority:
  - **Primary**: Uzbek, Russian, Kazakh, Kyrgyz, Tajik, Turkmen cuisines
  - **Secondary**: Other world cuisines when applicable
- **Detailed Nutritional Breakdown**: Calculates calories, protein, carbs, fats, and fiber based on:
  - Visible ingredients and their quantities
  - Cooking methods (fried, grilled, steamed, baked, raw)
  - Portion size estimation using standard serving sizes
  - Hidden ingredients (cooking oils, sauces, dressings)
- **Health Score Assessment**: Professional 0-10 rating based on nutritional balance
- **Concise Descriptions**: Brief, informative descriptions (max 90-100 characters)
- **Visual-First Analysis**: Examines colors, textures, cooking style, plating, and text labels

**Professional Calculation Method:**
- Uses food science formula: calories ≈ (4×protein + 4×carbs + 9×fat)
- Considers all macro and micronutrients
- Accounts for cooking methods that affect nutrition

To enable the AI features:
1. Set `VITE_OPENAI_API_KEY` in your environment variables with your OpenAI API key
2. The app uses GPT-4o-mini model with vision capabilities and nutritionist expertise
3. Set `VITE_USE_MOCK="0"` to use real API (set to "1" for mock data)

**Why GPT-4o-mini Multimodal:**
- Cost-effective solution for production use
- Single API call for complete analysis (vision + nutrition calculation)
- Professional-grade nutritional assessment with regional cuisine expertise
- High accuracy in identifying Central Asian and CIS dishes
- Understanding of local food culture and traditional recipes