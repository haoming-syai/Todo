import nodemailer from "smtp-mailer";

import { env } from "~/env";

type AuthEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  developmentUrl: string;
};

export async function sendAuthEmail(message: AuthEmail) {
  if (
    !env.SMTP_HOST ||
    !env.SMTP_USER ||
    !env.SMTP_PASSWORD ||
    !env.SMTP_FROM
  ) {
    if (env.NODE_ENV !== "production") {
      console.info(
        `[auth email] ${message.subject}: ${message.developmentUrl}`,
      );
      return;
    }
    throw new Error("SMTP is not configured");
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  try {
    const result = await transport.sendMail({
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return result;
  } catch (error) {
    console.error("[auth email] SMTP send failed", {
      error: error instanceof Error ? error.message : error,
      to: message.to,
      subject: message.subject,
    });
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = new URL("/api/auth/verify", env.APP_URL);
  url.searchParams.set("token", token);

  await sendAuthEmail({
    to: email,
    subject: "Verify your Lists account",
    text: `Verify your email by opening this link: ${url.toString()}`,
    html: `<p>Verify your email to finish creating your Lists account.</p><p><a href="${url.toString()}">Verify email</a></p>`,
    developmentUrl: url.toString(),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = new URL("/reset-password", env.APP_URL);
  url.searchParams.set("token", token);

  await sendAuthEmail({
    to: email,
    subject: "Reset your Lists password",
    text: `Reset your password by opening this link: ${url.toString()}`,
    html: `<p>A password reset was requested for your Lists account.</p><p><a href="${url.toString()}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    developmentUrl: url.toString(),
  });
}
