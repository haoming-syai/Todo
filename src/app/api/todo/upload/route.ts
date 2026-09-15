/**
 * ============================================================================
 * [ROUTE] — POST /api/todo/upload
 * ============================================================================
 * Stores one image per todo in Neon Postgres. Auth.js + list membership gate
 * both writes and reads.
 */

import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getClientIp, isSameOriginRequest } from "~/server/security/request";
import { checkRateLimit } from "~/server/security/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limits = await Promise.all([
    checkRateLimit({
      route: "todo.image-upload.user",
      identity: session.user.id,
      limit: 10,
      windowMs: 60_000,
    }),
    checkRateLimit({
      route: "todo.image-upload.ip",
      identity: getClientIp(request.headers),
      limit: 30,
      windowMs: 60_000,
    }),
  ]);
  const blocked = limits.find((limit) => !limit.allowed);
  if (blocked) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(blocked.retryAfter) },
      },
    );
  }

  const form = await request.formData();
  const todoId = form.get("todoId");
  const file = form.get("file");

  if (typeof todoId !== "string" || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Expected todoId + file in FormData" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF images allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller" },
      { status: 400 },
    );
  }

  const todo = await db.todo.findFirst({
    where: {
      id: todoId,
      list: { members: { some: { userId: session.user.id } } },
    },
  });
  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = `/api/todo/image/${todoId}?v=${Date.now()}`;

  await db.$transaction([
    db.todoImage.upsert({
      where: { todoId },
      create: {
        todoId,
        data: buffer,
        mimeType: file.type,
        size: file.size,
      },
      update: {
        data: buffer,
        mimeType: file.type,
        size: file.size,
      },
    }),
    db.todo.update({
      where: { id: todoId },
      data: { imageUrl },
    }),
  ]);

  return NextResponse.json({ imageUrl });
}
