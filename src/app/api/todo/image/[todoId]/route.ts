import { type NextRequest, NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ todoId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { todoId } = await context.params;
  const image = await db.todoImage.findFirst({
    where: {
      todoId,
      todo: {
        list: { members: { some: { userId: session.user.id } } },
      },
    },
    select: { data: true, mimeType: true, size: true, updatedAt: true },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new Response(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.size),
      "Cache-Control": "private, max-age=3600",
      "Last-Modified": image.updatedAt.toUTCString(),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
