'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CannedRepliesPage() {
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ id: '', title: '', content: '', category: 'General' })
  const [submitting, setSubmitting] = useState(false)

  const fetchReplies = async () => {
    try {
      const res = await fetch('/api/agent/canned')
      const data = await res.json()
      setReplies(data || [])
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
        throw new Error(d.error || 'บันทึกไม่สำเร็จ')
      }
      alert('บันทึกแม่แบบสำเร็จ!')
      resetForm()
      fetchReplies()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่?')) return
    try {
      const res = await fetch(`/api/agent/canned?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
         const d = await res.json()
         throw new Error(d.error || 'ลบไม่สำเร็จ')
      }
      fetchReplies()
    } catch(err:any) {
      alert(err.message)
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

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Data...</div>

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Canned Replies</h2>
          <p className="text-sm text-gray-500">จัดการข้อความตอบกลับสำเร็จรูป (Quick Replies)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Form */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-8">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold">{isEditing ? 'แก้ไขข้อความ' : 'สร้างข้อความใหม่'}</h3>
               {isEditing && <button onClick={resetForm} className="text-xs text-red-500 font-bold hover:underline">ยกเลิกแก้ไข</button>}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">หัวข้อ (Title)</label>
                <input required type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="เช่น วิธีรีเซ็ตรหัสผ่าน..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">หมวดหมู่ (Category)</label>
                <input required type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="เช่น Technical, General, Billing..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">เนื้อหาข้อความตอบกลับ</label>
                <textarea required rows={5} className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="สวัสดีครับ กรณีรีเซ็ตรหัสผ่าน สามารถทำได้โดย..." />
              </div>
              <button disabled={submitting} type="submit" className="w-full bg-gray-900 text-white font-bold p-3 rounded-xl hover:bg-black transition-all">
                {submitting ? 'กำลังบันทึก...' : (isEditing ? 'UPDATE REPLY' : '+ SAVE REPLY')}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold px-2">รายการที่มีในระบบ ({replies.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {replies.map(r => (
                 <div key={r.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between group">
                   <div>
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{r.category || 'General'}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEdit(r)} className="text-gray-400 hover:text-blue-500 transition px-1">✏️</button>
                           <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-500 transition px-1">🗑️</button>
                        </div>
                     </div>
                     <h4 className="font-bold text-gray-900 text-sm mb-2">{r.title}</h4>
                     <p className="text-xs text-gray-500 line-clamp-4 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">{r.content}</p>
                   </div>
                 </div>
               ))}
               {replies.length === 0 && (
                  <p className="text-sm text-gray-400 p-4">ยังไม่มีข้อความตอบกลับด่วนในระบบ</p>
               )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
