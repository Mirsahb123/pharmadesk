"use client"
import { getCustomers, getBills, getPayments, getOrders, getInventory, saveOrder, savePayment } from '@/lib/db-firebase'
import { Auth } from '@/lib/auth'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import {
  ShoppingCart, Search, Package, CreditCard, Receipt, History,
  Copy, Check, X, Plus, Minus, ShoppingBag, Calendar,
  ChevronDown, Upload, ArrowRight, Sparkles, TrendingUp, ExternalLink,
  Phone, User, Hash, Pill, Zap, DollarSign, Droplets
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const ITEM_TYPES = [
  { name: 'Tablet', icon: '💊', color: 'bg-blue-500' },
  { name: 'Capsule', icon: '💊', color: 'bg-purple-500' },
  { name: 'Syrup', icon: '🧴', color: 'bg-pink-500' },
  { name: 'Injection', icon: '💉', color: 'bg-red-500' },
  { name: 'Drip', icon: '💧', color: 'bg-rose-500' },
  { name: 'Cream', icon: '🧴', color: 'bg-yellow-500' },
  { name: 'Ointment', icon: '🩹', color: 'bg-orange-500' },
  { name: 'Drops', icon: '💧', color: 'bg-cyan-500' },
  { name: 'Sugar Strip', icon: '📊', color: 'bg-lime-500' },
  { name: 'BP Apparatus', icon: '🩺', color: 'bg-teal-500' },
  { name: 'Sphygmomanometer', icon: '🩺', color: 'bg-teal-600' },
  { name: 'Thermometer', icon: '🌡️', color: 'bg-amber-500' },
  { name: 'Glucometer', icon: '📟', color: 'bg-emerald-500' },
  { name: 'Bandage', icon: '🩹', color: 'bg-slate-500' },
  { name: 'Syringe', icon: '💉', color: 'bg-indigo-500' },
  { name: 'Mask', icon: '😷', color: 'bg-sky-500' },
  { name: 'Sanitizer', icon: '🧴', color: 'bg-green-500' },
  { name: 'Other', icon: '📦', color: 'bg-gray-500' },
]

const LIQUID_TYPES = ['Syrup', 'Drops', 'Injection', 'Drip']

export default function CustomerPortalPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [bills, setBills] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [shopInfo, setShopInfo] = useState<any>({name: 'Pharmacy'})
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('shop')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const [qrInput, setQrInput] = useState('')
  const [selectedType, setSelectedType] = useState('Tablet')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [packets, setPackets] = useState('')
  const [unitsPerPacket, setUnitsPerPacket] = useState('')
  const [saleType, setSaleType] = useState<'packet' | 'loose'>('packet')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const [adminGst, setAdminGst] = useState(0)
  const [adminDiscount, setAdminDiscount] = useState(0)
  const [showGstDiscount, setShowGstDiscount] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState('')
  const [paidAmount, setPaidAmount] = useState(0)
  const [senderName, setSenderName] = useState('')
  const [screenshot, setScreenshot] = useState('')
  const [selectedBillId, setSelectedBillId] = useState('')
  const [billTitle, setBillTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchBill, setSearchBill] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    setIsMounted(true)
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const id = params.id as string
      const allCustomers = await getCustomers()

      const found = allCustomers.find((c: any) =>
        c.id === id ||
        c.id === id.replace(/-/g, '_') ||
        c.id.replace(/_/g, '-') === id ||
        c.id.toLowerCase() === id.toLowerCase()
      )

      if(found && found.blocked) {
        setCustomer(null)
        return
      }

      if(found) {
        setCustomer(found)
        const [allBills, allPayments, allMedicines] = await Promise.all([
          getBills(),
          getPayments(),
          getInventory()
        ])

        setBills(allBills.filter((b: any) => b.customerPhone === found.phone || b.customerId === found.id))
        setPayments(allPayments.filter((p: any) => p.customerPhone === found.phone || p.customerId === found.id))
        setMedicines(allMedicines || [])

        const user = Auth.getCurrentUser()
        setShopInfo({ name: user?.shopId || 'Pharmacy' })
        setAdminGst(0)
        setAdminDiscount(0)
        setShowGstDiscount(false)
        setPaymentMethods([])
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Load failed: ' + err.message)
    }
  }

  const getUdhaar = () => {
    const totalBilled = bills.reduce((sum: number, b: any) => sum + (b.total || 0), 0)
    const totalPaid = payments.filter((p: any) => p.status === 'approved').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    return totalBilled - totalPaid
  }

  const getBillDue = (bill: any) => {
    const paid = payments.filter((p: any) => p.billId === bill.id && p.status === 'approved').reduce((sum: number, p: any) => sum + p.amount, 0)
    return bill.total - paid
  }

  const isLiquidType = (type: string) => {
    return LIQUID_TYPES.includes(type)
  }

  const handleQRSearch = (value: string) => {
    setQrInput(value)
    if (value.length < 2) {
      setSelectedItem(null)
      return
    }

    const found = medicines.find(m =>
      m.qrCode?.toLowerCase() === value.toLowerCase() ||
      m.name.toLowerCase().includes(value.toLowerCase()) ||
      m.barcode === value
    )

    if (found) {
      setSelectedItem(found)
      setSelectedType(found.type || 'Tablet')
      setProductName(found.name)
      setPrice(found.price.toString())
      setUnitsPerPacket(found.tabletsPerPacket?.toString() || '10')
      setPackets('')
      setQty('')
      if (isLiquidType(found.type)) {
        setSaleType('loose')
      } else {
        setSaleType('packet')
      }
      toast.success('Product found!', { icon: '✅' })
    }
  }

  const getTotalUnits = () => {
    if (saleType === 'packet') {
      const p = parseInt(packets || '0')
      const u = parseInt(unitsPerPacket || '0')
      return p * u
    }
    return parseInt(qty || '0')
  }

  const getTotalPrice = () => {
    return getTotalUnits() * parseFloat(price || '0')
  }

  const addToCart = () => {
    if (!selectedItem) return toast.error('Please select a product', { icon: '❌' })

    const totalUnits = getTotalUnits()
    if (totalUnits <= 0) return toast.error('Quantity must be greater than 0', { icon: '❌' })
    if (totalUnits > selectedItem.qty) return toast.error(`Insufficient stock! Available: ${selectedItem.qty}`, { icon: '⚠️' })

    const newItem = {
      id: crypto.randomUUID(),
      inventoryId: selectedItem.id,
      name: productName,
      type: selectedType,
      price: parseFloat(price),
      saleType: saleType,
      packets: saleType === 'packet'? parseInt(packets || '0') : 0,
      unitsPerPacket: saleType === 'packet'? parseInt(unitsPerPacket || '0') : 0,
      qty: totalUnits,
      qrCode: selectedItem.qrCode || ''
    }

    const existing = cart.find(c => c.name === newItem.name && c.type === newItem.type)
    if(existing) {
      setCart(cart.map(c => c.name === newItem.name && c.type === newItem.type? {...c, qty: c.qty + totalUnits, packets: c.packets + (saleType === 'packet'? parseInt(packets || '0') : 0)} : c))
    } else {
      setCart([...cart, newItem])
    }

    setQrInput('')
    setProductName('')
    setPrice('')
    setQty('')
    setPackets('')
    setUnitsPerPacket('')
    setSelectedItem(null)
    toast.success('Added to cart!', { icon: '🛒' })
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id!== id))
    toast.info('Removed from cart')
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const discountAmount = adminDiscount > 0? subtotal * adminDiscount / 100 : 0
  const gstAmount = adminGst > 0? ((subtotal - discountAmount) * adminGst / 100) : 0
  const total = subtotal - discountAmount + gstAmount

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Cart is empty', { icon: '❌' })

    try {
      const order = {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: cart,
        subtotal,
        discount: discountAmount,
        gst: gstAmount,
        total,
        paymentMethod: 'Pending',
        paidAmount: 0,
        balance: total,
        billNo: `BILL-${Date.now()}`,
        title: billTitle || `Order ${new Date().toLocaleDateString()}`,
        status: 'pending' as const
      }

      const savedOrder = await saveOrder(order)
      await loadData()

      setCart([])
      setBillTitle('')
      setSelectedBillId(savedOrder.id || '')
      setActiveTab('pay')
      toast.success('Order placed successfully!', { icon: '✅' })
    } catch (err: any) {
      toast.error('Order failed: ' + err.message)
    }
  }

  const reorderBill = (bill: any) => {
    if (!bill.items || bill.items.length === 0) return toast.error('No items in this bill', { icon: '❌' })

    const reorderItems = bill.items.map((item: any) => ({
      id: crypto.randomUUID(),
      inventoryId: item.inventoryId,
      name: item.name,
      type: item.type || 'Other',
      price: item.price,
      qty: item.qty,
      packets: item.packets || 0,
      unitsPerPacket: item.unitsPerPacket || 0,
      saleType: item.saleType || 'loose',
      qrCode: item.qrCode || ''
    }))

    setCart(reorderItems)
    setActiveTab('shop')
    toast.success(`${reorderItems.length} items added to cart!`, { icon: '🛒' })
  }

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshot(reader.result as string)
        toast.success('Screenshot uploaded!', { icon: '📸' })
      }
      reader.readAsDataURL(file)
    }
  }

  const submitPayment = async () => {
    if(!selectedBillId) return toast.error('Select a bill', { icon: '❌' })
    if(!paidAmount || paidAmount <= 0) return toast.error('Enter amount', { icon: '❌' })
    if(!screenshot) return toast.error('Upload screenshot', { icon: '❌' })
    if(!senderName) return toast.error('Enter sender name', { icon: '❌' })

    try {
      const bill = bills.find(b => b.id === selectedBillId)
      const method = paymentMethods.find(m => m.name === paymentMethod)

      const newPayment = {
        id: crypto.randomUUID(),
        customerId: customer.id,
        customerPhone: customer.phone,
        customerName: customer.name,
        billId: selectedBillId,
        billAmount: bill?.total || 0,
        amount: paidAmount,
        paymentMethod: paymentMethod,
        paymentAccount: method?.account || '',
        senderName: senderName,
        screenshot: screenshot,
        date: new Date().toISOString(),
        status: 'pending' as const
      }

      await savePayment(newPayment)
      await loadData()

      setPaidAmount(0); setScreenshot(''); setSelectedBillId(''); setSenderName('')
      setActiveTab('ledger')
      toast.success('Payment submitted! Admin will approve soon.', { icon: '✅' })
    } catch (err: any) {
      toast.error('Payment failed: ' + err.message)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied to clipboard!', { icon: '📋' })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categories = ['All',...new Set(medicines.map((p: any) => p.type || 'Other'))]

  const filteredProducts = medicines.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(searchProduct.toLowerCase())
    const matchCategory = selectedCategory === 'All' || p.type === selectedCategory
    return matchSearch && matchCategory
  })

  const filteredBills = bills.filter((b: any) => {
    const matchSearch =!searchBill ||
      b.billNo?.toLowerCase().includes(searchBill.toLowerCase()) ||
      b.title?.toLowerCase().includes(searchBill.toLowerCase()) ||
      b.items?.some((i: any) => i.name.toLowerCase().includes(searchBill.toLowerCase()))

    const billDate = new Date(b.date).toISOString().split('T')[0]
    const matchFrom =!filterDateFrom || billDate >= filterDateFrom
    const matchTo =!filterDateTo || billDate <= filterDateTo

    return matchSearch && matchFrom && matchTo
  })

  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>
  }
  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 md:p-8 rounded-3xl shadow-2xl mb-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center text-white">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <motion.h1
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-4xl md:text-5xl font-black"
                >
                  {shopInfo.name || 'Pharmacy'}
                </motion.h1>
              </div>
              <div className="flex items-center justify-center gap-2 text-white/90">
                <User className="w-4 h-4" />
                <p className="font-medium text-lg">{customer.name}</p>
                <span>•</span>
                <Phone className="w-4 h-4" />
                <p className="font-medium text-lg">{customer.phone}</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mt-6 inline-block bg-white/20 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/30"
              >
                <p className="text-white/80 text-sm font-semibold mb-1 flex items-center gap-2 justify-center">
                  <TrendingUp className="w-4 h-4" />
                  Total Outstanding Balance
                </p>
                <p className="text-5xl font-black">Rs. {udhaar.toFixed(0)}</p>
              </motion.div>
            </div>
          </motion.div>

          <div className="bg-white/70 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-white/50 mb-6 flex gap-2">
            {[
              { id: 'shop', label: 'Shop', icon: ShoppingBag, gradient: 'from-blue-500 to-blue-600' },
              { id: 'ledger', label: 'Ledger', icon: Receipt, gradient: 'from-purple-500 to-purple-600' },
              { id: 'pay', label: 'Pay', icon: CreditCard, gradient: 'from-green-500 to-green-600' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={()=>setActiveTab(tab.id)}
                className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab===tab.id
? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                   : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50">
                    <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-blue-500" />
                      Add Item
                    </h2>

                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          value={qrInput}
                          onChange={e => handleQRSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addToCart()}
                          placeholder="🔍 Scan QR or type Product Name + Enter"
                          className="border-2 border-gray-200 pl-12 pr-4 py-4 rounded-2xl w-full text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">💡 Details auto-fill when QR scanned</p>
                    </div>

                    {selectedItem && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl">
                              {ITEM_TYPES.find(t => t.name === selectedType)?.icon || '📦'}
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-lg">{selectedItem.name}</p>
                              <p className="text-xs text-gray-600">Stock: {selectedItem.qty} units</p>
                            </div>
                          </div>

                          <div className={`grid ${isLiquidType(selectedType)? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                              <select
                                value={selectedType}
                                onChange={e => {
                                  setSelectedType(e.target.value)
                                  if (isLiquidType(e.target.value)) {
                                    setSaleType('loose')
                                  }
                                }}
                                className="bg-white p-3 rounded-xl border-2 border-gray-200 w-full font-bold text-blue-600 focus:border-blue-500 outline-none"
                              >
                                {ITEM_TYPES.map(cat => (
                                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">Price/Unit</label>
                              <div className="bg-white p-3 rounded-xl border-2 border-gray-200">
                                <p className="font-bold text-green-600 text-lg">Rs. {price}</p>
                              </div>
                            </div>
                            {!isLiquidType(selectedType) && (
                              <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Units/Packet</label>
                                <div className="bg-white p-3 rounded-xl border-2 border-gray-200">
                                  <p className="font-bold text-blue-600 text-lg">{unitsPerPacket}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {!isLiquidType(selectedType) && (
                          <div className="grid grid-cols-2 gap-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSaleType('packet')}
                              className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                                saleType === 'packet'
                 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Package className="w-5 h-5" />
                              Packets
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSaleType('loose')}
                              className={`py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                                saleType === 'loose'
                 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Pill className="w-5 h-5" />
                              Loose Units
                            </motion.button>
                          </div>
                        )}

                        {isLiquidType(selectedType) && (
                          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 text-center">
                            <p className="text-sm text-blue-700 font-bold flex items-center justify-center gap-2">
                              <Droplets className="w-4 h-4" />
                              Liquid items sold by units only
                            </p>
                          </div>
                        )}

                        {saleType === 'packet' &&!isLiquidType(selectedType)? (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Packets</label>
                            <input
                              type="number"
                              value={packets}
                              onChange={e => setPackets(e.target.value)}
                              placeholder="Enter packets"
                              className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none text-lg font-bold bg-white/50"
                              min="1"
                            />
                            {packets && (
                              <p className="text-xs text-gray-500 mt-1">
                                Total: {packets} packets × {unitsPerPacket} units = <span className="font-bold text-blue-600">{getTotalUnits()} units</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity (Total Units)</label>
                            <input
                              type="number"
                              value={qty}
                              onChange={e => setQty(e.target.value)}
                              placeholder="Enter quantity"
                              className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-green-500 transition-all outline-none text-lg font-bold bg-white/50"
                              min="1"
                            />
                          </div>
                        )}

                        {getTotalUnits() > 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border-2 border-green-200">
                            <p className="text-sm text-gray-600 mb-1">Total Price</p>
                            <p className="text-3xl font-black text-green-600">Rs. {getTotalPrice().toFixed(0)}</p>
                            <p className="text-xs text-gray-500">{getTotalUnits()} units × Rs. {price}</p>
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={addToCart}
                          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2 text-lg"
                        >
                          <Plus className="w-6 h-6" />
                          Add to Cart
                        </motion.button>
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50">
                    <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-blue-500" />
                      Cart Items ({cart.length})
                    </h2>
                    {cart.length === 0? (
                      <div className="text-center py-16">
                        <p className="text-8xl mb-4">🛒</p>
                        <p className="text-gray-400 font-medium text-lg">Cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {cart.map(item => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-between items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-300 transition-all bg-white/50"
                          >
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.saleType === 'packet'
               ? `${item.packets} Packets (${item.qty} units)`
                                  : `${item.qty} Units`
                                } × Rs. {item.price}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold w-28 text-right text-green-600 text-lg">Rs. {item.price * item.qty}</p>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 w-10 h-10 rounded-xl hover:bg-red-50 transition-all">
                                <X className="w-5 h-5 mx-auto" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 sticky top-4">
                    <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                      <Receipt className="w-6 h-6 text-blue-500" />
                      Bill Summary
                    </h2>
                    <div className="space-y-4">
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-bold text-lg">Rs. {subtotal.toFixed(2)}</span>
                      </div>
                      {adminDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount ({adminDiscount}%):</span>
                          <span className="text-red-500 font-bold">-Rs. {discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {adminGst > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">GST ({adminGst}%):</span>
                          <span className="text-green-600 font-bold">+Rs. {gstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-4 flex justify-between text-3xl font-black">
                        <span>Total:</span>
                        <span className="text-blue-600">Rs. {total.toFixed(2)}</span>
                      </div>
                      {showGstDiscount && <p className="text-xs text-gray-500 text-center mt-2">* GST & Discount set by admin</p>}
                    </div>

                    <div className="mt-6">
                      <input
                        value={billTitle}
                        onChange={e=>setBillTitle(e.target.value)}
                        placeholder="📝 Bill Title (Optional)"
                        className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={placeOrder}
                      disabled={cart.length === 0}
                      className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-2xl hover:shadow-2xl transition-all font-bold text-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-6 h-6" />
                      Place Order
                    </motion.button>
                  </div>

                  <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      All Products
                    </h3>
                    <input
                      value={searchProduct}
                      onChange={e=>setSearchProduct(e.target.value)}
                      placeholder="🔍 Search products..."
                      className="border-2 border-gray-200 p-3 rounded-xl w-full mb-4 focus:border-blue-500 transition-all outline-none"
                    />
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredProducts.slice(0, 15).map((product: any) => (
                        <div key={product.id} className="border-2 border-gray-100 p-4 rounded-2xl hover:border-blue-300 transition-all bg-white/50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-sm text-gray-800">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.type} | Stock: {product.qty || 0} | {product.tabletsPerPacket || 10}/pkt</p>
                            </div>
                            <p className="font-bold text-green-600 text-lg">Rs. {product.price}</p>
                          </div>
                          <button
                            onClick={()=>{setProductName(product.name); setPrice(product.price.toString()); setSelectedType(product.type); setSelectedItem(product); setUnitsPerPacket(product.tabletsPerPacket?.toString() || '10'); if(isLiquidType(product.type)) setSaleType('loose'); addToCart()}}
                            disabled={(product.qty || 0) <= 0}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:from-gray-300 disabled:to-gray-400"
                          >
                            {(product.qty || 0) <= 0? '❌ Out of Stock' : '➕ Add to Cart'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ledger' && (
              <motion.div
                key="ledger"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50">
                  <h3 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-500" />
                    Search Bills
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        value={searchBill}
                        onChange={e=>setSearchBill(e.target.value)}
                        placeholder="🔍 Search by title, bill no, item..."
                        className="border-2 border-gray-200 pl-12 pr-4 py-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={e=>setFilterDateFrom(e.target.value)}
                      className="border-2 border-gray-200 p-4 rounded-2xl focus:border-blue-500 transition-all outline-none"
                    />
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={e=>setFilterDateTo(e.target.value)}
                      className="border-2 border-gray-200 p-4 rounded-2xl focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50">
                  <h3 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-blue-500" />
                    All Bills ({filteredBills.length})
                  </h3>
                  {filteredBills.length === 0? (
                    <div className="text-center py-16">
                      <p className="text-8xl mb-4">📄</p>
                      <p className="text-gray-500 font-medium text-lg">No bills found</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {filteredBills.map((b: any) => (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-2 border-gray-100 p-5 rounded-2xl hover:border-blue-300 transition-all bg-white/50"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-lg">#{b.billNo || b.id.slice(-6)}</p>
                              {b.title && <p className="text-sm text-blue-600 font-bold flex items-center gap-1"><Calendar className="w-4 h-4" /> {b.title}</p>}
                              <p className="text-xs text-gray-600 mt-1">{new Date(b.date).toLocaleString()}</p>
                              <p className="text-xs text-gray-500 mt-2">{b.items?.map((i:any)=>`${i.name} x${i.qty}`).join(', ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-2xl text-gray-800">Rs. {b.total}</p>
                              <p className="text-xs text-red-600 font-bold">Due: Rs. {getBillDue(b)}</p>
                              <span className={`inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold ${
                                b.status === 'paid'? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {b.status === 'paid'? '✅ Paid' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={()=>reorderBill(b)}
                            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Reorder - Add Items to Cart
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50">
                  <h3 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-500" />
                    Payment History
                  </h3>
                  {payments.length === 0? (
                    <div className="text-center py-16">
                      <p className="text-8xl mb-4">💳</p>
                      <p className="text-gray-500 font-medium text-lg">No payments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {payments.map((p: any) => (
                        <div key={p.id} className="border-2 border-gray-100 p-5 rounded-2xl bg-white/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-2xl text-gray-800">Rs. {p.amount}</p>
                              <p className="text-xs text-gray-600 mt-1">{new Date(p.date).toLocaleString()}</p>
                              <p className="text-xs text-gray-600">{p.paymentMethod} - {p.senderName}</p>
                              <p className="text-xs text-gray-500">Bill: #{p.billId?.slice(-6)}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-xs font-bold ${
                              p.status === 'approved'? 'bg-green-100 text-green-700' :
                              p.status === 'rejected'? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {p.status === 'approved'? '✅ Approved' : p.status === 'rejected'? '❌ Rejected' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'pay' && (
              <motion.div
                key="pay"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50"
              >
                <h3 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-500" />
                  Make Payment
                </h3>

                {paymentMethods.length === 0? (
                  <div className="text-center py-16">
                    <p className="text-8xl mb-4">💳</p>
                    <p className="text-gray-500 font-medium text-lg">No payment methods available</p>
                    <p className="text-sm text-gray-400 mt-2">Contact admin to add payment methods</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      <p className="text-sm font-bold text-gray-700">Available Payment Methods:</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        {paymentMethods.map((method: any) => (
                          <motion.div
                            key={method.id}
                            whileHover={{ scale: 1.03 }}
                            className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-200"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-3xl">{method.icon}</span>
                              <p className="text-sm text-blue-800 font-bold">{method.name}</p>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 font-medium">Account Name:</p>
                            <p className="text-sm font-bold text-gray-800 mb-3">{method.accountName}</p>
                            <p className="text-xs text-gray-600 mb-1 font-medium">Account Number:</p>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl">
                              <p className="font-mono font-bold text-blue-600 text-sm">{method.account}</p>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => copyToClipboard(method.account, method.id.toString())}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                              >
                                {copiedId === method.id.toString()? '✅ Copied' : 'Copy'}
                              </motion.button>
                            </div>
                            {method.url && (
                              <a
                                href={method.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium mt-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Pay Now
                              </a>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 mb-6">
                      <h4 className="font-black text-green-800 mb-4 text-lg">📤 Submit Payment</h4>
                      <div className="space-y-4">
                        <select
                          value={selectedBillId}
                          onChange={e=>setSelectedBillId(e.target.value)}
                          className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-green-500 transition-all outline-none"
                        >
                          <option value="">-- Select Bill --</option>
                          {bills.filter((b:any) => getBillDue(b) > 0).map((bill: any) => (
                            <option key={bill.id} value={bill.id}>
                              #{bill.billNo} - Due: Rs. {getBillDue(bill)} - {bill.title || 'No Title'}
                            </option>
                          ))}
                        </select>

                        <select
                          value={paymentMethod}
                          onChange={e=>setPaymentMethod(e.target.value)}
                          className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-green-500 transition-all outline-none"
                        >
                          {paymentMethods.map((m:any) => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          value={paidAmount || ''}
                          onChange={e=>setPaidAmount(parseFloat(e.target.value) || 0)}
                          placeholder="💰 Amount (How much did you send)"
                          className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-green-500 transition-all outline-none"
                        />

                        <input
                          value={senderName}
                          onChange={e=>setSenderName(e.target.value)}
                          placeholder="👤 Sender Name (From which name you sent money)"
                          className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-green-500 transition-all outline-none"
                        />

                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-green-300 p-6 rounded-2xl hover:bg-green-50 transition-all flex items-center justify-center gap-3"
                          >
                            <Upload className="w-6 h-6 text-green-600" />
                            <span className="font-bold text-green-700">
                              {screenshot? '✅ Screenshot Uploaded' : '📸 Upload Payment Screenshot'}
                            </span>
                          </motion.button>
                          {screenshot && (
                            <img src={screenshot} alt="Payment" className="mt-4 w-full max-w-md mx-auto rounded-2xl border-2 border-green-200" />
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={submitPayment}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl hover:shadow-2xl transition-all font-bold text-lg"
                        >
                          ✅ Submit Payment for Approval
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
