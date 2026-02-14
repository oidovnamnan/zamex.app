'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Truck, AlertTriangle, Star, Users, BarChart3,
  ChevronRight, Clock, CheckCircle2, XCircle, TrendingUp,
  Box, Scale, QrCode, RefreshCw, LogOut, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CargoAdminDashboard() {
  const router = useRouter();
  const { user, loading, fetchMe, logout } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, china: 0, transit: 0, ub: 0, ready: 0, pendingReturns: 0 });

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => {
    if (user && ['CARGO_ADMIN', 'SUPER_ADMIN', 'STAFF_CHINA', 'STAFF_MONGOLIA', 'TRANSPORT_ADMIN'].includes(user.role)) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [pkgRes, batchRes, retRes] = await Promise.all([
        api.get('/packages?limit=50'),
        api.get('/batches?limit=5'),
        api.get('/returns?status=OPENED&limit=5'),
      ]);
      const pkgs = pkgRes.data.data.packages;
      setPackages(pkgs);
      setBatches(batchRes.data.data.batches);
      setReturns(retRes.data.data.returns);

      setStats({
        total: pkgRes.data.data.total,
        china: pkgs.filter((p: any) => ['RECEIVED_IN_CHINA', 'MEASURED', 'CATEGORIZED', 'SHELVED_CHINA', 'BATCHED'].includes(p.status)).length,
        transit: pkgs.filter((p: any) => ['DEPARTED', 'IN_TRANSIT', 'AT_CUSTOMS'].includes(p.status)).length,
        ub: pkgs.filter((p: any) => ['ARRIVED_MN', 'SHELVED_MN'].includes(p.status)).length,
        ready: pkgs.filter((p: any) => p.status === 'READY_FOR_PICKUP').length,
        pendingReturns: retRes.data.data.total,
      });
    } catch { }
  };

  const renderChinaView = () => (
    <div className="space-y-8">
      {/* China Specific Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#283480] p-8 rounded-[32px] text-white overflow-hidden relative group">
          <Box className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform" />
          <div className="relative z-10">
            <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Өнөөдрийн орлого</div>
            <div className="text-4xl font-black">{packages.filter(p => dayjs(p.createdAt).isSame(dayjs(), 'day')).length}</div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-wider">China Warehouse Inbound</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Хэмжилт хүлээгдэж буй</div>
          <div className="text-4xl font-black text-slate-900">{packages.filter(p => p.status === 'RECEIVED_IN_CHINA').length}</div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ачилтанд бэлэн</div>
          <div className="text-4xl font-black text-[#F9BE4A]">{packages.filter(p => !['BATCHED', 'DEPARTED'].includes(p.status) && p.weightKg).length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Эрээн: Үйл ажиллагаа</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => router.push('/staff/scanner')} className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] text-left group hover:bg-blue-600 transition-all">
              <QrCode className="w-10 h-10 text-blue-600 group-hover:text-white mb-4" />
              <div className="font-black text-blue-900 group-hover:text-white uppercase text-xs tracking-widest">Бараа хүлээн авах</div>
              <p className="text-[10px] text-blue-500 group-hover:text-blue-100 mt-2 font-bold italic">China Inbound Scan</p>
            </button>
            <button onClick={() => router.push('/cargo/batches')} className="p-8 bg-slate-900 rounded-[32px] text-left group hover:bg-black transition-all">
              <Truck className="w-10 h-10 text-white mb-4" />
              <div className="font-black text-white uppercase text-xs tracking-widest">Batch ачих (Loading)</div>
              <p className="text-[10px] text-white/40 mt-2 font-bold italic">Dispatch to Mongolia</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Сүүлийн ачилт</h3>
          <div className="space-y-4">
            {batches.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{b.batchCode}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{b.carrier?.name || 'China Carrier'}</div>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMNView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-600 p-8 rounded-[32px] text-white group relative overflow-hidden shadow-xl shadow-emerald-900/10">
          <CheckCircle2 className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <div className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2">Олгоход бэлэн</div>
          <div className="text-4xl font-black">{stats.ready}</div>
          <p className="text-[10px] text-emerald-200 mt-4 uppercase font-bold tracking-wider italic">Ready for Customer Pickup</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Замд яваа ачаа</div>
            <div className="text-4xl font-black text-blue-600">{batches.filter(b => b.status === 'DEPARTED' || b.status === 'IN_TRANSIT').length}</div>
          </div>
          <Truck className="w-12 h-12 text-slate-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Улаанбаатар: Цэс</h3>
          <div className="space-y-3">
            <button onClick={() => router.push('/cargo/batches')} className="w-full flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-100 transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Ачаа хүлээн авах</div>
                <div className="text-[9px] text-slate-400 font-bold italic uppercase">Unload Batch</div>
              </div>
            </button>
            <button onClick={() => router.push('/cargo/pickup')} className="w-full flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all text-left group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Бараа олгох</div>
                <div className="text-[9px] text-slate-400 font-bold italic uppercase">Customer Pickup</div>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Олгох ачааны жагсаалт</h3>
          <div className="space-y-4">
            {packages.filter(p => p.status === 'READY_FOR_PICKUP').slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                    {p.id.slice(-4)}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{p.trackingNumber || p.order?.orderCode}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{(p.owner?.firstName || 'Customer')} - {p.weightKg}кг</div>
                  </div>
                </div>
                <button className="h-10 px-6 bg-[#283480] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#1a235c] transition-all active:scale-95">Олгох</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminView = () => (
    <>
      {/* Stats Grid - Ultra Compact 2-Column */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Эрээнд', value: stats.china, icon: Box, gradient: 'from-blue-500 to-blue-600' },
          { label: 'Замд', value: stats.transit, icon: Truck, gradient: 'from-amber-500 to-orange-600' },
          { label: 'УБ-д', value: stats.ub, icon: Package, gradient: 'from-violet-500 to-purple-600' },
          { label: 'Авахад бэлэн', value: stats.ready, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
          { label: 'Буцаалт', value: stats.pendingReturns, icon: AlertTriangle, gradient: 'from-red-500 to-rose-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-98 ${i === 4 ? 'col-span-2' : ''}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-black text-slate-900 leading-none mb-0.5">{s.value}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Action Buttons - Compact 2x2 Grid */}
        <div>
          <h3 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">Удирдлагын хэсэг</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Бараа авах', icon: QrCode, href: '/staff/scanner', color: 'from-blue-600 to-blue-700' },
              { label: 'Batch +', icon: Truck, href: '/cargo/batches/new', color: 'from-slate-800 to-slate-900' },
              { label: 'Хэмжилт', icon: Scale, href: '/cargo/measure', color: 'from-violet-600 to-violet-700' },
              { label: 'Олголт', icon: CheckCircle2, href: '/cargo/pickup', color: 'from-emerald-600 to-emerald-700' },
            ].map((a) => (
              <button key={a.label} onClick={() => router.push(a.href)}
                className={`relative overflow-hidden group bg-gradient-to-br ${a.color} rounded-2xl p-4 text-left shadow-md hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95`}>
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                    <a.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-black text-white leading-tight uppercase tracking-wide">{a.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Packages - Compact List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Сүүлийн бараанууд</h3>
            <button onClick={() => router.push('/cargo/packages')} className="text-[9px] font-black text-[#283480] hover:bg-slate-50 uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all">
              Бүгд
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {packages.slice(0, 5).map((pkg) => (
              <div key={pkg.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors cursor-pointer active:bg-slate-100" onClick={() => router.push(`/cargo/packages/${pkg.id}`)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-black text-slate-900">{pkg.trackingNumber || pkg.order?.orderCode || 'N/A'}</div>
                  <StatusBadge status={pkg.status} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-medium">{pkg.weightKg ? `${pkg.weightKg} кг` : '-'}</span>
                  <span className="text-slate-400 font-medium uppercase">{pkg.category?.name || 'Category'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Хяналтын самбар</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
              {user?.role === 'STAFF_CHINA' ? 'Erlian Warehouse' : user?.role === 'STAFF_MONGOLIA' ? 'Ulaanbaatar Hub' : user?.role === 'CARGO_ADMIN' ? 'Cargo Owner' : 'System Administrator'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadData} className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 flex items-center justify-center transition-all text-[#283480] shadow-sm active:scale-90">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-6">
        {user?.company && (user.company.verificationStatus === 'NOT_SUBMITTED' || user.company.verificationStatus === 'REJECTED') && (
          <div className="mb-8 p-1 rounded-[36px] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 animate-gradient-x shadow-xl shadow-orange-500/20">
            <div className="bg-white rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                    {user.role === 'TRANSPORT_ADMIN' ? 'Тээвэр баталгаажуулалт' : 'Карго баталгаажуулалт'}
                  </h3>
                  <p className="text-slate-500 font-bold text-xs uppercase mt-1 tracking-wider">Гэрээ болон үйл ажиллагааны эрхээ идэвхжүүлэх шаардлагатай</p>
                </div>
              </div>
              <button
                onClick={() => router.push(user.role === 'TRANSPORT_ADMIN' ? '/transport/verify' : '/cargo/verify')}
                className="w-full md:w-auto px-10 py-4 bg-[#283480] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a235c] transition-all shadow-xl shadow-blue-900/10 active:scale-95 flex items-center justify-center gap-2"
              >
                Одоо баталгаажуулах <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {user?.role === 'STAFF_CHINA' && renderChinaView()}
        {user?.role === 'STAFF_MONGOLIA' && renderMNView()}
        {(['CARGO_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) && renderAdminView()}

        {user && !['STAFF_CHINA', 'STAFF_MONGOLIA', 'CARGO_ADMIN', 'SUPER_ADMIN'].includes(user.role || '') && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm px-6 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-8">
              <ShieldCheck className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Хяналтын самбар боломжгүй</h3>
            <p className="text-slate-500 font-bold text-sm uppercase mt-3 tracking-widest max-w-md">
              Таны "{user.role}" эрхэд тохирсон хяналтын самбар олдсонгүй. <br />
              Системээс гараад дахин нэвтэрч үзнэ үү.
            </p>
            <button
              onClick={() => { logout(); router.push('/auth'); }}
              className="mt-10 px-10 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              Системээс гарах
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RECEIVED_IN_CHINA: 'bg-blue-50 text-blue-700 border-blue-100',
    MEASURED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    BATCHED: 'bg-violet-50 text-violet-700 border-violet-100',
    OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
    DEPARTED: 'bg-amber-50 text-amber-700 border-amber-100',
    IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-100',
    ARRIVED_MN: 'bg-green-50 text-green-700 border-green-100',
    READY_FOR_PICKUP: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DELIVERED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels: Record<string, string> = {
    RECEIVED_IN_CHINA: 'Эрээнд ирсэн',
    MEASURED: 'Хэмжсэн',
    BATCHED: 'Batch-д',
    OPEN: 'Нээлттэй',
    CLOSED: 'Хаасан',
    DEPARTED: 'Замд гарсан',
    IN_TRANSIT: 'Тээвэрлэлтэнд',
    ARRIVED_MN: 'УБ-д ирсэн',
    READY_FOR_PICKUP: 'Олгоход бэлэн',
    DELIVERED: 'Хүлээлгэн өгсөн',
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
      {labels[status] || status || 'UNKNOWN'}
    </span>
  );
}
