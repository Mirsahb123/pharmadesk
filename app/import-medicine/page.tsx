"use client"
import { getInventory, addMedicine, updateMedicine, deleteMedicine, Medicine } from '@/lib/db-firebase'
import { Auth } from '@/lib/auth'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { Package, Scan, Trash2, Plus, X, Pill, Droplet, Syringe, HeartPulse, ArrowLeft, Edit } from 'lucide-react'

const ITEM_TYPES = [
  { name: 'Tablet', icon: Pill },
  { name: 'Capsule', icon: Pill },
  { name: 'Syrup', icon: Droplet },
  { name: 'Injection', icon: Syringe },
  { name: 'Drip', icon: Droplet },
  { name: 'Cream', icon: HeartPulse },
  { name: 'Ointment', icon: HeartPulse },
  { name: 'Drops', icon: Droplet },
  { name: 'Other', icon: Package }
]

export default function ImportMedicinePage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null)
  const scannerRef = useRef<any>(null)
  const [shopId, setShopId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '',
    expiry: '', qrCode: '', cost_price: '', qty: ''
  })

  useEffect(() => {
    // Shop ID check karo
    const user = Auth.getCurrentUser()
    if (!user?.shopId) {
      toast.error('Login nahi ho. Pehle login karo')
      return
    }
    setShopId(user.shopId)
    loadInventory()
    
    if (typeof window !== 'undefined') {
      import('html5-qrcode').then((mod) => {
        setHtml5Qrcode(() => mod.Html5Qrcode)
      })
    }
    return () => stopScan()
  }, [])

  const loadInventory = async () => {
    try {
      const data = await getInventory()
      setMedicines(data)
      console.log('Loaded medicines:', data)
    } catch (err: any) {
      toast.error('Firebase Error: ' + err.message)
      console.error(err)
    }
  }

  const isSyrup = form.type === 'Syrup'
  const totalTablets = isSyrup 
    ? (parseInt(form.qty) || 0)
    : (parseInt(form.packetQty) || 0) * (parseInt(form.tabletsPerPacket) || 0)

  const generateProductQR = () => {
    const qr = `MED-${Date.now()}`
    setForm({...form, qrCode: qr})
    toast.success('QR Code Generated!')
  }

  const startScan = async () => {
    if (!Html5Qrcode) {
      toast.error('Scanner load ho raha hai...')
      return
    }

    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        toast.error('Camera nahi mila. Laptop me camera hai?')
        return
      }
    } catch (err) {
      toast.error('Camera permission do: URL bar me camera icon pe click karo')
      return
    }

    setIsScanning(true)

    try {
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      const config = { fps: 10, qrbox: { width: 250, height: 250 } }

      const onScanSuccess = (decodedText: string) => {
        console.log('QR Scanned:', decodedText)
        const existing = medicines.find(m => m.qrCode === decodedText)
        if (existing) {
          toast.error(`Ye QR already exists: ${existing.name}`)
          stopScan()
          return
        }
        
        setForm(prev => ({...prev, qrCode: decodedText}))
        toast.success(`QR Scanned: ${decodedText}`)
        stopScan()
      }

      await scanner.start({ facingMode: "environment" }, config, onScanSuccess, () => {})
      toast.success('Camera ON - QR dikhao')
    } catch (err: any) {
      console.error('Camera error:', err)
      toast.error('Camera nahi chala: ' + err.message)
      setIsScanning(false)
    }
  }

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {}
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const addMedicineManual = async () => {
    if (!shopId) return toast.error('Login nahi ho')
    if (!form.name || !form.price) return toast.error('Name aur Price zaroori hai')
    if (!form.qrCode) return toast.error('QR Code Generate dabao ya Scan karo')
    if (medicines.find(m => m.qrCode === form.qrCode)) return toast.error('Ye QR pehle se exist karta hai!')
    
    if (isSyrup && !form.qty) return toast.error('Syrup ke liye Quantity zaroori hai')
    if (!isSyrup && (!form.packetQty || !form.tabletsPerPacket)) return toast.error('Packets aur Units/Packet zaroori hai')

    const newMed = {
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

    try {
      await addMedicine(newMed)
      await loadInventory()
      setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })
      toast.success(`Medicine save ho gayi shops/${shopId}/inventory me`)
    } catch (err: any) {
      toast.error('Error: ' + err.message)
      console.error(err)
    }
  }

  const editMedicine = (med: Medicine) => {
    setForm({
      name: med.name,
      type: med.type || 'Tablet',
      price: med.price.toString(),
      packetQty: med.packetQty?.toString() || '',
      tabletsPerPacket: med.tabletsPerPacket?.toString() || '',
      expiry: med.expiry,
      qrCode: med.qrCode || '',
      cost_price: med.cost_price?.toString() || '',
      qty: med.qty?.toString() || ''
    })
    setEditingId(med.id!)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateMedicineManual = async () => {
    if (!editingId) return
    if (!form.name || !form.price) return toast.error('Name aur Price zaroori hai')
    
    const isSyrupEdit = form.type === 'Syrup'
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

    try {
      await updateMedicine(editingId, updateData)
      await loadInventory()
      setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })
      setEditingId(null)
      toast.success('Medicine update ho gayi')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    }
  }

  const deleteMedicineItem = async (id: string | undefined) => {
    if (!id) return toast.error('ID nahi mili')
    if (!confirm('Delete karna hai?')) return
    
    try {
      await deleteMedicine(id)
      await loadInventory()
      toast.success('Medicine delete ho gayi')
    } catch (err: any) {
      toast.error('Delete Error: ' + err.message)
    }
  }

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Login karo pehle...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-6xl mx-auto">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-3xl shadow-2xl mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Package className="w-10 h-10" />
                Add Medicine
              </h1>
              <p className="text-white/80">Shop: {shopId}</p>
            </div>
            <Link href="/inventory">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 backdrop-blur-xl text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-lg mb-6 border-2 border-purple-200"
        >
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Scan className="w-6 h-6 text-purple-600" />
            QR Scan Karke Add Karo
          </h2>
          <div id="qr-reader" className="mb-3"></div>
          {!isScanning ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startScan}
              disabled={!Html5Qrcode}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Scan className="w-5 h-5" />
              {Html5Qrcode ? 'Start Camera - Scan QR' : 'Loading...'}
            </motion.button>
          ) : (
            <button
              onClick={stopScan}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse"
            >
              <X className="w-5 h-5" />
              Stop Camera
            </button>
          )}
          <p className="text-xs text-gray-500 mt-2">⚠️ Agar camera black hai: Chrome URL bar me camera icon pe click karke "Allow" karo</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-lg mb-6"
        >
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-500" />
            {editingId ? 'Edit Medicine' : 'Manual Add Medicine'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={e=>setForm({...form, name: e.target.value})}
              placeholder="Medicine Name"
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
            />
            <select
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
            >
              {ITEM_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <input
              type="number"
              value={form.price}
              onChange={e=>setForm({...form, price: e.target.value})}
              placeholder={isSyrup ? "Price/Bottle (Rs.)" : "Price/Unit (Rs.)"}
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
            />
            
            {isSyrup ? (
              <input
                type="number"
                value={form.qty}
                onChange={e=>setForm({...form, qty: e.target.value})}
                placeholder="Total Quantity"
                className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
              />
            ) : (
              <>
                <input
                  type="number"
                  value={form.packetQty}
                  onChange={e=>setForm({...form, packetQty: e.target.value})}
                  placeholder="Packets"
                  className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
                />
                <input
                  type="number"
                  value={form.tabletsPerPacket}
                  onChange={e=>setForm({...form, tabletsPerPacket: e.target.value})}
                  placeholder="Units/Packet"
                  className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
                />
              </>
            )}
            
            <input
              type="date"
              value={form.expiry}
              onChange={e=>setForm({...form, expiry: e.target.value})}
              className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none"
            />
            <div className="flex gap-2">
              <input
                value={form.qrCode}
                onChange={e=>setForm({...form, qrCode: e.target.value})}
                placeholder="QR Code - Scan ya Generate"
                className="border-2 border-gray-200 p-3 rounded-xl flex-1 focus:border-blue-500 outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateProductQR}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl font-bold"
              >
                Auto
              </motion.button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <p className="text-sm font-bold text-green-700">
              {isSyrup 
                ? `Total Quantity: ${form.qty || 0}` 
                : `Total Units: ${totalTablets} = ${form.packetQty || 0} × ${form.tabletsPerPacket || 0}`
              }
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={editingId ? updateMedicineManual : addMedicineManual}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:shadow-xl font-bold flex items-center gap-2"
            >
              {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Update Medicine' : 'Add to Firebase'}
            </motion.button>
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {setEditingId(null); setForm({ name: '', type: 'Tablet', price: '', packetQty: '', tabletsPerPacket: '', expiry: '', qrCode: '', cost_price: '', qty: '' })}}
                className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:shadow-xl font-bold flex items-center gap-2"
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
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-black mb-4">All Medicines ({medicines.length})</h2>
          <div className="space-y-3">
            {medicines.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition"
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.type} | Rs. {m.price} | Qty: {m.qty} | QR: {m.qrCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => editMedicine(m)}
                    className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-bold"
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteMedicineItem(m.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}