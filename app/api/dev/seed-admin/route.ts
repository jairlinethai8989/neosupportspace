import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * DEVELOPMENT ONLY: Route to seed an initial admin user for testing.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
  }

  // Use Service Role Key to bypass RLS and Auth limits
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const username = 'admin01'
  const email = `${username}@admin.local`
  const password = 'password123'

  try {
    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'System Admin' }
    })

    if (authError) {
      if (authError.message.includes('already exists')) {
        // Fallback: try to just create the public profile if auth user exists
        // (This happens if only the public profile was deleted but auth remains)
      } else {
        throw authError
      }
    }

    const userId = authData?.user?.id

    if (userId) {
      // 2. Create Public Profile in agent_users
      const { error: profileError } = await supabaseAdmin
        .from('agent_users')
        .upsert({
          auth_user_id: userId,
          email,
          display_name: 'System Admin',
          role: 'admin',
          is_active: true
        })

      if (profileError) throw profileError
    }

    return NextResponse.json({ 
      message: 'Admin user created successfully', 
      username, 
      password,
      note: 'Please use these credentials to login at /login'
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
