'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Form to create a new support ticket.
 * Validation and submission are handled on the server.
 */
export const NewTicketForm = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hardware',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customer/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้าง Ticket')
      }

      router.push(`/liff/tickets/${data.ticketId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อปัญหา</label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="เช่น ไม่สามารถเข้าระบบได้, เครื่องพิมพ์เสีย"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Hardware">Hardware (ฮาร์ดแวร์)</option>
              <option value="Software">Software (ซอฟต์แวร์)</option>
              <option value="Network">Network (อินเทอร์เน็ต)</option>
              <option value="Account">Account (บัญชีผู้ใช้)</option>
              <option value="Other">Other (อื่นๆ)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ความสำคัญ</label>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">Low (ทั่วไป)</option>
              <option value="medium">Medium (ปานกลาง)</option>
              <option value="high">High (เร่งด่วน)</option>
              <option value="urgent">Urgent (วิกฤต)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดปัญหา</label>
          <textarea
            required
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="อธิบายอาการเสียหรือปัญหาอย่างละเอียด"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:bg-gray-400"
      >
        {loading ? 'กำลังส่งข้อมูล...' : 'แจ้งปัญหา / ส่งงาน'}
      </button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-gray-500 font-medium py-2 hover:underline"
      >
        ยกเลิก
      </button>
    </form>
  )
}
