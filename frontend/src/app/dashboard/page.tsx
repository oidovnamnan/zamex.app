'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Plus, Truck, Bell, Star, ChevronRight,
  Shield, Clock, CheckCircle2, AlertCircle, LogOut, User, Copy
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: 'Хүлээгдэж буй', color: 'badge-gray', dot: 'dot-gray' },
  PRE_ANNOUNCED: { label: 'Tracking оруулсан', color: 'badge-blue', dot: 'dot-blue' },
  IN_TRANSIT_TO_WAREHOUSE: { label: 'Агуулах руу замдаа', color: 'badge-yellow', dot: 'dot-yellow' },
  RECEIVED_AT_WAREHOUSE: { label: 'Агуулахад ирсэн', color: 'badge-blue', dot: 'dot-blue' },
  MATCHED: { label: 'Бараа ирлээ', color: 'badge-green', dot: 'dot-green' },
  PROCESSING: { label: 'Боловсруулагдаж байна', color: 'badge-blue', dot: 'dot-blue' },
  COMPLETED: { label: 'Дууссан', color: 'badge-green', dot: 'dot-green' },
  CANCELLED: { label: 'Цуцлагдсан', color: 'badge-red', dot: 'dot-red' },
  RETURN_REQUESTED: { label: 'Буцаалт хүссэн', color: 'badge-yellow', dot: 'dot-yellow' },
  NOT_RECEIVED: { label: 'Ирээгүй хүсэлт', color: 'badge-yellow', dot: 'dot-yellow' },
};

const PKG_STATUS_MAP: Record<string, { label: string; color: string }> = {
  RECEIVED_IN_CHINA: { label: 'Эрээнд ирсэн', color: 'badge-blue' },
  MEASURED: { label: 'Хэмжигдсэн', color: 'badge-blue' },
  CATEGORIZED: { label: 'Ангилагдсан', color: 'badge-blue' },
  SHELVED_CHINA: { label: 'Эрээнд агуулагдсан', color: 'badge-blue' },
  BATCHED: { label: 'Тээвэрт бэлэн', color: 'badge-blue' },
  DEPARTED: { label: 'Тээвэрт гарсан', color: 'badge-yellow' },
  IN_TRANSIT: { label: 'Замд яваа', color: 'badge-yellow' },
  AT_CUSTOMS: { label: 'Гааль дээр', color: 'badge-yellow' },
  CUSTOMS_CLEARED: { label: 'Гаалиас гарсан', color: 'badge-blue' },
  ARRIVED_MN: { label: 'УБ-д ирсэн', color: 'badge-green' },
  SHELVED_MN: { label: 'УБ агуулахад', color: 'badge-green' },
  READY_FOR_PICKUP: { label: 'Авахад бэлэн', color: 'badge-green' },
  DELIVERED: { label: 'Олгосон', color: 'badge-gray' },
  RETURN_REQUESTED: { label: 'Буцаалт хүссэн', color: 'badge-yellow' },
  RETURNED: { label: 'Буцаагдсан', color: 'badge-gray' },
};

