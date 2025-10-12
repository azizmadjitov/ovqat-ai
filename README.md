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

This app now includes AI-powered nutrition analysis using Google Cloud Vision API and OpenAI API:

- When you take a photo of your meal, the app analyzes the image to identify the dish and ingredients
- It then uses AI to estimate the nutritional content including calories, protein, carbs, fat, and fiber
- A health score is calculated based on the nutritional balance of the meal
- All analysis happens in real-time while maintaining the same user interface

To enable the full AI features, you'll need to:
1. Set up Google Cloud Vision API credentials
2. Set up OpenAI API credentials
3. Update the API configuration in [lib/api/nutritionAnalysis.ts](lib/api/nutritionAnalysis.ts)

The current implementation includes simulated API responses for demonstration purposes.