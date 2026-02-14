'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Check, Package, Truck, CreditCard, AlertTriangle, Star } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const ICONS: Record<string, any> = {
  order: Package, package: Package, delivery: Truck,
  payment: CreditCard, return: AlertTriangle, rating: Star, default: Bell,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const { data } = await api.get('/notifications?limit=50'); setNotifications(data.data.notifications); } catch {} setLoading(false);
  };

  const markRead = async (id: string) => {
    try { await api.patch(`/notifications/${id}/read`); load(); } catch {}
  };

  const markAllRead = async () => {
    try { await api.post('/notifications/read-all'); toast.success('Бүгд уншсан'); load(); } catch {}
  };

  const unread = notifications.filter(n => !n.isRead);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2"><ArrowLeft className="w-4.5 h-4.5" /></button>
            <h1 className="font-semibold text-surface-900">Мэдэгдэл</h1>
            {unread.length > 0 && <span className="badge-red">{unread.length} шинэ</span>}
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="btn-ghost btn-sm text-zamex-600"><Check className="w-4 h-4" /> Бүгд</button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {notifications.map(n => {
          const Icon = ICONS[n.type] || ICONS.default;
          return (
            <button key={n.id} onClick={() => { markRead(n.id); }}
              className={`w-full px-4 py-3.5 flex gap-3 text-left border-b border-surface-100 transition ${!n.isRead ? 'bg-zamex-50/30' : 'hover:bg-surface-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-zamex-100 text-zamex-600' : 'bg-surface-100 text-surface-400'}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-surface-900">{n.title}</div>
                <div className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.message}</div>
                <div className="text-xs text-surface-400 mt-1">{new Date(n.createdAt).toLocaleString('mn-MN')}</div>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-zamex-600 mt-2 flex-shrink-0" />}
            </button>
          );
        })}
        {!loading && notifications.length === 0 && (
          <div className="p-12 text-center"><Bell className="w-10 h-10 text-surface-200 mx-auto mb-3" /><p className="text-sm text-surface-400">Мэдэгдэл байхгүй</p></div>
        )}
      </main>
    </div>
  );
}
