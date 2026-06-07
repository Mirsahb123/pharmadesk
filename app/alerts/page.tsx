"use client"
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

type Medicine = {
  id: string
  name: string
  expiry?: string
  qty: number
  type?: string
  price?: number
}

export default function AlertsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const inv = JSON.parse(localStorage.getItem('inventory') || '[]')
    setMedicines(inv)
  }, [])

  const { today, thirtyDaysLater, expired, expiringSoon, lowStock, outOfStock } = useMemo(() => {
    const today = new Date()
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expired = medicines.filter(m => m.expiry && new Date(m.expiry) < today)
    const expiringSoon = medicines.filter(m => {
      if (!m.expiry) return false
      const expDate = new Date(m.expiry)
      return expDate >= today && expDate <= thirtyDaysLater
    })
    const lowStock = medicines.filter(m => m.qty > 0 && m.qty < 10)
    const outOfStock = medicines.filter(m => m.qty === 0)

    return { today, thirtyDaysLater, expired, expiringSoon, lowStock, outOfStock }
  }, [medicines])

  if (!isClient) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">🚨 Alerts & Warnings</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">← Dashboard</Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-sm opacity-90">Expired</p>
            <p className="text-4xl font-black">{expired.length}</p>
          </div>
          <div className="bg-yellow-500 text-white p-6 rounded-xl shadow-lg">
            <p className="text-sm opacity-90">Expiring in 30 Days</p>
            <p className="text-4xl font-black">{expiringSoon.length}</p>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-xl shadow-lg">
            <p className="text-sm opacity-90">Low Stock &lt;10</p>
            <p className="text-4xl font-black">{lowStock.length}</p>
          </div>
          <div className="bg-gray-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-sm opacity-90">Out of Stock</p>
            <p className="text-4xl font-black">{outOfStock.length}</p>
          </div>
        </div>

        {/* Expired Medicines */}
        {expired.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-red-500 mb-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">⛔ Expired Medicines - Remove Immediately</h2>
            <div className="space-y-2">
              {expired.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200">
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-xs text-gray-600">Expired: {m.expiry} | Stock: {m.qty}</p>
                  </div>
                  <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">EXPIRED</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Soon */}
        {expiringSoon.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-yellow-500 mb-6">
            <h2 className="text-xl font-bold text-yellow-600 mb-4">⚠️ Expiring in 30 Days</h2>
            <div className="space-y-2">
              {expiringSoon.map(m => {
                const daysLeft = Math.ceil((new Date(m.expiry!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={m.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div>
                      <p className="font-bold">{m.name}</p>
                      <p className="text-xs text-gray-600">Expires: {m.expiry} | Stock: {m.qty}</p>
                    </div>
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-bold">{daysLeft} Days Left</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Low Stock */}
        {lowStock.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-orange-500 mb-6">
            <h2 className="text-xl font-bold text-orange-600 mb-4">📦 Low Stock Alert</h2>
            <div className="space-y-2">
              {lowStock.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-orange-50 rounded border border-orange-200">
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-xs text-gray-600">Type: {m.type} | Price: Rs. {m.price}</p>
                  </div>
                  <span className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold">Only {m.qty} Left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Out of Stock */}
        {outOfStock.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-500">
            <h2 className="text-xl font-bold text-gray-600 mb-4">❌ Out of Stock</h2>
            <div className="space-y-2">
              {outOfStock.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-xs text-gray-600">Type: {m.type}</p>
                  </div>
                  <span className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold">OUT OF STOCK</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expired.length === 0 && expiringSoon.length === 0 && lowStock.length === 0 && outOfStock.length === 0 && (
          <div className="bg-green-50 p-12 rounded-xl border-2 border-green-500 text-center">
            <p className="text-6xl mb-4">✅</p>
            <p className="text-2xl font-bold text-green-600">All Good! No Alerts</p>
            <p className="text-gray-600 mt-2">Sab medicines ka stock aur expiry theek hai</p>
          </div>
        )}
      </div>
    </div>
  )
}
