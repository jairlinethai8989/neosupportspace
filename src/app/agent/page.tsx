import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'
import { AgentQueue } from '@/components/agent/AgentQueue'

export const dynamic = 'force-dynamic'

/**
 * Main Agent Dashboard (Command Center).
 * 1. Fetches initial queue and filters server-side.
 * 2. Renders a 3-column Layout: Sidebar Filters | Queue List | Ticket Detail.
 */
export default async function AgentDashboard() {
  const supabase = createServiceRoleSupabaseClient()

  // 1. Fetch initial filter data (Hospitals)
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  // 2. Fetch ticket counts per status
  const { data: ticketsCount } = await supabase
    .from('tickets')
    .select('status')
  
  const counts = (ticketsCount || []).reduce((acc: any, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    acc['all'] = (acc['all'] || 0) + 1
    return acc
  }, { all: 0, open: 0, assigned: 0, pending_customer: 0, resolved: 0, closed: 0 })

  return (
    <main className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black">N</div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight uppercase">NeoSupport <span className="text-blue-600">Intelligence</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-900">Agent Dashboard</p>
            <p className="text-[10px] text-gray-400 font-medium">ศูนย์ควบคุมการจัดการตั๋ว</p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold">
            A
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <div className="flex flex-1 overflow-hidden">
        <AgentQueue initialHospitals={hospitals || []} initialCounts={counts} />
      </div>
    </main>
  )
}
