"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DB } from '@/lib/storage'
import { toast, Toaster } from 'sonner'
import { Scan, ShoppingCart, Trash2, Plus, Minus, Printer, X, Search, Camera, Upload, Type } from 'lucide-react'
import Link from 'next/link'

export default function ScanPage() {
  const [medicines, setMedicines] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [manualQR, setManualQR] = useState('')
  const [search, setSearch] = useState('')
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera')
  const [isScanning, setIsScanning] = useState(false)
  const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null)
  const scannerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMeds()
    if (typeof window!== 'undefined') {
      import('html5-qrcode').then((mod) => {
        setHtml5Qrcode(() => mod.Html5Qrcode)
      })
    }
    return () => {
      stopCameraScan()
    }
  }, [])

  const loadMeds = () => {
    setMedicines(DB.getInventory())
  }

  const startCameraScan = async () => {
    if (isScanning ||!Html5Qrcode) {
      toast.error('Scanner loading... 2 sec wait karo')
      return
    }
    setIsScanning(true)

    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText)
          stopCameraScan()
        },
        (errorMessage) => {}
      )
    } catch (err) {
      toast.error('Camera access nahi mila. Permission allow karo')
      setIsScanning(false)
    }
  }

  const stopCameraScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.log('Stop error:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file ||!Html5Qrcode) return

    try {
      const html5QrCode = new Html5Qrcode("temp-qr")
      const qrResult = await html5QrCode.scanFile(file, true)
      handleScan(qrResult)
      html5QrCode.clear()
      toast.success('QR Code mil gaya!')
    } catch (err) {
      toast.error('QR code nahi mila image me. Clear QR upload karo')
    }
    e.target.value = ''
  }

  const handleScan = (qrCode: string) => {
    if (!qrCode.trim()) {
      toast.error('QR code daalo!')
      return
    }

    const med = medicines.find(m => m.qrCode === qrCode.trim())
    if (!med) {
      toast.error('Medicine not found! QR galat hai')
      return
    }
    if (med.qty <= 0) {
      toast.error('Out of stock!')
      return
    }
    addToCart(med)
    setManualQR('')
  }

  const addToCart = (med: any) => {
    const existing = cart.find(c => c.id === med.id)
    if (existing) {
      if (existing.cartQty >= med.qty) {
        toast.error('Stock limit reached!')
        return
      }
      setCart(cart.map(c => c.id === med.id? {...c, cartQty: c.cartQty + 1} : c))
    } else {
      setCart([...cart, {...med, cartQty: 1}])
    }
    toast.success(`${med.name} added!`, { icon: '✅' })
  }

  const updateQty = (id: number, change: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.cartQty + change
        if (newQty <= 0) return null
        if (newQty > c.qty) {
          toast.error('Stock limit!')
          return c
        }
        return {...c, cartQty: newQty}
      }
      return c
    }).filter(Boolean) as any[])
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id!== id))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0)

  const checkout = () => {
    if (cart.length === 0) {
      toast.error('Cart empty!')
      return
    }

    const inventory = DB.getInventory()
    cart.forEach(cartItem => {
      const idx = inventory.findIndex((m: any) => m.id === cartItem.id)
      if (idx!== -1) {
        inventory[idx].qty -= cartItem.cartQty
      }
    })
    DB.saveInventory(inventory)

    const sales = JSON.parse(localStorage.getItem('sales') || '[]')
    sales.push({
      id: Date.now(),
      items: cart,
      total,
      date: new Date().toISOString()
    })
    localStorage.setItem('sales', JSON.stringify(sales))

    toast.success('Sale completed! Stock updated', { icon: '🎉' })
    setCart([])
    loadMeds()
  }

  const filteredMeds = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.qrCode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 md:p-8 rounded-3xl shadow-2xl mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                <Scan className="w-10 h-10" />
                Billing & Sale
              </h1>
              <p className="text-white/80">Camera scan, QR upload, ya naam se add karo</p>
            </div>
            <Link href="/inventory" className="bg-white/20 backdrop-blur-xl text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all border border-white/30">
              ← Inventory
            </Link>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50"
          >
            <h2 className="text-2xl font-black mb-4 text-gray-800">Add Medicine</h2>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { stopCameraScan(); setScanMode('camera') }}
                className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 ${scanMode === 'camera'? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Camera className="w-4 h-4" /> Camera
              </button>
              <button
                onClick={() => { stopCameraScan(); setScanMode('manual') }}
                className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 ${scanMode === 'manual'? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                <Type className="w-4 h-4" /> Manual
              </button>
            </div>

            <div className="space-y-4">
              {scanMode === 'camera' && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl">
                  <div id="qr-reader" className="w-full mb-3"></div>
                  <div id="temp-qr" className="hidden"></div>
                  {!isScanning? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startCameraScan}
                      disabled={!Html5Qrcode}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5" />
                      {Html5Qrcode? 'Start Camera Scan' : 'Loading...'}
                    </motion.button>
                  ) : (
                    <button
                      onClick={stopCameraScan}
                      className="w-full bg-red-500 text-white py-3 rounded-xl font-bold"
                    >
                      Stop Scanning
                    </button>
                  )}

                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!Html5Qrcode}
                      className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" />
                      Upload QR Image
                    </button>
                    <p className="text-xs text-gray-600 mt-2 text-center">Clear QR code wali image upload karo</p>
                  </div>
                </div>
              )}

              {scanMode === 'manual' && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-blue-900 mb-2">📱 QR Code Paste Karo:</p>
                  <div className="flex gap-2">
                    <input
                      value={manualQR}
                      onChange={e => setManualQR(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleScan(manualQR)
                      }}
                      placeholder="MED-123... paste karo"
                      className="flex-1 border-2 border-blue-300 p-3 rounded-xl focus:border-blue-500 outline-none bg-white"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleScan(manualQR)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold"
                    >
                      Add
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Ya naam se search karo..."
                  className="w-full border-2 border-gray-200 pl-11 pr-4 py-3 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-3">Quick Select:</h3>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {filteredMeds.map(m => (
                    <motion.button
                      key={m.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(m)}
                      disabled={m.qty === 0}
                      className={`p-4 rounded-xl text-left transition-all border-2 ${
                        m.qty === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white hover:bg-blue-50 text-gray-800 border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold">{m.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{m.qrCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-green-600">Rs.{m.price}</p>
                          <p className={`text-xs font-bold ${m.qty < 10? 'text-red-500' : 'text-gray-500'}`}>
                            Stock: {m.qty}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-7 h-7" />
                Cart
              </h2>
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-bold">
                {cart.length} items
              </span>
            </div>

            <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
              <AnimatePresence>
                {cart.length === 0? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-gray-400"
                  >
                    <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Cart khali hai</p>
                    <p className="text-sm">Medicine scan karke add karo</p>
                  </motion.div>
                ) : (
                  cart.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white p-4 rounded-2xl shadow-md border border-gray-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">Rs.{item.price} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-sm transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-black text-lg w-8 text-center">{item.cartQty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-sm transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-black text-xl text-green-600">
                          Rs.{item.price * item.cartQty}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t-2 border-gray-200 pt-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-gray-700">Total:</span>
                  <span className="text-3xl font-black text-green-600">Rs.{total}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={checkout}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  <Printer className="w-6 h-6" />
                  Checkout & Print
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
