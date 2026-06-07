"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { Eye, EyeOff, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { Auth } from '@/lib/auth'

export default function LoginPage() {
  const [cnic, setCnic] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const SUPER_ADMIN = {
    cnic: '35202-1234567-1',
    password: 'admin123'
  }

  const handleLogin = async () => {
    if (!cnic ||!password) return toast.error('CNIC aur Password dono likho')
    setLoading(true)

    // Super Admin check
    if (cnic.replace(/\D/g, '') === SUPER_ADMIN.cnic.replace(/\D/g, '') && password === SUPER_ADMIN.password) {
      const user = { cnic, role: 'superadmin' as const, name: 'Super Admin', id: 'superadmin' }
      Auth.setCurrentUser(user)
      toast.success('Welcome Super Admin!')
      router.push('/admin/shops')
      setLoading(false)
      return
    }

    // Shop Owner check - Firebase
    const shop = await Auth.getShopByCNIC(cnic)

    if (!shop || shop.password!== password) {
      toast.error('CNIC ya Password galat hai')
      setLoading(false)
      return
    }

    if (shop.plan === 'blocked') {
      toast.error('Account blocked hai. Admin se contact karo')
      setLoading(false)
      return
    }

    if (shop.plan === 'trial' && new Date(shop.trialEndsAt) < new Date()) {
      toast.error('Trial khatam ho gaya. Subscription renew karo')
      setLoading(false)
      return
    }

    const user = {
      cnic,
      role: 'shop' as const,
      shopId: shop.id,
      name: shop.ownerName,
      id: shop.id
    }
    Auth.setCurrentUser(user)
    toast.success(`Welcome ${shop.ownerName}!`)
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-4">
      <Toaster position="top-center" richColors />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-2xl">
            <Store className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center mb-2 text-gray-900">PharmaDesk</h1>
        <p className="text-center text-gray-500 mb-8">Medical Store Management System</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">CNIC Number</label>
            <input
              type="text"
              placeholder="35202-1234567-1"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass? 'text' : 'password'}
                placeholder="Apna password likho"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-lg pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              >
                {showPass? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading? 'Loading...' : 'Login Karo'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}