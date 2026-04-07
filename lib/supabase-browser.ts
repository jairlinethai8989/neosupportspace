import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for use in Client Components.
 */
export const createBrowserSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build to avoid crashing Next.js SSG
    return createClient(
      supabaseUrl || 'http://localhost:3000',
      supabaseAnonKey || 'dummy-key'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
