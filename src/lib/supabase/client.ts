import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  const url = SUPABASE_URL && SUPABASE_ANON_KEY ? SUPABASE_URL : "https://placeholder.supabase.co";
  const anonKey = SUPABASE_URL && SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";
  return createBrowserClient(url, anonKey, {
    auth: {
      flowType: "implicit",
    },
  });
}
