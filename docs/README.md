# Project Documentation

This directory contains comprehensive documentation for the Next.js Better Auth project with Drizzle ORM, Turso database, and Cloudflare integration. All project documentation has been centralized here for easier access and maintenance.

## Quick-Start Guides

New to the project? Start here:

- [Quick-Start Overview](./quick-start/README.md) - Introduction to the project and guides
- [Project Setup](./quick-start/project-setup.md) - Get the project running locally
- [Authentication System](./quick-start/authentication.md) - Working with the auth system
- [Internationalization (i18n)](./quick-start/i18n.md) - Multi-language support
- [Database Management](./quick-start/database.md) - Working with Drizzle ORM and Turso
- [Deployment Guide](./quick-start/deployment.md) - Deploying to Cloudflare Pages

## Feature Guides

Detailed guides for specific features:

- [Progressive Web App (PWA)](./features/pwa/README.md) - Adding PWA support with offline capabilities
  - [Implementation Example](./features/pwa/implementation-example.md) - Step-by-step PWA implementation
- [Apple Pay Integration](./features/apple-pay/README.md) - Adding Apple Pay payment functionality
  - [Implementation Example](./features/apple-pay/implementation-example.md) - Step-by-step Apple Pay implementation

## Documentation Structure

### Internationalization (i18n)
- [Hydration Guide](./i18n/hydration-guide.md) - Guide to solving hydration issues in Next.js i18n implementations
- [Implementation Guide](./i18n/implementation-guide.md) - Guide for implementing internationalization in Next.js
- [Dynamic Data Guide (Chinese)](./i18n/dynamic-data-guide-zh.md) - Guide for handling dynamic data with i18n in Chinese
- [Implementation Guide (Chinese)](./i18n/implementation-guide-zh.md) - Guide for i18n implementation in Chinese
- [Dynamic Data in Next.js (English)](./i18n/en/02-dynamic-data.md) - Handling dynamic data with Next.js internationalization
- [Implementation in Next.js (English)](./i18n/en/01-implementation.md) - Basic i18n implementation in Next.js
- [Hydration in Next.js (English)](./i18n/en/03-hydration.md) - Solving hydration issues with Next.js i18n

### Authentication
- [Authentication System Deep Analysis (Chinese)](./auth/auth-system-deep-analysis-zh.md) - In-depth analysis of the authentication system

### Database
- [Table Prefix Configuration Guide (Chinese)](./db/table-prefix-config-guide-zh.md) - Guide for configuring table name prefixes
- [Local Development Database Configuration (Chinese)](./db/local-dev-db-config-guide-zh.md) - Guide for configuring the database for local development

### Deployment
- [Deployment Process Guide (Chinese)](./deployment/deployment-guide-zh.md) - Guide for deploying the application

### General
- [Performance Optimization (Chinese)](./general/performance-optimization-zh.md) - Performance optimization recommendations
- [API Documentation and Usage Examples (Chinese)](./general/api-docs-usage-examples-zh.md) - API documentation with usage examples
- [Tailwind Configuration Guide (Chinese)](./general/tailwind-config-guide-zh.md) - Guide for configuring and updating Tailwind CSS
- [Project Analysis and Extension Guide (Chinese)](./general/project-analysis-extension-guide-zh.md) - Analysis of the project with extension recommendations

## Languages

Documentation is available in multiple languages:
- English
- Chinese (中文)

## Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate category directory
2. Use clear and descriptive filenames (preferably with language suffix if non-English)
3. Update this README.md to include the new documentation
4. Use Markdown formatting for consistent styling

## Documentation Conventions

- All documentation files use the `.md` extension
- Non-English documentation includes a language suffix in the filename (e.g., `-zh` for Chinese)
- All documentation follows a clear structure with headings, code examples, and explanations
