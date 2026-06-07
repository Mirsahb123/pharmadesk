"use client"
import { Auth, Shop, User } from '@/lib/auth'
import { getInventory, getBills, getPayments, getCustomers } from '@/lib/db-firebase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import {
  Receipt, Package, TrendingDown, Users, BarChart3, AlertTriangle,
  Users2, QrCode, Settings, LogOut, ShoppingCart, CreditCard,
  DollarSign, Bell, Activity, Building2, TrendingUp, Store, RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const user = Auth.getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)
    loadData(user)

    // Har 30 minute = 1800000 ms me auto reload
    const interval = setInterval(() => {
      console.log('Auto refresh: 30 min')
      loadData(user)
    }, 1800000)

    return () => clearInterval(interval)
  }, [router])

  const loadData = async (user: User) => {
    try {
      setRefreshing(true)

      if (user.role === 'superadmin') {
        setInventory([])
        setBills([])
        setPayments([])
        setCustomers([])
        setShop(null)
      } else {
        const [invData, billsData, paymentsData, custData, allShops] = await Promise.all([
          getInventory(),
          getBills(),
          getPayments(),
          getCustomers(),
          Auth.getAllShops()
        ])

        setInventory(invData || [])
        setBills(billsData || [])
        setPayments(paymentsData || [])
        setCustomers(custData || [])

        const currentShop = allShops.find(s => s.id === user.shopId)
        setShop(currentShop || null)
      }
    } catch (err: any) {
      console.error('Load error:', err)
      toast.error('Data load failed')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    if (!currentUser) return
    toast.loading('Refreshing data...', { id: 'refresh' })
    loadData(currentUser).then(() => {
      toast.success('Data updated!', { id: 'refresh' })
    })
  }

  const logout = () => {
    if (confirm('Logout karna hai?')) {
      Auth.logout()
      router.push('/login')
    }
  }

  if (loading ||!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold text-lg">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  const today = new Date().toDateString()
  const todayBills = bills.filter((b: any) => b.date && new Date(b.date).toDateString() === today)
  const todayTotal = todayBills.reduce((sum: number, b: any) => sum + (b.total || 0), 0)

  const totalTablets = inventory.reduce((sum: number, m: any) => {
    if (m.batches && m.batches.length > 0) {
      return sum + m.batches.reduce((s: number, b: any) => s + (b.qty || 0), 0)
    }
    return sum + (m.qty || 0)
  }, 0)

  const lowStock = inventory.filter((m: any) => {
    const total = m.batches
   ? m.batches.reduce((s: number, b: any) => s + (b.qty || 0), 0)
      : (m.qty || 0)
    return total > 0 && total < 10
  }).length

  const expired = inventory.filter((m: any) => {
    if (m.batches) {
      return m.batches.some((b: any) => b.expiry && new Date(b.expiry) < new Date())
    }
    return m.expiry && new Date(m.expiry) < new Date()
  }).length

  const pendingPayments = payments.filter((p: any) => p.status === 'pending').length

  const stats = [
    {
      title: 'Today Sales',
      value: `Rs. ${todayTotal.toFixed(0)}`,
      sub: `${todayBills.length} bills`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Total Stock',
      value: totalTablets,
      sub: `${inventory.length} items in inventory`,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Low Stock',
      value: lowStock,
      sub: 'Below 10 qty',
      icon: TrendingDown,
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      title: 'Expired',
      value: expired,
      sub: 'Remove now',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-pink-600'
    }
  ]

  const shopCards = [
    { title: 'New Bill', href: '/billing', gradient: 'from-blue-600 to-blue-700', icon: Receipt, desc: 'Create sale invoice' },
    { title: 'Inventory', href: '/inventory', gradient: 'from-green-600 to-green-700', icon: Package, desc: 'Manage medicines' },
    { title: 'Purchase', href: '/purchase', gradient: 'from-teal-600 to-teal-700', icon: ShoppingCart, desc: 'Stock In / Khareed' },
    { title: 'Customers', href: '/customers', gradient: 'from-purple-600 to-purple-700', icon: Users, desc: 'Khata ledger' },
    {
      title: 'Payments',
      href: '/payments',
      gradient: 'from-emerald-600 to-green-700',
      icon: CreditCard,
      desc: 'Customer payments',
      badge: pendingPayments > 0? pendingPayments : null
    },
    { title: 'Reports', href: '/reports', gradient: 'from-orange-600 to-orange-700', icon: BarChart3, desc: 'Sales & analytics' },
    { title: 'Alerts', href: '/alerts', gradient: 'from-red-600 to-red-700', icon: Bell, desc: 'Expiry & low stock', badge: lowStock > 0? lowStock : null },
    { title: 'Staff', href: '/staff', gradient: 'from-indigo-600 to-indigo-700', icon: Users2, desc: 'Manage team' },
    { title: 'QR Generator', href: '/qr-generator', gradient: 'from-cyan-600 to-cyan-700', icon: QrCode, desc: 'Print QR codes' },
    { title: 'Settings', href: '/settings', gradient: 'from-gray-600 to-gray-700', icon: Settings, desc: 'Shop & backup' },
  ]

  const adminCards = [
    { title: 'Manage Shops', href: '/admin/shops', gradient: 'from-blue-600 to-blue-700', icon: Store, desc: 'Add/Block shops' },
    { title: 'All Payments', href: '/admin/payments', gradient: 'from-green-600 to-green-700', icon: DollarSign, desc: 'SaaS revenue' },
    { title: 'Settings', href: '/admin/settings', gradient: 'from-gray-600 to-gray-700', icon: Settings, desc: 'System settings' },
  ]

  const cards = currentUser.role === 'superadmin'? adminCards : shopCards

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6"
      style={{
        background: shop?.theme === 'green'? 'linear-gradient(to br, #f0fdf4, #dcfce7)' :
          shop?.theme === 'purple'? 'linear-gradient(to br, #faf5ff, #f3e8ff)' :
            'linear-gradient(to br, #eff6ff, #dbeafe)'
      }}
    >
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {shop?.logo && (
                <img src={shop.logo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover" />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-blue-600" />
                  {currentUser.role === 'superadmin'? 'Super Admin' : shop?.name || 'Pharmadesk'} Dashboard
                </h1>
                <p className="text-gray-600 mt-2 flex items-center gap-2">
                  Welcome, <span className="font-bold text-blue-600">{currentUser.name}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {currentUser.role.toUpperCase()}
                  </span>
                  <Activity className="w-4 h-4 text-green-500 ml-2" />
                  <span className="text-xs text-green-600 font-semibold">Live</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl hover:shadow-xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl hover:shadow-xl font-bold flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </motion.button>
            </div>
          </div>
        </motion.div>

        {currentUser.role === 'shop' && (
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
                  <p className="text-3xl font-black mb-1">{stat.value}</p>
                  <p className="text-xs opacity-75">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {cards.map((card, idx) => (
            <Link key={card.title} href={card.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                className={`relative bg-gradient-to-br ${card.gradient} text-white p-8 rounded-3xl shadow-2xl cursor-pointer h-48 flex flex-col justify-between overflow-hidden`}
              >
                {card.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg animate-pulse z-20"
                  >
                    {card.badge}
                  </motion.span>
                )}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <card.icon className="w-12 h-12 mb-3" />
                  <h3 className="text-xl font-black mb-1">{card.title}</h3>
                  <p className="text-sm opacity-90">{card.desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {currentUser.role === 'shop' && shop?.plan === 'trial' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-3xl shadow-2xl text-white"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <div className="flex-1">
                <p className="font-black text-xl">Trial Active</p>
                <p className="text-sm opacity-90">
                  Trial ends: {new Date(shop.trialEndsAt).toLocaleDateString()}
                </p>
              </div>
              <button className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold">
                Upgrade Now
              </button>
            </div>
          </motion.div>
        )}

        {lowStock > 0 && currentUser.role === 'shop' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-3xl shadow-2xl text-white"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <div className="flex-1">
                <p className="font-black text-xl">Low Stock Alert!</p>
                <p className="text-sm opacity-90">{lowStock} products are running low on stock</p>
              </div>
              <Link href="/inventory">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold"
                >
                  Check Now
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}