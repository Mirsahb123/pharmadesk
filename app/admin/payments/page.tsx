"use client";
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Auth } from '@/lib/auth';
import { db, ref, get, update } from '@/lib/firebase';
import { CreditCard, Check, X, User, Calendar } from 'lucide-react';

type Payment = {
  id: string;
  customerName?: string;
  senderName?: string;
  customerPhone?: string;
  billId?: string;
  paymentMethod?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const shopId = Auth.getCurrentShopId();
      if (!shopId) return;

      const paymentsRef = ref(db, `shops/${shopId}/payments`);
      const snap = await get(paymentsRef);

      if (snap.exists()) {
        const data = snap.val();
        const allPayments = Object.keys(data).map(key => ({ id: key,...data[key] }));
        setPayments(allPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Payments load failed');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId: string) => {
    try {
      const shopId = Auth.getCurrentShopId();
      if (!shopId) return;

      const paymentRef = ref(db, `shops/${shopId}/payments/${paymentId}`);
      await update(paymentRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      const payment = payments.find((p) => p.id === paymentId);
      if (payment?.billId) {
        const billRef = ref(db, `shops/${shopId}/bills/${payment.billId}`);
        const billSnap = await get(billRef);

        if (billSnap.exists()) {
          const bill = billSnap.val();
          const paymentsSnap = await get(ref(db, `shops/${shopId}/payments`));
          let totalPaid = 0;

          if (paymentsSnap.exists()) {
            const allPayments = paymentsSnap.val();
            Object.keys(allPayments).forEach(key => {
              const p = allPayments[key];
              if (p.billId === payment.billId && (p.status === 'approved' || key === paymentId)) {
                totalPaid += p.amount;
              }
            });
          }

          await update(billRef, {
            paidAmount: totalPaid,
            balance: bill.total - totalPaid,
            status: totalPaid >= bill.total? 'paid' : 'pending'
          });
        }
      }

      await loadPayments();
      toast.success('Payment approved!');
    } catch (error) {
      toast.error('Approve failed');
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      const shopId = Auth.getCurrentShopId();
      if (!shopId) return;

      const paymentRef = ref(db, `shops/${shopId}/payments/${paymentId}`);
      await update(paymentRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });

      await loadPayments();
      toast.error('Payment rejected');
    } catch (error) {
      toast.error('Reject failed');
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const approvedTotal = payments.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">

        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 mb-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Payment Approvals
          </h1>
          <p className="text-gray-600 mt-2">Total Approved: Rs. {approvedTotal}</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6">
          <h3 className="text-2xl font-black mb-6">Pending Payments ({pendingPayments.length})</h3>

          {pendingPayments.length === 0? (
            <div className="text-center py-12">
              <p className="text-6xl mb-3">✅</p>
              <p className="text-gray-500 font-medium">No pending payments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="border-2 border-gray-100 p-5 rounded-2xl bg-white/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        {payment.customerName || payment.senderName}
                      </p>
                      <p className="text-sm text-gray-600">{payment.customerPhone}</p>
                      <p className="text-sm mt-2">Bill: #{payment.billId?.slice(-6)} | Method: {payment.paymentMethod}</p>
                      <p className="font-bold text-green-600 text-xl mt-1">Rs. {payment.amount}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approvePayment(payment.id)} className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-600 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button onClick={() => rejectPayment(payment.id)} className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-600 flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
