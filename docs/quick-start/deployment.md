# Deployment Quick-Start Guide

This guide provides step-by-step instructions for deploying the Next.js Better Auth project to Cloudflare Pages.

## Overview

The project is configured for deployment to Cloudflare Pages using the following:

- **Cloudflare Pages** - For hosting the Next.js application
- **@cloudflare/next-on-pages** - For optimizing Next.js for Cloudflare Pages
- **Wrangler** - Cloudflare's command-line tool for deployment

## Prerequisites

Before deploying, ensure you have:

1. A Cloudflare account
2. The Wrangler CLI installed: `npm install -g wrangler`
3. Authentication with Cloudflare: `wrangler login`
4. A production-ready build of your application

## Deployment Steps

### 1. Prepare Your Environment Variables

Create a `.env.production` file with your production environment variables:

```
# Database (Turso)
DATABASE_URL="libsql://your-production-db.turso.io"
DATABASE_AUTH_TOKEN="your-production-token"

# Auth
AUTH_SECRET="your-production-auth-secret"

# Email Service
RESEND_API_KEY="your-production-resend-api-key"
EMAIL_FROM="no-reply@yourdomain.com"
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
```

You'll need to set these as environment variables in your Cloudflare Pages dashboard.

### 2. Configure the Deployment Settings

Verify your `wrangler.jsonc` file has the correct settings:

```jsonc
{
  "name": "next-better-auth",
  "compatibility_date": "2023-12-01",
  "// kv_namespaces": [
    {
      "binding": "MY_KV_NAMESPACE",
      "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ]
}
```

### 3. Build the Application for Cloudflare Pages

```bash
# Build the application for production
bun run pages:build
```

This command uses `@cloudflare/next-on-pages` to optimize your Next.js application for Cloudflare Pages.

### 4. Preview Your Deployment Locally

Before deploying to Cloudflare, you can preview your production build locally:

```bash
bun run preview
```

This will start a local server that simulates the Cloudflare Pages environment.

### 5. Deploy to Cloudflare Pages

Once you're satisfied with the preview, deploy to Cloudflare Pages:

```bash
bun run deploy
```

This will upload your build to Cloudflare Pages and make it available at your Cloudflare Pages URL.

## First-Time Deployment

If this is your first time deploying the project:

1. Log in to your Cloudflare dashboard: https://dash.cloudflare.com/
2. Navigate to Pages and create a new project
3. Connect your GitHub repository or upload your build files
4. Set up the build settings:
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`
5. Add your environment variables in the Cloudflare Pages dashboard
6. Deploy your site

## Environment Variables in Cloudflare

To add environment variables to your Cloudflare Pages project:

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to Settings > Environment variables
4. Add each of your environment variables from `.env.production`
5. Make sure to set the environment (Production, Preview, or both)
6. Save and trigger a new deployment

## Setting Up Cloudflare Bindings

If your application uses Cloudflare bindings (KV, D1, etc.):

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to Settings > Functions
4. Scroll to Bindings section
5. Add your bindings (KV namespaces, D1 databases, etc.)
6. Save and trigger a new deployment

## Custom Domains

To set up a custom domain for your application:

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to Custom domains
4. Add your custom domain
5. Follow the instructions to verify and set up DNS

## Troubleshooting Deployment Issues

### Build Failures

If your build fails:

1. Check the build logs in the Cloudflare dashboard
2. Verify all dependencies are installed
3. Ensure your Next.js version is compatible with `@cloudflare/next-on-pages`
4. Check for any syntax errors or import issues

### Runtime Errors

If your application deploys but doesn't work:

1. Check the Function logs in the Cloudflare dashboard
2. Verify all environment variables are correctly set
3. Make sure your database is accessible from Cloudflare (IP restrictions)
4. Check if there are any CORS or security issues

## Post-Deployment Steps

After successful deployment:

1. Test all functionality on the live site
2. Set up monitoring and analytics
3. Configure any additional security settings
4. Set up redirects if needed

## Additional Resources

For more detailed information about deployment:

- [Deployment Process Guide](../deployment/deployment-guide-zh.md) (Chinese)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [`@cloudflare/next-on-pages` Documentation](https://github.com/cloudflare/next-on-pages)
