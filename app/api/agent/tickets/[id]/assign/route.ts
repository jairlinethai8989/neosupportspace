import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API for agents to assign/claim a ticket.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabaseAdmin = createServiceRoleSupabaseClient()

  // 2. Get Agent User Reference
  const { data: agentUser } = await supabaseAdmin
    .from('agent_users')
    .select('id, display_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!agentUser) return NextResponse.json({ error: 'Agent profile not found' }, { status: 400 })

  // 3. Update Ticket
  const { data: currentTicket } = await supabaseAdmin.from('tickets').select('status').eq('id', id).single()

  const { error: updateError } = await supabaseAdmin
    .from('tickets')
    .update({ 
      assigned_agent_id: agentUser.id,
      // Change status to assigned ONLY if it was open
      status: currentTicket?.status === 'open' ? 'assigned' : currentTicket?.status 
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 4. Log Event
  await supabaseAdmin.from('ticket_events').insert({
    ticket_id: id,
    event_type: 'agent_assigned',
    actor_id: agentUser.id,
    actor_type: 'agent',
    new_value: { agent_id: agentUser.id, agent_name: agentUser.display_name },
  })

  return NextResponse.json({ success: true })
}
