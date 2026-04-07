import React from 'react'
import { TicketThread } from '@/components/customer/TicketThread'
import Link from 'next/link'

/**
 * Individual Ticket Detail Page for Customer LIFF.
 * Displays the conversation thread and ticket status.
 */
export default async function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white p-6 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <Link href="/liff" className="text-blue-500 font-bold hover:underline flex items-center">
          <span className="text-xl mr-2">←</span> กลับไปหน้าหลัก
        </Link>
        <h1 className="text-xl font-bold text-gray-800">รายละเอียดงาน</h1>
      </header>

      <div className="flex-1">
        <TicketThread ticketId={id} />
      </div>
    </main>
  )
}