import { Skeleton } from '@/components/ui/Skeleton';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, fetchMe, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      if (user.role === 'SUPER_ADMIN') router.push('/admin');
      else if (user.role === 'CARGO_ADMIN' || user.role === 'TRANSPORT_ADMIN') router.push('/cargo');
      else if (user.role === 'STAFF_CHINA' || user.role === 'STAFF_MONGOLIA' || user.role === 'TRANSPORT_STAFF') router.push('/staff');
      else if (user.role === 'DRIVER') router.push('/driver');
      else loadOrders();
    }
  }, [user, loading]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data } = await api.get('/orders?limit=50');
      setOrders(data.data.orders);
    } catch { }
    setLoadingOrders(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Хуулагдлаа');
  };

  const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  // Loading Skeleton State
  if (loading) return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <div className="hidden lg:block w-72 bg-slate-900 h-screen fixed" />
      <div className="flex-1 lg:ml-72 bg-slate-50 px-4 lg:px-10 py-10 space-y-10">
        <div className="h-48 bg-slate-200/50 rounded-[40px] animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex selection:bg-blue-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white flex-col fixed h-screen z-50 overflow-y-auto">
        <div className="p-10 flex-1">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-900/50 group cursor-pointer overflow-hidden transform transition-transform active:scale-90">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white italic">ZAMEX</span>
          </div>

          <nav className="space-y-3">
            {[
              { icon: Package, label: 'Хяналтын самбар', href: '/dashboard', active: true },
              { icon: Truck, label: 'Карго хайх', href: '/companies' },
              { icon: Plus, label: 'Шинэ захиалга', href: '/orders/new' },
              { icon: Star, label: 'Үнэлгээ', href: '/ratings' },
              { icon: User, label: 'Профайл', href: '/profile' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all font-bold text-[13px] ${item.active
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40 translate-x-1'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-10 border-t border-white/5">
          <button onClick={() => { logout(); router.push('/auth'); }} className="flex items-center gap-4 text-slate-400 hover:text-white transition-all text-sm font-bold hover:translate-x-1">
            <LogOut className="w-5 h-5" />
            Гарах
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72">
        {/* Header - Desktop & Mobile */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 lg:h-24 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter italic">ZAMEX</span>
            </div>

            <h1 className="hidden lg:block text-2xl font-black tracking-tight text-slate-900">
              Хяналтын самбар
            </h1>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-sm font-black text-slate-900">{user.firstName} {user.lastName}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/50 hover:bg-white transition-colors cursor-pointer relative group">
                <Bell className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-12 space-y-8 lg:space-y-12">
          {/* Greeting Card - Premium Glassmorphism */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600 rounded-[40px] blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-1000" />
            <div className="bg-[#283480] rounded-[40px] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
              <div className="relative z-10 lg:flex items-center justify-between">
                <div className="max-w-xl">
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="text-3xl lg:text-5xl font-black mb-4 tracking-tight"
                  >
                    Сайн байна уу, {user.firstName}! 👋
                  </motion.h2>
                  <p className="text-blue-200 text-lg lg:text-xl font-medium mb-10 leading-relaxed opacity-90">
                    Өнөөдөр танд <span className="text-white font-black">{activeOrders.length} идэвхтэй захиалга</span> байна. <br /> Сүүлийн шинэчлэлтийн мэдээллүүдийг доороос хяналттай хараарай.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => router.push('/orders/new')} className="bg-[#F9BE4A] text-[#283480] px-8 py-4 rounded-[18px] font-black text-sm shadow-2xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2 active:scale-95">
                      <Plus className="w-5 h-5" />
                      ШИНЭ ЗАХИАЛГА ҮҮСГЭХ
                    </button>
                    <button onClick={() => router.push('/companies')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-[18px] font-black text-sm hover:bg-white/20 transition-all flex items-center gap-2 active:scale-95">
                      <Truck className="w-5 h-5" />
                      КАРГО ХАЙХ
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex w-72 h-72 relative items-center justify-center group-hover:scale-110 transition-transform duration-700">
                  <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse" />
                  <Package className="w-32 h-32 text-white/20" />
                </div>
              </div>

              {/* Decorative blobs */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 blur-[100px] rounded-full" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-white/10 blur-[120px] rounded-full" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {[
              { label: 'Нийт захиалга', value: orders.length, icon: Package, bg: 'bg-blue-50', text: 'text-blue-600' },
              { label: 'Идэвхтэй ачаа', value: activeOrders.length, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
              { label: 'Хүргэгдсэн', value: completedOrders.length, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'Мэдэгдэл', value: 0, icon: Bell, bg: 'bg-slate-50', text: 'text-slate-600' },
            ].map((stat, i) => (
              <div key={i} className="grid-card p-6 border-none shadow-sm hover:translate-y-0 group">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Orders Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Идэвхтэй захиалгууд</h3>
                <button onClick={() => router.push('/orders')} className="text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">Бүгдийг харах</button>
              </div>

              <div className="space-y-4">
                {loadingOrders ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                ) : activeOrders.length > 0 ? (
                  activeOrders.map((order) => (
                    <button key={order.id} onClick={() => router.push(`/orders/${order.id}`)}
                      className="w-full bg-white rounded-[24px] p-5 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:border-blue-500/30 transition-all text-left flex items-center gap-6 group translate-x-0 hover:translate-x-1"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Package className="w-7 h-7 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-slate-900 truncate pr-4 text-lg">{order.productTitle || 'Захиалга ' + order.orderCode}</span>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full tracking-widest">{order.orderCode}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {order.serviceType === 'FAST' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[8px] font-black uppercase tracking-tighter shadow-sm">
                              Хурдан
                            </span>
                          )}
                          {order.package ? (
                            <>
                              <div className="badge-minimal bg-blue-50 text-blue-600 border border-blue-100">
                                {PKG_STATUS_MAP[order.package.status]?.label || order.package.status}
                              </div>
                              {order.package.weightKg && <span className="text-xs font-bold text-slate-500">{order.package.weightKg} кг</span>}
                              {order.package.shippingCost && <span className="text-xs font-black text-emerald-600">₮{Number(order.package.shippingCost).toLocaleString()}</span>}
                            </>
                          ) : (
                            <div className={`badge-minimal ${STATUS_MAP[order.status]?.color === 'badge-green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_MAP[order.status]?.label || order.status}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="p-16 border-2 border-dashed border-slate-200 rounded-[32px] text-center bg-white/50">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">Идэвхтэй захиалга байхгүй</h4>
                    <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">Та захиалга хийж ачааныхаа тээвэрлэлтийг бодит хугацаанд хянаарай.</p>
                    <button onClick={() => router.push('/companies')} className="btn-primary px-8">ГОЛ КАРГО СОНГОХ</button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              {/* Recently Finished */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                  <CheckCircle2 className="w-32 h-32 text-slate-950" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Сүүлд хүргэгдсэн</h3>
                <div className="space-y-6 relative z-10">
                  {completedOrders.length > 0 ? (
                    completedOrders.slice(0, 4).map(order => (
                      <div key={order.id} className="flex items-center gap-4 group/item">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 group-hover/item:scale-150 transition-transform"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-extrabold text-slate-900 truncate">{order.productTitle || order.orderCode}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Амжилттай хүлээн авсан</div>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm font-bold text-slate-400 italic">Дууссан захиалга байхгүй</p>}
                </div>
              </div>

              {/* Promo / Member Card */}
              <div className="bg-gradient-to-br from-[#283480] to-[#1A235D] rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
                <Star className="w-12 h-12 text-[#F9BE4A] mb-8 animate-pulse" />
                <h3 className="text-2xl font-black mb-3">Zamex Elite</h3>
                <p className="text-blue-100 text-sm font-medium mb-10 leading-relaxed opacity-80">
                  Та 50+ ачаа тээвэрлэвэл тээврийн зардлын 10% хөнгөлөлт эдлэх эрхтэй болно.
                </p>
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                  <div className="w-[15%] h-full bg-[#F9BE4A] rounded-full shadow-[0_0_10px_rgba(249,190,74,0.5)]"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-[#F9BE4A] uppercase">
                  <span>Elite Member</span>
                  <span>15 / 50 АЧАА</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>


      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-surface-100 pb-safe z-40 lg:hidden">
        <div className="max-w-2xl mx-auto flex">
          {[
            { icon: <Package className="w-5 h-5" />, label: 'Нүүр', href: '/dashboard', active: true },
            { icon: <Truck className="w-5 h-5" />, label: 'Карго', href: '/companies' },
            { icon: <Plus className="w-6 h-6" />, label: 'Захиалга', href: '/orders/new', primary: true },
            { icon: <Star className="w-5 h-5" />, label: 'Үнэлгээ', href: '/ratings' },
            { icon: <User className="w-5 h-5" />, label: 'Профайл', href: '/profile' },
          ].map((item) => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex-1 flex flex-col items-center py-2 ${item.primary
                ? 'text-zamex-600'
                : item.active ? 'text-zamex-600' : 'text-surface-400'}`}>
              {item.icon}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
