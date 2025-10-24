# Ovqat AI - AI-Powered Nutrition Tracker

> **Smart food tracking powered by AI vision**  
> Take a photo → Get instant nutrition analysis → Track your goals

Ovqat AI is a mobile-first web application that uses AI to analyze food photos and provide detailed nutritional information. Built for integration with native mobile apps (iOS/Android) via WebView.

## ✨ Key Features

- 📸 **AI Food Recognition** - OpenAI Vision API analyzes photos instantly
- 📊 **Nutrition Breakdown** - Calories, protein, carbs, fat, fiber, health score
- 🎯 **Personalized Goals** - Custom targets based on age, weight, activity level
- 📅 **Meal History** - 4-day calendar strip with daily progress tracking
- 🌍 **Multilingual** - English, Russian (Русский), Uzbek (O'zbek)
- 🎨 **Auto Theme** - Follows system dark/light mode automatically
- 📱 **Native Integration** - Seamless WebView navigation with native navbar

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Native App (iOS/Android)                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  WebView                                          │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  Ovqat AI (React SPA)                       │ │  │
│  │  │  • Browser History API for navigation       │ │  │
│  │  │  • postMessage for native communication     │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           ↓                           ↓
    Backend API                  Vercel AI API
    (JWT Auth)              (Food Analysis)
           ↓
      Supabase DB
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS (custom design tokens) |
| **State** | React Hooks + localStorage cache |
| **Navigation** | Browser History API + NavigationManager |
| **Auth** | Custom JWT (Node.js backend) |
| **Database** | Supabase PostgreSQL |
| **AI** | OpenAI Vision API (via Vercel) |
| **Deployment** | Vercel (static SPA) |

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Backend API (JWT Auth)
VITE_BACKEND_URL=http://localhost:3001

# Supabase (Database only)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Analysis (Vercel)
VITE_AI_API_URL=https://ovqat-ai-backend.vercel.app
```

### 3. Database Setup

**Option A: Use existing Supabase project**
- Tables: `users`, `user_profiles`, `user_goals`, `user_meals`
- No migrations needed if already set up

**Option B: Create new Supabase project**
```sql
-- Run in Supabase SQL Editor
-- See supabase/schema.sql for full schema
```

### 4. Start Backend (JWT Auth)
```bash
cd server
npm install
npm run dev  # Runs on :3001
```

### 5. Start Frontend
```bash
npm run dev  # Runs on :3000
```

### 6. Test Authentication
```bash
# Get JWT token
curl -X POST http://localhost:3001/api/auth/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "998997961877"}'

# Open app with token
open "http://localhost:3000/?token=YOUR_TOKEN"
```

## 📁 Project Structure

```
ovqat-ai/
├── App.tsx                    # Main app component
├── components/                # React components
│   ├── HomeScreen.tsx        # Main screen with meal history
│   ├── ResultScreen.tsx      # Nutrition analysis results
│   ├── QuestionnaireScreen/  # Onboarding questionnaire
│   └── home/                 # Home screen subcomponents
├── src/
│   ├── lib/
│   │   ├── navigationManager.ts  # Browser history navigation
│   │   ├── nativeEvents.ts       # Native app communication
│   │   ├── theme.ts              # Auto theme system
│   │   └── supabase.ts           # Supabase client
│   ├── services/
│   │   ├── authService.ts        # JWT authentication
│   │   ├── mealsService.ts       # Meal CRUD operations
│   │   ├── questionnaireService.ts  # User profile & goals
│   │   └── nutritionSupabase.ts  # AI food analysis
│   └── utils/
│       └── calculations.ts       # BMI, calorie calculations
├── server/                    # JWT auth backend
│   ├── index.js              # Express API
│   └── .env.example          # Backend config
├── i18n.ts                   # Translations (en, ru, uz)
├── types.ts                  # TypeScript definitions
└── NATIVE_INTEGRATION.md     # WebView integration guide
```

## 🔐 Authentication Flow

```
1. Native app opens WebView with URL: ?token=JWT_TOKEN
2. Frontend verifies token with backend API
3. Backend returns userId
4. Frontend loads user data from Supabase
5. If new user → Questionnaire
6. If existing user → Home screen
```

**Key Points:**
- ✅ No Supabase Auth (custom JWT)
- ✅ One userId across all devices
- ✅ Phone number is primary identifier
- ✅ Token passed via URL parameter

## 🗄️ Database Schema

**Tables:**
```sql
users
├── id (uuid, primary key)
├── phone (text, unique)
└── onboarding_completed (boolean)

user_profiles
├── user_id (uuid, foreign key)
├── gender, birth_year, weight_kg, height_cm
├── activity_level, primary_goal, diet_type
└── bmi (calculated)

user_goals
├── user_id (uuid, foreign key)
├── goal_calories, goal_protein_g
├── goal_carbs_g, goal_fat_g
└── bmr, tdee (calculated)

user_meals
├── user_id (uuid, foreign key)
├── meal_id (text, unique per user)
├── date, time, name, description
├── calories, protein_g, carbs_g, fat_g, fiber_g
├── health_score, language, image_url
└── created_at
```

**Indexes:**
- `idx_user_meals_user_id_date` on (user_id, date)
- Optimized for 4-day history queries

## 🎨 Key Implementation Details

### Navigation System
- **Browser History API** - Native back/forward support
- **NavigationManager** - Singleton managing screen stack
- **postMessage** - Communication with native navbar
- **Zero config** - Native app just needs to listen for `NAVIGATION_CHANGED`

### Theme System
- **Auto-sync** - Follows system `prefers-color-scheme`
- **No caching** - Always reads current system theme
- **CSS variables** - Dynamic theme tokens
- **Zero flash** - Theme applied before first render

### Performance Optimizations
- **localStorage cache** - Instant display of goals & meals
- **Parallel loading** - Goals and meals load simultaneously
- **Non-blocking saves** - Meals save in background
- **4-day limit** - Only loads recent history (80 meals max)

### AI Analysis
- **Image compression** - Resizes to ≤1024px before upload
- **Vercel Edge** - Fast serverless processing
- **OpenAI Vision** - GPT-4 Vision API
- **Multilingual** - Analysis in user's language

## 📱 Native Integration

See `NATIVE_INTEGRATION.md` for detailed WebView setup guide.

**Quick summary:**
```swift
// iOS - Listen for navigation changes
webView.evaluateJavaScript("window.addEventListener('message', (e) => { ... })")

// Show Back or Close button based on canGoBack
if (canGoBack) { showBackButton() } else { showCloseButton() }

// Handle back press
webView.evaluateJavaScript("window.history.back()")
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

**Environment variables:**
- `VITE_BACKEND_URL` - JWT auth API
- `VITE_SUPABASE_URL` - Database URL
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - DB access key
- `VITE_AI_API_URL` - AI analysis endpoint

### Backend (Railway/Render)
```bash
cd server
# Deploy to Railway or Render
# Set PORT, JWT_SECRET, DATABASE_URL
```

## 🐛 Common Issues

**Issue: "User not found"**
- Check JWT token is valid
- Verify userId exists in `users` table

**Issue: Theme not updating**
- System theme changes are auto-detected
- Check browser supports `prefers-color-scheme`

**Issue: Navigation broken**
- Ensure native app calls `window.history.back()`
- Check `NAVIGATION_CHANGED` messages are received

**Issue: AI analysis fails**
- Verify Vercel API is deployed
- Check image size < 5MB
- Ensure OpenAI API key is valid

## 📚 Documentation

- `NATIVE_INTEGRATION.md` - WebView integration guide
- `server/README.md` - Backend API documentation
- `types.ts` - TypeScript type definitions

## 🤝 Contributing

This is a production app. For major changes:
1. Open an issue first
2. Fork and create feature branch
3. Test thoroughly
4. Submit PR with clear description

## 📄 License

MIT License - see LICENSE file

---

**Built with ❤️ for smart nutrition tracking**