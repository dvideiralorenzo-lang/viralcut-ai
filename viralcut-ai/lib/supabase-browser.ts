// lib/supabase-browser.ts
// Client-side Supabase instance — safe to use in components ("use client").
// Uses the public anon key, protected by the row-level security policies
// defined in database/schema.sql (users can only read/write their own rows).

import { createClient } from "@supabase/supabase-js";

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
