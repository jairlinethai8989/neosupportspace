'use client'

import React, { useState, useRef } from 'react'

export const ProfileForm = ({ agentData }: { agentData: any }) => {
  const [password, setPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/agent/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      alert('เปลี่ยนรหัสผ่านสำเร็จ!')
      setPassword('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/agent/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      
      alert('เปลี่ยนรูปโปรไฟล์สำเร็จ กรุณารีเฟรชหน้าเว็บเพื่อดูการเปลี่ยนแปลง')
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="space-y-8">
       {/* Profile Display */}
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 bg-cover bg-center border-4 border-white shadow-xl flex items-center justify-center text-gray-400 font-bold text-3xl" style={{ backgroundImage: agentData?.avatar_url ? `url(${agentData.avatar_url})` : 'none' }}>
             {!agentData?.avatar_url && agentData?.display_name?.charAt(0)}
          </div>
          <div className="flex-1">
             <h3 className="text-xl font-bold">{agentData?.display_name}</h3>
             <p className="text-gray-500 text-sm">Username: {agentData?.username || agentData?.email}</p>
             <p className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-2 font-bold uppercase tracking-widest">{agentData?.role}</p>
          </div>
          <div>
            <input type="file" ref={fileRef} onChange={handleAvatarUpload} className="hidden" accept="image/jpeg,image/png,image/webp" />
            <button onClick={() => fileRef.current?.click()} disabled={avatarLoading} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50">
              {avatarLoading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
            </button>
          </div>
       </div>

       {/* Security */}
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span>🔒</span> Security (เปลี่ยนรหัสผ่าน)</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">New Password</label>
               <input required type="password" minLength={6} className="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={e => setPassword(e.target.value)} placeholder="รหัสผ่านใหม่..." />
             </div>
             <button disabled={passwordLoading} type="submit" className="bg-gray-900 text-white font-bold p-3 rounded-xl hover:bg-black transition-all w-full">
                {passwordLoading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่าน'}
             </button>
          </form>
       </div>
    </div>
  )
}
