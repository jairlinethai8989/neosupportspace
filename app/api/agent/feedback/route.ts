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
  
  // Get Agent Role
  const { data: agentUser } = await supabaseAdmin.from('agent_users').select('id, role').eq('auth_user_id', user.id).single()
  if (!agentUser) return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 })

  const isAdmin = agentUser.role === 'admin' || agentUser.role === 'super_admin'

  let query = supabaseAdmin
    .from('tickets')
    .select(`
       id, 
       ticket_number, 
       csat_score, 
       csat_review, 
       last_message_at,
       customer_users(full_name),
       agent_users(display_name)
    `)
    .not('csat_score', 'is', null)
    .order('last_message_at', { ascending: false })

  // If not admin, only show reviews for tickets they handled
  if (!isAdmin) {
    query = query.eq('assigned_agent_id', agentUser.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
