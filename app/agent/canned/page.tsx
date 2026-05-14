'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pencil, Trash2, ShieldAlert } from 'lucide-react'

export default function CannedRepliesPage() {
  const [replies, setReplies] = useState<any[]>([])
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)
  const [currentAgentRole, setCurrentAgentRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ id: '', title: '', content: '', category: 'General' })
  const [submitting, setSubmitting] = useState(false)

  const fetchReplies = async () => {
    try {
      const res = await fetch('/api/agent/canned')
      const data = await res.json()
      setReplies(data.replies || [])
      setCurrentAgentId(data.currentAgentId || null)
      setCurrentAgentRole(data.currentAgentRole || null)
    } catch (err) {
      toast.error('Failed to load canned replies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = '/api/agent/canned'
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to save reply')
      }
      toast.success(isEditing ? 'Reply updated successfully' : 'Reply created successfully')
      resetForm()
      fetchReplies()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return
    try {
      const res = await fetch(`/api/agent/canned?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
         const d = await res.json()
         throw new Error(d.error || 'Failed to delete')
      }
      toast.success('Reply deleted')
      fetchReplies()
    } catch(err:any) {
      toast.error(err.message)
    }
  }

  const resetForm = () => {
    setIsEditing(null)
    setForm({ id: '', title: '', content: '', category: 'General' })
  }

  const handleEdit = (reply: any) => {
    setIsEditing(reply.id)
    setForm({ id: reply.id, title: reply.title, content: reply.content, category: reply.category || 'General' })
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse font-medium">Loading templates...</div>

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Canned Replies</h2>
          <p className="text-sm text-muted-foreground">Manage templates for faster customer responses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create/Edit Form */}
          <div className="h-fit lg:sticky lg:top-8">
            <Card className="border-border shadow-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{isEditing ? 'Edit Reply' : 'New Reply'}</CardTitle>
                  {isEditing && (
                    <Button variant="ghost" size="sm" onClick={resetForm} className="text-destructive h-auto p-0 hover:bg-transparent">
                      Cancel
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {isEditing ? 'Update your template text' : 'Create a new template snippet'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Title</label>
                    <Input 
                      required 
                      value={form.title} 
                      onChange={e => setForm({...form, title: e.target.value})} 
                      placeholder="e.g. Password Reset..." 
                      className="bg-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Category</label>
                    <Input 
                      required 
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value})} 
                      placeholder="e.g. Technical, General..." 
                      className="bg-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Content</label>
                    <Textarea 
                      required 
                      rows={6} 
                      value={form.content} 
                      onChange={e => setForm({...form, content: e.target.value})} 
                      placeholder="Hello, here is how you can..." 
                      className="bg-transparent resize-none leading-relaxed"
                    />
                  </div>
                  <Button disabled={submitting} type="submit" className="w-full font-semibold">
                    {submitting ? 'Saving...' : (isEditing ? 'Update Reply' : 'Save Reply')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* List of Canned Replies */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold px-1">Templates ({replies.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {replies.map(r => {
                 const isOwner = r.created_by === currentAgentId;
                 const canModify = isOwner || currentAgentRole === 'admin';
                 
                 return (
                   <Card key={r.id} className="border-border shadow-none group relative overflow-hidden flex flex-col">
                     <CardHeader className="pb-3 px-5 pt-5 flex-row justify-between items-start space-y-0 relative z-10">
                        <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider bg-secondary/50 text-secondary-foreground">
                          {r.category || 'General'}
                        </Badge>
                        
                        {canModify && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => handleEdit(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {!canModify && (
                          <div className="absolute right-4 top-4 text-muted-foreground/30" title="Locked: You don't have permission to edit this">
                            <ShieldAlert className="h-4 w-4" />
                          </div>
                        )}
                     </CardHeader>
                     
                     <CardContent className="px-5 pb-4 flex-grow z-10">
                      <h4 className="font-semibold text-foreground text-sm mb-2 leading-tight">{r.title}</h4>
                      <div className="bg-secondary/40 p-3 rounded-lg border border-border/50 h-[100px] overflow-hidden relative">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                          {r.content}
                        </p>
                      </div>
                     </CardContent>

                     <CardFooter className="px-5 pb-4 pt-0 border-t-0 space-x-2">
                        {r.author ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 border border-border">
                              <AvatarImage src={r.author.avatar_url || ''} />
                              <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                                {r.author.display_name?.charAt(0) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {r.author.display_name} {isOwner ? '(You)' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium italic">Shared Template</span>
                        )}
                     </CardFooter>
                   </Card>
                 )
               })}
               {replies.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground font-medium">No canned replies found.</p>
                  </div>
               )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
