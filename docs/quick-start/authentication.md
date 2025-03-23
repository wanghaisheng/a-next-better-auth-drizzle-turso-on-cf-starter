# Authentication System Quick-Start Guide

This guide provides a quick overview of the authentication system used in this project and how to work with it as a developer.

## Overview

The authentication system in this project is built using a custom implementation that integrates with Drizzle ORM and provides features like:

- User registration and login
- Email verification
- Password reset
- Session management
- Role-based access control

## Key Files

The authentication system is primarily implemented in these files:

- `lib/auth.ts` - Core authentication implementation
- `lib/auth-hasher.ts` - Password hashing functions
- `lib/auth-client.ts` - Client-side authentication utilities
- `db/auth.ts` - Database schema for auth tables
- `app/api/auth/[...all]/route.ts` - API routes for authentication
- `components/login-form.tsx` - Login form component
- `components/sign-up-form.tsx` - Registration form component
- `components/reset-password-form.tsx` - Password reset form
- `components/forgot-password-form.tsx` - Forgot password form

## How to Use Authentication in Your Components

### 1. Getting the Current User

To get the current authenticated user in a server component:

```tsx
import { auth } from "@/lib/auth";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    // Handle unauthenticated user
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      {/* Rest of your component */}
    </div>
  );
}
```

### 2. Protecting Routes

You can protect routes using server-side checks:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    // Redirect to login page if not authenticated
    redirect("/login");
  }

  // Page content for authenticated users
  return <div>Protected content</div>;
}
```

### 3. Client-Side Authentication

For client components, use the auth-client utilities:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { signIn, signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return <button onClick={handleLogout}>Log out</button>;
}
```

## Authentication Flow

1. **Registration**:
   - User submits registration form
   - Password is hashed using bcrypt
   - User record is created in the database
   - Email verification is sent (if enabled)
   - User is redirected to login page

2. **Login**:
   - User submits login form
   - Password is verified against hashed version
   - Session is created and stored
   - User is redirected to dashboard

3. **Password Reset**:
   - User requests password reset
   - Reset token is generated and stored
   - Email with reset link is sent
   - User clicks link and enters new password
   - Password is updated in the database

## Customizing Authentication

### Adding Custom Fields to User

To add custom fields to the user table:

1. Update the schema in `db/auth.ts`:

```tsx
export const users = sqliteTable("user", {
  // Existing fields...

  // Add your custom fields
  role: text("role").default("user"),
  bio: text("bio"),

  // ...other fields
});
```

2. Run the migration:

```bash
bun db:push
```

3. Update registration form to include new fields

### Customizing Email Templates

Email templates for verification and password reset are in:

- `lib/email/verify-email.tsx`
- `lib/email/reset-password.tsx`

Edit these files to customize the email content and design.

## Troubleshooting

### User cannot log in

1. Check if the user exists in the database
2. Verify the password hash is correct
3. Make sure email verification is completed (if required)

### Password reset email not received

1. Check the RESEND_API_KEY in your environment variables
2. Verify the email service is configured correctly
3. Check spam/junk folders

### Session expires too quickly

The session duration can be adjusted in the `lib/auth.ts` file.

## Additional Resources

For more detailed information about the authentication system, refer to:

- [Authentication System Deep Analysis](../auth/auth-system-deep-analysis-zh.md) (Chinese)
- For implementing additional authentication providers or methods, check the project's API documentation
