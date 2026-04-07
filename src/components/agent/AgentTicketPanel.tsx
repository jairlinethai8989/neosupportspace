'use client'

import React, { useState, useEffect, useRef } from 'react'

type Message = {
  id: string
  sender_type: 'customer' | 'agent' | 'system'
  message_body: string
  is_internal?: boolean
  metadata?: {
    attachments?: Array<{ url: string; type: string; name: string; size: number }>
  }
  created_at: string
}

type TicketDetail = {
  id: string
  ticket_number: number
  title: string
  category: string
  priority: string
  status: string
  hospital_id: string
  customer_id: string
  assigned_agent_id: string | null
  csat_score: number | null
  csat_review: string | null
  created_at: string
  hospitals: { name: string; code: string }
  customer_users: { full_name: string; phone: string; department: string }
  agent_users: { display_name: string } | null
  messages: Message[]
}

type Props = {
  ticketId: string | null
  onActionSuccess: () => void
}

/**
 * Detailed ticket panel for agent interaction.
 * Handles Claim, Status change, and Real-time-ish Messaging for agents.
 */
export const AgentTicketPanel: React.FC<Props> = ({ ticketId, onActionSuccess }) => {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isInternalMode, setIsInternalMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchTicketDetail = async (silent = false) => {
    if (!ticketId) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/agent/tickets/${ticketId}`)
      const data = await res.json()
      setTicket(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicketDetail()
  }, [ticketId])

  // Polling for new messages from customer
  useEffect(() => {
    if (!ticketId) return
    const interval = setInterval(() => fetchTicketDetail(true), 5000)
    return () => clearInterval(interval)
  }, [ticketId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleAction = async (action: 'assign' | 'status' | 'reply', payload: any = {}) => {
    if (!ticketId) return
    setSending(true)
    try {
      let finalPayload = { ...payload }

      // Upload file if it's a reply and attachment exists
      if (action === 'reply' && attachment) {
        const formData = new FormData()
        formData.append('file', attachment)

        const uploadRes = await fetch(`/api/agent/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const ud = await uploadRes.json()
          throw new Error('อัปโหลดไฟล์ไม่สำเร็จ: ' + ud.error)
        }

        const uploadedAttachment = await uploadRes.json()
        finalPayload.metadata = { attachments: [uploadedAttachment] }
        if (!finalPayload.messageBody) {
          finalPayload.messageBody = 'ภาพ/เอกสารแนบ'
        }
      }
      
      if (action === 'reply') {
        finalPayload.isInternal = isInternalMode
      }

      const res = await fetch(`/api/agent/tickets/${ticketId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      })
      if (res.ok) {
        if (action === 'reply') {
           setReplyText('')
           setAttachment(null)
           if (fileInputRef.current) fileInputRef.current.value = ''
        }
        fetchTicketDetail(true)
        onActionSuccess()
      } else {
        const data = await res.json()
        alert(data.error || 'Error completing action')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!ticketId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 bg-gray-50/50">
        <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-6 border border-gray-100">
          <span className="text-4xl text-gray-200">🔍</span>
        </div>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">เลือกเมนูลูกค้า</h3>
        <p className="text-sm text-gray-400 font-medium mt-2">กรุณาคลิกเลือกรายการงานจากแผงด้านซ้ายเพื่อตรวจสอบรายละเอียด</p>
      </div>
    )
  }

  if (loading) return <div className="p-20 text-center text-gray-400">กำลังดึงข้อมูลรายละเอียดงาน...</div>

  return (
    <div className="h-full flex flex-col">
      {/* Header Profile Section */}
      <div className="flex justify-between items-start p-8 border-b border-gray-100 flex-shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black bg-gray-900 text-white px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
               {ticket?.status.replace('_', ' ')}
             </span>
             <span className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">#{ticket?.ticket_number}</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight max-w-xl">{ticket?.title}</h2>
          <div className="flex gap-6 items-center">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
               <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{ticket?.hospitals.name}</span>
             </div>
             <span className="text-xs font-bold text-gray-400">•</span>
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">AGENT: {ticket?.agent_users?.display_name || 'UNASSIGNED'}</span>
             {ticket?.csat_score && (
               <>
                 <span className="text-xs font-bold text-gray-400">•</span>
                 <div className="flex gap-1 items-center bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                    <span className="text-yellow-400 text-sm leading-none shadow-sm">★</span>
                    <span className="text-xs font-black text-yellow-600">{ticket.csat_score}/5</span>
                    {ticket.csat_review && <span className="text-[10px] text-yellow-700 ml-1 font-medium italic break-all max-w-[150px] truncate block border-l border-yellow-200 pl-2">"{ticket.csat_review}"</span>}
                 </div>
               </>
             )}
          </div>
        </div>
        
        {/* Rapid Status Actions */}
        <div className="flex gap-2">
           {['assigned', 'pending_customer', 'resolved'].map((s) => (
             <button
                key={s}
                onClick={() => handleAction('status', { status: s })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest border ${
                  ticket?.status === s 
                    ? 'bg-gray-100 border-gray-300 text-gray-900 shadow-inner' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'
                }`}
             >
               {s.replace('_', ' ')}
             </button>
           ))}
        </div>
      </div>

      {/* Message Timeline (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20">
         <div className="space-y-8">
            {ticket?.messages.map((msg) => {
              const isAgent = msg.sender_type === 'agent'
              const isCustomer = msg.sender_type === 'customer'
              const isInternal = msg.is_internal
              
              return (
                <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group ${isInternal ? 'w-full max-w-[85%]' : ''}`}>
                    <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${isAgent ? 'text-blue-500 text-right' : 'text-gray-400'} ${isInternal ? '!text-amber-500' : ''}`}>
                      {isInternal ? '🔒 INTERNAL NOTE' : (isAgent ? 'YOU (AGENT)' : 'CUSTOMER')}
                    </p>
                    <div className={`px-5 py-3.5 rounded-[1.5rem] shadow-sm relative ${
                      isInternal
                        ? 'bg-amber-100/50 border border-amber-200 text-amber-900 rounded-tr-none'
                        : isAgent 
                          ? 'bg-gray-900 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.message_body}</p>
                      {msg.metadata?.attachments?.map((file, i) => (
                         <div key={i} className="mt-3">
                           {file.type.startsWith('image/') ? (
                             <img src={file.url} alt={file.name} className="max-w-full rounded-lg max-h-64 object-cover border border-black/10" />
                           ) : (
                             <a href={file.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-lg text-xs transition border ${isAgent && !isInternal ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-black/5 border-black/10 hover:bg-black/10'}`}>
                               📄 <span className="underline truncate max-w-[200px]">{file.name}</span>
                             </a>
                           )}
                         </div>
                      ))}
                      <p className={`text-[9px] mt-2 font-bold ${isInternal ? 'text-amber-700/60' : (isAgent ? 'text-gray-400' : 'text-gray-300')}`}>
                        {new Date(msg.created_at).toLocaleTimeString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
         </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0 space-y-4">
         {!ticket?.assigned_agent_id ? (
            <div className="bg-blue-600 p-6 rounded-2xl flex items-center justify-between shadow-xl shadow-blue-100">
               <div className="text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ticket Status</p>
                  <h4 className="text-lg font-black tracking-tight leading-none mt-1 uppercase">UNCLAIMED TICKET</h4>
               </div>
               <button 
                  onClick={() => handleAction('assign')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95"
               >
                 CLAIM & START WORKING
               </button>
            </div>
         ) : (
            <div className="space-y-3">
               {attachment && (
                  <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg w-full max-w-sm border border-gray-200">
                     <span className="text-xs text-gray-700 truncate font-medium">📎 {attachment.name}</span>
                     <button type="button" onClick={() => setAttachment(null)} className="text-gray-500 hover:text-black text-xs font-bold px-2 py-1 bg-white rounded-md">✕</button>
                  </div>
               )}
               <div className="flex gap-4">
                  <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && file.size > 5 * 1024 * 1024) {
                           alert('ไฟล์ขนาดใหญ่เกินไป (สูงสุด 5MB)')
                           e.target.value = ''
                           return
                        }
                        setAttachment(file || null)
                     }}
                     accept="image/jpeg,image/png,application/pdf"
                  />
                  <button 
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="bg-gray-50 border border-gray-200 text-gray-400 px-4 rounded-2xl flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 transition-all"
                     title="แนบไฟล์"
                  >
                     📎
                  </button>
                  <textarea 
                     className={`flex-1 border p-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 transition-all resize-none h-[4.5rem] ${
                        isInternalMode 
                          ? 'bg-amber-50 border-amber-200 focus:ring-amber-100 placeholder-amber-400 text-amber-900' 
                          : 'bg-gray-50 border-gray-200 focus:ring-blue-100'
                     }`}
                     placeholder={isInternalMode ? "🔒 พิมพ์โน้ตภายใน (ลูกค้ามองไม่เห็น)..." : "พิมพ์ข้อความตอบกลับลูกค้าที่นี่..."}
                     value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault()
                           if(replyText.trim() || attachment) handleAction('reply', { messageBody: replyText })
                        }
                     }}
                  />
                  <div className="flex flex-col gap-2">
                     <button 
                        onClick={() => handleAction('reply', { messageBody: replyText })}
                        disabled={(!replyText.trim() && !attachment) || sending}
                        className={`${isInternalMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-black'} text-white w-28 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center py-3 text-center disabled:opacity-50 flex-1`}
                     >
                       {sending ? '...' : (isInternalMode ? 'SAVE NOTE' : 'SEND REPLY')}
                     </button>
                     <button
                        onClick={() => setIsInternalMode(!isInternalMode)}
                        className={`text-[9px] font-bold uppercase tracking-widest py-1.5 rounded-lg border transition-all ${
                          isInternalMode 
                             ? 'bg-amber-100 border-amber-200 text-amber-700' 
                             : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                     >
                        {isInternalMode ? '🔒 INTERNAL ON' : '🔓 PUBLIC'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  )
}
