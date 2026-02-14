'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CreditCard, Clock, CheckCircle2, AlertTriangle,
  QrCode, Package, ChevronRight, Download
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [paidQr, setPaidQr] = useState<{ invoiceId: string; qr: string } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await api.get('/invoices?limit=50');
      setInvoices(data.data.invoices);
    } catch {} setLoading(false);
  };

  const handlePay = async (invoiceId: string) => {
    setPaying(invoiceId);
    try {
      const { data } = await api.post(`/invoices/${invoiceId}/pay`, { paymentMethod: 'qpay' });
      setPaidQr({ invoiceId, qr: data.data.pickupQrCode });
      toast.success('Төлбөр амжилттай!');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа');
    }
    setPaying(null);
  };

  const unpaid = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
  const paid = invoices.filter(i => i.status === 'PAID');

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-semibold text-surface-900">Нэхэмжлэх & Төлбөр</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Pickup QR Modal */}
        {paidQr && (
          <div className="card border-2 border-emerald-300 bg-emerald-50/50 p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-emerald-900 mb-1">Төлбөр төлөгдлөө!</h3>
            <p className="text-sm text-emerald-700 mb-4">Энэ QR кодыг агуулахад харуулж барааг аваарай</p>
            <div className="bg-white rounded-2xl p-6 inline-block shadow-card mb-3">
              <div className="w-48 h-48 bg-surface-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-20 h-20 text-surface-300" />
              </div>
              <p className="text-xs font-mono text-surface-500 mt-2 break-all">{paidQr.qr}</p>
            </div>
            <button onClick={() => setPaidQr(null)} className="btn-secondary w-full mt-2">Хаах</button>
          </div>
        )}

        {/* Unpaid */}
        {unpaid.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Төлөгдөөгүй ({unpaid.length})
            </h2>
            <div className="space-y-3">
              {unpaid.map(inv => (
                <div key={inv.id} className="card border-l-4 border-l-amber-400 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-mono font-semibold text-surface-900">{inv.invoiceCode}</div>
                      <div className="text-xs text-surface-400">{inv.company?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-surface-900">₮{Number(inv.totalAmount).toLocaleString()}</div>
                      {inv.status === 'OVERDUE' && <span className="badge-red">Хугацаа хэтэрсэн</span>}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-surface-50 rounded-xl p-3 mb-3 space-y-1.5">
                    {inv.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-surface-500">{item.description}</span>
                        <span className="text-surface-700 font-medium">₮{Number(item.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handlePay(inv.id)} disabled={paying === inv.id}
                    className="btn-primary w-full">
                    {paying === inv.id ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Төлж байна...
                      </span>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> QPay-ээр төлөх</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">
              Төлөгдсөн ({paid.length})
            </h2>
            <div className="space-y-2">
              {paid.map(inv => (
                <div key={inv.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-mono text-surface-700">{inv.invoiceCode}</div>
                    <div className="text-xs text-surface-400">
                      {new Date(inv.paidAt).toLocaleDateString('mn-MN')} • {inv.company?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-surface-900">₮{Number(inv.totalAmount).toLocaleString()}</div>
                    <span className="badge-green"><CheckCircle2 className="w-3 h-3" /> Төлсөн</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && invoices.length === 0 && (
          <div className="card p-12 text-center">
            <CreditCard className="w-12 h-12 text-surface-200 mx-auto mb-4" />
            <p className="text-sm text-surface-400">Нэхэмжлэх байхгүй</p>
          </div>
        )}
      </main>
    </div>
  );
}
