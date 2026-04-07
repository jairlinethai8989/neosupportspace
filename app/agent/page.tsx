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
    <>
      <div className="flex flex-1 overflow-hidden">
        <AgentQueue initialHospitals={hospitals || []} initialCounts={counts} />
      </div>
    </>
  )
}
