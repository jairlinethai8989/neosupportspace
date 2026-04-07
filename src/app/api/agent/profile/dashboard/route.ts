import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  // Auth User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { layout } = await request.json()
    if (!layout) return NextResponse.json({ error: 'Missing layout' }, { status: 400 })

    const supabaseAdmin = createServiceRoleSupabaseClient()
    
    // Fetch existing config or make new
    const { data: agentData } = await supabaseAdmin.from('agent_users').select('dashboard_config').eq('auth_user_id', user.id).single()
    
    const newConfig = {
      ...(agentData?.dashboard_config || {}),
      layout: layout
    }

    const { error } = await supabaseAdmin.from('agent_users').update({ dashboard_config: newConfig }).eq('auth_user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
