import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API for agents to reply to a ticket.
 * Also handles updating last_message_at and first_response_at metrics.
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
  const { messageBody, metadata, isInternal } = await request.json()
  
  if (!messageBody && (!metadata || !metadata.attachments || metadata.attachments.length === 0)) {
    return NextResponse.json({ error: 'Message or attachment required' }, { status: 400 })
  }
  const supabaseAdmin = createServiceRoleSupabaseClient()

  // 2. Get Agent User Reference
  const { data: agentUser } = await supabaseAdmin
    .from('agent_users')
    .select('id, display_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!agentUser) return NextResponse.json({ error: 'Agent profile not found' }, { status: 400 })

  // 3. Insert Message
  const { error: msgError } = await supabaseAdmin.from('ticket_messages').insert({
    ticket_id: id,
    sender_id: agentUser.id,
    sender_type: 'agent',
    message_body: messageBody || '',
    metadata: metadata || {},
    is_internal: Boolean(isInternal),
  })

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  // 4. Update Ticket Metadata & Metrics
  const { data: ticket } = await supabaseAdmin.from('tickets').select('status, first_response_at').eq('id', id).single()
  
  const updateData: any = {
    last_message_at: new Date().toISOString(),
  }

  // If status is open, change to assigned (auto-assign on reply if not yet assigned)
  if (ticket?.status === 'open') {
    updateData.status = 'assigned'
    updateData.assigned_agent_id = agentUser.id
  }

  // Set first_response_at if this is the first response from an agent and not an internal note
  if (!ticket?.first_response_at && !isInternal) {
    updateData.first_response_at = new Date().toISOString()
  }

  // Only bump last_message_at for public messages
  if (!isInternal) {
    await supabaseAdmin.from('tickets').update(updateData).eq('id', id)
  } else if (Object.keys(updateData).length > 1) {
    // just update status/assign if it was open
    delete updateData.last_message_at;
    await supabaseAdmin.from('tickets').update(updateData).eq('id', id)
  }

  // 5. Log Event and Notification
  await supabaseAdmin.from('ticket_events').insert({
    ticket_id: id,
    event_type: isInternal ? 'internal_note_added' : 'agent_replied',
    actor_id: agentUser.id,
    actor_type: 'agent',
    new_value: { message_preview: (messageBody || 'Attachment').substring(0, 50) },
  })

  if (isInternal) {
    // Notify all active agents except sender
    const { data: otherAgents } = await supabaseAdmin
      .from('agent_users')
      .select('id')
      .eq('is_active', true)
      .neq('id', agentUser.id)

    if (otherAgents && otherAgents.length > 0) {
      const notifications = otherAgents.map(a => ({
        agent_id: a.id,
        ticket_id: id,
        title: `โน้ตภายในใหม่จาก ${agentUser.display_name}`,
        message: (messageBody || 'แนบไฟล์').substring(0, 50),
      }))
      await supabaseAdmin.from('agent_notifications').insert(notifications)
    }
  }

  return NextResponse.json({ success: true })
}
