'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ShieldCheck, User, UserX } from 'lucide-react'

export default function TeamManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'agent' })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/agent/users')
      if (res.status === 403) {
        toast.error('Forbidden: Admins only')
        router.push('/agent')
        return
      }
      const data = await res.json()
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/agent/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to create user')
      }
      toast.success('Agent created successfully!')
      setForm({ username: '', password: '', displayName: '', role: 'agent' })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/agent/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      })
      if (!res.ok) {
         const d = await res.json()
         throw new Error(d.error)
      }
      toast.success(`Agent ${!currentStatus ? 'Activated' : 'Suspended'}`)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse font-medium">Loading Team Data...</div>

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">Manage agent accounts, roles, and access limits.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create User Form */}
          <div className="h-fit lg:sticky lg:top-8">
            <Card className="border-border shadow-none bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Add New Member</CardTitle>
                <CardDescription>Create a new account for support staff or administrators.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Username</label>
                    <Input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="e.g. agent01" className="bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Temporary Password</label>
                    <Input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" minLength={6} className="bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Display Name</label>
                    <Input required value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} placeholder="e.g. John - IT Support" className="bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">System Role</label>
                    <select 
                      className="w-full bg-secondary/30 p-2.5 rounded-md border border-border outline-none text-sm font-medium text-foreground cursor-pointer" 
                      value={form.role} 
                      onChange={e => setForm({...form, role: e.target.value})}
                    >
                      <option value="agent">Agent (Support Staff)</option>
                      <option value="admin">Admin (Manager)</option>
                    </select>
                  </div>
                  <Button disabled={submitting} type="submit" className="w-full font-semibold mt-2">
                    {submitting ? 'Creating...' : '+ Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* User List Table */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold px-1 flex items-center gap-2">
               <User className="w-5 h-5" /> Team Members ({users.length})
            </h3>
            
            <Card className="border-border shadow-none overflow-hidden">
               <Table>
                 <TableHeader className="bg-secondary/20">
                   <TableRow className="border-border">
                     <TableHead className="font-semibold text-xs tracking-wider uppercase">Name</TableHead>
                     <TableHead className="font-semibold text-xs tracking-wider uppercase">Role</TableHead>
                     <TableHead className="font-semibold text-xs tracking-wider uppercase text-center">Status</TableHead>
                     <TableHead className="font-semibold text-xs tracking-wider uppercase text-right">Access</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {users.map((u) => (
                     <TableRow key={u.id} className="border-border group transition-colors">
                       <TableCell className="font-medium text-foreground">
                         <div className="flex flex-col">
                           <span>{u.display_name}</span>
                           <span className="text-xs text-muted-foreground font-mono">{u.username || u.email}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         {u.role === 'admin' || u.role === 'super_admin' ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary uppercase text-[9px] tracking-widest hover:bg-primary/20"><ShieldCheck className="w-3 h-3 mr-1"/> {u.role}</Badge>
                         ) : (
                            <Badge variant="outline" className="text-muted-foreground uppercase text-[9px] tracking-widest border-border text-foreground"><User className="w-3 h-3 mr-1"/> {u.role}</Badge>
                         )}
                       </TableCell>
                       <TableCell className="text-center">
                         {u.is_active ? (
                            <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/10 uppercase text-[9px] tracking-widest font-bold">Active</Badge>
                         ) : (
                            <Badge variant="outline" className="border-red-500/30 text-destructive bg-destructive/10 uppercase text-[9px] tracking-widest font-bold"><UserX className="w-3 h-3 mr-1" /> Suspended</Badge>
                         )}
                       </TableCell>
                       <TableCell className="text-right">
                          <Switch 
                            checked={u.is_active} 
                            onCheckedChange={() => toggleUserStatus(u.id, u.is_active)}
                            disabled={u.role === 'super_admin'}
                            className="data-[state=checked]:bg-primary"
                            title={u.role === 'super_admin' ? "Cannot modify super admin" : "Toggle account access"}
                          />
                       </TableCell>
                     </TableRow>
                   ))}
                   {users.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-medium">No team members found.</TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
            </Card>
          </div>
        </div>
        
      </div>
    </div>
  )
}
