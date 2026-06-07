"use client"
import { getCustomers, saveCustomer, deleteCustomer, getBills, savePayment, getPayments, getOrders, saveOrder } from '@/lib/db-firebase'
import { Auth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'react-qr-code'

export const dynamic = 'force-dynamic'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showQRCard, setShowQRCard] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '', date: '' })
  const [shopId, setShopId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setPaymentForm(prev => ({...prev, date: new Date().toISOString().split('T')[0] }))
    const user = Auth.getCurrentUser()
    if (!user?.shopId) {
      alert('Login nahi ho. Pehle login karo')
      router.push('/login')
      return
    }
    setShopId(user.shopId)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [custData, billsData, paymentsData, ordersData] = await Promise.all([
        getCustomers(),
        getBills(),
        getPayments(),
        getOrders()
      ])
      setCustomers(custData || [])
      setBills(billsData || [])
      setPayments(paymentsData || [])
      setOrders(ordersData || [])
    } catch (err: any) {
      console.error(err)
      alert('Data load error: ' + err.message)
    }
  }

  const addCustomer = async () => {
    if(!form.name ||!form.phone) return alert('Name and Phone are required')
    if (!shopId) return alert('Login nahi ho')

    const customerId = `CUST_${crypto.randomUUID()}`
    const baseUrl = typeof window!== 'undefined'? window.location.origin : ''
    const newCustomer = {
      id: customerId,
   ...form,
      createdAt: new Date().toISOString(),
      shopQR: customerId,
      customerQR: `${baseUrl}/customers/${customerId}`,
      blocked: false
    }

    try {
      await saveCustomer(newCustomer)
      await loadData()
      setForm({ name: '', phone: '', address: '' })
      setShowForm(false)
    } catch (err: any) {
      alert('Save failed: ' + err.message)
    }
  }

  const deleteCustomerHandler = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return alert('Customer not found')

    const udhaar = getCustomerUdhaar(customer)
    if (udhaar > 0) {
      return alert('Clear outstanding balance first. This customer has Rs.' + udhaar.toFixed(0) + ' pending.')
    }

    if (!confirm('Delete customer? All bills, payments and orders will be deleted permanently.')) return

    try {
      await deleteCustomer(customerId)
      await loadData()
      alert('Customer deleted successfully')
    } catch (err: any) {
      alert('Delete failed: ' + err.message)
    }
  }

  const toggleBlockCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    const action = customer.blocked? 'Unblock' : 'Block'
    if (!confirm(`${action} ${customer.name}?`)) return

    try {
      const updated = {...customer, blocked:!customer.blocked}
      await saveCustomer(updated)
      await loadData()
      alert(`Customer ${customer.blocked? 'unblocked' : 'blocked'} successfully`)
    } catch (err: any) {
      alert('Update failed: ' + err.message)
    }
  }

  const getCustomerUdhaar = (customer: any) => {
    if (!customer) return 0
    const customerBills = bills.filter((b: any) => b.customerPhone === customer.phone || b.customerId === customer.id)
    const totalBilled = customerBills.reduce((sum: number, b: any) => sum + (b.total || 0), 0)
    const totalPaid = payments.filter((p: any) => (p.customerPhone === customer.phone || p.customerId === customer.id) && p.status === 'approved')
   .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    return totalBilled - totalPaid
  }

  const getCustomerHistory = (customer: any) => {
    return bills.filter(b => b.customerPhone === customer.phone || b.customerId === customer.id)
   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 5)
  }

  const getLastBillDate = (customer: any) => {
    const customerBills = bills.filter(b => b.customerPhone === customer.phone || b.customerId === customer.id)
    if (customerBills.length === 0) return 'No bills'
    const last = customerBills.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return new Date(last.date).toLocaleDateString('en-US')
  }

  const getDueDays = (customer: any) => {
    const customerBills = bills.filter(b => (b.customerPhone === customer.phone || b.customerId === customer.id) && b.paymentMethod === 'udhaar')
    if (customerBills.length === 0) return 0
    const oldest = customerBills.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    const diff = Math.floor((new Date().getTime() - new Date(oldest.date).getTime()) / (1000*60*60*24))
    return diff
  }

  const printQRCard = (customer: any) => {
    setSelectedCustomer(customer)
    setShowQRCard(true)
    setTimeout(() => {
      window.print()
      setShowQRCard(false)
    }, 500)
  }

  const openCustomerPortal = (customer: any) => {
    if (customer.blocked) {
      return alert('This customer is blocked. Unblock first to access portal.')
    }
    router.push(`/customers/${customer.id}`)
  }

  const receivePayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return alert('Enter valid amount')

    const amount = parseFloat(paymentForm.amount)
    const newPayment = {
      id: crypto.randomUUID(),
      customerId: selectedCustomer.id,
      customerPhone: selectedCustomer.phone,
      customerName: selectedCustomer.name,
      amount,
      note: paymentForm.note,
      date: paymentForm.date,
      status: 'approved'
    }

    try {
      await savePayment(newPayment)
      await loadData()
      setPaymentForm({ amount: '', note: '', date: new Date().toISOString().split('T')[0] })
      setShowPaymentModal(false)
      alert(`Rs. ${amount} received`)
    } catch (err: any) {
      alert('Payment save failed: ' + err.message)
    }
  }

  const approveOrder = async (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId)
    if (!order) return

    try {
      await saveOrder({...order, status: 'approved'})
      alert('Order approved!')
      await loadData()
    } catch (err: any) {
      alert('Approve failed: ' + err.message)
    }
  }

  const approvePayment = async (paymentId: string) => {
    const payment = payments.find((p: any) => p.id === paymentId)
    if (!payment) return

    try {
      await savePayment({...payment, status: 'approved'})
      alert('Payment approved! Balance updated.')
      await loadData()
    } catch (err: any) {
      alert('Approve failed: ' + err.message)
    }
  }

  const rejectPayment = async (paymentId: string) => {
    const payment = payments.find((p: any) => p.id === paymentId)
    if (!payment) return

    try {
      await savePayment({...payment, status: 'rejected'})
      alert('Payment rejected')
      await loadData()
    } catch (err: any) {
      alert('Reject failed: ' + err.message)
    }
  }

  const pendingOrders = orders.filter((o: any) => o.status === 'pending')
  const pendingPayments = payments.filter((p: any) => p.status === 'pending')

  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
       .qr-card,.qr-card * { visibility: visible; }
       .qr-card { position: absolute; left: 0; top: 0; width: 100%; }
       .no-print { display: none!important; }
        }
        @media screen {
       .qr-card {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-6 no-print">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Double QR Ledger System</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">← Dashboard</Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700"
              >
                {showForm? 'Cancel' : '+ New Customer'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
              <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  value={form.name}
                  onChange={e=>setForm({...form, name: e.target.value})}
                  placeholder="Customer Name"
                  className="border p-2 rounded"
                />
                <input
                  value={form.phone}
                  onChange={e=>setForm({...form, phone: e.target.value})}
                  placeholder="Phone Number"
                  className="border p-2 rounded"
                />
                <input
                  value={form.address}
                  onChange={e=>setForm({...form, address: e.target.value})}
                  placeholder="Address"
                  className="border p-2 rounded"
                />
              </div>
              <button
                onClick={addCustomer}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Save Customer
              </button>
            </div>
          )}

          {pendingOrders.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-lg">
              <h2 className="text-lg font-bold text-orange-800 mb-3">📦 {pendingOrders.length} Pending Orders</h2>
              {pendingOrders.map((order: any) => (
                <div key={order.id} className="bg-white p-3 rounded mb-2 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{order.customerName} - {order.customerPhone}</p>
                      <p className="text-xs text-gray-600">{new Date(order.date).toLocaleString()}</p>
                      <p className="text-sm mt-1">Items: {order.items.map((i:any)=>`${i.name} x${i.qty}`).join(', ')}</p>
                      <p className="font-bold text-green-600">Total: Rs.{order.total}</p>
                    </div>
                    <button onClick={()=>approveOrder(order.id)} className="bg-green-500 text-white px-4 py-2 rounded font-semibold text-sm">✓ Approve</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingPayments.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
              <h2 className="text-lg font-bold text-yellow-800 mb-3">⚠️ {pendingPayments.length} Pending Payments</h2>
              {pendingPayments.map((payment: any) => (
                <div key={payment.id} className="bg-white p-3 rounded mb-2 border">
                  <p className="font-bold">{payment.customerName} - {payment.customerPhone}</p>
                  <p className="text-sm">Bill: #{payment.billId?.slice(-6)} | Bill Amount: Rs.{payment.billAmount}</p>
                  <p className="text-sm">Paid via: {payment.paymentMethod} | From: {payment.senderName}</p>
                  <p className="font-bold text-green-600">Amount Sent: Rs.{payment.amount}</p>
                  {payment.screenshot && <img src={payment.screenshot} className="w-20 h-20 object-cover rounded mt-2" />}
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>approvePayment(payment.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">✓ Approve</button>
                    <button onClick={()=>rejectPayment(payment.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">✗ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.length === 0? (
              <div className="col-span-full bg-white p-8 rounded-xl shadow-sm border text-center text-gray-500">
                No customers found. Click "New Customer" to add.
              </div>
            ) : customers.map((c: any) => {
              const udhaar = getCustomerUdhaar(c)
              const dueDays = getDueDays(c)
              const lastBill = getLastBillDate(c)

              return (
                <div key={c.id} className={`bg-white p-5 rounded-xl shadow-sm border ${c.blocked? 'opacity-60 bg-red-50' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {c.name}
                        {c.blocked && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">BLOCKED</span>}
                      </h3>
                      <p className="text-sm text-gray-600">{c.phone}</p>
                      <p className="text-xs text-gray-400">ID: {c.id}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <button
                        onClick={() => printQRCard(c)}
                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold hover:bg-purple-200"
                        title="Print Double QR"
                      >
                        📱
                      </button>
                      <button
                        onClick={() => openCustomerPortal(c)}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold hover:bg-blue-200 disabled:opacity-50"
                        title="Open Portal"
                        disabled={c.blocked}
                      >
                        🔗
                      </button>
                      <button
                        onClick={() => toggleBlockCustomer(c.id)}
                        className={`${c.blocked? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} px-2 py-1 rounded text-xs font-semibold hover:opacity-80`}
                        title={c.blocked? 'Unblock Customer' : 'Block Customer'}
                      >
                        {c.blocked? '✓' : '🚫'}
                      </button>
                      <button
                        onClick={() => deleteCustomerHandler(c.id)}
                        className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold hover:bg-red-200"
                        title="Delete Customer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-xs text-gray-600">Total Balance</p>
                    <p className={`text-2xl font-bold ${udhaar > 0? 'text-red-600' : 'text-green-600'}`}>
                      Rs.{udhaar.toFixed(0)}
                    </p>
                    {udhaar > 0 && <p className="text-xs text-red-500 mt-1">Due: {dueDays} days | Last: {lastBill}</p>}
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <p>✓ Shop QR: For Billing</p>
                    <p>✓ Customer QR: Ledger + Payment</p>
                  </div>

                  <details className="text-xs mb-3">
                    <summary className="cursor-pointer text-blue-600 font-semibold">View History</summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {getCustomerHistory(c).length === 0? (
                        <p className="text-gray-400">No bills</p>
                      ) : (
                        getCustomerHistory(c).map(bill => (
                          <div key={bill.id} className="text-gray-600 border-l-2 border-gray-200 pl-2">
                            {new Date(bill.date).toLocaleDateString('en-US')} - Rs.{bill.total.toFixed(0)}
                          </div>
                        ))
                      )}
                    </div>
                  </details>

                  <button
                    onClick={() => { setSelectedCustomer(c); setShowPaymentModal(true); }}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:bg-gray-300"
                    disabled={udhaar <= 0 || c.blocked}
                  >
                    💰 Receive Payment
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showQRCard && selectedCustomer && (
        <div className="qr-card" onClick={() => setShowQRCard(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
            <div style={{ width: '85mm', height: '54mm', border: '2px solid #000', padding: '3mm', display: 'flex', background: '#fff' }}>
              <div style={{ width: '50%', borderRight: '1px dashed #666', paddingRight: '3mm', textAlign: 'center' }}>
                <p style={{ fontSize: '7pt', fontWeight: 'bold', margin: '0' }}>FOR SHOP</p>
                <div style={{ background: 'white', padding: '2mm', display: 'inline-block', margin: '1mm 0' }}>
                  <QRCode
                    value={selectedCustomer.shopQR}
                    size={100}
                    style={{ height: "28mm", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 100 100`}
                  />
                </div>
                <p style={{ fontSize: '8pt', fontWeight: 'bold', margin: '1mm 0 0 0' }}>
                  {selectedCustomer.name}
                </p>
                <p style={{ fontSize: '7pt', margin: '0' }}>{selectedCustomer.phone}</p>
                <p style={{ fontSize: '6pt', margin: '1mm 0 0 0', color: '#666' }}>Scan for billing</p>
              </div>

              <div style={{ width: '50%', paddingLeft: '3mm', textAlign: 'center' }}>
                <p style={{ fontSize: '7pt', fontWeight: 'bold', margin: '0' }}>FOR CUSTOMER</p>
                <div style={{ background: 'white', padding: '2mm', display: 'inline-block', margin: '1mm 0' }}>
                  <QRCode
                    value={selectedCustomer.customerQR}
                    size={100}
                    style={{ height: "28mm", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 100 100`}
                  />
                </div>
                <p style={{ fontSize: '6pt', margin: '1mm 0 0 0' }}>Scan for Ledger</p>
                <p style={{ fontSize: '6pt', margin: '0' }}>Pay + Order + History</p>
              </div>
            </div>
            <div className="no-print text-center mt-3">
              <button
                onClick={() => {window.print(); setShowQRCard(false);}}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm mr-2"
              >
                Print Card
              </button>
              <button
                onClick={() => setShowQRCard(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white p-6 rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-2">Receive Payment</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">From: <strong>{selectedCustomer.name}</strong></p>
              <p className="text-lg text-red-600 mt-2">Due: <strong>Rs. {getCustomerUdhaar(selectedCustomer).toFixed(0)}</strong></p>
            </div>
            <div className="space-y-3">
              <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="Amount Received *" className="border-2 p-3 rounded-lg w-full text-xl font-bold" />
              <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="border-2 p-3 rounded-lg w-full" />
              <input value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} placeholder="Note - Cash/JazzCash/etc" className="border-2 p-3 rounded-lg w-full" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={receivePayment} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Receive</button>
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
