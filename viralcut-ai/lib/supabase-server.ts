// lib/supabase-server.ts
// Server-only Supabase instance using the service role key — bypasses RLS.
// NEVER import this file in a "use client" component or expose it to the browser.
// Use only inside API routes (app/api/**) and server components.

import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
