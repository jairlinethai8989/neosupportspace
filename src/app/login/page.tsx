'use client'

import React, { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * Modern login page for agents and admins.
 * Uses Supabase Auth (Email/Password or Magic Link if configured).
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'เข้าสู่ระบบสำเร็จ กำลังนำท่านไปยังหน้าควบคุม...' })
      
      // Short delay for visual feedback before redirect
      setTimeout(() => {
        router.push('/agent')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-[2.5rem] p-10 border border-white">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-3xl text-white">🛡️</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">NeoSupport</h1>
          <p className="text-gray-400 font-medium mt-1">Agent & Admin Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 px-1">อีเมลเจ้าหน้าที่</label>
            <input
              required
              type="email"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all"
              placeholder="agent@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 px-1">รหัสผ่าน</label>
            <input
              required
              type="password"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:bg-gray-400 text-lg"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          NeoSupport v1.0.0 &copy; 2026 Foundation System
        </p>
      </div>
    </main>
  )
}
