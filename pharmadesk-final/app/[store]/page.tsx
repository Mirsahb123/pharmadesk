"use client"
import { useEffect } from 'react'

export default function StorePage() {
  useEffect(() => {
    window.location.href = '/dashboard'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  )
}