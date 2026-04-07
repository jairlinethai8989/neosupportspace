import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API for agent ticket detail view.
 * Fetches ticket metadata, messages, and events.
 */
export async function GET(
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

  // 2. Fetch Ticket Detail with related profiles
  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select(`
      *,
      hospitals!inner(*),
      customer_users!inner(*),
      agent_users(*)
    `)
    .eq('id', id)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // 3. Fetch Messages
  const { data: messages } = await supabaseAdmin
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ...ticket, messages })
}
