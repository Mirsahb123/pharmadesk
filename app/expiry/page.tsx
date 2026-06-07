"use client"
import { DB } from '@/lib/storage'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ExpiryPage() {
  const [medicines, setMedicines] = useState<any[]>([])

  useEffect(() => {
    setMedicines(DB.getInventory() || [])
  }, [])

  const getDaysLeft = (expiryDate: string) => {
    if (!expiryDate) return 9999
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatus = (days: number) => {
    if (days < 0) return { text: 'Expired', color: 'bg-red-500' }
    if (days <= 30) return { text: 'Expiring Soon', color: 'bg-yellow-500' }
    if (days <= 90) return { text: 'Near Expiry', color: 'bg-orange-400' }
    return { text: 'Safe', color: 'bg-green-500' }
  }

  const expired = medicines.filter(m => getDaysLeft(m.expiry) < 0)
  const expiringSoon = medicines.filter(m => {
    const days = getDaysLeft(m.expiry)
    return days >= 0 && days <= 30
  })
  const nearExpiry = medicines.filter(m => {
    const days = getDaysLeft(m.expiry)
    return days > 30 && days <= 90
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expiry Alert</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-gray-500 text-sm">Expired</p>
                <p className="text-3xl font-bold text-red-600">{expired.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-gray-500 text-sm">30 Days Left</p>
                <p className="text-3xl font-bold text-yellow-600">{expiringSoon.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
              <div>
                <p className="text-gray-500 text-sm">90 Days Left</p>
                <p className="text-3xl font-bold text-orange-500">{nearExpiry.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">All Medicines by Expiry</h2>
          {medicines.length === 0 ? (
            <p className="text-gray-500">Inventory me medicine add karo expiry date ke saath</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-3">Medicine</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Expiry Date</th>
                    <th className="text-left p-3">Days Left</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines
                    .sort((a, b) => getDaysLeft(a.expiry) - getDaysLeft(b.expiry))
                    .map(m => {
                      const days = getDaysLeft(m.expiry)
                      const status = getStatus(days)
                      return (
                        <tr key={m.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{m.name}</td>
                          <td className="p-3">{m.qty}</td>
                          <td className="p-3">{m.expiry ? new Date(m.expiry).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-3">{days === 9999 ? 'N/A' : days < 0 ? 'Expired' : `${days} days`}</td>
                          <td className="p-3">
                            <span className={`${status.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                              {status.text}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}