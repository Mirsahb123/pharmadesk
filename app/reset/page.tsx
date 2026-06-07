"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const router = useRouter()

  useEffect(() => {
    localStorage.removeItem('staff')
    localStorage.removeItem('currentUser')

    const defaultAdmin = {
      id: 1,
      name: 'Admin',
      phone: '03001234567',
      password: 'admin123',
      role: 'admin',
      salary: 0
    }
    localStorage.setItem('staff', JSON.stringify([defaultAdmin]))
    alert('Reset Done! Default Admin create ho gaya\nPhone: 03001234567\nPassword: admin123')
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Resetting...</h1>
        <p className="text-gray-600">Login page pe le ja rahe hain</p>
      </div>
    </div>
  )
}
