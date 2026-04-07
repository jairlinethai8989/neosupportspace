import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { readCustomerSession } from '@/lib/customer-session'

const ticketSchema = z.object({
  title: z.string().min(5, 'หัวข้อต้องมีความยาวอย่างน้อย 5 ตัวอักษร'),
  category: z.string().min(1, 'กรุณาระบุหมวดหมู่'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string().min(10, 'กรุณาระบุรายละเอียดเพิ่มเติม'),
})

/**
 * Handle GET (list tickets) and POST (create ticket) for customers.
 * Identity is strictly derived from the session cookie.
 */
export async function GET() {
  const session = await readCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleSupabaseClient()
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, hospitals(name)')
    .eq('customer_id', session.customerId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(tickets)
}

export async function POST(request: NextRequest) {
  const session = await readCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validation = ticketSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 })
    }

    const { title, category, priority, description } = validation.data
    const supabase = createServiceRoleSupabaseClient()

    // Transaction-like flow: Create Ticket -> Create Initial Message -> Create Event
    
    // 1. Create Ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title,
        category,
        priority,
        status: 'open',
        hospital_id: session.hospitalId,
        customer_id: session.customerId,
      })
      .select()
      .single()

    if (ticketError || !ticket) {
      throw new Error(`Failed to create ticket: ${ticketError?.message}`)
    }

    // 2. Insert Initial Message
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: session.customerId,
      sender_type: 'customer',
      message_body: description,
    })

    // 3. Log Event
    await supabase.from('ticket_events').insert({
      ticket_id: ticket.id,
      event_type: 'ticket_created',
      actor_id: session.customerId,
      actor_type: 'customer',
      new_value: { status: 'open', title, priority },
    })

    return NextResponse.json({ success: true, ticketId: ticket.id })
  } catch (err: any) {
    console.error('Ticket creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
