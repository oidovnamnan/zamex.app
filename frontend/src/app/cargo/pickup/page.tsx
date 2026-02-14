'use client';

import { useState } from 'react';
import { ArrowLeft, QrCode, CheckCircle2, Keyboard, Package, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PickupPage() {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePickup = async () => {
    if (!invoiceId || !qrCode) { toast.error('ID болон QR код оруулна уу'); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/invoices/${invoiceId}/pickup`, { qrCode });
      setResult(data.data);
      toast.success(`${data.data.deliveredCount} бараа олгогдлоо!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-zamex-950 text-white">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/60 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Бараа олгох</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {!result ? (
          <>
            <button className="card-hover w-full p-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <div className="text-base font-semibold text-surface-900">QR код скан хийх</div>
                <div className="text-xs text-surface-400">Захиалагчийн QR кодыг камераар скан</div>
              </div>
            </button>

            <div className="flex items-center gap-3 text-surface-300">
              <div className="flex-1 h-px bg-surface-200" /><span className="text-xs">эсвэл гараар</span><div className="flex-1 h-px bg-surface-200" />
            </div>

            <div className="card p-5 space-y-3">
              <div>
                <label className="input-label">Нэхэмжлэхийн ID</label>
                <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)}
                  placeholder="Invoice UUID" className="input font-mono" />
              </div>
              <div>
                <label className="input-label">QR код утга</label>
                <input value={qrCode} onChange={e => setQrCode(e.target.value)}
                  placeholder="ZAMEX-PICKUP-..." className="input font-mono" />
              </div>
              <button onClick={handlePickup} disabled={loading || !invoiceId || !qrCode}
                className="btn-primary w-full btn-lg">
                {loading ? 'Шалгаж байна...' : <><CheckCircle2 className="w-5 h-5" /> Бараа олгох</>}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center pt-8">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 mb-2">Олгогдлоо!</h2>
            <p className="text-surface-500 mb-6">{result.deliveredCount} бараа амжилттай олгогдлоо</p>
            <button onClick={() => { setResult(null); setInvoiceId(''); setQrCode(''); }}
              className="btn-primary btn-lg"><Package className="w-5 h-5" /> Дараагийн</button>
          </div>
        )}
      </main>
    </div>
  );
}
