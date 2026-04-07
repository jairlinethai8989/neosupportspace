import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { ProfileForm } from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createServiceRoleSupabaseClient()
  const { data: agentData } = await supabaseAdmin.from('agent_users').select('*').eq('auth_user_id', user.id).single()

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Profile Settings</h2>
          <p className="text-sm text-gray-500">ตั้งค่าบัญชีและโปรไฟล์ของคุณ</p>
        </div>
        <ProfileForm agentData={agentData} />
      </div>
    </div>
  )
}
