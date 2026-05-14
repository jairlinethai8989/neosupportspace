'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ImageEditorModal } from './ImageEditorModal'
import { TicketPrintView } from './TicketPrintView'
import { useReactToPrint } from 'react-to-print'
import { FileUploadPreview } from '../shared/FileUploadPreview'
import { Paperclip, Send, Lock, Unlock, Zap, FileText, GitBranch, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

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
  assigned_team: string
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

export const AgentTicketPanel: React.FC<Props> = ({ ticketId, onActionSuccess }) => {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [imageToEdit, setImageToEdit] = useState<{ url: string, name: string } | null>(null)
  const [isInternalMode, setIsInternalMode] = useState(false)
  const [cannedReplies, setCannedReplies] = useState<Array<{ id: string; category: string; title: string; content: string }>>([])

  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `NeoSupport_Ticket_${ticket?.ticket_number || 'Export'}`
  })

  useEffect(() => {
    fetch('/api/agent/canned').then(res => res.json()).then(data => setCannedReplies(data || []))
  }, [])

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
      const finalPayload = { ...payload }

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
        toast.error(data.error || 'Error completing action')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleTransfer = async (team: string) => {
    if (!ticketId) return
    setSending(true)
    try {
      const res = await fetch(`/api/agent/tickets/${ticketId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      })
      if (res.ok) {
        toast.success(`Transferred to ${team.toUpperCase()}`)
        fetchTicketDetail(true)
        onActionSuccess()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Transfer failed')
      }
    } catch (err) {
      toast.error('Network error during transfer')
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
    <div className="h-full flex flex-col bg-white">
      {/* Header Profile Section */}
      <div className="flex justify-between items-start p-6 border-b border-gray-100 flex-shrink-0 bg-white z-20">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black bg-gray-900 text-white px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
               {ticket?.status.replace('_', ' ')}
             </span>
             <span className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">#{ticket?.ticket_number}</span>
             {ticket?.assigned_team && ticket.assigned_team !== 'support' && (
               <span className="text-[10px] font-black bg-amber-500 text-white px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                 Team: {ticket.assigned_team}
               </span>
             )}
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight max-w-xl line-clamp-1">{ticket?.title}</h2>
          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{ticket?.hospitals.name}</span>
             </div>
             <span className="text-xs font-bold text-gray-200">•</span>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">AGENT: {ticket?.agent_users?.display_name || 'UNASSIGNED'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-white shadow-sm hover:bg-accent hover:text-accent-foreground border-dashed border-gray-200 text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 gap-2 h-8 px-3 cursor-pointer">
                        <GitBranch className="w-3 h-3" /> TRANSFER <ChevronDown className="w-3 h-3 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign to Team</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleTransfer('programmer')} className="flex items-center justify-between group">
                          <span className="font-bold text-xs uppercase tracking-tight">💻 Programmer Team</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTransfer('sa')} className="flex items-center justify-between group">
                          <span className="font-bold text-xs uppercase tracking-tight">📐 SA / Analyst</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTransfer('pending_dev')} className="flex items-center justify-between group text-amber-600">
                          <span className="font-bold text-xs uppercase tracking-tight">⏳ Pending Dev Bucket</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleTransfer('support')} className="text-gray-400">
                          <span className="font-bold text-xs uppercase tracking-tight">↺ Back to Support</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>

                  <button onClick={() => handlePrint()} className="text-[9px] font-black uppercase bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 h-8">
                    📄 PDF
                  </button>
                  
                  <button 
                    onClick={() => setIsCustomerInfoOpen(!isCustomerInfoOpen)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isCustomerInfoOpen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    title={isCustomerInfoOpen ? "ซ่อนข้อมูลลูกค้า" : "แสดงข้อมูลลูกค้า"}
                  >
                    👤
                  </button>
                </div>
                
                <div className="flex gap-1.5">
                  {['assigned', 'pending_customer', 'resolved'].map((s) => (
                    <button
                        key={s}
                        onClick={() => handleAction('status', { status: s })}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all tracking-widest border h-7 ${
                          ticket?.status === s 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-50">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20">
              <div className="space-y-8">
                {ticket?.messages.map((msg) => {
                  const isAgent = msg.sender_type === 'agent'
                  const isSystem = msg.sender_type === 'system'
                  const isInternal = msg.is_internal
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest border border-gray-200/50 shadow-sm">
                          {msg.message_body}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] group ${isInternal ? 'w-full' : ''}`}>
                        <p className={`text-[9px] font-black uppercase mb-1 tracking-widest ${isAgent ? 'text-blue-500 text-right' : 'text-gray-400'} ${isInternal ? '!text-amber-500' : ''}`}>
                          {isInternal ? '🔒 INTERNAL NOTE' : (isAgent ? 'YOU (AGENT)' : 'CUSTOMER')}
                        </p>
                        <div className={`px-5 py-3.5 rounded-2xl shadow-sm relative ${
                          isInternal
                            ? 'bg-amber-100/40 border border-amber-200 text-amber-900 rounded-tr-none'
                            : isAgent 
                              ? 'bg-gray-900 text-white rounded-tr-none' 
                              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                        }`}>
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.message_body}</p>
                          {msg.metadata?.attachments?.map((file, i) => (
                            <div key={i} className="mt-3 relative group/img w-fit block">
                              {file.type.startsWith('image/') ? (
                                <>
                                  <img src={file.url} alt={file.name} className="max-w-full rounded-lg max-h-64 object-cover border border-black/10" />
                                  <button 
                                    title="แก้ไข"
                                    onClick={() => setImageToEdit({ url: file.url, name: file.name })} 
                                    className="absolute top-2 right-2 bg-gray-900 border border-gray-700 text-white px-3 py-1.5 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-2 hover:bg-black font-bold text-[10px] uppercase tracking-widest shadow-xl"
                                  >
                                      ✏️ EDIT
                                  </button>
                                </>
                              ) : (
                                <a href={file.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2 rounded-lg text-xs transition border ${isAgent && !isInternal ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-black/5 border-black/10 hover:bg-black/10'}`}>
                                  <FileText className="w-4 h-4" /> <span className="underline truncate max-w-[200px]">{file.name}</span>
                                </a>
                              )}
                            </div>
                          ))}
                          <p className={`text-[8px] mt-2 font-bold ${isInternal ? 'text-amber-700/60' : (isAgent ? 'text-gray-400' : 'text-gray-300')}`}>
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

          <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
            {!ticket?.assigned_agent_id ? (
                <div className="bg-blue-600 p-6 rounded-2xl flex items-center justify-between shadow-xl shadow-blue-100">
                  <div className="text-white space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-70 text-blue-100">Ticket Waiting</p>
                      <h4 className="text-lg font-black tracking-tight leading-none uppercase">Claim this ticket</h4>
                  </div>
                  <Button onClick={() => handleAction('assign')} className="bg-white text-blue-600 px-6 h-10 rounded-xl font-black text-xs hover:bg-gray-100 transition-all active:scale-95 shadow-lg">CLAIM & START</Button>
                </div>
            ) : (
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                      <div className="flex-1 flex flex-col gap-2">
                        <FileUploadPreview file={attachment} onRemove={() => setAttachment(null)} loading={sending} />
                        <div className="relative transition-all duration-300 rounded-2xl border overflow-hidden bg-gray-50 border-gray-100 focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50">
                          <textarea 
                            className="w-full bg-transparent p-4 pb-12 text-sm font-medium outline-none resize-none min-h-[4.5rem] max-h-48 scrollbar-none text-foreground"
                            placeholder="พิมพ์ข้อความตอบกลับลูกค้า..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  if(replyText.trim() || attachment) handleAction('reply', { messageBody: replyText })
                                }
                            }}
                          />
                          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                            <div className="flex items-center gap-1.5 pointer-events-auto">
                              <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                              <TooltipProvider><Tooltip><TooltipTrigger><Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 rounded-lg bg-white border border-border"><Paperclip className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Attach (Max 5MB)</TooltipContent></Tooltip></TooltipProvider>
                              
                              <TooltipProvider><Tooltip><TooltipTrigger><Button variant="ghost" size="icon" onClick={() => setIsInternalMode(!isInternalMode)} className={`h-8 w-8 rounded-lg border transition-all ${isInternalMode ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white border-border text-gray-400'}`}>{isInternalMode ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}</Button></TooltipTrigger><TooltipContent>{isInternalMode ? 'Internal Mode ON' : 'Customer Mode ON'}</TooltipContent></Tooltip></TooltipProvider>
                            </div>
                            <div className="flex items-center gap-2 pointer-events-auto">
                              <Button 
                                onClick={() => handleAction('reply', { messageBody: replyText })} 
                                disabled={(!replyText.trim() && !attachment) || sending} 
                                className={`h-8 px-5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${isInternalMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-black'} text-white shadow-lg`}
                              >
                                {sending ? '...' : (
                                  <>
                                    {isInternalMode ? 'Add Note' : 'Send'}
                                    <Send className="w-3 h-3 ml-2" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                  {cannedReplies.length > 0 && !isInternalMode && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
                        {cannedReplies.slice(0, 5).map((r: any) => (
                          <button key={r.id} onClick={() => setReplyText(r.content)} className="text-[9px] font-bold bg-white text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-border transition-all whitespace-nowrap">
                            {r.title}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
            )}
          </div>
        </div>

        {/* Customer Meta Sidebar (Right Column) */}
        <aside className={`bg-white border-l border-gray-100 flex flex-col transition-all duration-300 ease-in-out ${isCustomerInfoOpen ? 'w-80' : 'w-0 border-0 opacity-0 overflow-hidden'}`}>
           <div className="p-6 space-y-8 overflow-y-auto">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Customer Meta</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-black text-blue-600 shadow-sm border border-blue-200/20">
                      {ticket?.customer_users.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-tight">{ticket?.customer_users.full_name}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Customer Profile</p>
                    </div>
                  </div>

                  <div className="space-y-4 px-1">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Phone Number</p>
                      <p className="text-sm font-bold text-gray-700 font-mono tracking-tight">{ticket?.customer_users.phone || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-bold text-gray-700">{ticket?.customer_users.department || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Hospital Location</p>
                      <p className="text-sm font-bold text-gray-700">{ticket?.hospitals.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Category</p>
                      <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase mt-1 border border-gray-200/50">{ticket?.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              {ticket?.csat_score && (
                <div className="pt-8 border-t border-gray-100">
                   <h3 className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mb-4">Satisfaction Score</h3>
                   <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-2xl">
                      <div className="flex items-center gap-1.5 mb-2">
                         {[1,2,3,4,5].map((s: number) => (
                           <span key={s} className={`text-lg ${s <= (ticket?.csat_score || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                         ))}
                         <span className="ml-2 text-sm font-black text-yellow-700">{ticket.csat_score}/5</span>
                      </div>
                      <p className="text-xs font-medium text-yellow-800/70 italic leading-relaxed">&quot;{ticket.csat_review}&quot;</p>
                   </div>
                </div>
              )}

              <div className="pt-8 border-t border-gray-100">
                <button 
                  onClick={() => handlePrint()}
                  className="w-full bg-gray-900 text-white p-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>📄</span> Export PDF Summary
                </button>
              </div>
           </div>
        </aside>
      </div>

      {imageToEdit && (
         <ImageEditorModal imageUrl={imageToEdit!.url} fileName={imageToEdit!.name} onClose={() => setImageToEdit(null)} onSave={(file) => { setAttachment(file); setImageToEdit(null); }} />
      )}
      <div className="hidden"><TicketPrintView ref={printRef} ticket={ticket} /></div>
    </div>
  )
}
