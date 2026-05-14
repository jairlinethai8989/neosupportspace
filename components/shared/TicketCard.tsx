'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, UserCheck, ArrowRight, Timer } from 'lucide-react'
import { formatDistanceToNow, formatDistance } from 'date-fns'
import { th } from 'date-fns/locale'

type TicketCardProps = {
  ticket: {
    id: string
    ticket_number: number
    title: string
    status: string
    priority: string
    created_at: string
    resolved_at?: string | null
    closed_at?: string | null
    hospitals: { name: string }
    customer_users: { full_name: string }
    agent_users?: { display_name: string; role?: string } | null
  }
  onClick?: () => void
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  // คำนวณระยะเวลา
  const getDuration = () => {
    const start = new Date(ticket.created_at)
    const end = ticket.resolved_at ? new Date(ticket.resolved_at) : (ticket.closed_at ? new Date(ticket.closed_at) : new Date())
    
    // ถ้าปิดงานแล้ว ให้แสดงระยะเวลาที่ใช้ไปทั้งหมด
    if (ticket.resolved_at || ticket.closed_at) {
      return `ใช้เวลาแก้ไข: ${formatDistance(start, end, { locale: th })}`
    }
    
    // ถ้ายังเปิดอยู่ ให้แสดงว่าเปิดมานานเท่าไหร่แล้ว
    return `เปิดมาแล้ว: ${formatDistanceToNow(start, { locale: th })}`
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  }

  return (
    <Card className="group relative overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-[2.5rem] bg-white max-w-sm">
      {/* Accent Left Border (Yellow/Orange like image) */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500 rounded-l-full" />
      
      <CardContent className="p-8">
        {/* Header: ID & Priority */}
        <div className="flex justify-between items-center mb-6">
          <Badge variant="outline" className="font-mono text-[11px] px-3 py-1 bg-gray-50 border-gray-100 text-gray-400 font-bold tracking-tight">
            #SI-{ticket.ticket_number.toString().padStart(6, '0')}
          </Badge>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ticket.priority === 'urgent' || ticket.priority === 'high' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">
              {ticket.priority === 'medium' ? 'กลาง' : ticket.priority}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">🏢</span>
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{ticket.hospitals.name}</p>
          </div>
          
          <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
            {ticket.title}
          </h3>

          <div className="flex items-center gap-2 text-gray-400">
             <Calendar className="w-3.5 h-3.5" />
             <span className="text-[11px] font-bold">
               {new Date(ticket.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: '2-digit' })}
               {' • '}
               {new Date(ticket.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
             </span>
          </div>
        </div>

        {/* Roles Section (แจ้งงาน / รับงาน) */}
        <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-50 mb-8">
          <div className="flex items-center justify-between group/role">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover/role:bg-blue-50 transition-colors">
                   <User className="w-5 h-5 text-gray-300 group-hover/role:text-blue-400" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ผู้แจ้งงาน</p>
                   <p className="text-sm font-bold text-gray-700">{ticket.customer_users.full_name}</p>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between group/role">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover/role:bg-blue-600 transition-all">
                   <UserCheck className="w-5 h-5 text-blue-500 group-hover/role:text-white" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ผู้รับงาน</p>
                   <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">
                        {ticket.agent_users?.display_name || 'รอกดรับงาน'}
                      </p>
                      {ticket.agent_users && (
                        <Badge className="bg-emerald-500 text-white text-[8px] px-1.5 h-4 font-black uppercase tracking-tighter hover:bg-emerald-600">
                          {ticket.agent_users.display_name.toUpperCase()} (ADMIN)
                        </Badge>
                      )}
                   </div>
                </div>
             </div>
             
             <button className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:border-blue-200 transition-all">
                <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Duration / SLA Info */}
        <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex items-center justify-center gap-3 mb-6">
           <Timer className="w-4 h-4 text-blue-500 animate-pulse" />
           <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">
             {getDuration()}
           </span>
        </div>

        {/* Footer Action Button */}
        <Button 
          onClick={onClick}
          className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-100 transition-all active:scale-95 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          เปิดแชทใน inbox
        </Button>
      </CardContent>
    </Card>
  )
}
