import { createServiceRoleSupabaseClient } from '@/lib/supabase-server'

// ... existing code ...
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  let agentUser = null

  if (user) {
    const supabaseAdmin = createServiceRoleSupabaseClient()
    const { data } = await supabaseAdmin.from('agent_users').select('*').eq('auth_user_id', user.id).single()
    agentUser = data
  }

  const isAdmin = agentUser?.role === 'admin' || agentUser?.role === 'super_admin'

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Navigation Sidebar */}
      <aside className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 flex-shrink-0 z-30 justify-between">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="bg-blue-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-500/30">
            N
          </div>
          
          <nav className="flex flex-col gap-4 w-full px-3">
            <Link href="/agent" className="group flex flex-col items-center gap-1 p-3 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white relative">
              <span className="text-xl">📥</span>
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Tickets</span>
            </Link>
            <Link href="/agent/dashboard" className="group flex flex-col items-center gap-1 p-3 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white">
              <span className="text-xl">📊</span>
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Dash</span>
            </Link>
            <Link href="/agent/canned" className="group flex flex-col items-center gap-1 p-3 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white">
              <span className="text-xl">💬</span>
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Replies</span>
            </Link>
            {isAdmin && (
              <Link href="/agent/users" className="group flex flex-col items-center gap-1 p-3 rounded-2xl hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                <span className="text-xl">👥</span>
                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Team</span>
              </Link>
            )}
          </nav>
        </div>

        <Link href="/agent/profile" className="w-10 h-10 bg-indigo-500 rounded-full border-2 border-gray-800 shadow-sm flex items-center justify-center text-white font-bold hover:scale-110 transition-all bg-cover bg-center" style={{ backgroundImage: agentUser?.avatar_url ? `url(${agentUser.avatar_url})` : 'none' }}>
           {!agentUser?.avatar_url && (agentUser?.display_name?.charAt(0).toUpperCase() || 'A')}
        </Link>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
         {/* Top Unified Header (Optional but good for global state) */}
         <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-20">
            <div>
               <h1 className="text-lg font-black text-gray-900 tracking-tight uppercase">NeoSupport <span className="text-blue-600">Intelligence</span></h1>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Internal Operations Center</p>
            </div>
            <div className="flex gap-4 items-center">
               <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">{agentUser?.display_name || 'Agent'}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{agentUser?.role || 'Staff'}</p>
               </div>
            </div>
         </header>
         {children}
      </div>
    </div>
  )
}
