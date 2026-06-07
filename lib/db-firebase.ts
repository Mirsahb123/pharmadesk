import { db } from './firebase'
import { ref, set, get, push, update, remove, query, orderByChild } from 'firebase/database'
import { Auth } from './auth'

export interface Customer {
  id?: string
  name: string
  phone: string
  address?: string
  blocked?: boolean
  createdAt?: number
  updatedAt?: number
}

export interface Medicine {
  id?: string
  name: string
  type: string
  price: number
  qty: number
  tabletsPerPacket?: number
  qrCode?: string
  barcode?: string
  expiry?: string
  createdAt?: number
  updatedAt?: number
}

export interface Bill {
  id?: string
  customerId?: string
  customerName?: string
  total: number
  paidAmount?: number
  balance?: number
  status?: 'pending' | 'paid'
  items?: unknown[]
  createdAt?: number
  date?: string
  updatedAt?: number
}

export interface Payment {
  id?: string
  customerId?: string
  billId?: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  paymentMethod?: string
  createdAt?: number
  updatedAt?: number
}

export interface Order {
  id?: string
  customerId?: string
  items?: unknown[]
  status?: 'pending' | 'completed' | 'cancelled'
  createdAt?: number
  date?: string
}

// CUSTOMERS
export const saveCustomer = async (customer: Customer): Promise<Customer> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const customerRef = customer.id
    ? ref(db, `shops/${user.shopId}/customers/${customer.id}`)
    : push(ref(db, `shops/${user.shopId}/customers`))

  const customerData: Customer = {
    ...customer,
    id: customer.id || customerRef.key!,
    createdAt: customer.createdAt || Date.now(),
    updatedAt: Date.now()
  }

  await set(customerRef, customerData)
  return customerData
}

export const getCustomers = async (): Promise<Customer[]> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) return []

  const customersRef = query(
    ref(db, `shops/${user.shopId}/customers`),
    orderByChild('createdAt')
  )
  const snapshot = await get(customersRef)
  if (!snapshot.exists()) return []
  
  const data = snapshot.val()
  return Object.values(data).reverse() as Customer[]
}

export const deleteCustomer = async (id: string): Promise<void> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const customerRef = ref(db, `shops/${user.shopId}/customers/${id}`)
  await remove(customerRef)

  const [bills, payments, orders] = await Promise.all([getBills(), getPayments(), getOrders()])

  for (const bill of bills.filter((b) => b.customerId === id)) {
    if (bill.id) await remove(ref(db, `shops/${user.shopId}/bills/${bill.id}`))
  }
  for (const payment of payments.filter((p) => p.customerId === id)) {
    if (payment.id) await remove(ref(db, `shops/${user.shopId}/payments/${payment.id}`))
  }
  for (const order of orders.filter((o) => o.customerId === id)) {
    if (order.id) await remove(ref(db, `shops/${user.shopId}/orders/${order.id}`))
  }
}

export const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<void> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const customerRef = ref(db, `shops/${user.shopId}/customers/${id}`)
  await update(customerRef, {
    ...customer,
    updatedAt: Date.now()
  })
}

// BILLS
export const getBills = async (): Promise<Bill[]> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) return []

  const billsRef = query(
    ref(db, `shops/${user.shopId}/bills`),
    orderByChild('createdAt')
  )
  const snapshot = await get(billsRef)
  if (!snapshot.exists()) return []
  
  const data = snapshot.val()
  return Object.values(data).reverse() as Bill[]
}

export const saveBill = async (bill: Bill): Promise<Bill> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const billRef = push(ref(db, `shops/${user.shopId}/bills`))
  const billData: Bill = {
    ...bill,
    id: billRef.key!,
    createdAt: Date.now(),
    date: bill.date || new Date().toISOString()
  }

  await set(billRef, billData)
  return billData
}

// PAYMENTS
export const getPayments = async (): Promise<Payment[]> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) return []

  const paymentsRef = query(
    ref(db, `shops/${user.shopId}/payments`),
    orderByChild('createdAt')
  )
  const snapshot = await get(paymentsRef)
  if (!snapshot.exists()) return []
  
  const data = snapshot.val()
  return Object.values(data).reverse() as Payment[]
}

