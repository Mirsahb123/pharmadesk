"use client"

import { getInventory, addMedicine as addMedDB, updateMedicine as updateMedDB, deleteMedicine as deleteMedDB } from '@/lib/db-firebase'
import { Medicine } from '@/lib/db-firebase'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { Package, Search, Filter, Download, Printer, Edit, Trash2, Plus, X, AlertTriangle, TrendingUp, DollarSign, Box, Sparkles, Grid3x3, List, Scan, Camera, Check } from 'lucide-react'
import { import500Medicines } from '@/lib/import-medicines'

const ITEM_TYPES = [
  { name: 'Tablet', icon: '💊', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { name: 'Capsule', icon: '💊', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  { name: 'Syrup', icon: '🧴', color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  { name: 'Injection', icon: '💉', color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  { name: 'Drip', icon: '💧', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  { name: 'Cream', icon: '🧴', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  { name: 'Ointment', icon: '🩹', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { name: 'Drops', icon: '💧', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  { name: 'Sugar Strip', icon: '📊', color: 'from-lime-500 to-lime-600', bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-200' },
  { name: 'BP Apparatus', icon: '🩺', color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  { name: 'Sphygmomanometer', icon: '🩺', color: 'from-teal-600 to-teal-700', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
  { name: 'Thermometer', icon: '🌡️', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { name: 'Glucometer', icon: '📟', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { name: 'Bandage', icon: '🩹', color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  { name: 'Syringe', icon: '💉', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  { name: 'Mask', icon: '😷', color: 'from-sky-500 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  { name: 'Sanitizer', icon: '🧴', color: 'from-green-500 to-green-600', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  { name: 'Other', icon: '📦', color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
]

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [showQRPrint, setShowQRPrint] = useState(false)
  const [showAllQRPrint, setShowAllQRPrint] = useState(false)
  const [selectedMed, setSelectedMed] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showLowStock, setShowLowStock] = useState(false)

  const [columns, setColumns] = useState(10)
  const [qrSize, setQrSize] = useState(15)
  const [cuttingGap, setCuttingGap] = useState(2)
  const [showIdText, setShowIdText] = useState(true)

  const [linkQrScan, setLinkQrScan] = useState('')
  const [linkToMed, setLinkToMed] = useState('')

  const [showScanModal, setShowScanModal] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [detectedTexts, setDetectedTexts] = useState<string[]>([])
  const [selectedScanText, setSelectedScanText] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const codeReader = useRef<any>(null)

  const [form, setForm] = useState({
    name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '',
    expiry: '', qrCode: '', cost_price: '', qty: ''
  })

  useEffect(() => {
    loadInventory()
    return () => {
      if (codeReader.current) codeReader.current.reset()
    }
  }, [])

  const loadInventory = async () => {
    const data = await getInventory()
    setMedicines(data)
  }

  const isSyrup = form.type === 'Syrup'
  const totalTablets = isSyrup 
    ? (parseInt(form.qty) || 0)
    : (parseInt(form.packetQty) || 0) * (parseInt(form.tabletsPerPacket) || 0)

  const generateProductQR = () => {
    const qr = `MED-${Date.now()}`
    setForm({...form, qrCode: qr})
    toast.success('QR Code Generated!', { icon: '✅' })
  }

  const addMedicine = async () => {
    if (!form.name || !form.price) return toast.error('Name aur Price zaroori hai', { icon: '❌' })
    if (!form.qrCode) return toast.error('QR Code Generate dabao', { icon: '⚠️' })
    if (medicines.find(m => m.qrCode === form.qrCode)) return toast.error('Ye QR pehle se exist karta hai!', { icon: '⚠️' })
    
    if (isSyrup && !form.qty) return toast.error('Syrup ke liye Quantity zaroori hai', { icon: '❌' })
    if (!isSyrup && (!form.packetQty || !form.tabletsPerPacket)) return toast.error('Packets aur Tabs/Packet zaroori hai', { icon: '❌' })

    const newMed = {
      id: Date.now().toString(),
      name: form.name,
      type: form.type,
      price: parseFloat(form.price),
      packetQty: isSyrup ? 0 : (parseInt(form.packetQty) || 0),
      tabletsPerPacket: isSyrup ? 0 : (parseInt(form.tabletsPerPacket) || 0),
      qty: totalTablets,
      expiry: form.expiry,
      qrCode: form.qrCode,
      cost_price: parseFloat(form.cost_price) || 0
    }

    const saved = await addMedDB(newMed)
    setMedicines([...medicines, saved])
    setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })
    setShowScanModal(false)
    toast.success('Medicine add ho gayi + QR code generate ho gaya', { icon: '✅' })
  }

  const editMedicine = (med: any) => {
    setForm({
      name: med.name,
      type: med.type || 'Tablet',
      price: med.price.toString(),
      packetQty: med.packetQty?.toString() || '',
      tabletsPerPacket: med.tabletsPerPacket?.toString() || '',
      expiry: med.expiry,
      qrCode: med.qrCode,
      cost_price: med.cost_price?.toString() || '',
      qty: med.qty?.toString() || ''
    })
    setEditingId(med.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateMedicine = async () => {
    if (!editingId) return
    if (!form.name || !form.price) return toast.error('Name aur Price zaroori hai', { icon: '❌' })
    
    const isSyrupEdit = form.type === 'Syrup'
    if (isSyrupEdit && !form.qty) return toast.error('Syrup ke liye Quantity zaroori hai', { icon: '❌' })
    if (!isSyrupEdit && (!form.packetQty || !form.tabletsPerPacket)) return toast.error('Packets aur Tabs/Packet zaroori hai', { icon: '❌' })

    const updatedQty = isSyrupEdit 
      ? (parseInt(form.qty) || 0)
      : (parseInt(form.packetQty) || 0) * (parseInt(form.tabletsPerPacket) || 0)

    const updateData = {
      name: form.name,
      type: form.type,
      price: parseFloat(form.price),
      packetQty: isSyrupEdit ? 0 : (parseInt(form.packetQty) || 0),
      tabletsPerPacket: isSyrupEdit ? 0 : (parseInt(form.tabletsPerPacket) || 0),
      qty: updatedQty,
      expiry: form.expiry,
      qrCode: form.qrCode,
      cost_price: parseFloat(form.cost_price) || 0
    }

    await updateMedDB(editingId, updateData)
    const updated = medicines.map(m =>
      m.id === editingId ? { ...m, ...updateData } : m
    )
    setMedicines(updated)
    setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })
    setEditingId(null)
    toast.success('Medicine update ho gayi', { icon: '✅' })
  }

  const deleteMedicine = async (id: string) => {
    if (!confirm('Delete karna hai?')) return
    await deleteMedDB(id)
    const updated = medicines.filter(m => m.id !== id)
    setMedicines(updated)
    toast.success('Medicine delete ho gayi', { icon: '🗑️' })
  }
    const startScan = async () => {
    toast.info('Camera feature ke liye @zxing/library install karo', { icon: '⚠️' })
  }

  const stopScan = () => {
    if (codeReader.current) codeReader.current.reset()
    setIsScanning(false)
  }

  const captureAndOCR = async () => {
    toast.info('OCR ke liye tesseract.js install karo', { icon: '⚠️' })
  }

  const selectDetectedText = (text: string) => {
    setForm({...form, name: text})
    setSelectedScanText(text)
    toast.success(`Name set: ${text}`, { icon: '✅' })
  }

  const linkQRToMedicine = async () => {
    if(!linkQrScan || !linkToMed) return toast.error('QR aur Medicine dono select karo', { icon: '⚠️' })
    await updateMedDB(linkToMed, { qrCode: linkQrScan })
    const updated = medicines.map(m => m.id.toString() === linkToMed ? {...m, qrCode: linkQrScan} : m)
    setMedicines(updated)
    toast.success(`QR ${linkQrScan} ab medicine se link ho gaya`, { icon: '🔗' })
    setLinkQrScan(''); setLinkToMed('')
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Price', 'Stock', 'Packets', 'Units/Packet', 'Expiry', 'QR Code', 'Cost Price']
    const rows = medicines.map(m => [
      m.id, m.name, m.type, m.price, m.qty, m.packetQty, m.tabletsPerPacket, m.expiry, m.qrCode, m.cost_price
    ])
    const csv = [headers,...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('CSV exported!', { icon: '💾' })
  }

  const filteredMeds = medicines.filter(m => {
    const matchType = filterType === 'All' || m.type === filterType
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || 
      m.qrCode?.toLowerCase().includes(search.toLowerCase())
    const matchLowStock = !showLowStock || m.qty < 10
    return matchType && matchSearch && matchLowStock
  })

  const categoryStats = ITEM_TYPES.map(type => ({
   ...type,
    count: medicines.filter(i => i.type === type.name).length,
    stock: medicines.filter(i => i.type === type.name).reduce((s, i) => s + (i.qty || 0), 0),
    value: medicines.filter(i => i.type === type.name).reduce((s, i) => s + ((i.price || 0) * (i.qty || 0)), 0)
  }))

  const totalValue = medicines.reduce((sum, m) => sum + ((m.price || 0) * (m.qty || 0)), 0)
  const totalStock = medicines.reduce((sum, m) => sum + (m.qty || 0), 0)
  const lowStockItems = medicines.filter(m => m.qty < 10).length

  const openSinglePrint = (med: any) => {
    setSelectedMed(med)
    setShowQRPrint(true)
  }

  const openAllQRPrint = () => {
    setShowAllQRPrint(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 md:p-8 rounded-3xl shadow-2xl mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                  <Package className="w-10 h-10" />
                  Inventory Management
                </h1>
                <p className="text-white/80">Manage your pharmacy stock with QR codes</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowScanModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-2 border border-white/30"
                >
                  <Scan className="w-5 h-5" />
                  Scan & Add
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    const count = await import500Medicines()
                    await loadInventory()
                    toast.success(`${count} Medicines imported! QR auto generated`, { icon: '✅' })
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-2 border border-white/30"
                >
                  <Download className="w-5 h-5" />
                  Import 500
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAllQRPrint}
                  className="bg-white/20 backdrop-blur-xl text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
                >
                  <Printer className="w-5 h-5" />
                  Print All QR
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportToCSV}
                  className="bg-white/20 backdrop-blur-xl text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </motion.button>
                <Link href="/dashboard" className="bg-white/20 backdrop-blur-xl text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all border border-white/30 flex items-center gap-2">
                  ← Dashboard
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-xl p-5 rounded-2xl border border-white/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-semibold">Total Items</p>
                    <p className="text-3xl font-black text-white">{medicines.length}</p>
                  </div>
                  <Box className="w-12 h-12 text-white/50" />
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-xl p-5 rounded-2xl border border-white/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-semibold">Total Stock</p>
                    <p className="text-3xl font-black text-white">{totalStock}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-white/50" />
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-xl p-5 rounded-2xl border border-white/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-semibold">Stock Value</p>
                    <p className="text-3xl font-black text-white">Rs. {totalValue.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-white/50" />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Baaki UI code same rahega - search, filters, grid/list view etc */}
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="border-2 border-gray-200 p-3 rounded-xl bg-white/50 focus:border-blue-500 transition-all outline-none font-medium"
              >
                <option value="All">📦 All Categories</option>
                {ITEM_TYPES.map(t => <option key={t.name} value={t.name}>{t.icon} {t.name}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder="Search by name or QR..."
                  className="border-2 border-gray-200 pl-11 pr-4 py-3 rounded-xl bg-white/50 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLowStock(!showLowStock)}
                className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  showLowStock
                   ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                Low Stock ({lowStockItems})
              </motion.button>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'grid'? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'list'? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Medicine list/grid rendering yahan aayega - same as before */}
        {viewMode === 'list'? (
          <div className="overflow-x-auto bg-white rounded-2xl p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 font-black text-gray-700">Name</th>
                  <th className="text-left p-4 font-black text-gray-700">Type</th>
                  <th className="text-left p-4 font-black text-gray-700">Price</th>
                  <th className="text-left p-4 font-black text-gray-700">Qty</th>
                  <th className="text-left p-4 font-black text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-blue-50/50">
                    <td className="p-4 font-bold">{m.name}</td>
                    <td className="p-4">{m.type}</td>
                    <td className="p-4 font-black text-green-600">Rs. {m.price}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                        m.qty < 10? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {m.qty}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => editMedicine(m)} className="bg-yellow-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openSinglePrint(m)} className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMedicine(m.id)} className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-bold">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredMeds.map((m) => (
              <div key={m.id} className="bg-white p-5 rounded-2xl shadow-lg">
                <h3 className="font-black text-lg">{m.name}</h3>
                <p className="text-sm text-gray-600">{m.type} - Rs. {m.price}</p>
                <p className="text-sm">Stock: {m.qty}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => editMedicine(m)} className="flex-1 bg-yellow-500 text-white py-2 rounded-xl text-sm font-bold">Edit</button>
                  <button onClick={() => deleteMedicine(m.id)} className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-bold">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
