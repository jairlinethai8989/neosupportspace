import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * API for agents to list and filter tickets.
 * Only authenticated agents can access.
 */
export async function GET(request: NextRequest) {
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

  // 1. Check Auth (Strict)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const hospitalId = searchParams.get('hospital')
  const search = searchParams.get('search')

  // 2. Build Query
  let query = supabase
    .from('tickets')
    .select('*, hospitals(name), customer_users(full_name, phone)')
    .order('last_message_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (hospitalId && hospitalId !== 'all') {
    query = query.eq('hospital_id', hospitalId)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data: tickets, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(tickets)
}
