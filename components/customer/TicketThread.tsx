'use client'

import React, { useEffect, useState, useRef } from 'react'

type Message = {
  id: string
  sender_type: 'customer' | 'agent' | 'system'
  message_body: string
  metadata?: {
    attachments?: Array<{ url: string; type: string; name: string; size: number }>
  }
  created_at: string
}

type Ticket = {
  id: string
  ticket_number: number
  title: string
  status: string
  priority: string
  csat_score?: number | null
  csat_review?: string | null
}

const POLLING_INTERVAL = 5000 // 5 seconds

/**
 * Message thread component for customers to view and send messages.
 * Includes polling logic to fetch new messages automatically.
 */
export const TicketThread = ({ ticketId }: { ticketId: string }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [csatScore, setCsatScore] = useState(0)
  const [csatReview, setCsatReview] = useState('')
  const [submittingCsat, setSubmittingCsat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchData = async (silent = false) => {
    try {
      const response = await fetch(`/api/customer/tickets/${ticketId}/messages`)
      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูลแชท')
      const data = await response.json()
      
      setMessages(data.messages)
      setTicket(data.ticket)
      
      if (!silent) setLoading(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Initial Fetch
  useEffect(() => {
    fetchData()
  }, [ticketId])

  // Polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [ticketId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !attachment) || sending) return

    setSending(true)
    try {
      let uploadedAttachment = null

      // First upload file if exists
      if (attachment) {
        setUploadProgress(true)
        const formData = new FormData()
        formData.append('file', attachment)

        const uploadRes = await fetch(`/api/customer/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const ud = await uploadRes.json()
          throw new Error('อัปโหลดไฟล์ไม่สำเร็จ: ' + (ud.error || 'Unknown error'))
        }

        uploadedAttachment = await uploadRes.json()
        setUploadProgress(false)
      }

      const response = await fetch(`/api/customer/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageBody: newMessage || 'ภาพ/เอกสารแนบ', 
          metadata: uploadedAttachment ? { attachments: [uploadedAttachment] } : {} 
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'ส่งข้อความไม่สำเร็จ')
      }

      setNewMessage('')
      setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchData(true)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSending(false)
      setUploadProgress(false)
    }
  }

  const handleSubmitCsat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (csatScore === 0 || submittingCsat) return
    setSubmittingCsat(true)
    try {
      const res = await fetch(`/api/customer/tickets/${ticketId}/csat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: csatScore, review: csatReview })
      })
      if (!res.ok) throw new Error('บันทึกคะแนนไม่สำเร็จ')
      alert('ขอบคุณสำหรับคะแนนประเมินครับ!')
      fetchData(true)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmittingCsat(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">กำลังโหลดแชท...</div>

  const isClosed = ticket && ['resolved', 'closed'].includes(ticket.status)

  return (
    <div className="flex flex-col h-full">
      {/* Ticket Header Brief */}
      <div className="bg-white border-b p-4 mb-4 rounded-b-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{ticket?.ticket_number}</span>
          <span className="text-xs uppercase font-black text-gray-400 tracking-tighter">{ticket?.priority.toUpperCase()} PRIORITY</span>
        </div>
        <h2 className="text-lg font-bold text-gray-800 line-clamp-1">{ticket?.title}</h2>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 mb-24 min-h-[400px]">
        {messages.map((msg) => {
          const isCustomer = msg.sender_type === 'customer'
          const isSystem = msg.sender_type === 'system'

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{msg.message_body}</span>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                  isCustomer
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {!isCustomer && <p className="text-[10px] font-black uppercase text-blue-500 mb-1">AGENT</p>}
                <p className="text-sm whitespace-pre-wrap">{msg.message_body}</p>
                {msg.metadata?.attachments?.map((file, i) => (
                  <div key={i} className="mt-2">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="max-w-full rounded-lg max-h-64 object-cover" />
                    ) : (
                      <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/5 p-2 rounded-lg text-xs hover:bg-black/10 transition">
                        📄 <span className="underline truncate max-w-[200px]">{file.name}</span>
                      </a>
                    )}
                  </div>
                ))}
                <p className={`text-[9px] mt-1 ${isCustomer ? 'text-blue-100' : 'text-gray-400'} text-right`}>
                  {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input (Fixed at bottom) */}
      {!isClosed ? (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50/80 backdrop-blur-md border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="max-w-screen-md mx-auto flex flex-col gap-2">
            {attachment && (
              <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                <span className="text-xs text-blue-700 truncate max-w-[200px] font-medium">📎 {attachment.name}</span>
                <button type="button" onClick={() => setAttachment(null)} className="text-blue-500 hover:text-blue-700 text-xs font-bold px-2 py-1 bg-blue-100 rounded-md">✕</button>
              </div>
            )}
            <div className="flex gap-2">
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
                className="bg-white border border-gray-200 text-gray-500 p-4 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
                title="แนบไฟล์รูปภาพหรือ PDF"
              >
                📎
              </button>
              <textarea
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              <button
                disabled={sending || (!newMessage.trim() && !attachment)}
                type="submit"
                className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:bg-gray-300 transition-all active:scale-90 shadow-lg"
              >
                <span className="text-xl">{uploadProgress ? '⏳' : '✈️'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-gray-100 rounded-t-3xl pb-8 z-10 transition-all">
          {ticket?.csat_score ? (
            <div className="text-center">
               <p className="text-gray-500 font-bold mb-2">Ticket ถูกปิดเรียบร้อยแล้ว</p>
               <div className="inline-flex gap-1 mb-2">
                 {[1,2,3,4,5].map(star => (
                   <span key={star} className={`text-2xl ${star <= ticket.csat_score! ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                 ))}
               </div>
               <p className="text-xs text-gray-400">ขอบคุณสำหรับคะแนนความพึงพอใจ</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitCsat} className="max-w-md mx-auto text-center space-y-4">
               <div>
                  <h3 className="font-bold text-gray-800">ให้คะแนนความพึงพอใจการบริการ</h3>
                  <p className="text-xs text-gray-500 mt-1">การประเมินนี้ช่วยให้เราพัฒนาบริการให้ดียิ่งขึ้น</p>
               </div>
               <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setCsatScore(star)}
                      className={`text-4xl transition-all focus:outline-none ${csatScore >= star ? 'text-yellow-400 scale-110 drop-shadow-sm' : 'text-gray-200 hover:text-yellow-200'} active:scale-95`}
                    >
                      ★
                    </button>
                  ))}
               </div>
               <textarea 
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
                  placeholder="ข้อเสนอแนะเพิ่มเติม (ถ้ามี)"
                  value={csatReview}
                  onChange={(e) => setCsatReview(e.target.value)}
               />
               <button 
                  disabled={csatScore === 0 || submittingCsat}
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95"
               >
                 {submittingCsat ? 'กำลังส่งข้อมูล...' : 'ส่งคะแนนประเมิน'}
               </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
