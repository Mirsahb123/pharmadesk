"use client";
import { use, useEffect, useState } from "react";
import { DB, Shop, Product } from "@/lib/storage";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";

export default function SalesPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const foundShop = DB.shops.find(store);
    setShop(foundShop || null);
    setProducts(DB.products.getByShop(store));
  }, [store]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
      ? {...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, {...product, qty: 1 }]);
    }
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.id!== id));
    } else {
      setCart(cart.map(item =>
        item.id === id? {...item, qty } : item
      ));
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (!shop) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <a href={`/store/${store}/dashboard`} className="p-2 hover:bg-gray-200 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </a>
          <div>
            <h1 className="text-3xl font-bold" style={{color: shop.themeColor}}>POS - {shop.name}</h1>
            <p className="text-gray-600">Point of Sale</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <h2 className="font-bold text-xl mb-4">Products</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {products.length === 0? (
                <p className="text-gray-500 text-center py-8">No products. Add from Inventory</p>
              ) : products.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 border-2 rounded-xl hover:border-blue-300">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-sm text-gray-600">₹{p.price} | Stock: {p.stock}</p>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="px-4 py-2 rounded-lg text-white font-bold disabled:opacity-50"
                    style={{backgroundColor: shop.themeColor}}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <h2 className="font-bold text-xl mb-4">Cart ({cart.length})</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
              {cart.length === 0? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-gray-600">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 bg-gray-200 rounded">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 bg-gray-200 rounded">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateQty(item.id, 0)} className="p-1 bg-red-100 text-red-600 rounded ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 pt-4">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total:</span>
                <span style={{color: shop.themeColor}}>₹{total.toFixed(2)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                className="w-full py-4 rounded-xl text-white font-black text-lg disabled:opacity-50"
                style={{backgroundColor: shop.themeColor}}
                onClick={() => {
                  alert('Sale completed! ₹' + total.toFixed(2));
                  setCart([]);
                }}
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
