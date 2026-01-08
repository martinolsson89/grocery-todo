
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

let client: SupabaseClient<Database> | null = null;

export const createClient = (): SupabaseClient<Database> => {
  if (!client) {
    client = createBrowserClient<Database>(
      supabaseUrl!,
      supabaseKey!,
    );
  }
  return client;
}