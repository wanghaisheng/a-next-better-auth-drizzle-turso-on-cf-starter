# Database Management Quick-Start Guide

This guide provides an overview of how to work with the database in the Next.js Better Auth project, which uses Drizzle ORM with a Turso database.

## Overview

The project uses:
- **Drizzle ORM** - A TypeScript ORM for SQL databases
- **Turso** - A distributed SQLite database built on libSQL
- **Database Schema** - Defined in TypeScript for type safety

## Key Files

- `db/index.ts` - Database connection setup
- `db/auth.ts` - Authentication tables schema
- `db/migrations/` - Migration files for schema changes
- `drizzle.config.ts` - Drizzle ORM configuration

## Getting Started with the Database

### Connecting to the Database

The database connection is already set up in `db/index.ts`. To use it in your code:

```tsx
import { db } from "@/db";

// Now you can use db to perform queries
```

### Basic Database Operations

#### 1. Select Data

```tsx
import { db } from "@/db";
import { users } from "@/db/auth";
import { eq } from "drizzle-orm";

// Get all users
const allUsers = await db.select().from(users);

// Get a specific user by email
const user = await db.select().from(users).where(eq(users.email, "user@example.com")).get();
```

#### 2. Insert Data

```tsx
import { db } from "@/db";
import { users } from "@/db/auth";

// Insert a new user
const newUser = await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
  hashedPassword: "...", // You should hash passwords before storing
}).returning().get();
```

#### 3. Update Data

```tsx
import { db } from "@/db";
import { users } from "@/db/auth";
import { eq } from "drizzle-orm";

// Update a user's name
await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.email, "john@example.com"));
```

#### 4. Delete Data

```tsx
import { db } from "@/db";
import { users } from "@/db/auth";
import { eq } from "drizzle-orm";

// Delete a user
await db.delete(users).where(eq(users.email, "john@example.com"));
```

## Database Schema

### Viewing the Schema

The database schema is defined in TypeScript files in the `db/` directory. The main schema file for authentication is `db/auth.ts`.

### Understanding the Auth Schema

The authentication schema includes these main tables:

- `users` - User accounts
- `sessions` - Authentication sessions
- `verificationTokens` - Tokens for email verification
- `accounts` - For OAuth provider accounts (if used)

## Making Schema Changes

### 1. Update Schema Definition

First, modify the schema in the TypeScript files. For example, to add a new field to the users table:

```tsx
// db/auth.ts
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  hashedPassword: text("hashed_password"),

  // Add a new field
  role: text("role").default("user"),

  // ... other fields
});
```

### 2. Generate and Apply Migrations

After updating the schema definition, generate and apply migrations:

```bash
# Generate a new migration
bun drizzle-kit generate

# Push the changes to the database
bun db:push
```

## Best Practices

### 1. Use Transactions for Related Operations

```tsx
import { db } from "@/db";
import { users, sessions } from "@/db/auth";

await db.transaction(async (tx) => {
  // Create user
  const user = await tx.insert(users).values({
    // user data
  }).returning().get();

  // Create session
  await tx.insert(sessions).values({
    userId: user.id,
    // session data
  });
});
```

### 2. Use Prepared Statements for Repeated Queries

```tsx
import { db } from "@/db";
import { users } from "@/db/auth";
import { eq } from "drizzle-orm";

// Create a prepared statement
const getUserByEmail = db.select()
  .from(users)
  .where(eq(users.email, sql.placeholder("email")))
  .prepare();

// Use it multiple times
const user1 = await getUserByEmail.execute({ email: "user1@example.com" });
const user2 = await getUserByEmail.execute({ email: "user2@example.com" });
```

### 3. Type Safety with Schema Inference

```tsx
import { db } from "@/db";
import { users } from "@/db/auth";
import { InferSelectModel } from "drizzle-orm";

// Type-safe user model
type User = InferSelectModel<typeof users>;

// Now you have type-safe access to user fields
function displayUserInfo(user: User) {
  console.log(`Name: ${user.name}, Email: ${user.email}`);
}
```

## Troubleshooting

### Connection Issues

If you encounter database connection issues:

1. Verify your `.env.local` file contains the correct database URL and authentication token
2. Ensure your IP address is allowed in Turso's firewall settings
3. Check if your Turso database is running and accessible

### Migration Failures

If migrations fail:

1. Check for SQL syntax errors in your schema definitions
2. Ensure you're not making incompatible changes to existing columns
3. Consider creating a backup before applying migrations in production

## Additional Resources

For more detailed information about database management:

- [Local Development Database Configuration](../db/local-dev-db-config-guide-zh.md) (Chinese)
- [Table Prefix Configuration Guide](../db/table-prefix-config-guide-zh.md) (Chinese)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Turso Documentation](https://docs.turso.tech/)
