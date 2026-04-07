import { createClient } from '@supabase/supabase-js'

/**
 * Creates a standard Supabase client for Server Components / Route Handlers.
 */
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return createClient(
      supabaseUrl || 'http://localhost:3000',
      supabaseAnonKey || 'dummy-key'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Creates a PRIVILEGED Supabase client for Server-only operations.
 */
export const createServiceRoleSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return createClient(
      supabaseUrl || 'http://localhost:3000',
      serviceRoleKey || 'dummy-key'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
