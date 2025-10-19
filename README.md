# Ovqat AI - AI-Powered Nutrition Analysis App

Ovqat AI is an innovative nutrition analysis application that leverages artificial intelligence to help users track their meals and achieve their health goals. Simply take a photo of your food, and Ovqat AI will analyze its nutritional content, providing detailed information about calories and macronutrients.

## Features

- 📸 **AI-Powered Food Recognition**: Advanced computer vision identifies food items in photos
- 📊 **Nutritional Analysis**: Detailed breakdown of calories, proteins, carbs, and fats
- 🎯 **Personalized Goals**: Custom nutrition targets based on user profile and objectives
- 📱 **Mobile-First Design**: Optimized for smartphones with intuitive interface
- 🌍 **Multilingual Support**: Available in Russian and Uzbek languages
- 🔐 **Secure Authentication**: Phone-based authentication without complex OTP flows

## Technology Stack

- **Frontend**: React with TypeScript, Vite build tool
- **Backend**: Supabase (Database, Authentication, Storage)
- **AI/ML**: OpenAI Vision API for food recognition
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone git@github.com:azizmadjitov/ovqat-ai.git
cd ovqat-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

### Supabase Setup

1. Create a new Supabase project at https://app.supabase.com/
2. Get your project credentials from Settings → API
3. Update your `.env` file with the new credentials:
   ```
   VITE_SUPABASE_URL=your_new_project_url
   VITE_SUPABASE_ANON_KEY=your_new_anon_key
   ```
4. Enable Anonymous Sign-ins in Authentication → Settings
5. Apply database migrations:
   Apply these files in order in your Supabase SQL Editor:
   - supabase/migrations/001_initial_schema.sql
   - supabase/migrations/002_security_fixes.sql
   - supabase/migrations/003_fix_function_search_path.sql
   - supabase/migrations/004_fix_user_account_linking.sql

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Building for Production

```bash
npm run build
```

## Project Structure

```
ovqat-ai/
├── components/          # React components
├── src/
│   ├── lib/            # Supabase client configuration
│   ├── services/       # Business logic and API services
│   └── utils/          # Utility functions
├── supabase/
│   └── migrations/     # Database schema migrations
├── assets/             # Static assets
├── styles/             # Global styles
└── types.ts           # TypeScript type definitions
```

## Authentication Flow

1. User enters phone number on LoginScreen
2. App checks if user exists using secure `check_phone_exists` function
3. If user exists, creates anonymous session and links to existing data
4. If new user, creates anonymous session and new user record
5. User completes questionnaire if onboarding not completed
6. App loads personalized nutrition goals

## Database Schema

The application uses three main tables:

1. `users` - Core user information and authentication
2. `user_profiles` - Detailed user profile from questionnaire
3. `user_goals` - Calculated nutrition goals

All tables have Row Level Security (RLS) policies for data protection.

## Recent Fixes

### Fixed User Account Linking Issue
Resolved the issue where users logging in with existing phone numbers were creating duplicate accounts instead of linking to their existing account. The updated implementation:
- Uses an enhanced `check_phone_exists` database function that returns both existence status and user ID
- Properly links new anonymous sessions to existing user data
- Prevents duplicate user creation for the same phone number
- Enables consistent cross-device authentication

### Fixed Phone Number Format
Updated phone number storage format to store numbers without the "+" sign (e.g., 998997961877 instead of +998997961877) for consistency and to fix empty phone number issues in the database.

### Fixed Authentication Session Expiration
Enhanced the questionnaire submission flow with automatic session refresh capabilities to prevent "Authentication session expired" errors.

### Fixed User Identification by Phone Number
Enhanced the createUserByPhone function to properly identify users by their phone number as the primary identifier, ensuring cross-device authentication works correctly and maintaining all user data integrity.

### Fixed Database Query Errors
Resolved "cannot coerce the result to a single json object" errors by removing problematic .single() calls and adding proper error handling for database operations.

### Fixed Supabase Security Warnings
Addressed all security concerns reported by Supabase Security Advisor:
- Removed custom RLS policies on auth.users
- Restricted all table access to authenticated users only
- Scoped all RLS policies to auth.uid()
- Implemented secure phone number checking via function

### Fixed Duplicate Users Issue
Enhanced phone number checking and user identification to prevent duplicate users from being created when the same phone number is entered multiple times.

## Deployment to Vercel

### Automatic Deployment
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set these environment variables in Vercel:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
4. Vercel will automatically detect the build settings and deploy your app

### Manual Deployment
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```

## Environment Variables

```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Authentication Issues
- Ensure phone numbers are consistently formatted without + prefix
- Check that Supabase RLS policies are correctly applied
- Verify environment variables are correctly set

### AI Analysis Not Working
- Confirm OpenAI API key is valid and has vision capabilities
- Check internet connection
- Verify image format and size requirements

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the Vision API
- Supabase for the excellent backend platform
- Tailwind CSS for the styling framework