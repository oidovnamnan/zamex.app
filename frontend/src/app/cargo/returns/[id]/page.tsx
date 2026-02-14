'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Shield, Clock,
  User, Package, DollarSign, Camera, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const LIABILITY_MAP: Record<string, string> = {
  SELLER: 'Худалдагч', CHINA_CARRIER: 'Хятад тээвэр', CARGO_CHINA: 'Карго (Хятад)',
  CARGO_TRANSIT: 'Карго (Тээвэр)', CARGO_MONGOLIA: 'Карго (Монгол)',
  CUSTOMS: 'Гааль', CUSTOMER: 'Захиалагч', UNDETERMINED: 'Тодорхойгүй',
};

export default function ReturnReviewPage() {
  const router = useRouter();
  const { id } = useParams();
  const [ret, setRet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [liableParty, setLiableParty] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadReturn(); }, [id]);

  const loadReturn = async () => {
    try {
      const { data } = await api.get(`/returns/${id}`);
      setRet(data.data.return);
      setLiableParty(data.data.return.liableParty);
      if (data.data.return.requestedAmount) setApprovedAmount(String(data.data.return.requestedAmount));
    } catch { toast.error('Буцаалт олдсонгүй'); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      await api.patch(`/returns/${id}/review`, {
        status: decision,
        liableParty: liableParty || undefined,
        approvedAmount: decision === 'APPROVED' ? parseFloat(approvedAmount) || 0 : 0,
        reviewNotes,
      });
      toast.success(decision === 'APPROVED' ? 'Буцаалт зөвшөөрөгдлөө' : 'Буцаалт татгалзагдлаа');
      router.back();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!ret) return null;

  const hasInsurance = !!ret.order?.insurance;

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2"><ArrowLeft className="w-4.5 h-4.5" /></button>
          <div>
            <h1 className="text-sm font-semibold text-surface-900">Буцаалт шалгах</h1>
            <p className="text-xs text-surface-400 font-mono">{ret.returnCode}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Summary */}
        <div className="card p-5">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-surface-900">{ret.title}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{ret.returnType} • {new Date(ret.createdAt).toLocaleDateString('mn-MN')}</p>
            </div>
          </div>
          <p className="text-sm text-surface-600 leading-relaxed">{ret.description}</p>
        </div>

        {/* Customer & Order */}
        <div className="card p-5 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-500 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Захиалагч</span>
            <span className="font-medium">{ret.customer?.firstName} ({ret.customer?.phone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-500 flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Захиалга</span>
            <span className="font-mono">{ret.order?.orderCode || '—'}</span>
          </div>
          {hasInsurance && (
            <div className="flex justify-between">
              <span className="text-surface-500 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Даатгал</span>
              <span className="badge-blue">{ret.order.insurance.planSlug} (max ₮{Number(ret.order.insurance.maxPayout).toLocaleString()})</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-surface-500">AI хариуцагч</span>
            <span className="font-medium text-amber-700">{LIABILITY_MAP[ret.liableParty] || ret.liableParty}</span>
          </div>
          <div className="text-xs text-surface-400 bg-surface-50 rounded-lg p-2">{ret.liabilityReason}</div>
        </div>

        {/* Timeline */}
        {ret.timeline?.length > 0 && (
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Түүх</h4>
            <div className="space-y-3">
              {ret.timeline.map((t: any) => (
                <div key={t.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-surface-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-surface-700">{t.message || t.action}</p>
                    <p className="text-xs text-surface-400">{new Date(t.createdAt).toLocaleString('mn-MN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {['OPENED', 'UNDER_REVIEW'].includes(ret.status) && (
          <div className="card p-5 border-2 border-zamex-200">
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Шийдвэр гаргах</h4>

            {/* Decision */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setDecision('APPROVED')}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  decision === 'APPROVED' ? 'border-emerald-500 bg-emerald-50' : 'border-surface-200 hover:border-surface-300'
                }`}>
                <CheckCircle2 className={`w-6 h-6 mx-auto mb-1 ${decision === 'APPROVED' ? 'text-emerald-600' : 'text-surface-300'}`} />
                <span className="text-sm font-semibold">Зөвшөөрөх</span>
              </button>
              <button onClick={() => setDecision('REJECTED')}
                className={`p-4 rounded-xl border-2 text-center transition ${
                  decision === 'REJECTED' ? 'border-red-500 bg-red-50' : 'border-surface-200 hover:border-surface-300'
                }`}>
                <XCircle className={`w-6 h-6 mx-auto mb-1 ${decision === 'REJECTED' ? 'text-red-600' : 'text-surface-300'}`} />
                <span className="text-sm font-semibold">Татгалзах</span>
              </button>
            </div>

            {/* Liable party override */}
            <div className="mb-3">
              <label className="input-label">Хариуцагч (солих бол)</label>
              <select value={liableParty} onChange={e => setLiableParty(e.target.value)} className="input">
                {Object.entries(LIABILITY_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            {decision === 'APPROVED' && (
              <div className="mb-3">
                <label className="input-label flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Нөхөн олговрын дүн (₮)
                </label>
                <input type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)}
                  placeholder="0" className="input" />
                {hasInsurance && (
                  <p className="text-xs text-blue-600 mt-1">
                    Даатгалын max: ₮{Number(ret.order.insurance.maxPayout).toLocaleString()} ({ret.order.insurance.planSlug})
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="input-label">Тайлбар</label>
              <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                placeholder="Шийдвэрийн тайлбар..." className="input min-h-[60px] resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={!decision || submitting}
              className={`w-full btn-lg ${decision === 'APPROVED' ? 'btn bg-emerald-600 text-white hover:bg-emerald-700' : decision === 'REJECTED' ? 'btn-danger' : 'btn-primary'}`}>
              {submitting ? 'Хадгалж байна...' : decision === 'APPROVED' ? 'Зөвшөөрч нөхөн олгох' : decision === 'REJECTED' ? 'Татгалзах' : 'Шийдвэр сонгоно уу'}
            </button>
          </div>
        )}

        {/* Already reviewed */}
        {!['OPENED', 'UNDER_REVIEW'].includes(ret.status) && (
          <div className={`card p-5 text-center ${ret.status === 'APPROVED' || ret.status === 'REFUND_COMPLETED' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {ret.status === 'REJECTED' ? (
              <><XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" /><p className="font-semibold text-red-700">Татгалзсан</p></>
            ) : (
              <><CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" /><p className="font-semibold text-emerald-700">Зөвшөөрсөн — {ret.status}</p></>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
