import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { team, note } = await request.json()

  if (!team) return NextResponse.json({ error: 'Team is required' }, { status: 400 })

  const supabaseAdmin = createServiceRoleSupabaseClient()

  // 1. Get Agent Profile for Logging
  const { data: agentUser } = await supabaseAdmin.from('agent_users').select('id, display_name').eq('auth_user_id', user.id).single()
  if (!agentUser) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  // 2. Update Ticket Team
  const { error: updateError } = await supabaseAdmin
    .from('tickets')
    .update({ 
      assigned_team: team,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 3. Log Event
  await supabaseAdmin.from('ticket_events').insert({
    ticket_id: id,
    event_type: 'ticket_transferred',
    actor_id: agentUser.id,
    actor_type: 'agent',
    new_value: { team, note }
  })

  // 4. Record as a system message in the thread
  await supabaseAdmin.from('ticket_messages').insert({
    ticket_id: id,
    sender_id: agentUser.id,
    sender_type: 'system',
    message_body: `🔄 งานถูกส่งต่อไปยังทีม: ${team.toUpperCase()}${note ? ` (หมายเหตุ: ${note})` : ''}`
  })

  return NextResponse.json({ success: true })
}
