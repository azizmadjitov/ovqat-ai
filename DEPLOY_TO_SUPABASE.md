# Deploy to Supabase Hosting

This guide will help you deploy your Ovqat AI application to Supabase Hosting.

## Prerequisites

1. A Supabase account
2. A Supabase project (the same one you've already set up)
3. The built application in the `dist` folder

## Deployment Steps

### 1. Prepare Your Application

Your application has already been built and is ready for deployment:
```bash
npm run build
```

The built files are in the `dist` folder.

### 2. Create a ZIP Archive

Create a ZIP archive of your `dist` folder:
```bash
cd /Users/azizmadjitov/qoder/ovqat-ai
zip -r ovqat-ai.zip dist
```

### 3. Deploy via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Hosting** in the left sidebar
3. Click **New Site**
4. Choose **Deploy manually**
5. Upload the `ovqat-ai.zip` file you created
6. Set the following configuration:
   - **Build command**: (leave empty)
   - **Publish directory**: `dist`
   - **Environment variables**: Add any required environment variables

### 4. Configure Environment Variables

In the Supabase Hosting settings, add these environment variables:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

### 5. Set Up Custom Domain (Optional)

1. In the Hosting section, click on your deployed site
2. Go to **Custom domains**
3. Add your custom domain
4. Follow the DNS configuration instructions

### 6. Configure Redirects

To ensure routing works correctly, you may need to add a redirect rule in Supabase Hosting:

Create a `_redirects` file in your `dist` folder with this content:
```
/*    /index.html    200
```

This ensures that all routes are redirected to your index.html for client-side routing to work.

## Alternative: Using Supabase CLI (When Available)

When you have Supabase CLI installed, you can deploy with:
```bash
supabase init
supabase link --project-ref your-project-id
supabase deploy
```

## Troubleshooting

### If Images Don't Load
Make sure all image paths are relative and assets are correctly bundled.

### If API Calls Fail
Verify that your Supabase credentials are correctly set in the environment variables.

### If Routing Doesn't Work
Ensure the `_redirects` file is in your `dist` folder.

## Post-Deployment

After deployment:
1. Test all functionality
2. Verify authentication works
3. Check that the questionnaire flow works
4. Ensure images and assets load correctly

Your application should now be accessible at: `https://your-project-id.supabase.co`

## Updating Your Deployment

To update your deployment:
1. Rebuild your application: `npm run build`
2. Create a new ZIP archive
3. Upload the new ZIP file in the Supabase Hosting section
4. Redeploy the site