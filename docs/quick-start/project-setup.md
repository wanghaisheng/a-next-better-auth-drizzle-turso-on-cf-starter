# Project Setup Guide

This guide will walk you through setting up the Next.js Better Auth project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.17 or higher)
- **Bun** (recommended) or npm/yarn/pnpm
- **Git**
- **A code editor** (VS Code recommended)

## Step 1: Clone the Repository

```bash
git clone [repository-url]
cd next-better-auth-drizzle-turso-on-cf
```

## Step 2: Install Dependencies

Using Bun (recommended):

```bash
bun install
```

Or using npm:

```bash
npm install
```

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the root directory
2. Copy the following variables and adjust them according to your setup:

```
# Database (Turso)
DATABASE_URL="libsql://[your-database-name]-[your-org].turso.io"
DATABASE_AUTH_TOKEN="[your-auth-token]"

# Auth
AUTH_SECRET="[generate-a-secret-string]"
# For production, set a minimum length of 32 characters
# Generate with: openssl rand -base64 32

# Email Service (optional for email verification)
RESEND_API_KEY="[your-resend-api-key]"
EMAIL_FROM="no-reply@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Setting up Turso Database

If you don't have a Turso database yet:

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. Login to Turso:
   ```bash
   turso auth login
   ```

3. Create a new database:
   ```bash
   turso db create next-auth-app
   ```

4. Get the database URL and token:
   ```bash
   turso db show next-auth-app --url
   turso db tokens create next-auth-app
   ```

5. Add these to your `.env.local` file

## Step 4: Set Up the Database Schema

Run the database migrations to create the required tables:

```bash
bun db:push
```

This will create all necessary tables for the authentication system.

## Step 5: Start the Development Server

```bash
bun dev
```

This will start the Next.js development server at `http://localhost:3000`.

## Step 6: Verify the Setup

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the homepage with authentication options
3. Try registering a new user to test the setup

## Common Issues and Solutions

### Database Connection Errors

If you encounter database connection issues:

1. Verify your `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in the `.env.local` file
2. Ensure your IP address is allowed in Turso's firewall settings
3. Check if your Turso credentials are still valid

### Missing Environment Variables

If you see errors related to missing environment variables:

1. Ensure your `.env.local` file exists in the root directory
2. Verify all required environment variables are set
3. Restart the development server after making changes

### Bun Command Not Found

If the `bun` command is not found:

1. Install Bun using the official installer:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
2. Or use npm commands instead (e.g., `npm run dev` instead of `bun dev`)

## Next Steps

Now that you have the project set up, you can:

1. Explore the [Authentication System](./authentication.md) guide to understand how authentication works
2. Learn about the [Internationalization (i18n)](./i18n.md) features
3. Understand the [Database Management](./database.md) with Drizzle ORM

If you need to deploy the application, refer to the [Deployment Guide](./deployment.md).
