# Ovqat AI

Ovqat AI is a nutrition tracking application that helps users monitor their daily meals and nutritional intake. The app uses AI-powered food recognition to analyze meal photos and provide detailed nutritional information.

## Features

- AI-powered food recognition from photos
- Nutritional analysis (calories, protein, carbs, fat, fiber)
- Daily nutrition tracking
- Health score assessment
- Personalized nutrition goals based on user profile
- Multi-language support (English, Russian, Uzbek)

## Authentication Flow

The app now supports multiple authentication methods:

### Phone Number Authentication
Users can authenticate using their phone number with OTP verification.

### OAuth Authentication
Users can also sign in with:
- Google
- Apple

Both authentication methods are available on the login screen.

## User Flow

1. User opens the app and is presented with the LoginScreen
2. User can choose to:
   a. Enter phone number for OTP verification, or
   b. Sign in with Google or Apple
3. After authentication:
   - New users are directed to the QuestionnaireScreen to complete their profile
   - Returning users are directed to HomeScreen
4. Users can take photos of their meals
5. App analyzes meals and provides nutritional information
6. Nutritional data is tracked against daily goals

## Technical Implementation

### Frontend
- React with TypeScript
- Vite build tool
- Tailwind CSS for styling
- State-based routing (no react-router-dom)
- Responsive design with mobile-first approach

### Authentication
- Supabase Auth for user management
- Phone number verification with OTP
- OAuth providers (Google, Apple)
- Session management with automatic refresh

### Database
- Supabase PostgreSQL database
- Row Level Security (RLS) policies
- User profiles with questionnaire data
- Meal tracking with nutritional information

### AI Services
- Food recognition and analysis
- Nutritional data extraction
- Health score calculation

## Database Schema

### users

Stores basic user information linked to Supabase Auth.

Fields:
- `id` (UUID, PK) - References auth.users(id)
- `phone` (TEXT) - User's phone number (nullable for OAuth users)
- `onboarding_completed` (BOOLEAN) - Whether user has completed questionnaire
- `created_at` (TIMESTAMPTZ) - Creation timestamp

### user_profiles

Stores user questionnaire data and profile information.

Fields:
- `user_id` (UUID, PK) - References auth.users(id)
- `gender` (TEXT) - 'male' or 'female'
- `birth_year` (INTEGER) - Birth year (1900-2020)
- `weight_kg` (NUMERIC) - Weight in kg (30-300)
- `height_cm` (INTEGER) - Height in cm (120-220)
- `workout_freq` (TEXT) - 'rarely', 'regularly', or 'very_active'
- `activity_level` (TEXT) - 'sedentary', 'light', 'moderate', or 'very_active'
- `primary_goal` (TEXT) - 'lose', 'maintain', or 'gain'
- `diet_type` (TEXT) - 'balanced', 'pescetarian', 'vegetarian', or 'vegan'
- `bmi` (NUMERIC) - Calculated BMI
- `email` (TEXT) - User's email (for OAuth users)
- `full_name` (TEXT) - User's full name (for OAuth users)
- `avatar_url` (TEXT) - User's avatar URL (for OAuth users)
- `provider` (TEXT) - Authentication provider ('google' or 'apple')
- `questionnaire_completed` (BOOLEAN) - Whether user has completed questionnaire
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### user_goals

Stores calculated nutrition goals for users.

Fields:
- `user_id` (UUID, PK) - References auth.users(id)
- `goal_calories` (INTEGER) - Daily calorie goal
- `goal_protein_g` (INTEGER) - Daily protein goal (grams)
- `goal_fat_g` (INTEGER) - Daily fat goal (grams)
- `goal_carbs_g` (INTEGER) - Daily carbs goal (grams)
- `bmr` (INTEGER) - Basal Metabolic Rate
- `tdee` (INTEGER) - Total Daily Energy Expenditure
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run the development server: `npm run dev`

## Deployment

The app can be deployed to Vercel with automatic builds on git push.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT