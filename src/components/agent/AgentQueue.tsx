'use client'

import React, { useState, useEffect } from 'react'
import { AgentTicketPanel } from './AgentTicketPanel'

type TicketListItem = {
  id: string
  ticket_number: number
  title: string
  status: 'open' | 'assigned' | 'pending_customer' | 'resolved' | 'closed'
  priority: string
  category: string
  created_at: string
  hospitals: { name: string }
  customer_users: { full_name: string; phone: string }
}

type Props = {
  initialHospitals: any[]
  initialCounts: any
}

/**
 * Interactive Queue and Filtering system for agents.
 * 3-Column Layout: Status Filters | Ticket List | Selection Panel
 */
export const AgentQueue: React.FC<Props> = ({ initialHospitals, initialCounts }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [hospitalFilter, setHospitalFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [tickets, setTickets] = useState<TicketListItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        hospital: hospitalFilter,
        search: searchTerm,
      })
      
      const response = await fetch(`/api/agent/tickets?${queryParams.toString()}`)
      const data = await response.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  // Effect to refetch when filters change
  useEffect(() => {
    fetchTickets()
  }, [statusFilter, hospitalFilter, searchTerm])

  const statusMap: Record<string, string> = {
    all: 'ทั้งหมด',
    open: 'เปิดงาน',
    assigned: 'กำลังทำ',
    pending_customer: 'รอข้อมูล',
    resolved: 'สำเร็จ',
    closed: 'ปิดงาน',
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar Filters (Column 1) */}
      <aside className="w-64 bg-gray-50 border-r p-6 overflow-y-auto space-y-8 flex-shrink-0">
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">กรองตามสถานะ</h2>
          <div className="space-y-1">
            {Object.entries(statusMap).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  statusFilter === key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md ${statusFilter === key ? 'bg-blue-400/30' : 'bg-gray-200 text-gray-400'}`}>
                  {initialCounts[key] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">โรงพยาบาล</h2>
          <select 
            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100"
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
          >
            <option value="all">ทุกโรงพยาบาล</option>
            {initialHospitals.map((h: any) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Ticket List (Column 2) */}
      <section className="w-96 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <div className="relative group">
            <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาชื่องานหรือลูกค้า..."
              className="w-full bg-gray-100 border-none px-9 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          {loading ? (
             <div className="p-10 text-center text-xs text-gray-400">กำลังดาวน์โหลดข้อมูลงาน...</div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400">ไม่พบรายการงานที่ตรงตามเงื่อนไข</div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`w-full p-5 border-b text-left hover:bg-blue-50/50 transition-all ${
                  selectedTicketId === ticket.id ? 'bg-blue-50/80 border-r-4 border-r-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-blue-500 bg-blue-100/50 px-2 py-0.5 rounded-md uppercase">#{ticket.ticket_number}</span>
                  <span className="text-[10px] font-medium text-gray-400">{new Date(ticket.created_at).toLocaleDateString('th-TH')}</span>
                </div>
                <h3 className="text-sm font-black text-gray-800 line-clamp-1">{ticket.title}</h3>
                <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{ticket.hospitals.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500">{ticket.customer_users.full_name}</span>
                  <div className={`w-2 h-2 rounded-full ${ticket.priority === 'high' || ticket.priority === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Ticket Panel (Column 3) */}
      <section className="flex-1 bg-white overflow-hidden shadow-2xl z-10">
        <AgentTicketPanel ticketId={selectedTicketId} onActionSuccess={fetchTickets} />
      </section>
    </div>
  )
}
