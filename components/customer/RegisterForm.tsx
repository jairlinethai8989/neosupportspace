'use client'

import React, { useState } from 'react'

type RegisterFormProps = {
  lineProfile: {
    userId: string
    displayName: string
  }
  onSuccess: () => void
}

/**
 * Modern registration form component for LIFF portal.
 * Handles Thai input for Name, Hospital Code, and Phone.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ lineProfile, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    hospitalCode: '',
    department: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/liff/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: lineProfile.userId,
          displayName: lineProfile.displayName,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">ลงทะเบียนเข้าใช้งาน</h2>
        <p className="text-gray-500 mt-2">กรุณาระบุข้อมูลเพื่อเชื่อมต่อกับระบบ Support</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="ชื่อจริง-นามสกุล"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รหัสโรงพยาบาล (Hospital Code)</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            placeholder="เช่น H001"
            value={formData.hospitalCode}
            onChange={(e) => setFormData({ ...formData, hospitalCode: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
          <input
            required
            type="tel"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="08x-xxx-xxxx"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">แผนก/หน่วยงาน</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="ระบุแผนก (ถ้ามี)"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:bg-gray-400 mt-6"
        >
          {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนและเข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  )
}
