'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type Ticket = {
  id: string
  ticket_number: number
  title: string
  status: 'open' | 'assigned' | 'pending_customer' | 'resolved' | 'closed'
  priority: string
  created_at: string
}

/**
 * Modern ticket listing component for the customer portal.
 * Displays ticket status, number, title, and timestamp.
 */
export const TicketList = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/customer/tickets')
        if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการโหลดรายการงาน')
        const data = await response.json()
        setTickets(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  if (loading) return <div className="text-center py-10 text-gray-500">กำลังโหลดรายการงาน...</div>
  
  if (error) return <div className="p-4 bg-red-50 text-red-500 rounded-xl text-center border border-red-100">{error}</div>

  if (tickets.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">ยังไม่พบรายการงานที่คุณแจ้งไว้</p>
        <Link href="/liff/tickets/new" className="text-blue-600 font-bold hover:underline mt-2 inline-block">เริ่มแจ้งปัญหาที่นี่</Link>
      </div>
    )
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    open: { label: 'รอดำเนินการ', color: 'bg-blue-100 text-blue-600' },
    assigned: { label: 'กำลังจัดการ', color: 'bg-purple-100 text-purple-600' },
    pending_customer: { label: 'รอข้อมูลเพิ่ม', color: 'bg-orange-100 text-orange-600' },
    resolved: { label: 'แก้ไขเสร็จสิ้น', color: 'bg-green-100 text-green-600' },
    closed: { label: 'ปิดงานแล้ว', color: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Link 
          key={ticket.id} 
          href={`/liff/tickets/${ticket.id}`} 
          className="block p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-95"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400">#{ticket.ticket_number}</span>
            <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${statusMap[ticket.status].color}`}>
              {statusMap[ticket.status].label}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-800 line-clamp-1">{ticket.title}</h3>
          <div className="mt-3 flex justify-between items-center text-[11px] text-gray-400">
            <span>{new Date(ticket.created_at).toLocaleDateString('th-TH')} {new Date(ticket.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
            <span className="font-medium text-blue-500">ดูรายละเอียด →</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
