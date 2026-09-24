const SUPABASE_URL = "https://swueerabgmmbaeqxirkm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dWVlcmFiZ21tYmFlcXhpcmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjMwODksImV4cCI6MjEwNTczOTA4OX0.DUdH78T3jq5d-uB6ouYw5U94TxL1BkpiQrZK3_lDbOU";

async function getSupabaseClient() {
  if (window._supabaseClient) return window._supabaseClient;
  const { createClient } = await import(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.js"
  );
  window._supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return window._supabaseClient;
}
