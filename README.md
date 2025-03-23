This is a [Next.js](https://nextjs.org/) project bootstrapped with [`c3`](https://developers.cloudflare.com/pages/get-started/c3).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### Authentication System
Comprehensive authentication system with email/password support, email verification, and password reset functionality.

### Internationalization (i18n)
Full internationalization support with English, Chinese, and Japanese languages using next-intl.

### Progressive Web App (PWA)
PWA support with offline capabilities, installability, and app-like experience for users.

### Apple Pay Integration
Secure payment processing with Apple Pay integration using Stripe as the payment processor.

## Documentation

Comprehensive documentation for this project is available in the [`docs`](./docs) directory. The documentation covers:

- **Internationalization (i18n)**: Guides for implementing and troubleshooting i18n in Next.js
- **Authentication**: Deep analysis of the authentication system
- **Database**: Configuration guides for tables and local development
- **Deployment**: Process guides for deployment
- **General**: Performance optimization, API usage, Tailwind configuration, and project analysis
- **PWA**: Implementation guide for Progressive Web App features
- **Apple Pay**: Integration guide for Apple Pay with Stripe

### Quick-Start Guides

New to the project? Check out our quick-start guides:

- [Project Setup](./docs/quick-start/project-setup.md) - Get up and running quickly
- [Authentication System](./docs/quick-start/authentication.md) - Learn how auth works
- [Internationalization](./docs/quick-start/i18n.md) - Working with multiple languages
- [Database Management](./docs/quick-start/database.md) - Drizzle ORM and Turso basics
- [Deployment](./docs/quick-start/deployment.md) - Deploy to Cloudflare Pages

### Feature Guides

- [Progressive Web App (PWA)](./docs/features/pwa/README.md) - Adding PWA support with offline capabilities
- [Apple Pay Integration](./docs/features/apple-pay/README.md) - Adding Apple Pay payment functionality

Documentation is available in both English and Chinese. See the [Documentation Index](./docs/README.md) for a complete list of available documents.

## Project Structure

```
next-better-auth-drizzle-turso-on-cf/
├── app/                     # Next.js App Router structure
│   ├── [locale]/            # Locale-specific routes
│   ├── checkout/            # Apple Pay checkout flow
│   └── api/                 # API endpoints
├── components/              # React components
│   ├── payment/             # Payment-related components
│   └── ui/                  # UI components (shadcn)
├── db/                      # Database schema and migrations
├── docs/                    # Project documentation
├── i18n/                    # Internationalization utilities
├── lib/                     # Utility functions
│   └── payment/             # Payment utility functions
├── messages/                # Translation messages
├── public/                  # Static assets
└── src/                     # Source files
    └── i18n/                # i18n configuration
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Database (Turso)
DATABASE_URL=libsql://your-database-name.turso.io
DATABASE_AUTH_TOKEN=your-auth-token

# Auth
AUTH_SECRET=your-secret-key

# Stripe (for Apple Pay)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID=merchant.your.identifier
```

## Cloudflare integration

Besides the `dev` script mentioned above `c3` has added a few extra scripts that allow you to integrate the application with the [Cloudflare Pages](https://pages.cloudflare.com/) environment, these are:
  - `pages:build` to build the application for Pages using the [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) CLI
  - `preview` to locally preview your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI
  - `deploy` to deploy your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI

> __Note:__ while the `dev` script is optimal for local development you should preview your Pages application as well (periodically or before deployments) in order to make sure that it can properly work in the Pages environment (for more details see the [`@cloudflare/next-on-pages` recommended workflow](https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md#recommended-development-workflow))

### Bindings

Cloudflare [Bindings](https://developers.cloudflare.com/pages/functions/bindings/) are what allows you to interact with resources available in the Cloudflare Platform.

You can use bindings during development, when previewing locally your application and of course in the deployed application:

- To use bindings in dev mode you need to define them in the `next.config.js` file under `setupDevBindings`, this mode uses the `next-dev` `@cloudflare/next-on-pages` submodule. For more details see its [documentation](https://github.com/cloudflare/next-on-pages/blob/05b6256/internal-packages/next-dev/README.md).

- To use bindings in the preview mode you need to add them to the `pages:preview` script accordingly to the `wrangler pages dev` command. For more details see its [documentation](https://developers.cloudflare.com/workers/wrangler/commands/#dev-1) or the [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

- To use bindings in the deployed application you will need to configure them in the Cloudflare [dashboard](https://dash.cloudflare.com/). For more details see the  [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

#### KV Example

`c3` has added for you an example showing how you can use a KV binding.

In order to enable the example:
- Search for javascript/typescript lines containing the following comment:
  ```ts
  // KV Example:
  ```
  and uncomment the commented lines below it (also uncomment the relevant imports).
- In the `wrangler.jsonc` file add the following configuration line:
  ```
  "kv_namespaces": [{ "binding": "MY_KV_NAMESPACE", "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }],
  ```
- If you're using TypeScript run the `cf-typegen` script to update the `env.d.ts` file:
  ```bash
  npm run cf-typegen
  # or
  yarn cf-typegen
  # or
  pnpm cf-typegen
  # or
  bun cf-typegen
  ```

After doing this you can run the `dev` or `preview` script and visit the `/api/hello` route to see the example in action.

Finally, if you also want to see the example work in the deployed application make sure to add a `MY_KV_NAMESPACE` binding to your Pages application in its [dashboard kv bindings settings section](https://dash.cloudflare.com/?to=/:account/pages/view/:pages-project/settings/functions#kv_namespace_bindings_section). After having configured it make sure to re-deploy your application.
