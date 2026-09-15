import { z } from "zod";

export const normalizedEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254)
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer");

export const loginSchema = z
  .object({
    email: normalizedEmailSchema,
    password: z.string().min(1).max(72),
  })
  // Auth.js adds fields such as csrfToken and callbackUrl to the credentials
  // payload. Strip that trusted transport metadata after validating the two
  // credential fields instead of rejecting every login as an unknown-key error.
  .strip();

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80),
    email: normalizedEmailSchema,
    password: passwordSchema,
  })
  .strict();

export const emailRequestSchema = z
  .object({ email: normalizedEmailSchema })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(256),
    password: passwordSchema,
  })
  .strict();
