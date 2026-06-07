"use client"
import { getInventory, saveBill, Medicine } from '@/lib/db-firebase'
import { Auth } from '@/lib/auth'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { ShoppingCart, Scan, Trash2, Printer, Package, Percent, ArrowLeft, Pill, Droplet, Syringe, HeartPulse, X, Zap, Plus, CheckCircle } from 'lucide-react'

// Force client-side only - Hydration fix
export const dynamic = 'force-dynamic'

const MEDICINE_CATEGORIES = [
  { name: 'Tablet', icon: Pill },
  { name: 'Capsule', icon: Pill },
  { name: 'Syrup', icon: Droplet },
  { name: 'Injection', icon: Syringe },
  { name: 'Drip', icon: Droplet },
  { name: 'Cream', icon: HeartPulse },
  { name: 'Ointment', icon: HeartPulse },
  { name: 'Drops', icon: Droplet },
  { name: 'Inhaler', icon: HeartPulse },
  { name: 'Gel', icon: HeartPulse },
  { name: 'Powder', icon: Package },
  { name: 'Sachet', icon: Package },
  { name: 'Other', icon: Package }
]

const PACKET_SUPPORTED = ['Tablet', 'Capsule', 'Sachet']

export default function BillingPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [scannedList, setScannedList] = useState<any[]>([])
  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [customerPhone, setCustomerPhone] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const [selectedType, setSelectedType] = useState('Tablet')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')

  const [unitType, setUnitType] = useState('Piece')
  const [unitsPerStrip, setUnitsPerStrip] = useState(10)
  const [stripsPerBox, setStripsPerBox] = useState(10)

  const [isScanning, setIsScanning] = useState(false)
  const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null)
  const scannerRef = useRef<any>(null)
  const scannedCodesRef = useRef<Set<string>>(new Set())

  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('Rs')
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstPercent, setGstPercent] = useState(18)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paidAmount, setPaidAmount] = useState(0)
  const [printSize, setPrintSize] = useState('A4')
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const user = Auth.getCurrentUser()
    if (!user?.shopId) {
      toast.error('Login nahi ho. Pehle login karo')
      return
    }
    setShopId(user.shopId)
    loadInventory()

    if (typeof window!== 'undefined') {
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
    } catch (err: any) {
      toast.error('Firebase Error: ' + err.message)
    }
  }

  const showPacketSystem = PACKET_SUPPORTED.includes(selectedType)

  useEffect(() => {
    if (!showPacketSystem) {
      setUnitType('Piece')
    }
  }, [selectedType])

  const startScan = async () => {
    if (!Html5Qrcode) {
      toast.error('Scanner loading... 1 sec wait')
      return
    }
    setIsScanning(true)
    scannedCodesRef.current.clear()

    try {
      const scanner = new Html5Qrcode("qr-reader-billing")
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        videoConstraints: {
          facingMode: "environment"
        }
      }

      const onScanSuccess = (decodedText: string) => {
        if (scannedCodesRef.current.has(decodedText)) {
          toast.warning('Already Scanned!', { icon: '⚠️', duration: 1000 })
          return
        }
        handleScanSuccess(decodedText)
      }

      try {
        await scanner.start({ facingMode: "environment" }, config, onScanSuccess, () => {})
        toast.success('⚡ Camera ON', { icon: '📷' })
      } catch {
        await scanner.start({ facingMode: "user" }, config, onScanSuccess, () => {})
        toast.success('⚡ Camera ON', { icon: '📷' })
      }
    } catch (err: any) {
      toast.error('Camera access nahi mila')
      setIsScanning(false)
    }
  }

  const handleScanSuccess = (decodedText: string) => {
    scannedCodesRef.current.add(decodedText)
    const found = medicines.find(m => m.qrCode?.toLowerCase() === decodedText.toLowerCase())

    if (found) {
      const alreadyScanned = scannedList.find(item => item.qrCode === decodedText)
      if (alreadyScanned) {
        toast.warning(`${found.name} - Already in list!`, { icon: '⚠️' })
        return
      }

      const newScannedItem = {
        id: crypto.randomUUID(),
        inventoryId: found.id,
        name: found.name,
        type: found.type,
        price: found.price,
        qrCode: decodedText,
        qty: 0,
        unitType: PACKET_SUPPORTED.includes(found.type)? 'Piece' : 'Unit',
        unitsPerStrip: found.tabletsPerPacket || 10,
        stripsPerBox: 10,
        stockAvailable: found.qty
      }

      setScannedList(prev => [...prev, newScannedItem])
      toast.success(`✅ Added: ${found.name}`, { duration: 1500, icon: '📦' })
    } else {
      toast.error(`QR not found: ${decodedText}`, { duration: 2000 })
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

  const addManualToCart = () => {
    if (!productName ||!price ||!qty) return toast.error('Name, Price, Qty bharo')
    if (parseInt(qty) <= 0) return toast.error('Qty 0 se zyada honi chahiye')

    const newItem = {
      id: crypto.randomUUID(),
      inventoryId: null,
      name: productName,
      type: selectedType,
      price: parseFloat(price),
      qty: parseInt(qty),
      unitType: unitType,
      unitsPerStrip: unitsPerStrip,
      stripsPerBox: stripsPerBox,
      totalPieces: PACKET_SUPPORTED.includes(selectedType)
      ? (unitType === 'Piece'? parseInt(qty) : unitType === 'Strip'? parseInt(qty) * unitsPerStrip : parseInt(qty) * stripsPerBox * unitsPerStrip)
        : parseInt(qty),
      qrCode: 'MANUAL'
    }

    setCart([...cart, newItem])
    toast.success(`${productName} cart me add ho gaya`)
    setProductName('')
    setPrice('')
    setQty('')
  }

  const removeFromScannedList = (id: string) => {
    const item = scannedList.find(i => i.id === id)
    if (item) scannedCodesRef.current.delete(item.qrCode)
    setScannedList(scannedList.filter(i => i.id!== id))
    toast.info('Removed from list')
  }

  const updateScannedQty = (id: string, newQty: number) => {
    if (newQty < 0) return
    const item = scannedList.find(i => i.id === id)
    if (item && newQty > item.stockAvailable) return toast.error(`Stock kam hai! Available: ${item.stockAvailable}`)
    setScannedList(scannedList.map(i => i.id === id? {...i, qty: newQty } : i))
  }

  const updateScannedUnitType = (id: string, newUnitType: string) => {
    setScannedList(scannedList.map(i => i.id === id? {...i, unitType: newUnitType } : i))
  }

  const addAllToCart = () => {
    const itemsWithQty = scannedList.filter(item => item.qty > 0)
    if (itemsWithQty.length === 0) return toast.error('Kisi item ki quantity set karo')

    const newCartItems = itemsWithQty.map(item => {
      const totalPieces = PACKET_SUPPORTED.includes(item.type)
      ? (item.unitType === 'Piece'? item.qty : item.unitType === 'Strip'? item.qty * item.unitsPerStrip : item.qty * item.stripsPerBox * item.unitsPerStrip)
        : item.qty

      return {
        id: item.id,
        inventoryId: item.inventoryId,
        name: item.name,
        type: item.type,
        price: item.price,
        qty: item.qty,
        unitType: item.unitType,
        unitsPerStrip: item.unitsPerStrip,
        stripsPerBox: item.stripsPerBox,
        totalPieces: totalPieces,
        qrCode: item.qrCode
      }
    })

    setCart([...cart,...newCartItems])
    setScannedList([])
    scannedCodesRef.current.clear()
    toast.success(`${newCartItems.length} items added to cart!`, { icon: '🛒' })
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id!== id))
    toast.info('Item removed')
  }

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) return removeFromCart(id)
    const item = cart.find(c => c.id === id)
    if (!item) return

    if (item.inventoryId) {
      const med = medicines.find(m => m.id === item.inventoryId)
      const newTotalPieces = PACKET_SUPPORTED.includes(item.type)
      ? (item.unitType === 'Piece'? newQty : item.unitType === 'Strip'? newQty * item.unitsPerStrip : newQty * item.stripsPerBox * item.unitsPerStrip)
        : newQty

      if (med && newTotalPieces > med.qty) return toast.error(`Stock kam hai! Available: ${med.qty}`)
    }

    setCart(cart.map(c => c.id === id? {
    ...c,
      qty: newQty,
      totalPieces: PACKET_SUPPORTED.includes(c.type)
      ? (c.unitType === 'Piece'? newQty : c.unitType === 'Strip'? newQty * c.unitsPerStrip : newQty * c.stripsPerBox * c.unitsPerStrip)
        : newQty
    } : c))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const discountAmount = discountType === '%'? (subtotal * discount / 100) : discount
  const gstAmount = gstEnabled? ((subtotal - discountAmount) * gstPercent / 100) : 0
  const total = subtotal - discountAmount + gstAmount
  const balance = paidAmount - total

  const completeBill = async () => {
    if (cart.length === 0) return toast.error('Cart khali hai')
    if (!shopId) return toast.error('Login nahi ho')

    const bill = {
      items: cart.map(c => ({
        name: c.name,
        qty: c.qty,
        price: c.price,
        unitType: c.unitType,
        inventoryId: c.inventoryId,
        totalPieces: c.totalPieces
      })),
      total,
      customerName,
      customerPhone,
      discount: discountAmount,
      discountPercent: discountType === '%'? discount : 0,
      gstEnabled,
      gstPercent: gstEnabled? gstPercent : 0,
      gstAmount,
      paymentMethod,
      paidAmount,
      balance,
      billNo: `BILL-${Date.now()}`,
      printSize
    }

    try {
      await saveBill(bill)
      const updatedInventory = await getInventory()
      setMedicines(updatedInventory)
      window.print()

      setCart([])
      setScannedList([])
      setCustomerName('Walk-in Customer')
      setCustomerPhone('')
      setPaidAmount(0)
      setDiscount(0)
      toast.success('Bill Complete! Stock updated')
    } catch (err: any) {
      toast.error('Bill save nahi hua: ' + err.message)
    }
  }

  const filteredMeds = medicines.filter(m =>
    m.name.toLowerCase().includes(productName.toLowerCase()) && m.qty > 0
  )

  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>
  }

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Login karo pehle...</p>
          <Link href="/login">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Login Page</button>
          </Link>
        </div>
      </div>
    )
    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Billing / POS</h1>
              <p className="text-sm text-gray-500">Shop: {shopId}</p>
            </div>
          </div>
          <Link href="/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border hover:bg-gray-50 font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </motion.button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                Customer Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in Customer" className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition" />
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone Number" className="border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none transition" />
              </div>
            </motion.div>

            <div className="flex gap-2">
              <button onClick={() => setManualMode(false)} className={`flex-1 py-3 rounded-xl font-bold ${!manualMode? 'bg-blue-600 text-white' : 'bg-white border-2'}`}>
                <Scan className="w-4 h-4 inline mr-2" />
                QR Scan Mode
              </button>
              <button onClick={() => setManualMode(true)} className={`flex-1 py-3 rounded-xl font-bold ${manualMode? 'bg-purple-600 text-white' : 'bg-white border-2'}`}>
                <Plus className="w-4 h-4 inline mr-2" />
                Manual Entry
              </button>
            </div>

            {!manualMode? (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                  Step 1: Scan Multiple Items
                </h2>
                <div id="qr-reader-billing" className="mb-3"></div>
                <div className="flex gap-2 mb-4">
                  {!isScanning? (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startScan} disabled={!Html5Qrcode} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                      <Zap className="w-5 h-5" />
                      {Html5Qrcode? 'Start Scanning - Multiple Items' : 'Loading...'}
                    </motion.button>
                  ) : (
                    <button onClick={stopScan} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse">
                      <X className="w-5 h-5" />
                      Stop Camera ({scannedList.length} scanned)
                    </button>
                  )}
                </div>
                <p className="text-xs text-red-600 font-bold mb-4">⚠️ Camera black hai to: Chrome me chrome://flags/#unsafely-treat-insecure-origin-as-secure enable karo aur http://localhost:3000 add karo</p>
              </motion.div>
            ) : (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                  Manual Entry - Type & Add
                </h2>
                <div className="space-y-3">
                  <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-purple-500 outline-none">
                    {MEDICINE_CATEGORIES.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product Name" list="medicine-list" className="w-full border-2 p-3 rounded-xl focus:border-purple-500 outline-none" />
                  <datalist id="medicine-list">
                    {filteredMeds.map(m => (
                      <option key={m.id} value={m.name} />
                    ))}
                  </datalist>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price per unit" className="border-2 p-3 rounded-xl focus:border-purple-500 outline-none" />
                    <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Quantity" className="border-2 p-3 rounded-xl focus:border-purple-500 outline-none" />
                  </div>
                  {showPacketSystem && (
                    <div className="grid grid-cols-3 gap-3">
                      <select value={unitType} onChange={e => setUnitType(e.target.value)} className="border-2 p-3 rounded-xl bg-purple-50">
                        <option value="Piece">Piece</option>
                        <option value="Strip">Strip</option>
                        <option value="Box">Box</option>
                      </select>
                      <input type="number" value={unitsPerStrip} onChange={e => setUnitsPerStrip(parseInt(e.target.value) || 10)} placeholder="Units/Strip" className="border-2 p-3 rounded-xl" />
                      <input type="number" value={stripsPerBox} onChange={e => setStripsPerBox(parseInt(e.target.value) || 10)} placeholder="Strips/Box" className="border-2 p-3 rounded-xl" />
                    </div>
                  )}
                  <button onClick={addManualToCart} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700">
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {scannedList.length > 0 && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-lg border-2 border-yellow-300">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                      Step 2: Set Quantity ({scannedList.length} items)
                    </h2>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addAllToCart} disabled={!scannedList.some(i => i.qty > 0)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" />
                      Add All to Cart
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {scannedList.map((item, idx) => (
                      <motion.div key={item.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.05 }} className="bg-white p-4 rounded-xl border-2 border-yellow-200 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.type} | Rs. {item.price} | Stock: {item.stockAvailable}</p>
                        </div>
                        {PACKET_SUPPORTED.includes(item.type) && (
                          <select value={item.unitType} onChange={e => updateScannedUnitType(item.id, e.target.value)} className="border-2 border-purple-200 p-2 rounded-lg bg-purple-50 font-bold text-sm">
                            <option value="Piece">Piece</option>
                            <option value="Strip">Strip</option>
                            <option value="Box">Box</option>
                          </select>
                        )}
                        <input type="number" value={item.qty || ''} onChange={e => updateScannedQty(item.id, parseInt(e.target.value) || 0)} placeholder="Qty" className="border-2 border-gray-300 p-2 rounded-lg w-20 text-center font-bold focus:border-blue-500 outline-none" min="0" max={item.stockAvailable} />
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeFromScannedList(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                Step 3: Cart Items ({cart.length})
              </h2>
              {cart.length === 0? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">Cart khali hai - Scan ya manual add karo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <motion.div key={item.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-between items-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {item.type} | Rs. {item.price} |
                          <span className="text-purple-600 font-semibold"> {item.unitType}</span>
                          {PACKET_SUPPORTED.includes(item.type) && item.unitType!== 'Piece' && ` (${item.totalPieces} pcs)`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="number" value={item.qty} onChange={e => updateCartQty(item.id, parseInt(e.target.value) || 0)} className="border-2 border-gray-200 p-2 rounded-lg w-20 text-center font-bold" min="1" />
                        <p className="font-black text-lg w-24 text-right text-green-600">Rs. {item.price * item.qty}</p>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl shadow-xl text-white">
              <h2 className="text-xl font-black mb-4">Bill Summary</h2>
              <div className="space-y-3 bg-white/10 p-4 rounded-xl backdrop-blur">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <div className="flex gap-2">
                    <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="bg-white/20 border-white/30 p-1 rounded w-20 text-white placeholder-white/50" />
                    <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="bg-white/20 border border-white/30 p-1 rounded text-white">
                      <option value="Rs" className="text-black">Rs.</option>
                      <option value="%" className="text-black">%</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between text-red-200">
                  <span>-Discount:</span>
                  <span>Rs. {discountAmount.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={gstEnabled} onChange={e => setGstEnabled(e.target.checked)} />
                    <span className="font-semibold">Apply GST</span>
                  </label>
                  {gstEnabled && (
                    <div className="flex items-center gap-2">
                      <input type="number" value={gstPercent} onChange={e => setGstPercent(parseFloat(e.target.value) || 0)} className="bg-white/20 border border-white/30 p-1 rounded w-20 text-white" />
                      <Percent className="w-4 h-4" />
                      <span className="ml-auto font-bold">Rs. {gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-2xl font-black border-t border-white/30 pt-3">
                  <span>Total:</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="border-2 border-gray-200 p-3 rounded-xl w-full mb-4 focus:border-blue-500 outline-none">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>JazzCash</option>
                <option>EasyPaisa</option>
              </select>
              <label className="text-sm font-semibold text-gray-600">Paid Amount Rs.</label>
              <input type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="border-2 border-gray-200 p-3 rounded-xl w-full mb-2 focus:border-green-500 outline-none" />
              {paidAmount > 0 && (
                <p className={`text-sm font-bold ${balance >= 0? 'text-green-600' : 'text-red-600'}`}>Balance: Rs. {balance.toFixed(2)}</p>
              )}
            </motion.div>

            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-lg font-bold mb-4">Print Size</h2>
              <div className="grid grid-cols-2 gap-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPrintSize('A4')} className={`p-3 rounded-xl border-2 font-bold transition ${printSize === 'A4'? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-gray-400'}`}>A4</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPrintSize('80mm')} className={`p-3 rounded-xl border-2 font-bold transition ${printSize === '80mm'? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:border-gray-400'}`}>80mm Thermal</motion.button>
              </div>
            </motion.div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={completeBill} disabled={cart.length === 0} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 font-black text-lg disabled:from-gray-300 disabled:to-gray-400 shadow-xl flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              Save & Print Invoice
            </motion.button>
          </div>
        </div>

        <div className="hidden print:block fixed inset-0 bg-white p-8">
          <div className={printSize === 'A4'? 'max-w-2xl mx-auto' : 'max-w-xs mx-auto'}>
            <h1 className="text-2xl font-black text-center mb-2">MEDICAL STORE</h1>
            <p className="text-center text-xs mb-4">Bill Receipt - {printSize}</p>
            <div className="border-t border-b py-2 mb-2 text-xs">
              <p>Bill No: BILL-{Date.now()}</p>
              <p>Date: {new Date().toLocaleString()}</p>
              <p>Customer: {customerName}</p>
              {customerPhone && <p>Phone: {customerPhone}</p>}
            </div>
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left">Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} className="border-b">
                    <td>{item.name}</td>
                    <td className="text-right">{item.qty}</td>
                    <td className="text-right">{item.unitType}</td>
                    <td className="text-right">{item.price}</td>
                    <td className="text-right">{item.price * item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1 text-sm">
              <p>Subtotal: Rs. {subtotal.toFixed(2)}</p>
              <p>Discount: Rs. {discountAmount.toFixed(2)}</p>
              {gstEnabled && <p>GST {gstPercent}%: Rs. {gstAmount.toFixed(2)}</p>}
              <p className="text-lg font-black border-t pt-1">Total: Rs. {total.toFixed(2)}</p>
              <p>Paid: Rs. {paidAmount.toFixed(2)}</p>
              <p>Balance: Rs. {balance.toFixed(2)}</p>
            </div>
            <p className="text-center text-xs mt-6">Thank you! Get well soon 🙏</p>
          </div>
        </div>
      </div>
    </div>
  )
}
