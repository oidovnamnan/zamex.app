'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Zap, Clock, AlertTriangle, Link2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function UnidentifiedPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await api.get('/unidentified?limit=100'); setItems(data.data.items); } catch {} setLoading(false);
  };

  const autoMatch = async () => {
    setMatching(true);
    try {
      const { data } = await api.post('/unidentified/auto-match', {});
      toast.success(data.message); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
    setMatching(false);
  };

  const manualMatch = async (unidId: string) => {
    if (!orderId) { toast.error('Order ID оруулна уу'); return; }
    try {
      const { data } = await api.post(`/unidentified/${unidId}/match`, { orderId });
      toast.success(data.message); setMatchId(null); setOrderId(''); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
  };

  const getDays = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2"><ArrowLeft className="w-4.5 h-4.5" /></button>
            <h1 className="font-semibold text-surface-900">Эзэнгүй бараа ({items.length})</h1>
          </div>
          <button onClick={autoMatch} disabled={matching} className="btn-primary btn-sm">
            <Zap className="w-3.5 h-3.5" /> {matching ? 'Хайж байна...' : 'Автомат дүйцүүлэх'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-3">
        {items.map(item => {
          const days = getDays(item.storedAt);
          const borderColor = days >= 75 ? 'border-l-4 border-l-red-400' : days >= 60 ? 'border-l-4 border-l-amber-400' : '';

          return (
            <div key={item.id} className={`card p-4 ${borderColor}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-surface-900">{item.tempCode}</span>
                    {days >= 75 && <span className="badge-red">⚠ {days} хоног</span>}
                    {days >= 60 && days < 75 && <span className="badge-yellow">{days} хоног</span>}
                  </div>
                  <div className="text-xs text-surface-400 mt-0.5 space-x-3">
                    {item.partialTracking && <span>Tracking: {item.partialTracking}</span>}
                    {item.partialPhone && <span>Утас: {item.partialPhone}</span>}
                    {item.partialName && <span>Нэр: {item.partialName}</span>}
                  </div>
                </div>
                <div className="text-right text-xs text-surface-400">
                  {item.weightKg && <div>{item.weightKg}кг</div>}
                  {item.shelfLocation && <div className="font-mono">{item.shelfLocation}</div>}
                </div>
              </div>

              {item.aiDescription && (
                <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700 mb-2">
                  AI: {item.aiDescription} {item.aiCategory && `• ${item.aiCategory}`}
                </div>
              )}

              {/* Match suggestions */}
              {item.matchSuggestions?.length > 0 && (
                <div className="bg-emerald-50 rounded-lg p-2 mb-2">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">Дүйцэл олдсон:</div>
                  {item.matchSuggestions.map((s: any) => (
                    <div key={s.id} className="text-xs text-emerald-600">
                      {s.reasoning} ({s.confidence}%)
                    </div>
                  ))}
                </div>
              )}

              {/* Manual match */}
              {matchId === item.id ? (
                <div className="flex gap-2 mt-2">
                  <input value={orderId} onChange={e => setOrderId(e.target.value)}
                    placeholder="Order ID (UUID)" className="input flex-1 text-xs font-mono" autoFocus />
                  <button onClick={() => manualMatch(item.id)} className="btn-primary btn-sm">Холбох</button>
                  <button onClick={() => { setMatchId(null); setOrderId(''); }} className="btn-ghost btn-sm">✕</button>
                </div>
              ) : (
                <button onClick={() => setMatchId(item.id)} className="btn-secondary btn-sm mt-2">
                  <Link2 className="w-3.5 h-3.5" /> Гараар холбох
                </button>
              )}
            </div>
          );
        })}

        {!loading && items.length === 0 && (
          <div className="card p-12 text-center">
            <Package className="w-10 h-10 text-surface-200 mx-auto mb-3" />
            <p className="text-sm text-surface-400">Эзэнгүй бараа байхгүй 🎉</p>
          </div>
        )}
      </main>
    </div>
  );
}
