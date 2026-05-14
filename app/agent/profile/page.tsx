import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { ProfileForm } from './ProfileForm'
import { AgentAvatarUploader } from '@/components/agent-avatar-uploader'

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
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Profile Settings</h2>
          <p className="text-sm text-muted-foreground">ตั้งค่าบัญชีและโปรไฟล์ของคุณ</p>
        </div>
        
        <AgentAvatarUploader 
          currentAvatarUrl={agentData?.avatar_url} 
          agentName={agentData?.display_name || 'Agent'} 
        />

        <ProfileForm agentData={agentData} />
      </div>
    </div>
  )
}
