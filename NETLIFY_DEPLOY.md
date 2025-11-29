# Netlify Deployment Guide

This guide will help you deploy your Campus Cart app to Netlify.

## ✅ Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your Supabase project URL and anon key

## 🚀 Quick Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Go to Netlify Dashboard**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Click **"Add new site"** → **"Import an existing project"**

3. **Connect to Git**
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your `collage_cart` repository

4. **Build Settings** (Auto-detected from `netlify.toml`)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - ✅ These should be auto-detected

5. **Set Environment Variables** (IMPORTANT!)
   - Click **"Show advanced"** → **"New variable"**
   - Add these two variables:
     - **Variable:** `VITE_SUPABASE_URL`
       **Value:** `https://rmmpfcytckwsmtydqzex.supabase.co`
     - **Variable:** `VITE_SUPABASE_ANON_KEY`
       **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbXBmY3l0Y2t3c210eWRxemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTcxMjUsImV4cCI6MjA3OTk5MzEyNX0.AVcIj95O-9-HKnFu4HNMmPIRV3W_H8eFLAO3gZHgKUU`

6. **Deploy**
   - Click **"Deploy site"**
   - Wait for the build to complete (usually 1-2 minutes)
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   netlify init
   # Follow the prompts:
   # - Create & configure a new site
   # - Team: Choose your team
   # - Site name: (press enter for random name or enter custom)
   # - Build command: npm run build
   # - Directory to deploy: dist
   
   # Set environment variables
   netlify env:set VITE_SUPABASE_URL "https://rmmpfcytckwsmtydqzex.supabase.co"
   netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbXBmY3l0Y2t3c210eWRxemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTcxMjUsImV4cCI6MjA3OTk5MzEyNX0.AVcIj95O-9-HKnFu4HNMmPIRV3W_H8eFLAO3gZHgKUU"
   
   # Deploy
   netlify deploy --prod
   ```

## ⚙️ Configure Supabase for Production

After deployment, you **MUST** update your Supabase settings:

1. **Go to Supabase Dashboard**
   - Navigate to **Authentication** → **URL Configuration**

2. **Update URLs**
   - **Site URL:** `https://your-site-name.netlify.app`
   - **Redirect URLs:** Add `https://your-site-name.netlify.app/**`

3. **Update Email Templates (Optional)**
   - Go to **Authentication** → **Email Templates**
   - Update redirect URLs in email templates to use your Netlify domain

## 🧪 Test Your Deployment

1. Visit your Netlify site URL (e.g., `https://your-site.netlify.app`)
2. Test the login/signup flow
3. Verify that data loads from Supabase
4. Test creating items and collaborations
5. Test editing and deleting your own items

## 🌐 Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to configure your domain

## 🔄 Continuous Deployment

Netlify automatically deploys when you push to your main branch. To deploy manually:

1. Go to **Netlify Dashboard** → **Your Site** → **Deploys**
2. Click **"Trigger deploy"** → **"Deploy site"**

## 🐛 Troubleshooting

### Build Fails

- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify `vite.config.js` is correct
- Make sure `netlify.toml` exists

### Environment Variables Not Working

- Make sure variables start with `VITE_` prefix
- Redeploy after adding/changing environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are set in **Site settings** → **Environment variables**

### Supabase Connection Issues

- Verify environment variables are set correctly in Netlify
- Check Supabase project is active
- Ensure RLS policies allow public access where needed
- Update Supabase URL configuration with your Netlify domain

### 404 Errors on Routes

- The `netlify.toml` file handles redirects
- Make sure all HTML files are included in build
- Check that `dist` folder contains all files after build

### Login/Signup Not Working

- Verify Supabase URL configuration includes your Netlify domain
- Check that email confirmation is configured correctly
- Ensure environment variables are set in Netlify dashboard

## 📝 Useful Commands

```bash
# Build locally to test
npm run build

# Preview production build locally
npm run preview

# Check Netlify status
netlify status

# View deployment logs
netlify logs

# Update environment variables
netlify env:set VARIABLE_NAME "value"
```

## 🔒 Security Notes

- ✅ The Supabase anon key is safe to expose in frontend code
- ✅ RLS (Row Level Security) policies protect your data
- ❌ Never commit `.env` files with sensitive keys
- ✅ Use Netlify environment variables for production
- ✅ The anon key only allows operations permitted by your RLS policies

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**Need Help?** Check Netlify documentation or Supabase documentation for more details.

