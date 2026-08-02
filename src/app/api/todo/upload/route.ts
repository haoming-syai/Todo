/**
 * ============================================================================
 * [ROUTE] — POST /api/todo/upload
 * ============================================================================
 * Uses the anon key against a public bucket (no service role).
 * Auth.js + list membership still gate WHO may upload.
 */

import { NextResponse } from "next/server";

import {
  createSupabaseBrowserClient,
  TODO_IMAGES_BUCKET,
} from "~/lib/supabase/client";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.user.id}/${todoId}/${Date.now()}.${ext}`;

  const supabase = createSupabaseBrowserClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(TODO_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage
    .from(TODO_IMAGES_BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({ imageUrl: data.publicUrl });
}
