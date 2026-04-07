import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { DraggableDashboard } from './DraggableDashboard'

export const revalidate = 0

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() } }
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createServiceRoleSupabaseClient()
  const { data: agentData } = await supabaseAdmin.from('agent_users').select('dashboard_config').eq('auth_user_id', user.id).single()

  const defaultConfig = {
    layout: [
      { id: "timeline", type: "line", title: "Ticket Volume Trend", colSpan: 2 },
      { id: "status", type: "pie", title: "Tickets by Status", colSpan: 1 },
      { id: "priority", type: "bar", title: "Priority Breakdown", colSpan: 1 },
      { id: "csat", type: "kpi", title: "Avg CSAT Score", colSpan: 1 }
    ]
  }

  const config = agentData?.dashboard_config || defaultConfig

  return (
    <div className="p-8 h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
         <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">ผลสรุปวิเคราะห์ข้อมูล (ลากเพื่อจัดเรียง)</p>
         </div>
      </div>
      <div className="flex-1 overflow-y-auto">
         <DraggableDashboard initialConfig={config} />
      </div>
    </div>
  )
}
