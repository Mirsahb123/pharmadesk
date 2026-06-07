// lib/storage.ts
import { db, ref, get, set, update } from '@/lib/firebase'
import { auth } from '@/lib/auth'

export type Medicine = {
  id?: string
  name: string
  type: string
  price: number
  qty: number
  expiry: string
  qrCode?: string
  unitsPerStrip?: number
  stripsPerBox?: number
}

export type Bill = {
  id: number
  date: string
  customerName: string
  customerPhone: string
  items: any[]
  subtotal: number
  discount: number
  discountPercent: number
  gstEnabled: boolean
  gstPercent: number
  gstAmount: number
  total: number
  paymentMethod: string
  paidAmount: number
  balance: number
  billNo: string
  printSize: string
}

// SAAS SYSTEM - FIREBASE REALTIME DB
export const DB = {
  getCustomers: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/customers`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  saveCustomers: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/customers`), data)
  },
  
  getBills: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/bills`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  saveBills: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/bills`), data)
  },
  
  // BILL SAVE + STOCK UPDATE
  saveBill: async (billData: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    
    // 1. Save bill
    const billId = Date.now().toString()
    const newBill: Bill = {
    ...billData,
      id: Date.now(),
      date: new Date().toISOString()
    }
    await set(ref(db, `shops/${shopId}/bills/${billId}`), newBill)
    
    // 2. Update inventory stock
    const inventory = await DB.getInventory()
    for (const item of billData.items) {
      const med = inventory.find((m: Medicine) => m.id === item.inventoryId)
      if (med) {
        const totalDeduct = item.totalPieces || item.qty
        const newQty = Math.max(0, med.qty - totalDeduct)
        await update(ref(db, `shops/${shopId}/inventory/${med.id}`), { qty: newQty })
      }
    }
  },
  
  getPayments: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/payments`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  savePayments: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/payments`), data)
  },
  
  getOrders: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/orders`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  saveOrders: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/orders`), data)
  },
  
  getInventory: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/inventory`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  saveInventory: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/inventory`), data)
  },
  
  getShopInfo: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return { name: 'Pharmadesk' }
    const snapshot = await get(ref(db, `shops/${shopId}/shopInfo`))
    return snapshot.exists()? snapshot.val() : { name: 'Pharmadesk' }
  },
  saveShopInfo: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/shopInfo`), data)
  },
  
  getPaymentMethods: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/paymentMethods`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  savePaymentMethods: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/paymentMethods`), data)
  },
  
  getNotificationSound: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return null
    const snapshot = await get(ref(db, `shops/${shopId}/notificationSound`))
    return snapshot.exists()? snapshot.val() : null
  },
  saveNotificationSound: async (data: string) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/notificationSound`), data)
  },

  getStaff: async () => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return []
    const snapshot = await get(ref(db, `shops/${shopId}/staff`))
    if (snapshot.exists()) {
      const data = snapshot.val()
      return Object.keys(data).map(key => ({ id: key,...data[key] }))
    }
    return []
  },
  saveStaff: async (data: any) => {
    const shopId = auth.getCurrentShopId()
    if (!shopId) return
    await set(ref(db, `shops/${shopId}/staff`), data)
  }
}
