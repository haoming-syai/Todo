/**
 * ============================================================================
 * [INFRA] — Supabase client (anon key only)
 * ============================================================================
 * Public bucket `todo-images`:
 *   - READ works via public URLs (no service role)
 *   - WRITE (upload/delete) still needs Storage policies for `anon`
 *     (INSERT / UPDATE / DELETE on storage.objects)
 */

import { createClient } from "@supabase/supabase-js";

import { env } from "~/env";

export function createSupabaseBrowserClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const TODO_IMAGES_BUCKET = "todo-images";
