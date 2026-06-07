"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PurchasePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])

  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '' })
  const [showSupplierModal, setShowSupplierModal] = useState(false)

  const [purchase, setPurchase] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    items: [] as any[],
    total: 0,
    paid: 0,
    due: 0
  })

  const [itemForm, setItemForm] = useState({
    medicineId: '',
    name: '',
    batchNo: '',
    expiry: '',
    costPrice: '',
    salePrice: '',
    qty: ''
  })

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (!user) return router.push('/login')
    setCurrentUser(JSON.parse(user))

    setInventory(JSON.parse(localStorage.getItem('inventory') || '[]'))
    setSuppliers(JSON.parse(localStorage.getItem('suppliers') || '[]'))
    setPurchases(JSON.parse(localStorage.getItem('purchases') || '[]'))
  }, [router])

  const addSupplier = () => {
    if (!supplierForm.name) return alert('Supplier name zaroori hai')
    const newSupplier = { id: Date.now(),...supplierForm, balance: 0 }
    const updated = [...suppliers, newSupplier]
    localStorage.setItem('suppliers', JSON.stringify(updated))
    setSuppliers(updated)
    setSupplierForm({ name: '', phone: '', address: '' })
    setShowSupplierModal(false)
    setPurchase({...purchase, supplierId: newSupplier.id})
  }

  const addItemToPurchase = () => {
    if (!itemForm.name ||!itemForm.qty ||!itemForm.costPrice) {
      return alert('Medicine, Qty aur Cost Price zaroori hai')
    }

    const itemTotal = parseFloat(itemForm.qty) * parseFloat(itemForm.costPrice)
    const newItem = {
      id: Date.now(),
     ...itemForm,
      costPrice: parseFloat(itemForm.costPrice),
      salePrice: parseFloat(itemForm.salePrice) || parseFloat(itemForm.costPrice) * 1.2,
      qty: parseInt(itemForm.qty),
      total: itemTotal
    }

    const updatedItems = [...purchase.items, newItem]
    const newTotal = updatedItems.reduce((sum, i) => sum + i.total, 0)

    setPurchase({
     ...purchase,
      items: updatedItems,
      total: newTotal,
      due: newTotal - purchase.paid
    })

    setItemForm({ medicineId: '', name: '', batchNo: '', expiry: '', costPrice: '', salePrice: '', qty: '' })
  }

  const removeItem = (id: number) => {
    const updatedItems = purchase.items.filter(i => i.id!== id)
    const newTotal = updatedItems.reduce((sum, i) => sum + i.total, 0)
    setPurchase({...purchase, items: updatedItems, total: newTotal, due: newTotal - purchase.paid })
  }

  const savePurchase = () => {
    if (!purchase.supplierId) return alert('Supplier select karo')
    if (!purchase.invoiceNo) return alert('Invoice No. likho')
    if (purchase.items.length === 0) return alert('Kam se kam 1 item add karo')

    // 1. Save purchase
    const newPurchase = { id: Date.now(),...purchase }
    const updatedPurchases = [...purchases, newPurchase]
    localStorage.setItem('purchases', JSON.stringify(updatedPurchases))
    setPurchases(updatedPurchases)

    // 2. Update inventory stock
    let updatedInventory = [...inventory]
    purchase.items.forEach(pItem => {
      const existingIndex = updatedInventory.findIndex(m =>
        m.name.toLowerCase() === pItem.name.toLowerCase()
      )

      if (existingIndex >= 0) {
        // Existing medicine - add batch
        if (!updatedInventory[existingIndex].batches) updatedInventory[existingIndex].batches = []
        updatedInventory[existingIndex].batches.push({
          id: Date.now() + Math.random(),
          batchNo: pItem.batchNo || 'N/A',
          qty: pItem.qty,
          expiry: pItem.expiry,
          costPrice: pItem.costPrice
        })
        updatedInventory[existingIndex].price = pItem.salePrice // Update sale price
      } else {
        // New medicine - create with batch
        updatedInventory.push({
          id: Date.now() + Math.random(),
          name: pItem.name,
          type: 'Tablet',
          price: pItem.salePrice,
          costPrice: pItem.costPrice,
          qr: `MED-${Date.now()}`,
          batches: [{
            id: Date.now(),
            batchNo: pItem.batchNo || 'N/A',
            qty: pItem.qty,
            expiry: pItem.expiry,
            costPrice: pItem.costPrice
          }]
        })
      }
    })
    localStorage.setItem('inventory', JSON.stringify(updatedInventory))
    setInventory(updatedInventory)

    // 3. Update supplier balance
    const updatedSuppliers = suppliers.map(s =>
      s.id === purchase.supplierId
       ? {...s, balance: (s.balance || 0) + purchase.due }
        : s
    )
    localStorage.setItem('suppliers', JSON.stringify(updatedSuppliers))
    setSuppliers(updatedSuppliers)

    alert(`Purchase save ho gaya!\nTotal: Rs. ${purchase.total}\nDue: Rs. ${purchase.due}\nStock update ho gaya`)

    // Reset form
    setPurchase({
      invoiceNo: '',
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      items: [],
      total: 0,
      paid: 0,
      due: 0
    })
  }

  if (!currentUser) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">📦 Purchase / Stock In</h1>
          <Link href="/dashboard" className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700">
            ← Dashboard
          </Link>
        </div>

        {/* Invoice Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <input
              value={purchase.invoiceNo}
              onChange={e => setPurchase({...purchase, invoiceNo: e.target.value})}
              placeholder="Invoice No. *"
              className="border-2 p-3 rounded-lg"
            />
            <input
              type="date"
              value={purchase.date}
              onChange={e => setPurchase({...purchase, date: e.target.value})}
              className="border-2 p-3 rounded-lg"
            />
            <select
              value={purchase.supplierId}
              onChange={e => setPurchase({...purchase, supplierId: e.target.value})}
              className="border-2 p-3 rounded-lg"
            >
              <option value="">Select Supplier *</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
              ))}
            </select>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              + New Supplier
            </button>
          </div>
        </div>

        {/* Add Item */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <h2 className="text-xl font-bold mb-4">Add Item</h2>
          <div className="grid md:grid-cols-7 gap-3">
            <input
              value={itemForm.name}
              onChange={e => setItemForm({...itemForm, name: e.target.value})}
              placeholder="Medicine Name *"
              className="border-2 p-3 rounded-lg col-span-2"
            />
            <input
              value={itemForm.batchNo}
              onChange={e => setItemForm({...itemForm, batchNo: e.target.value})}
              placeholder="Batch No."
              className="border-2 p-3 rounded-lg"
            />
            <input
              type="date"
              value={itemForm.expiry}
              onChange={e => setItemForm({...itemForm, expiry: e.target.value})}
              className="border-2 p-3 rounded-lg"
            />
            <input
              type="number"
              value={itemForm.costPrice}
              onChange={e => setItemForm({...itemForm, costPrice: e.target.value})}
              placeholder="Cost Price *"
              className="border-2 p-3 rounded-lg"
            />
            <input
              type="number"
              value={itemForm.salePrice}
              onChange={e => setItemForm({...itemForm, salePrice: e.target.value})}
              placeholder="Sale Price"
              className="border-2 p-3 rounded-lg"
            />
            <input
              type="number"
              value={itemForm.qty}
              onChange={e => setItemForm({...itemForm, qty: e.target.value})}
              placeholder="Qty *"
              className="border-2 p-3 rounded-lg"
            />
          </div>
          <button
            onClick={addItemToPurchase}
            className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            + Add to Purchase
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-4 font-bold">Medicine</th>
                <th className="text-left p-4 font-bold">Batch</th>
                <th className="text-left p-4 font-bold">Expiry</th>
                <th className="text-left p-4 font-bold">Cost</th>
                <th className="text-left p-4 font-bold">Sale</th>
                <th className="text-left p-4 font-bold">Qty</th>
                <th className="text-left p-4 font-bold">Total</th>
                <th className="text-left p-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map(item => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-semibold">{item.name}</td>
                  <td className="p-4">{item.batchNo || 'N/A'}</td>
                  <td className="p-4">{item.expiry || 'N/A'}</td>
                  <td className="p-4">Rs. {item.costPrice}</td>
                  <td className="p-4">Rs. {item.salePrice}</td>
                  <td className="p-4">{item.qty}</td>
                  <td className="p-4 font-bold">Rs. {item.total}</td>
                  <td className="p-4">
                    <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800 font-semibold">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchase.items.length === 0 && (
            <div className="p-8 text-center text-gray-500">No items added yet</div>
          )}
        </div>

        {/* Total & Save */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-3xl font-black text-gray-900">Rs. {purchase.total.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid Amount</p>
              <input
                type="number"
                value={purchase.paid}
                onChange={e => setPurchase({...purchase, paid: parseFloat(e.target.value) || 0, due: purchase.total - (parseFloat(e.target.value) || 0)})}
                className="border-2 p-3 rounded-lg w-full text-xl font-bold"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Amount</p>
              <p className="text-3xl font-black text-red-600">Rs. {purchase.due.toFixed(0)}</p>
            </div>
          </div>
          <button
            onClick={savePurchase}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700"
          >
            Save Purchase & Update Stock
          </button>
        </div>

        {/* Add Supplier Modal */}
        {showSupplierModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupplierModal(false)}>
            <div className="bg-white p-6 rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-bold mb-4">Add New Supplier</h3>
              <div className="space-y-3">
                <input
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({...supplierForm, name: e.target.value})}
                  placeholder="Supplier Name *"
                  className="border-2 p-3 rounded-lg w-full"
                />
                <input
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})}
                  placeholder="Phone Number"
                  className="border-2 p-3 rounded-lg w-full"
                />
                <input
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({...supplierForm, address: e.target.value})}
                  placeholder="Address"
                  className="border-2 p-3 rounded-lg w-full"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={addSupplier} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
                  Save Supplier
                </button>
                <button onClick={() => setShowSupplierModal(false)} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