export const savePayment = async (payment: Payment): Promise<Payment> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const paymentRef = payment.id 
    ? ref(db, `shops/${user.shopId}/payments/${payment.id}`)
    : push(ref(db, `shops/${user.shopId}/payments`))

  const paymentData: Payment = {
    ...payment,
    id: payment.id || paymentRef.key!,
    createdAt: payment.createdAt || Date.now(),
    updatedAt: Date.now()
  }

  await set(paymentRef, paymentData)

  if (paymentData.status === 'approved' && paymentData.billId) {
    const billRef = ref(db, `shops/${user.shopId}/bills/${paymentData.billId}`)
    const billSnap = await get(billRef)

    if (billSnap.exists()) {
      const bill = billSnap.val() as Bill
      const allPayments = await getPayments()
      const totalPaid = allPayments
        .filter((p) => p.billId === paymentData.billId && p.status === 'approved')
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      await update(billRef, {
        paidAmount: totalPaid,
        balance: bill.total - totalPaid,
        status: totalPaid >= bill.total ? 'paid' : 'pending',
        updatedAt: Date.now()
      })
    }
  }

  return paymentData
}

export const updatePaymentStatus = async (id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const paymentRef = ref(db, `shops/${user.shopId}/payments/${id}`)
  await update(paymentRef, {
    status,
    updatedAt: Date.now()
  })

  const paymentSnap = await get(paymentRef)
  if (paymentSnap.exists()) {
    const payment = paymentSnap.val() as Payment
    if (payment.billId) {
      const allPayments = await getPayments()
      const billRef = ref(db, `shops/${user.shopId}/bills/${payment.billId}`)
      const billSnap = await get(billRef)
      
      if (billSnap.exists()) {
        const bill = billSnap.val() as Bill
        const totalPaid = allPayments
          .filter((p) => p.billId === payment.billId && p.status === 'approved')
          .reduce((sum, p) => sum + (p.amount || 0), 0)

        await update(billRef, {
          paidAmount: totalPaid,
          balance: bill.total - totalPaid,
          status: totalPaid >= bill.total ? 'paid' : 'pending',
          updatedAt: Date.now()
        })
      }
    }
  }
}

// INVENTORY
export const getInventory = async (): Promise<Medicine[]> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) return []

  const inventoryRef = query(
    ref(db, `shops/${user.shopId}/inventory`),
    orderByChild('createdAt')
  )
  const snapshot = await get(inventoryRef)
  if (!snapshot.exists()) return []
  
  const data = snapshot.val()
  return Object.values(data).reverse() as Medicine[]
}

export const saveInventory = async (medicines: Medicine[]): Promise<void> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const updates: Record<string, Medicine> = {}
  medicines.forEach((med) => {
    if (med.id) {
      updates[`shops/${user.shopId}/inventory/${med.id}`] = {
        ...med,
        updatedAt: Date.now()
      }
    }
  })
  
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates)
  }
}

export const saveMedicine = async (medicine: Medicine): Promise<Medicine> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const medicineRef = medicine.id
    ? ref(db, `shops/${user.shopId}/inventory/${medicine.id}`)
    : push(ref(db, `shops/${user.shopId}/inventory`))

  const medicineData: Medicine = {
    ...medicine,
    id: medicine.id || medicineRef.key!,
    createdAt: medicine.createdAt || Date.now(),
    updatedAt: Date.now()
  }

  await set(medicineRef, medicineData)
  return medicineData
}

export const addMedicine = async (medicine: Medicine): Promise<Medicine> => {
  return saveMedicine(medicine)
}

export const updateMedicine = async (id: string, medicine: Partial<Medicine>): Promise<void> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const medicineRef = ref(db, `shops/${user.shopId}/inventory/${id}`)
  await update(medicineRef, {
    ...medicine,
    updatedAt: Date.now()
  })
}

export const deleteMedicine = async (id: string): Promise<void> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const medicineRef = ref(db, `shops/${user.shopId}/inventory/${id}`)
  await remove(medicineRef)
}

// ORDERS
export const getOrders = async (): Promise<Order[]> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) return []

  const ordersRef = query(
    ref(db, `shops/${user.shopId}/orders`),
    orderByChild('createdAt')
  )
  const snapshot = await get(ordersRef)
  if (!snapshot.exists()) return []
  
  const data = snapshot.val()
  return Object.values(data).reverse() as Order[]
}

export const saveOrder = async (order: Order): Promise<Order> => {
  const user = Auth.getCurrentUser()
  if (!user?.shopId) throw new Error('Not logged in')

  const orderRef = push(ref(db, `shops/${user.shopId}/orders`))
  const orderData: Order = {
    ...order,
    id: orderRef.key!,
    createdAt: Date.now(),
    date: order.date || new Date().toISOString(),
    status: order.status || 'pending'
  }

  await set(orderRef, orderData)
  return orderData
}
