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

import { env } from "~/env";
import { loginSchema } from "~/lib/validation/auth";
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

const credentialsProvider = Credentials({
  name: "Email and Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const parsed = loginSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    // Keep the work factor similar for unknown users to reduce timing leakage.
    if (!user?.passwordHash) {
      await bcrypt.compare(
        parsed.data.password,
        "$2b$10$C6UzMDM.H6dfI/f/IKcEe.5Hbp7lV5l5QqgXw8yQdY2ynYQ2wS4uK",
      );
      return null;
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) return null;

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      const nextAttempts = user.failedLoginAttempts + 1;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lockedUntil:
            nextAttempts >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null,
        },
      });
      return null;
    }

    if (!user.emailVerified) {
      // Compatibility for passwords reset before reset completion also marked
      // the email verified. A consumed reset token proves inbox ownership.
      const completedReset = await db.authToken.findFirst({
        where: {
          userId: user.id,
          type: "PASSWORD_RESET",
          usedAt: { not: null },
        },
        select: { id: true },
      });
      if (!completedReset) return null;
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: user.emailVerified ?? now,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});

const providers: NextAuthConfig["providers"] = [credentialsProvider];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      // Google only returns the user's verified email address. Allow Auth.js to
      // attach Google to an existing credentials account with that same email
      // instead of failing with OAuthAccountNotLinked.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/**
 * Why JWT session strategy?
 * Credentials provider does NOT create a DB Session row the way Google OAuth does.
 * Auth.js docs: use JWT sessions when you mix Credentials with other providers.
 * PrismaAdapter still saves User + Account for Google logins.
 */
export const authConfig = {
  providers,

  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  trustHost: true,

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
      }

      if (typeof token.id === "string") {
        const current = await db.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true },
        });
        if (!current) return {};
        if (
          token.sessionVersion !== undefined &&
          token.sessionVersion !== current.sessionVersion
        )
          return {};
        token.sessionVersion = current.sessionVersion;
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

  events: {
    createUser: async ({ user }) => {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
    signIn: async ({ user, account }) => {
      if (account?.type === "oauth") {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
} satisfies NextAuthConfig;
