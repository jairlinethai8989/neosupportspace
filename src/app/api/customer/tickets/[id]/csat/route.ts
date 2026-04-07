import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { readCustomerSession } from '@/lib/customer-session'

const csatSchema = z.object({
  score: z.number().min(1).max(5),
  review: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readCustomerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const validation = csatSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 })
    }

    const supabase = createServiceRoleSupabaseClient()

    // Ensure user owns ticket and ticket is closed/resolved
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('status, customer_id, csat_score')
      .eq('id', id)
      .eq('customer_id', session.customerId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found or access denied' }, { status: 404 })
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return NextResponse.json({ error: 'Ticket must be resolved or closed to give rating' }, { status: 403 })
    }

    if (ticket.csat_score) {
      return NextResponse.json({ error: 'Rating already submitted' }, { status: 400 })
    }

    // Update the ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        csat_score: validation.data.score,
        csat_review: validation.data.review,
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('CSAT error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
