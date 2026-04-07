import React from 'react'
import { NewTicketForm } from '@/components/customer/NewTicketForm'

/**
 * Page for customers to create a new support ticket.
 * Accessible from the LIFF portal dashboard.
 */
export default function NewTicketPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white p-6 shadow-sm mb-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">แจ้งปัญหาใหม่</h1>
        <p className="text-sm text-gray-500">กรุณากรอกข้อมูลปัญหาเพื่อให้เจ้าหน้าที่ช่วยตรวจสอบ</p>
      </header>

      <div className="px-4">
        <NewTicketForm />
      </div>
    </main>
  )
}
