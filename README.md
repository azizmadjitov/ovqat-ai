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

This app uses **OpenAI Vision API (GPT-4o)** for advanced food recognition and nutrition analysis:

- When you take a photo of your meal, the app uses GPT-4o Vision to analyze the image directly
- The AI identifies the dish, ingredients, and preparation method from the photo
- It calculates nutritional content including calories, protein, carbs, fat, and fiber
- A health score (0-10) is assigned based on nutritional balance
- **Global cuisine recognition** - identifies dishes from all world cuisines (Asian, European, American, African, Middle Eastern, etc.)
- **Visual-first analysis** - bases identification on what it sees in the image
- All analysis happens in real-time with a single API call

To enable the AI features:
1. Set `VITE_OPENAI_API_KEY` in your environment variables with your OpenAI API key
2. The app uses GPT-4o model which has built-in vision capabilities
3. Set `VITE_USE_MOCK="0"` to use real API (set to "1" for mock data)

**Benefits of OpenAI Vision over Google Vision:**
- Direct image analysis without intermediate label extraction
- Better understanding of food context and cultural dishes
- More accurate identification of complex meals
- Single API call for both recognition and nutrition calculation