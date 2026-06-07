"use client"
import { useState, useEffect } from "react";
import { Auth, Shop } from "@/lib/auth";
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { Eye, EyeOff, Plus, Store, Lock, Unlock, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    cnic: '',
    password: '',
    ownerName: '',
    phone: '',
    logo: '',
    theme: 'blue'
  });

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) {
      toast.error('Login required')
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.role!== 'superadmin') {
      toast.error('Access denied. Super Admin only')
      router.push('/login')
      return
    }

    setLoading(false)
    loadShops()
  }, [router]);

  const loadShops = async () => {
    const data = await Auth.getAllShops();
    setShops(data);
  }

  const createShop = async () => {
    if (!form.name ||!form.cnic ||!form.password ||!form.ownerName) {
      return toast.error('Shop Name, CNIC, Password, Owner Name zaroori hai');
    }

    try {
      await Auth.addShop({
        name: form.name,
        cnic: form.cnic,
        password: form.password,
        ownerName: form.ownerName,
        phone: form.phone,
        logo: form.logo,
        theme: form.theme,
        plan: 'trial'
      });

      await loadShops();
      setForm({ name: '', cnic: '', password: '', ownerName: '', phone: '', logo: '', theme: 'blue' });
      setShowForm(false);
      toast.success(`Shop bani: ${form.name}`);
    } catch (e: any) {
      toast.error(e.message)
    }
  };

  const toggleBlock = async (id: string, currentPlan: string) => {
    const newPlan = currentPlan === 'blocked'? 'active' : 'blocked'
    await Auth.updateShop(id, { plan: newPlan })
    await loadShops()
    toast.success(`Shop ${newPlan === 'blocked'? 'blocked' : 'unblocked'}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="bg-gray-200 p-3 rounded-xl hover:bg-gray-300">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-xl">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Manage Shops</h1>
              <p className="text-sm text-gray-500">Add, Block, Update medical stores</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Plus className="w-5 h-5" /> Add Shop
          </button>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-100"
          >
            <h2 className="text-xl font-bold mb-4">Nayi Shop Add Karo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Shop Name *</label>
                <input
                  placeholder="City Medical Store"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="border-2 p-3 rounded-xl w-full mt-1 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Owner Name *</label>
                <input
                  placeholder="Malik ka naam"
                  value={form.ownerName}
                  onChange={e => setForm({...form, ownerName: e.target.value})}
                  className="border-2 p-3 rounded-xl w-full mt-1 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Owner CNIC *</label>
                <input
                  placeholder="35202-1234567-1"
                  value={form.cnic}
                  onChange={e => setForm({...form, cnic: e.target.value})}
                  className="border-2 p-3 rounded-xl w-full mt-1 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Temp Password *</label>
                <div className="relative mt-1">
                  <input
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Temp password"
                    type={showPass? 'text' : 'password'}
                    className="border-2 p-3 rounded-xl w-full pr-12 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3.5 text-gray-500"
                  >
                    {showPass? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Phone</label>
                <input
                  placeholder="03001234567"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="border-2 p-3 rounded-xl w-full mt-1 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Logo URL</label>
                <input
                  placeholder="https://..."
                  value={form.logo}
                  onChange={e => setForm({...form, logo: e.target.value})}
                  className="border-2 p-3 rounded-xl w-full mt-1 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Theme Color</label>
                <select
                  value={form.theme}
                  onChange={e => setForm({...form, theme: e.target.value})}
                  className="border-2 p-3 rounded-xl w-full mt-1 focus:border-blue-500 outline-none"
                >
                  <option value="blue">Blue Theme</option>
                  <option value="green">Green Theme</option>
                  <option value="purple">Purple Theme</option>
                </select>
              </div>
            </div>
            <button
              onClick={createShop}
              className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700"
            >
              Save Shop
            </button>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-black">Shop</th>
                <th className="p-4 text-left font-black">Owner</th>
                <th className="p-4 text-left font-black">CNIC</th>
                <th className="p-4 text-left font-black">Status</th>
                <th className="p-4 text-left font-black">Trial Ends</th>
                <th className="p-4 text-left font-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {shops.length === 0? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-400">
                    Koi shop add nahi hai. Upar "Add Shop" button dabao
                  </td>
                </tr>
              ) : shops.map(shop => (
                <tr key={shop.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-bold">{shop.name}</td>
                  <td className="p-4">{shop.ownerName}</td>
                  <td className="p-4 text-sm">{shop.cnic}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      shop.plan === 'active'? 'bg-green-100 text-green-700' :
                      shop.plan === 'trial'? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {shop.plan}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(shop.trialEndsAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleBlock(shop.id, shop.plan)}
                      className={`text-sm text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 ${
                        shop.plan === 'blocked'? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {shop.plan === 'blocked'? <><Unlock className="w-4 h-4" /> Unblock</> : <><Lock className="w-4 h-4" /> Block</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}