"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { Auth } from '@/lib/auth'
import { db, ref, get, set, update, remove } from '@/lib/firebase'
import {
  Settings, Building2, Phone, Mail, MapPin, Percent, Receipt, Save,
  CreditCard, Plus, Trash2, ExternalLink, Volume2, Shield, Bell,
  Sparkles, Check, Zap, Activity
} from 'lucide-react'

export default function SettingsPage() {
  const [shopInfo, setShopInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gst: 18,
    defaultDiscount: 0,
    paymentSoundUrl: ''
  })

  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [newMethod, setNewMethod] = useState({
    name: '',
    account: '',
    accountName: '',
    url: '',
    icon: '💳'
  })

  useEffect(() => {
    const user = Auth.getCurrentUser()
    if (user) setCurrentUser(user)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      const shopRef = ref(db, 'shopInfo')
      const shopSnap = await get(shopRef)
      if (shopSnap.exists()) {
        setShopInfo(shopSnap.val())
      }

      const methodsRef = ref(db, 'paymentMethods')
      const methodsSnap = await get(methodsRef)
      if (methodsSnap.exists()) {
        const methodsData = methodsSnap.val()
        const allMethods = Object.keys(methodsData).map(key => ({
          id: key,
        ...methodsData[key]
        }))
        setPaymentMethods(allMethods)
      } else {
        setPaymentMethods([])
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Settings load failed')
    } finally {
      setLoading(false)
    }
  }

  const saveShopInfo = async () => {
    try {
      const shopRef = ref(db, 'shopInfo')
      await set(shopRef, shopInfo)
      toast.success('Shop settings saved!', { icon: '✅' })
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Save failed', { icon: '❌' })
    }
  }

  const addPaymentMethod = async () => {
    if (!newMethod.name ||!newMethod.account ||!newMethod.accountName) {
      return toast.error('Please fill all required fields', { icon: '❌' })
    }

    try {
      const methodId = Date.now().toString()
      const method = {
        id: methodId,
      ...newMethod
      }

      const methodRef = ref(db, `paymentMethods/${methodId}`)
      await set(methodRef, method)

      await loadSettings()
      setNewMethod({ name: '', account: '', accountName: '', url: '', icon: '💳' })
      toast.success('Payment method added!', { icon: '💳' })
    } catch (error) {
      console.error('Add error:', error)
      toast.error('Add failed')
    }
  }

  const deletePaymentMethod = async (id: string) => {
    if (!confirm('Delete this payment method?')) return

    try {
      const methodRef = ref(db, `paymentMethods/${id}`)
      await remove(methodRef)
      await loadSettings()
      toast.success('Payment method deleted!', { icon: '🗑️' })
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed')
    }
  }

  const testSound = () => {
    if (shopInfo.paymentSoundUrl) {
      const audio = new Audio(shopInfo.paymentSoundUrl)
      audio.play().catch(() => toast.error('Invalid sound URL', { icon: '❌' }))
    } else {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
      audio.play()
    }
    toast.info('Playing sound...', { icon: '🔊' })
  }

  const methodsArray = Array.isArray(paymentMethods)? paymentMethods : []

  const stats = [
    {
      title: 'Payment Methods',
      value: methodsArray.length,
      icon: CreditCard,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'GST Rate',
      value: `${shopInfo.gst}%`,
      icon: Receipt,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Discount',
      value: `${shopInfo.defaultDiscount}%`,
      icon: Percent,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Sound Alert',
      value: shopInfo.paymentSoundUrl? 'ON' : 'OFF',
      icon: Volume2,
      gradient: 'from-orange-500 to-amber-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold text-lg">Loading settings...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                Shop Settings
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                Configure your pharmacy
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                  {currentUser?.role?.toUpperCase() || 'ADMIN'}
                </span>
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600 font-semibold">Live</span>
              </p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Pro Settings
            </motion.div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-3xl shadow-2xl text-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <stat.icon className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-sm opacity-90 mb-1">{stat.title}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50"
          >
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-500" />
              Shop Information
            </h2>

            <div className="space-y-4">
              <motion.div whileHover={{ x: 5 }}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> Shop Name
                </label>
                <input
                  value={shopInfo.name}
                  onChange={e => setShopInfo({...shopInfo, name: e.target.value })}
                  placeholder="Pharmacy Name"
                  className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50"
                />
              </motion.div>

              <motion.div whileHover={{ x: 5 }}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Address
                </label>
                <textarea
                  value={shopInfo.address}
                  onChange={e => setShopInfo({...shopInfo, address: e.target.value })}
                  placeholder="Complete shop address"
                  rows={3}
                  className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none resize-none bg-white/50"
                />
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ x: 5 }}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Phone
                  </label>
                  <input
                    value={shopInfo.phone}
                    onChange={e => setShopInfo({...shopInfo, phone: e.target.value })}
                    placeholder="+92 XXX XXXXXXX"
                    className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50"
                  />
                </motion.div>

                <motion.div whileHover={{ x: 5 }}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email
                  </label>
                  <input
                    value={shopInfo.email}
                    onChange={e => setShopInfo({...shopInfo, email: e.target.value })}
                    placeholder="email@example.com"
                    type="email"
                    className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50"
                  />
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ x: 5 }}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                    <Receipt className="w-4 h-4" /> GST %
                  </label>
                  <input
                    type="number"
                    value={shopInfo.gst}
                    onChange={e => setShopInfo({...shopInfo, gst: parseFloat(e.target.value) || 0 })}
                    placeholder="18"
                    className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50"
                    min="0"
                    max="100"
                  />
                </motion.div>

                <motion.div whileHover={{ x: 5 }}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                    <Percent className="w-4 h-4" /> Discount %
                  </label>
                  <input
                    type="number"
                    value={shopInfo.defaultDiscount}
                    onChange={e => setShopInfo({...shopInfo, defaultDiscount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="border-2 border-gray-200 p-4 rounded-2xl w-full focus:border-blue-500 transition-all outline-none bg-white/50"
                    min="0"
                    max="100"
                  />
                </motion.div>
              </div>

              <motion.div whileHover={{ x: 5 }}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                  <Volume2 className="w-4 h-4" /> Payment Alert Sound URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={shopInfo.paymentSoundUrl || ''}
                    onChange={e => setShopInfo({...shopInfo, paymentSoundUrl: e.target.value })}
                    placeholder="https://cdn.pixabay.com/...mp3"
                    className="border-2 border-gray-200 p-4 rounded-2xl flex-1 focus:border-blue-500 transition-all outline-none bg-white/50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={testSound}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 rounded-2xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    Test
                  </motion.button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty for default beep</p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveShopInfo}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl hover:shadow-2xl transition-all font-bold flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save All Settings
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50"
          >
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-green-500" />
              Payment Methods
            </h2>

            <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto">
              {methodsArray.length === 0? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-6xl mb-3">💳</p>
                  <p className="text-gray-500 font-medium">No payment methods added yet</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {methodsArray.map((method: any, idx: number) => (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, scale: 0.9, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-200 shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{method.icon}</span>
                          <div>
                            <p className="font-black text-gray-800 text-lg">{method.name}</p>
                            <p className="text-xs text-gray-600">{method.accountName}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deletePaymentMethod(method.id)}
                          className="text-red-500 hover:text-red-700 w-10 h-10 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                      <div className="bg-white p-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Account Number:</p>
                        <p className="font-mono font-bold text-blue-600 text-sm">{method.account}</p>
                      </div>
                      {method.url && (
                        <motion.a
                          whileHover={{ x: 5 }}
                          href={method.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold mt-3"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Payment Link
                        </motion.a>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-2xl border-2 border-gray-200"
            >
              <p className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Add New Method
              </p>
              <div className="space-y-3">
                <select
                  value={newMethod.icon}
                  onChange={e => setNewMethod({...newMethod, icon: e.target.value })}
                  className="border-2 border-gray-200 p-3 rounded-xl w-full focus:border-blue-500 transition-all outline-none bg-white/70"
                >
                  <option value="💳">💳 Bank Account</option>
                  <option value="📱">📱 JazzCash</option>
                  <option value="💰">💰 EasyPaisa</option>
                  <option value="🏦">🏦 Other Bank</option>
                  <option value="💵">💵 Cash</option>
                </select>

                <input
                  value={newMethod.name}
                  onChange={e => setNewMethod({...newMethod, name: e.target.value })}
                  placeholder="Method Name (e.g., HBL, JazzCash)"
                  className="border-2 border-gray-200 p-3 rounded-xl w-full focus:border-blue-500 transition-all outline-none text-sm bg-white/70"
                />

                <input
                  value={newMethod.accountName}
                  onChange={e => setNewMethod({...newMethod, accountName: e.target.value })}
                  placeholder="Account Holder Name"
                  className="border-2 border-gray-200 p-3 rounded-xl w-full focus:border-blue-500 transition-all outline-none text-sm bg-white/70"
                />

                <input
                  value={newMethod.account}
                  onChange={e => setNewMethod({...newMethod, account: e.target.value })}
                  placeholder="Account Number / IBAN"
                  className="border-2 border-gray-200 p-3 rounded-xl w-full focus:border-blue-500 transition-all outline-none text-sm bg-white/70"
                />

                <input
                  value={newMethod.url}
                  onChange={e => setNewMethod({...newMethod, url: e.target.value })}
                  placeholder="Payment URL (Optional)"
                  className="border-2 border-gray-200 p-3 rounded-xl w-full focus:border-blue-500 transition-all outline-none text-sm bg-white/70"
                />

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addPaymentMethod}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl hover:shadow-xl transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Method
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
