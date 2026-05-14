'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquareQuote, Star } from 'lucide-react'

type Feedback = {
  id: string
  ticket_number: number
  csat_score: number
  csat_review: string | null
  last_message_at: string
  customer_users: { full_name: string } | null
  agent_users: { display_name: string } | null
}

export default function CsatFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agent/feedback')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setFeedbacks(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const averageScore = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, curr) => acc + curr.csat_score, 0) / feedbacks.length).toFixed(1)
    : '0.0'

  if (loading) return <div className="p-10 text-center animate-pulse text-muted-foreground font-medium">Loading Feedback...</div>

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Customer Satisfaction (CSAT)</h2>
            <p className="text-sm text-muted-foreground">View service ratings and direct feedback from customers.</p>
          </div>
          <div className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-border shadow-sm">
             <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Average Score</p>
                <div className="flex items-baseline gap-1">
                   <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                   <span className="text-2xl font-black">{averageScore}</span>
                   <span className="text-xs text-muted-foreground font-bold">/ 5</span>
                </div>
             </div>
             <div className="w-px h-10 bg-border"></div>
             <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Reviews</p>
                <span className="text-xl font-bold text-foreground">{feedbacks.length}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbacks.map((f) => (
             <Card key={f.id} className="border-border shadow-none bg-card hover:border-gray-300 transition-all flex flex-col">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex justify-between items-start">
                     <div>
                       <Badge variant="outline" className="text-[10px] tracking-widest font-mono mb-2">#{f.ticket_number}</Badge>
                       <CardTitle className="text-sm flex items-center gap-1">
                         {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < f.csat_score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                         ))}
                         <span className="ml-1 text-xs font-bold text-foreground">{f.csat_score}.0</span>
                       </CardTitle>
                     </div>
                     <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(f.last_message_at).toLocaleDateString('th-TH')}
                     </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4">
                   {f.csat_review ? (
                      <div className="flex gap-2">
                        <MessageSquareQuote className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 italic font-medium leading-relaxed">"{f.csat_review}"</p>
                      </div>
                   ) : (
                      <p className="text-xs text-gray-400 italic">No text feedback provided.</p>
                   )}
                   <div className="mt-4 pt-4 border-t border-dashed border-border/50 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest shrink-0">
                         By: <span className="text-foreground">{f.customer_users?.full_name || 'Customer'}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-primary tracking-widest border border-primary/20 bg-primary/5 px-2 py-1 rounded truncate max-w-[120px]">
                         Agent: {f.agent_users?.display_name || 'System'}
                      </span>
                   </div>
                </CardContent>
             </Card>
          ))}
          {feedbacks.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-400">No CSAT Reviews Yet</h3>
                <p className="text-sm text-gray-400 mt-1">When customers rate their resolved tickets, they will appear here.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  )
}
