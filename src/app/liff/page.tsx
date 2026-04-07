import { LiffRegisterWrapper } from '@/components/customer/LiffRegisterWrapper'
import { TicketList } from '@/components/customer/TicketList'
import { readCustomerSession } from '@/lib/customer-session'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/**
 * Main Customer Portal Entrance (LIFF App).
 * Displays dashboard actions and the latest tickets for registered users.
 */
export default async function LiffPage() {
  const session = await readCustomerSession()

  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full">
          <LiffRegisterWrapper />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white p-6 shadow-sm mb-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Support Center</h1>
        <p className="text-sm text-gray-500">ยินดีต้อนรับคุณ {session.lineUserId} 👋</p>
      </header>

      <div className="px-6 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest px-1">เมนูหลัก</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link 
              href="/liff/tickets/new" 
              className="p-8 bg-blue-600 text-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center space-y-3 hover:bg-blue-700 active:scale-95 transition-all font-bold"
            >
              <div className="bg-white/20 p-4 rounded-full">
                <span className="text-3xl">✚</span>
              </div>
              <span>แจ้งปัญหาใหม่</span>
            </Link>
          </div>
        </section>

        {/* Latest Tickets */}
        <section>
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest">รายการงานล่าสุด</h2>
            <Link href="/liff/tickets" className="text-xs font-bold text-blue-500 hover:underline">ดูทั้งหมด</Link>
          </div>
          <TicketList />
        </section>
      </div>
    </main>
  )
}
