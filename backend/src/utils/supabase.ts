import { createClient } from "@supabase/supabase-js";

// Ensure these are set in your .env and serverless.yml
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Using the service role key allows our backend Lambda to securely write to the DB
export const supabase = createClient(supabaseUrl, supabaseServiceKey);