"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { db, ref, get } from '@/lib/firebase'
import {
  BarChart3, TrendingUp, Calendar, Search, Download,
  FilterX, Package, ArrowLeft, Sparkles, IndianRupee,
  FileText, Users, Activity
} from 'lucide-react'

export default function ReportsPage() {
  const [bills, setBills] = useState<any[]>([])
  const [filteredBills, setFilteredBills] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchCustomer, setSearchCustomer] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const billsRef = ref(db, 'bills')
      const snapshot = await get(billsRef)

      if (snapshot.exists()) {
        const billsData = snapshot.val()
        const allBills = Object.keys(billsData).map(key => ({
          id: key,
         ...billsData[key]
        }))
        setBills(allBills)
        setFilteredBills(allBills)
      } else {
        setBills([])
        setFilteredBills([])
      }
    } catch (error) {
      console.error('Load error:', error)
      setBills([])
      setFilteredBills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = bills

    if(startDate) {
      filtered = filtered.filter(b => new Date(b.date) >= new Date(startDate))
    }
    if(endDate) {
      const end = new Date(endDate)
      end.setHours(23,59,59,999)
      filtered = filtered.filter(b => new Date(b.date) <= end)
    }
    if(searchCustomer) {
      filtered = filtered.filter(b =>
        b.customerName?.toLowerCase().includes(searchCustomer.toLowerCase())
      )
    }

    setFilteredBills(filtered)
  }, [startDate, endDate, searchCustomer, bills])

  const billsArray = Array.isArray(filteredBills)? filteredBills : []

  const totalSales = billsArray.reduce((sum, bill) => sum + (bill.total || 0), 0)
  const totalGST = billsArray.reduce((sum, bill) => sum + (bill.gst || 0), 0)
  const avgBill = billsArray.length > 0? (totalSales / billsArray.length).toFixed(2) : 0

  const medicineSales: any = {}
  billsArray.forEach(bill => {
    if (bill.items && Array.isArray(bill.items)) {
      bill.items.forEach((item: any) => {
        if (medicineSales[item.name]) {
          medicineSales[item.name] += item.cartQty || 0
        } else {
          medicineSales[item.name] = item.cartQty || 0
        }
      })
    }
  })
  const topMedicines = Object.entries(medicineSales)
   .sort((a: any, b: any) => b[1] - a[1])
   .slice(0, 5)

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearchCustomer('')
  }

  const exportCSV = () => {
    const headers = ['Bill No,Date,Customer,Items,Subtotal,GST,Total\n']
    const rows = billsArray.map(b => {
      const items = b.items?.map((i: any) => `${i.name}x${i.cartQty}`).join('; ') || ''
      return `${b.id},${new Date(b.date).toLocaleString()},${b.customerName || 'N/A'},"${items}",${b.subtotal || 0},${b.gst || 0},${b.total}`
    }).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold text-lg">Loading reports...</p>
        </motion.div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Sales',
      value: `Rs. ${totalSales.toFixed(2)}`,
      icon: IndianRupee,
      gradient: 'from-green-500 to-emerald-600',
      glow: 'shadow-green-500/50'
    },
    {
      title: 'Total GST',
      value: `Rs. ${totalGST.toFixed(2)}`,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/50'
    },
    {
      title: 'Total Bills',
      value: billsArray.length,
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-600',
      glow: 'shadow-purple-500/50'
    },
    {
      title: 'Average Bill',
      value: `Rs. ${avgBill}`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-600',
      glow: 'shadow-orange-500/50'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
                Sales Reports
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                Real-time analytics & insights
              </p>
            </div>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 mb-8"
        >
          <h2 className="text-xl font-black mb-4 text-gray-800 flex items-center gap-2">
            <FilterX className="w-5 h-5 text-blue-600" />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e=>setStartDate(e.target.value)}
                className="border-2 border-gray-200 p-3 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50 backdrop-blur"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e=>setEndDate(e.target.value)}
                className="border-2 border-gray-200 p-3 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50 backdrop-blur"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customer Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchCustomer}
                  onChange={e=>setSearchCustomer(e.target.value)}
                  placeholder="Search customer..."
                  className="border-2 border-gray-200 pl-11 pr-3 py-3 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50 backdrop-blur"
                />
              </div>
            <div className="flex items-end gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-3 rounded-2xl hover:bg-gray-600 flex-1 font-bold flex items-center justify-center gap-2"
              >
                <FilterX className="w-4 h-4" />
                Clear
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportCSV}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-2xl hover:shadow-xl flex-1 font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-3xl shadow-2xl ${stat.glow} text-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <stat.icon className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-sm opacity-90 mb-1">{stat.title}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50"
          >
            <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-600" />
              Top Selling Medicines
            </h2>
            {topMedicines.length === 0? (
              <div className="text-center py-12">
                <p className="text-6xl mb-3">📦</p>
                <p className="text-gray-500 font-semibold">No sales in selected range</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topMedicines.map(([name, qty]: any, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex justify-between items-center border-2 border-gray-100 p-4 rounded-2xl hover:border-blue-300 transition-all bg-white/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black">
                        {i + 1}
                      </div>
                      <span className="font-bold text-gray-800">{name}</span>
                    </div>
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg">
                      {qty} sold
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50"
          >
            <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Bills - {billsArray.length}
            </h2>
            {billsArray.length === 0? (
              <div className="text-center py-12">
                <p className="text-6xl mb-3">📄</p>
                <p className="text-gray-500 font-semibold">No bills found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                <AnimatePresence>
                  {billsArray.slice().reverse().map((b, idx) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="border-2 border-gray-100 p-4 rounded-2xl hover:border-blue-300 transition-all bg-white/50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-gray-800">Bill #{b.id.toString().slice(-6)}</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" />
                            {b.customerName || 'Walk-in'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(b.date).toLocaleString()}
                          </p>
                        </div>
                        <p className="font-black text-green-600 text-xl flex items-center gap-1">
                          <IndianRupee className="w-5 h-5" />
                          {b.total}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
