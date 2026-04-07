import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceRoleSupabaseClient()
  
  // Verify Admin
  const { data: adminCheck } = await supabaseAdmin.from('agent_users').select('role').eq('auth_user_id', user.id).single()
  if (adminCheck?.role !== 'admin' && adminCheck?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: users, error } = await supabaseAdmin
    .from('agent_users')
    .select('id, email, username, display_name, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceRoleSupabaseClient()
  
  // Verify Admin
  const { data: adminCheck } = await supabaseAdmin.from('agent_users').select('role').eq('auth_user_id', user.id).single()
  if (adminCheck?.role !== 'admin' && adminCheck?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { username, password, displayName, role } = await request.json()
  if (!username || !password || !displayName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cleanedUsername = username.trim().toLowerCase()
  const fakeEmail = `${cleanedUsername}@admin.local`

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
    })

    if (authError) throw authError

    // 2. Create Agent Profile
    const { error: profileError } = await supabaseAdmin.from('agent_users').insert({
      auth_user_id: authData.user.id,
      email: fakeEmail,
      username: cleanedUsername,
      display_name: displayName,
      role: role || 'agent'
    })

    if (profileError) throw profileError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Create User Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
