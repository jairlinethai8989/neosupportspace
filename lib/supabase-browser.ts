import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components.
 * This client is configured to use cookies automatically via @supabase/ssr.
 */
export const createBrowserSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
