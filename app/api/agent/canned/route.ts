import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET all active canned replies
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceRoleSupabaseClient()
  const { data, error } = await supabaseAdmin.from('canned_replies').select('id, category, title, content, created_by').eq('is_active', true).order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST a new canned reply (Agent can create)
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceRoleSupabaseClient()
  const { data: agent } = await supabaseAdmin.from('agent_users').select('id').eq('auth_user_id', user.id).single()

  const body = await request.json()
  if (!body.title || !body.content) return NextResponse.json({ error: 'Missing title or content' }, { status: 400 })

  const { error } = await supabaseAdmin.from('canned_replies').insert({
    title: body.title,
    content: body.content,
    category: body.category || 'General',
    created_by: agent?.id
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PUT (Edit) a canned reply
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceRoleSupabaseClient()
  const { data: agent } = await supabaseAdmin.from('agent_users').select('id, role').eq('auth_user_id', user.id).single()

  const body = await request.json()
  if (!body.id || !body.title || !body.content) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const { data: reply } = await supabaseAdmin.from('canned_replies').select('created_by').eq('id', body.id).single()
  
  if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })

  if (reply.created_by !== agent?.id && agent?.role !== 'admin') {
     return NextResponse.json({ error: 'Forbidden. You can only edit your own replies.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('canned_replies').update({
    title: body.title,
    content: body.content,
    category: body.category || 'General'
  }).eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE a canned reply (soft delete or hard delete)
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createServiceRoleSupabaseClient()
  const { data: agent } = await supabaseAdmin.from('agent_users').select('id, role').eq('auth_user_id', user.id).single()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing reply ID' }, { status: 400 })

  const { data: reply } = await supabaseAdmin.from('canned_replies').select('created_by').eq('id', id).single()
  
  if (reply && reply.created_by !== agent?.id && agent?.role !== 'admin') {
     return NextResponse.json({ error: 'Forbidden. You can only delete your own replies.' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('canned_replies').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
