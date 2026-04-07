import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const supabaseAdmin = createServiceRoleSupabaseClient()
    const fileBuffer = await file.arrayBuffer()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`

    // Upload to bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('agent_avatars')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage.from('agent_avatars').getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

    // Update agent_users table
    const { error: profileError } = await supabaseAdmin
      .from('agent_users')
      .update({ avatar_url: publicUrl })
      .eq('auth_user_id', user.id)

    if (profileError) throw profileError

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    console.error('Avatar upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
