/**
 * ============================================================================
 * [AUTH] — Auth.js (NextAuth) configuration
 * ============================================================================
 * Not quite MVC, but sits in front of every protected CONTROLLER call.
 * Flow:
 *   1. User signs in (Google OAuth OR email+password)
 *   2. Auth.js creates/finds a User row (MODEL) via PrismaAdapter
 *   3. Browser gets a session cookie
 *   4. tRPC `protectedProcedure` reads session via `auth()` → ctx.session
 *
 * S2 providers:
 *   - Google  → OAuth (Auth.js + Google Cloud client id/secret)
 *   - Credentials → email + password we verify ourselves with bcrypt
 */

import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { db } from "~/server/db";

/**
 * Teach TypeScript that session.user always has `id` after our callback.
 * Without this, `session.user.id` would be a type error.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * Why JWT session strategy?
 * Credentials provider does NOT create a DB Session row the way Google OAuth does.
 * Auth.js docs: use JWT sessions when you mix Credentials with other providers.
 * PrismaAdapter still saves User + Account for Google logins.
 */
export const authConfig = {
  providers: [
    // Reads AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET from env automatically
    Google,

    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * authorize() runs on the server when someone calls signIn("credentials", …).
       * Return a user object → login succeeds.
       * Return null → login fails (wrong email/password).
       */
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        const user = await db.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        // No user, or Google-only user without a password → reject
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        // Shape Auth.js expects
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt",
  },

  pages: {
    // Use our custom UI instead of the default Auth.js sign-in page
    signIn: "/login",
  },

  callbacks: {
    // Put user.id onto the JWT when they first sign in.
    // Also: if DB was reset, wipe the JWT so the stale cookie stops acting logged-in.
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        return token;
      }

      if (typeof token.id === "string") {
        const exists = await db.user.findUnique({
          where: { id: token.id },
          select: { id: true },
        });
        if (!exists) {
          return {};
        }
      }

      return token;
    },
    // Expose token.id on session.user.id for tRPC / Server Components
    session: ({ session, token }) => {
      if (!token.id) {
        // Stale / cleared token → treat as logged out at the edge
        return { ...session, user: { ...session.user, id: "" } };
      }
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
} satisfies NextAuthConfig;
