# Quick-Start Guides

Welcome to the Next.js Better Auth project with Drizzle ORM, Turso database, and Cloudflare integration! These quick-start guides are designed to help you get up and running with the project as quickly as possible.

## Guide Structure

The quick-start guides are organized into the following sections:

1. [Project Setup](./project-setup.md) - Getting the project running locally
2. [Authentication System](./authentication.md) - Understanding and working with the auth system
3. [Internationalization (i18n)](./i18n.md) - Working with the multi-language support
4. [Database Management](./database.md) - Understanding the Drizzle ORM and Turso integration
5. [Deployment Guide](./deployment.md) - How to deploy the application

## Project Overview

This project is a Next.js application that provides a complete authentication system with:

- User registration and login
- Email verification
- Password reset functionality
- Internationalization support (English, Chinese, Japanese)
- Database integration with Drizzle ORM and Turso
- Cloudflare deployment configuration

### Key Technologies

- **Next.js 14+** with App Router
- **next-intl** for internationalization
- **Drizzle ORM** for database operations
- **Turso** (SQLite-based) database
- **Cloudflare Pages** for deployment
- **Tailwind CSS** with shadcn/ui for styling
- **TypeScript** for type safety

### Project Structure

```
next-better-auth-drizzle-turso-on-cf/
├── app/                    # Next.js App Router structure
│   ├── [locale]/           # Locale-specific routes
│   ├── (auth)/             # Authentication routes
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # UI components (shadcn)
│   └── dashboard/          # Dashboard-specific components
├── db/                     # Database schema and migrations
├── i18n/                   # Internationalization utilities
├── lib/                    # Utility functions and helpers
├── messages/               # Translation messages
├── public/                 # Static assets
└── docs/                   # Project documentation
```

## Getting Started Quickly

If you're in a hurry and just want to get the project running:

1. Clone the repository
2. Run `bun install` to install dependencies
3. Configure your database connection in the environment variables
4. Run `bun dev` to start the development server
5. Visit `http://localhost:3000` to see the application

For detailed instructions, refer to the [Project Setup](./project-setup.md) guide.

## Need Help?

If you encounter any issues or have questions, refer to the detailed documentation in the main [docs](../) directory or reach out to the project maintainers.
