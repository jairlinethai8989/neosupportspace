'use client'

import React, { useEffect, useState } from 'react'
import liff from '@line/liff'
import { RegisterForm } from './RegisterForm'
import { useRouter } from 'next/navigation'

/**
 * Initializes LIFF and ensures the user is logged into LINE.
 * Renders the RegisterForm once the LINE profile is acquired.
 */
export const LiffRegisterWrapper = () => {
  const [profile, setProfile] = useState<{ userId: string; displayName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        // For local testing without LIFF, we can set a fallback or mock
        if (!liffId) {
          console.warn('NEXT_PUBLIC_LIFF_ID is not configured. Falling back to mock data.')
          setProfile({ userId: 'MOCKED_LINE_ID_' + Math.floor(Math.random() * 1000), displayName: 'Mock User' })
          return
        }

        await liff.init({ liffId })

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }

        const liffProfile = await liff.getProfile()
        setProfile({
          userId: liffProfile.userId,
          displayName: liffProfile.displayName,
        })
      } catch (err: any) {
        console.error('LIFF init error', err)
        setError(err.message)
        // Fallback for development if LIFF fails (e.g. not in LINE browser)
        setProfile({ userId: 'MOCKED_LINE_ID_' + Math.floor(Math.random() * 1000), displayName: 'Dev User' })
      }
    }
    initLiff()
  }, [])

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100 max-w-md mx-auto">
        <h3 className="font-bold mb-2">LIFF Error</h3>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold">กำลังเชื่อมต่อกับ LINE...</p>
      </div>
    )
  }

  return (
    <RegisterForm 
      lineProfile={profile} 
      onSuccess={() => {
        router.refresh()
      }} 
    />
  )
}
