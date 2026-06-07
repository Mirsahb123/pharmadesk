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
// import { BrowserMultiFormatReader } from '@zxing/library'  // <-- Net aane pe uncomment karo
// import Tesseract from 'tesseract.js'  // <-- Net aane pe uncomment karo

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

  // SCAN SYSTEM STATES
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
      id: Date.now(),
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

    const updated = [...medicines, newMed]
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
    if (!form.name || !form.price) return toast.error('Name aur Price zaroori hai', { icon: '❌' })
    
    const isSyrupEdit = form.type === 'Syrup'
    if (isSyrupEdit && !form.qty) return toast.error('Syrup ke liye Quantity zaroori hai', { icon: '❌' })
    if (!isSyrupEdit && (!form.packetQty || !form.tabletsPerPacket)) return toast.error('Packets aur Tabs/Packet zaroori hai', { icon: '❌' })

    const updatedQty = isSyrupEdit 
      ? (parseInt(form.qty) || 0)
      : (parseInt(form.packetQty) || 0) * (parseInt(form.tabletsPerPacket) || 0)

    const updated = medicines.map(m =>
      m.id === editingId
       ? {
           ...m,
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
        : m
    )
    await updateMedDB(editingId, {...form, qty: updatedQty})
setMedicines(updated)
    setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })
    setEditingId(null)
    toast.success('Medicine update ho gayi', { icon: '✅' })
  }

  const deleteMedicine = (id: number) => {
    if (!confirm('Delete karna hai?')) return
    const updated = medicines.filter(m => m.id !== id)
    DB.saveInventory(updated)
    setMedicines(updated)
    toast.success('Medicine delete ho gayi', { icon: '🗑️' })
  }

  // SCAN FUNCTIONS - Net aane pe uncomment karo
  const startScan = async () => {
    toast.info('Net aane pe camera chalega. Abhi packages install karo: npm install @zxing/library tesseract.js', { icon: '⚠️' })
    // const { BrowserMultiFormatReader } = await import('@zxing/library')
    // codeReader.current = new BrowserMultiFormatReader()
    // setIsScanning(true)
    // try {
    //   const videoInputDevices = await codeReader.current.listVideoInputDevices()
    //   await codeReader.current.decodeFromVideoDevice(videoInputDevices[0].deviceId, videoRef.current, (result: any) => {
    //     if (result) {
    //       const qrText = result.getText()
    //       toast.success(`QR Scanned: ${qrText}`, { icon: '✅' })
    //       setForm({...form, qrCode: qrText})
    //       stopScan()
    //     }
    //   })
    // } catch (err) {
    //   toast.error('Camera access nahi mila', { icon: '❌' })
    //   setIsScanning(false)
    // }
  }

  const stopScan = () => {
    if (codeReader.current) codeReader.current.reset()
    setIsScanning(false)
  }

  const captureAndOCR = async () => {
    toast.info('Net aane pe OCR chalega', { icon: '⚠️' })
    // const canvas = canvasRef.current
    // const video = videoRef.current
    // if (!canvas || !video) return
    // canvas.width = video.videoWidth
    // canvas.height = video.videoHeight
    // const ctx = canvas.getContext('2d')
    // ctx?.drawImage(video, 0, 0)
    // toast.loading('Text read kar raha hun...', { id: 'ocr' })
    // const Tesseract = (await import('tesseract.js')).default
    // const { data: { text } } = await Tesseract.recognize(canvas, 'eng+urd')
    // const words = text.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 2)
    // setDetectedTexts(words)
    // toast.success(`${words.length} words mile!`, { id: 'ocr', icon: '✅' })
  }

  const selectDetectedText = (text: string) => {
    setForm({...form, name: text})
    setSelectedScanText(text)
    toast.success(`Name set: ${text}`, { icon: '✅' })
  }

  const linkQRToMedicine = async () => {
    if(!linkQrScan || !linkToMed) return toast.error('QR aur Medicine dono select karo', { icon: '⚠️' })
    const updated = medicines.map(m => m.id.toString() === linkToMed ? {...m, qrCode: linkQrScan} : m)
    await updateMedDB(linkToMed, { qrCode: linkQrScan })
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
                  onClick={() => {
                    const count = import500Medicines()
                    loadInventory()
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl mb-6 border-2 border-yellow-300 shadow-lg"
        >
          <h3 className="font-black text-yellow-900 mb-4 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Blank QR ko Medicine se Link Karo
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={linkQrScan}
              onChange={e=>setLinkQrScan(e.target.value)}
              placeholder="MED-123... paste karo"
              className="border-2 border-yellow-300 p-3 rounded-xl bg-white focus:border-yellow-500 outline-none transition-all"
            />
            <select
              value={linkToMed}
              onChange={e=>setLinkToMed(e.target.value)}
              className="border-2 border-yellow-300 p-3 rounded-xl bg-white focus:border-yellow-500 outline-none transition-all"
            >
              <option value="">Medicine Select Karo</option>
              {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={linkQRToMedicine}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all font-bold"
            >
              Link Karo
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 mb-6"
        >
          <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-500" />
            {editingId ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <div className="grid md:grid-cols-7 gap-3">
            <input
              value={form.name}
              onChange={e=>setForm({...form, name: e.target.value})}
              placeholder="Medicine Name"
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
            />
            <select
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
            >
              {ITEM_TYPES.map(t => <option key={t.name} value={t.name}>{t.icon} {t.name}</option>)}
            </select>
            <input
              type="number"
              value={form.price}
              onChange={e=>setForm({...form, price: e.target.value})}
              placeholder={isSyrup ? "Price/Bottle (Rs.)" : "Price/Tablet (Rs.)"}
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
            />
            
            {isSyrup ? (
              <input
                type="number"
                value={form.qty}
                onChange={e=>setForm({...form, qty: e.target.value})}
                placeholder="Total Quantity"
                className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
              />
            ) : (
              <>
                <input
                  type="number"
                  value={form.packetQty}
                  onChange={e=>setForm({...form, packetQty: e.target.value})}
                  placeholder="Packets"
                  className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
                />
                <input
                  type="number"
                  value={form.tabletsPerPacket}
                  onChange={e=>setForm({...form, tabletsPerPacket: e.target.value})}
                  placeholder="Tabs/Packet"
                  className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
                />
              </>
            )}
            
            <input
              type="date"
              value={form.expiry}
              onChange={e=>setForm({...form, expiry: e.target.value})}
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 transition-all outline-none bg-white/50"
            />
            <div className="flex gap-2">
              <input
                value={form.qrCode}
                onChange={e=>setForm({...form, qrCode: e.target.value})}
                placeholder="QR Code"
                className="border-2 border-gray-200 p-3 rounded-xl flex-1 focus:border-blue-500 transition-all outline-none bg-white/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateProductQR}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl hover:shadow-lg font-bold"
              >
                Auto
              </motion.button>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <p className="text-sm font-bold text-green-700">
              {isSyrup 
                ? `Total Quantity: ${form.qty || 0}` 
                : `Total Tablets: ${totalTablets} = ${form.packetQty || 0} Packets × ${form.tabletsPerPacket || 0} Tabs`
              }
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={editingId ? updateMedicine : addMedicine}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all font-bold flex items-center gap-2"
            >
              {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Update Medicine' : 'Add Medicine + Generate QR'}
            </motion.button>
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {setEditingId(null); setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })}}
                className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all font-bold flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
        >
          {categoryStats.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => setFilterType(cat.name)}
              className={`bg-gradient-to-br ${cat.color} p-5 rounded-2xl shadow-xl text-white cursor-pointer transition-all ${filterType === cat.name ? 'ring-4 ring-white shadow-2xl' : ''}`}
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <p className="text-xs opacity-90 font-bold mb-1">{cat.name}</p>
              <p className="text-3xl font-black mb-1">{cat.count}</p>
              <p className="text-xs opacity-80">Stock: {cat.stock}</p>
              <p className="text-xs opacity-80 mt-1">Rs. {cat.value.toFixed(0)}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50"
        >
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
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

          {viewMode === 'list'? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-4 font-black text-gray-700">Name</th>
                    <th className="text-left p-4 font-black text-gray-700">Type</th>
                    <th className="text-left p-4 font-black text-gray-700">QR Code</th>
                    <th className="text-left p-4 font-black text-gray-700">Price</th>
                    <th className="text-left p-4 font-black text-gray-700">Packets</th>
                    <th className="text-left p-4 font-black text-gray-700">Tabs/Pkt</th>
                    <th className="text-left p-4 font-black text-gray-700">Total Qty</th>
                    <th className="text-left p-4 font-black text-gray-700">Expiry</th>
                    <th className="text-left p-4 font-black text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeds.map((m, idx) => {
                    const typeInfo = ITEM_TYPES.find(t => t.name === m.type)
                    const isSyrupItem = m.type === 'Syrup'
                    return (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-all"
                      >
                        <td className="p-4 font-bold text-gray-800">{m.name}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${typeInfo?.color}`}>
                            {typeInfo?.icon} {m.type}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-blue-600 font-bold">{m.qrCode}</td>
                        <td className="p-4 font-black text-green-600">Rs. {m.price}</td>
                        <td className="p-4 font-medium">{isSyrupItem? '-' : (m.packetQty || 0)}</td>
                        <td className="p-4 font-medium">{isSyrupItem? '-' : (m.tabletsPerPacket || 0)}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                            m.qty < 10? 'bg-red-100 text-red-600 border-2 border-red-200' : 'bg-green-100 text-green-600 border-2 border-green-200'
                          }`}>
                            {m.qty}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium">{m.expiry || '-'}</td>
                        <td className="p-4 flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => editMedicine(m)}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-2 rounded-xl text-sm hover:shadow-lg transition-all font-bold"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openSinglePrint(m)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm hover:shadow-lg transition-all font-bold"
                          >
                            <Printer className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteMedicine(m.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-xl text-sm hover:shadow-lg transition-all font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeds.map((m, idx) => {
                const typeInfo = ITEM_TYPES.find(t => t.name === m.type)
                const isSyrupItem = m.type === 'Syrup'
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    className={`bg-white p-5 rounded-2xl shadow-lg border-2 ${typeInfo?.border} hover:shadow-2xl transition-all`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo?.color} flex items-center justify-center text-2xl`}>
                          {typeInfo?.icon}
                        </div>
                        <div>
                          <p className="font-black text-gray-800">{m.name}</p>
                          <p className="text-xs text-gray-500">{m.type}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        m.qty < 10? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {m.qty} {isSyrupItem? 'qty' : 'tabs'}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-green-600">Rs. {m.price}</span>
                      </div>
                      {!isSyrupItem && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Packets:</span>
                          <span className="font-bold">{m.packetQty || 0} × {m.tabletsPerPacket || 0}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">QR:</span>
                        <span className="font-mono text-xs text-blue-600">{m.qrCode}</span>
                      </div>
                      {m.expiry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expiry:</span>
                          <span className="font-medium">{m.expiry}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editMedicine(m)}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-2 rounded-xl text-sm hover:shadow-lg transition-all font-bold flex items-center justify-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openSinglePrint(m)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl text-sm hover:shadow-lg transition-all font-bold flex items-center justify-center gap-1"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteMedicine(m.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-xl text-sm hover:shadow-lg transition-all font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showScanModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {stopScan(); setShowScanModal(false)}}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-screen overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black flex items-center gap-2">
                    <Scan className="w-6 h-6 text-purple-600" />
                    Scan & Add Medicine
                  </h3>
                  <button onClick={() => {stopScan(); setShowScanModal(false)}} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <canvas ref={canvasRef} className="hidden" />
                <div className="bg-black rounded-2xl overflow-hidden mb-4 relative">
                  <video ref={videoRef} className="w-full h-80 object-cover" />
                  {isScanning && (
                    <div className="absolute inset-0 border-4 border-green-500 rounded-2xl animate-pulse"></div>
                  )}
                </div>

                {!isScanning? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startScan}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 mb-3"
                  >
                    <Camera className="w-6 h-6" />
                    Start Camera - Scan QR
                  </motion.button>
                ) : (
                  <div className="space-y-3 mb-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={captureAndOCR}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Capture Text from Image
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={stopScan}
                      className="w-full bg-red-500 text-white py-3 rounded-xl font-bold"
                    >
                      Stop Camera
                    </motion.button>
                  </div>
                )}

                {detectedTexts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">Detected Text - Click to Select:</p>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {detectedTexts.map((text, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => selectDetectedText(text)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                            selectedScanText === text
                             ? 'bg-green-500 text-white border-green-600'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {selectedScanText === text && <Check className="w-4 h-4 inline mr-1" />}
                          {text}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm font-bold text-blue-900 mb-2">Instructions:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>1. Camera start karo - QR code auto scan ho jayega</li>
                    <li>2. Medicine name capture karne ke liye "Capture Text" dabao</li>
                    <li>3. Detected text pe click karo to name auto fill ho jayega</li>
                    <li>4. Modal band karo aur form me price/qty daal ke save karo</li>
                  </ul>
                  <p className="text-xs text-orange-600 mt-2 font-bold">⚠️ Net aane pe packages install karo: npm install @zxing/library tesseract.js</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showQRPrint && selectedMed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowQRPrint(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white p-6 rounded-3xl max-w-2xl w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4 print:hidden">
                  <h3 className="text-xl font-black">Print QR - {selectedMed.name}</h3>
                  <div className="flex gap-2 items-center flex-wrap">
                    <label className="text-sm font-medium">Size:</label>
                    <input type="range" min="20" max="50" value={qrSize} onChange={e=>setQrSize(parseInt(e.target.value))} />
                    <span className="text-sm font-bold">{qrSize}mm</span>
                    <label className="text-sm flex items-center gap-1 font-medium">
                      <input type="checkbox" checked={showIdText} onChange={e=>setShowIdText(e.target.checked)} />
                      Name
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.print()}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg font-bold"
                    >
                      Print
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowQRPrint(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:shadow-lg font-bold"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>

                <div className="print:m-0 flex justify-center">
                  <div className="border-2 border-dashed border-gray-400 p-6 text-center rounded-2xl">
                    <div className="bg-white mb-3 flex items-center justify-center" style={{width: `${qrSize}mm`, height: `${qrSize}mm`, margin: '0 auto'}}>
                      <QRCode
                        value={selectedMed.qrCode}
                        size={qrSize * 3.78}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    </div>
                    {showIdText && (
                      <>
                        <p className="text-sm font-black">{selectedMed.name}</p>
                        <p className="text-xs font-mono text-blue-600 font-bold">{selectedMed.qrCode}</p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAllQRPrint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAllQRPrint(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white p-6 rounded-3xl max-w-6xl w-full max-h-screen overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4 print:hidden">
                  <h3 className="text-xl font-black">Print All Medicines QR - A4</h3>
                  <div className="flex gap-2 items-center flex-wrap">
                    <label className="text-sm font-medium">Cols:</label>
                    <select value={columns} onChange={e=>setColumns(parseInt(e.target.value))} className="border-2 p-2 rounded-xl">
                      <option value="5">5</option><option value="8">8</option><option value="10">10</option><option value="12">12</option>
                    </select>
                    <label className="text-sm font-medium">Size:</label>
                    <input type="range" min="10" max="30" value={qrSize} onChange={e=>setQrSize(parseInt(e.target.value))} />
                    <span className="text-sm font-bold">{qrSize}mm</span>
                    <label className="text-sm font-medium">Gap:</label>
                    <input type="range" min="0" max="5" value={cuttingGap} onChange={e=>setCuttingGap(parseInt(e.target.value))} />
                    <span className="text-sm font-bold">{cuttingGap}mm</span>
                    <label className="text-sm flex items-center gap-1 font-medium">
                      <input type="checkbox" checked={showIdText} onChange={e=>setShowIdText(e.target.checked)} />
                      Show Name
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.print()}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg font-bold"
                    >
                      Print A4
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAllQRPrint(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:shadow-lg font-bold"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>

                <div className="print:m-0">
                  <style jsx>{`
                    @media print {
                      @page { size: A4; margin: 5mm; }
                     .qr-grid-all {
                        display: grid;
                        grid-template-columns: repeat(${columns}, 1fr);
                        gap: ${cuttingGap}mm;
                      }
                     .qr-item-all {
                        border: 1px dashed #ccc;
                        padding: 2mm;
                        text-align: center;
                        page-break-inside: avoid;
                      }
                    }
                  `}</style>

                  <div className="qr-grid-all grid gap-2" style={{gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${cuttingGap}mm`}}>
                    {medicines.map((med) => (
                      <div key={med.id} className="qr-item-all border border-dashed border-gray-300 p-2 text-center rounded-lg">
                        <div className="bg-white w-full aspect-square mb-1 flex items-center justify-center" style={{width: `${qrSize}mm`, height: `${qrSize}mm`, margin: '0 auto'}}>
                          <QRCode
                            value={med.qrCode}
                            size={qrSize * 3.78}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          />
                        </div>
                        {showIdText && (
                          <>
                            <p className="text-[7px] font-bold truncate">{med.name}</p>
                            <p className="text-[6px] font-mono text-blue-600">{med.qrCode}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}