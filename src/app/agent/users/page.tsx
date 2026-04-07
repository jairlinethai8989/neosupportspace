'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับ Admin เท่านั้น)')
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
        throw new Error(d.error || 'สร้างไม่สำเร็จ')
      }
      alert('สร้างบัญชีสำเร็จแล้ว!')
      setForm({ username: '', password: '', displayName: '', role: 'agent' })
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center">Loading Data...</div>

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Team Management</h2>
          <p className="text-sm text-gray-500">จัดการข้อมูลเจ้าหน้าที่ และผู้ดูแลระบบ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold mb-4">เพิ่มเจ้าหน้าที่ใหม่</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Username</label>
                <input required type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="agent01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Temporary Password</label>
                <input required type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="ตั้งรหัสผ่านชั่วคราว..." minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Display Name</label>
                <input required type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} placeholder="ชื่อจริง - แผนก" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Role</label>
                <select className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="agent">Agent (Support Staff)</option>
                  <option value="admin">Admin (Manager)</option>
                </select>
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-gray-900 text-white font-bold p-3 rounded-xl hover:bg-black transition-all">
                {submitting ? 'กำลังสร้าง...' : '+ CREATE ACCOUNT'}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold px-2">รายชื่อพนักงานในระบบ</h3>
            {users.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    {u.display_name}
                    {u.role === 'admin' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">Username: <span className="font-mono text-gray-600">{u.username || u.email}</span></p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${u.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  )
}
