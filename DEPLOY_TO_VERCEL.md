# Deploy to Vercel

This guide will help you deploy your Ovqat AI application to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account
3. Your application code pushed to a GitHub repository

## Deployment Steps

### 1. Push Your Code to GitHub

If you haven't already, push your code to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/
2. Sign in or create an account
3. Click "New Project"
4. Import your GitHub repository

### 3. Configure Project Settings

Vercel should automatically detect the settings for your project:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. Set Environment Variables

In the Vercel project settings, add these environment variables:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

### 5. Deploy

Click "Deploy" and wait for the deployment to complete.

## Manual Deployment with Vercel CLI

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
```

Follow the prompts to configure your project.

### 3. Set Environment Variables

After deployment, set the environment variables:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_OPENAI_API_KEY
```

## Configuration Details

### vercel.json
Your project includes a `vercel.json` file with the following configuration:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures that all routes are redirected to your index.html for client-side routing to work properly.

## Environment Variables

Make sure to set these environment variables in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_SUPABASE_URL | Your Supabase project URL | https://your-project-id.supabase.co |
| VITE_SUPABASE_ANON_KEY | Your Supabase anonymous key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| VITE_OPENAI_API_KEY | Your OpenAI API key | sk-proj-... |

## Troubleshooting

### If Images Don't Load
Make sure all image paths are relative and assets are correctly bundled.

### If API Calls Fail
Verify that your Supabase credentials are correctly set in the environment variables.

### If Routing Doesn't Work
Ensure the `vercel.json` file is in your project root.

### If Build Fails
Check that all dependencies are correctly listed in `package.json`.

## Post-Deployment

After deployment:
1. Test all functionality
2. Verify authentication works
3. Check that the questionnaire flow works
4. Ensure images and assets load correctly

Your application should now be accessible at: `https://your-project-name.vercel.app`

## Updating Your Deployment

To update your deployment:
1. Push your changes to GitHub
2. Vercel will automatically redeploy
3. Or run `vercel --prod` to deploy manually