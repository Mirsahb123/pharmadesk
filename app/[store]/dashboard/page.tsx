"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DB, Shop } from "@/lib/storage";
import { Settings } from "lucide-react";

export default function ShopDashboard({ params }: { params: Promise<{ store: string }> }) {
  const { store } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    const foundShop = DB.shops.find(store);
    setShop(foundShop || null);
  }, [store]);

  if (!shop) return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-red-600">Shop not found</h1>
      <p className="text-gray-600 mt-2">Slug: {store}</p>
      <a href="/admin/shops" className="text-blue-600 underline mt-4 inline-block">Back to Admin</a>
    </div>
  );

  return (
    <div className="p-8" style={{borderTop: `4px solid ${shop.themeColor}`}}>
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {shop.logo && <img src={shop.logo} className="w-16 h-16 rounded-2xl object-cover" />}
          <div>
            <h1 className="text-3xl font-bold" style={{color: shop.themeColor}}>{shop.name}</h1>
            <p className="text-gray-600 italic">{shop.slogan}</p>
          </div>
        <a href={`/store/${store}/settings`} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200">
          <Settings className="w-5 h-5" /> Settings
        </a>
      </div>

      <p className="text-gray-600 mb-8">Offline Mode - Data saved in Browser</p>
      <div className="grid grid-cols-4 gap-4">
        <a href={`/store/${store}/sales`} className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-lg"><p className="text-2xl mb-2">🛒</p><p className="font-bold">POS</p></a>
        <a href={`/store/${store}/inventory`} className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-lg"><p className="text-2xl mb-2">📦</p><p className="font-bold">Stock</p></a>
        <a href={`/store/${store}/customers`} className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-lg"><p className="text-2xl mb-2">👥</p><p className="font-bold">Customers</p></a>
        <a href={`/store/${store}/reports`} className="bg-white p-6 rounded-2xl shadow text-center hover:shadow-lg"><p className="text-2xl mb-2">📊</p><p className="font-bold">Reports</p></a>
      </div>
    </div>
  );
}
