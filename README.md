# Lists

A Next.js todo app with personal/shared lists, Auth.js authentication, Prisma,
and Neon PostgreSQL.

## Authentication and security

- Email/password registration with mandatory email verification
- One-hour, single-use password-reset links
- Google OAuth through Auth.js
- Five-attempt account lockout for 15 minutes
- Neon-backed per-route, per-user, per-email, and per-IP rate limits
- Auth.js CSRF handling plus same-origin checks for custom mutations
- JWT session-version invalidation after password resets
- Authenticated image storage in Neon and 10-second list polling

## Local setup

1. Link the repository to the intended Neon project and branch. The checked-in
   `neon.ts` uses Neon for PostgreSQL only; Auth.js remains the auth provider.
2. Copy `.env.example` to `.env.local` and fill in the server-only values, or
   run `npm run dev:neon` to inject the linked Neon connection values from the
   Neon CLI.
3. Apply database migrations with `npm run db:migrate`. When relying on the
   CLI-injected connection, run:

   ```powershell
   neon-env run -- node node_modules/prisma/build/index.js migrate deploy
   ```

4. Start the app with `npm run dev` or `npm run dev:neon`.

During development only, verification/reset URLs are written to the server
console when SMTP is not configured. Production never logs these URLs and
requires working SMTP configuration.

## OAuth callbacks

Configure both the local and deployed origins with the providers:

- Google: `/api/auth/callback/google`

For example, the local callback is
`http://localhost:3000/api/auth/callback/google`.

## Commands

- `npm run check` — ESLint plus TypeScript
- `npm run build` — production Turbopack build
- `npm run db:migrate` — apply committed Prisma migrations
- `npm run db:studio` — inspect the database with Prisma Studio
