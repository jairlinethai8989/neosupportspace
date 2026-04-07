import React, { forwardRef } from 'react'

type Props = {
  ticket: any
}

export const TicketPrintView = forwardRef<HTMLDivElement, Props>(({ ticket }, ref) => {
  if (!ticket) return null

  return (
    <div ref={ref} className="p-10 w-full bg-white text-black font-sans leading-relaxed">
      <div className="border-b-2 border-black pb-6 mb-6 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-black">SUPPORT REPORT</h1>
           <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">NeoSupport System</p>
        </div>
        <div className="text-right">
           <h2 className="text-xl font-bold uppercase">TICKET #{ticket.ticket_number}</h2>
           <p className="text-xs">{new Date().toLocaleString('en-CA')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
         <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Details</p>
            <p className="font-bold">{ticket.customer_users?.full_name || 'Unknown'}</p>
            <p className="text-sm">Department: {ticket.customer_users?.department || '-'}</p>
            <p className="text-sm">Hospital: {ticket.hospitals?.name}</p>
            <p className="text-sm">Phone: {ticket.customer_users?.phone || '-'}</p>
         </div>
         <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ticket Summary</p>
            <p className="font-bold">Status: <span className="uppercase text-blue-600">{ticket.status}</span></p>
            <p className="text-sm">Priority: <span className="uppercase">{ticket.priority}</span></p>
            <p className="text-sm">Category: {ticket.category}</p>
            <p className="text-sm">Agent: {ticket.agent_users?.display_name || 'Unassigned'}</p>
         </div>
      </div>

      <div className="mb-8">
         <h3 className="text-lg font-black mb-2 border-b border-gray-200 pb-2">Issue Title</h3>
         <p className="font-bold text-xl">{ticket.title}</p>
      </div>

      {ticket.csat_score && (
        <div className="mb-8 p-4 border-2 border-gray-900 rounded-xl">
           <h3 className="text-sm font-black mb-2 uppercase tracking-widest">Customer Satisfaction (CSAT)</h3>
           <p className="font-bold text-lg mb-1">{ticket.csat_score} / 5 Stars</p>
           {ticket.csat_review && <p className="text-sm italic">"{ticket.csat_review}"</p>}
        </div>
      )}

      <div>
         <h3 className="text-lg font-black mt-10 mb-4 border-b border-gray-200 pb-2">Communication Timeline</h3>
         <div className="space-y-6">
            {ticket.messages?.map((msg: any, idx: number) => (
              <div key={idx} className={`pb-4 ${idx !== ticket.messages.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
                 <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                   {new Date(msg.created_at).toLocaleString('th-TH')} - 
                   <span className={msg.is_internal ? 'text-amber-600' : (msg.sender_type === 'agent' ? 'text-blue-600' : 'text-gray-900')}>
                     {msg.is_internal ? ' INTERNAL NOTE' : ` ${msg.sender_type}`}
                   </span>
                 </p>
                 <p className="text-sm whitespace-pre-wrap">{msg.message_body}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="mt-20 pt-10 border-t border-gray-200 text-center text-xs text-gray-400">
         End of Report. System generated on {new Date().toLocaleString()}
      </div>
    </div>
  )
})
TicketPrintView.displayName = 'TicketPrintView'
