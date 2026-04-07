import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { readCustomerSession } from '@/lib/customer-session'

const messageSchema = z.object({
  messageBody: z.string().optional(),
  metadata: z.any().optional(),
}).refine(data => data.messageBody || data.metadata?.attachments?.length, {
  message: "Please enter a message or attach a file"
})

/**
 * API for individual ticket details and messaging.
 * Accessible only by the ticket owner.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readCustomerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleSupabaseClient()
  const { id } = await params

  // 1. Fetch Ticket with Ownership Check
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*, hospitals(name)')
    .eq('id', id)
    .eq('customer_id', session.customerId)
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found or access denied' }, { status: 404 })
  }

  // 2. Fetch Messages (Excluding internal notes)
  const { data: messages, error: messagesError } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .is('is_internal', false) // Note: is('is_internal', false) covers explicit false, or we can use .neq('is_internal', true)
    .order('created_at', { ascending: true })

  // Since newly added column defaults might not instantly propagate if not updated, let's filter safely:
  // Supabase postgREST doesn't inherently support coalesce in eq without views, 
  // so we'll do neq true to cover false and null just in case.
  const safeMessages = messages?.filter(m => !m.is_internal) || []

  return NextResponse.json({ ticket, messages: safeMessages })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readCustomerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const validation = messageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabaseClient()

    // 1. Ownership & Status Check (Cannot reply to resolved/closed)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('status, customer_id')
      .eq('id', id)
      .eq('customer_id', session.customerId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found or access denied' }, { status: 404 })
    }

    if (['resolved', 'closed'].includes(ticket.status)) {
      return NextResponse.json({ error: 'Cannot reply to a resolved or closed ticket' }, { status: 403 })
    }

    // 2. Insert Message
    const { error: msgError } = await supabase.from('ticket_messages').insert({
      ticket_id: id,
      sender_id: session.customerId,
      sender_type: 'customer',
      message_body: validation.data.messageBody || '',
      metadata: validation.data.metadata || {},
    })

    if (msgError) throw msgError

    // 3. Update Last Message AT
    await supabase
      .from('tickets')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Message posting error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
