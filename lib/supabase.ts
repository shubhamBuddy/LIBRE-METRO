import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

/**
 * Service role client for server-side administrative tasks.
 * ONLY use this in Server Components, API Routes, or Server Actions.
 */
export const getSupabaseServiceRole = () => {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables");
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};
