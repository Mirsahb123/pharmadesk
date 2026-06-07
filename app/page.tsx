import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-4">
            Pharma<span className="text-yellow-300">desk</span>
          </h1>
          <p className="text-2xl opacity-90">
            Pharmacy Management System - Sab Kuch Ek Jagah
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="text-4xl mb-4">💊</div>
            <h3 className="text-xl font-bold text-white mb-2">Inventory</h3>
            <p className="text-white/80">Stock manage karo, expiry track karo</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="text-4xl mb-4">🧾</div>
            <h3 className="text-xl font-bold text-white mb-2">Billing</h3>
            <p className="text-white/80">Fast billing + GST invoice</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Reports</h3>
            <p className="text-white/80">Sales & profit reports dekho</p>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/dashboard" 
            className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all inline-block shadow-2xl"
          >
            Dashboard Kholo →
          </Link>
        </div>
      </div>
    </main>
  )
}