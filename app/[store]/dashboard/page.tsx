"use client";
import { use, useEffect, useState } from "react";
import { DB, Shop } from "@/lib/storage";
import { ArrowLeft, BarChart3, Package, ShoppingCart, Users, Receipt } from "lucide-react";

export default function DashboardPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    sales: 0,
    customers: 0
  });

  useEffect(() => {
    const foundShop = DB.shops.find(store);
    setShop(foundShop || null);

    if (foundShop) {
      const products = DB.products.getByShop(store);
      const lowStockItems = products.filter(p => p.stock < 10);

      setStats({
        products: products.length,
        lowStock: lowStockItems.length,
        sales: 0,
        customers: 0
      });
    }
  }, [store]);

  if (!shop) return <div className="p-8 text-center">Loading...</div>;

  const menuItems = [
    {
      icon: ShoppingCart,
      title: "POS",
      desc: "Point of Sale",
      href: `/store/${store}/sales`,
      color: "bg-blue-500"
    },
    {
      icon: Package,
      title: "Inventory",
      desc: "Manage Stock",
      href: `/store/${store}/inventory`,
      color: "bg-green-500"
    },
    {
      icon: Users,
      title: "Customers",
      desc: "Customer Data",
      href: `/store/${store}/customers`,
      color: "bg-purple-500"
    },
    {
      icon: Receipt,
      title: "Reports",
      desc: "Sales Reports",
      href: `/store/${store}/reports`,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="p-2 hover:bg-gray-200 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </a>
          <div>
            <h1 className="text-3xl font-bold" style={{color: shop.themeColor}}>{shop.name}</h1>
            <p className="text-gray-600">Store Dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-medium">Total Products</p>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-black" style={{color: shop.themeColor}}>{stats.products}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-medium">Low Stock</p>
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-3xl font-black text-red-500">{stats.lowStock}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-medium">Today Sales</p>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-black text-green-500">₹{stats.sales}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-medium">Customers</p>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-black text-purple-500">{stats.customers}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
            >
              <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
