/**
 * Safe Supabase Client - Graceful fallback for missing/invalid credentials
 *
 * This client is designed to never crash the app even if Supabase env vars
 * are missing or invalid. It returns null-safe implementations that allow
 * the app to continue functioning with limited features.
 *
 * Environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Check if Supabase credentials are properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY &&
            SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0);
}

/**
 * Get safe Supabase client - returns null if credentials are missing
 * This prevents runtime crashes and allows graceful degradation
 */
export function getSupabaseClient() {
  // If credentials are not configured, return null instead of crashing
  if (!isSupabaseConfigured()) {
    if (typeof window !== "undefined") {
      console.warn(
        "Supabase credentials not configured. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
      );
    }
    return null;
  }

  // Dynamic import to avoid loading Supabase if not needed
  try {
    const { createClient } = require("@supabase/supabase-js");
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (error) {
    console.warn("Failed to initialize Supabase client:", error);
    return null;
  }
}

/**
 * Type-safe null-coalescing for Supabase operations
 * Use this when calling Supabase methods that might fail
 */
export async function safeSupabaseCall<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn("Supabase operation failed:", error);
    return fallback;
  }
}
