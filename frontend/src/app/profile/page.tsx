'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft, User, Phone, Building2, Shield,
  LogOut, Star, Package, Truck, Plus, ChevronRight, Zap,
  Pause, Play, Gift, Copy, Check
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import MobileNav from '@/components/MobileNav';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, fetchMe, logout } = useAuth();
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  useEffect(() => {
    fetchMe();
    loadPlatformSettings();
  }, []);

  const loadPlatformSettings = async () => {
    try {
      const { data } = await api.get('/settings/public');
      setPlatformSettings(data.data.settings);
    } catch (err) {
      console.error('Failed to load platform settings');
    }
  };

  const toggleHold = async (value: boolean) => {
    try {
      await api.patch('/users/profile', { isConsolidationHold: value });
      fetchMe();
    } catch (err) {
      console.error('Failed to update hold status');
    }
  };

  if (!user) return null;

  const companies = user.customerCompanies || [];

  return (
    <div className="min-h-screen bg-slate-50 lg:flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white flex-col fixed h-screen z-50 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">ZAMEX</span>
          </div>
          <nav className="space-y-2">
            {[
              { icon: Package, label: 'Хяналтын самбар', href: '/dashboard' },
              { icon: Truck, label: 'Карго хайх', href: '/companies' },
              { icon: Plus, label: 'Шинэ захиалга', href: '/orders/new' },
              { icon: Star, label: 'Миний үнэлгээ', href: '/ratings' },
              { icon: User, label: 'Профайл', href: '/profile', active: true },
            ].map((item) => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium text-sm ${item.active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                <item.icon className={`w-5 h-5 ${item.active ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/10">
          <button onClick={() => { logout(); router.push('/auth'); }} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" /> Гарах
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-72 relative z-10 w-full max-w-full">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="lg:hidden w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">Профайл</h1>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12 pb-24 space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-slate-50 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none" />

            <div className="w-24 h-24 rounded-[32px] bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-black border-4 border-white shadow-lg relative z-10">
              {user.firstName?.charAt(0) || 'U'}
            </div>

            <div className="text-center md:text-left relative z-10 flex-1">
              <h2 className="text-2xl font-black text-slate-900 mb-2">{user.firstName} {user.lastName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-slate-500 mb-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full">
                  <Phone className="w-4 h-4 text-slate-400" /> {user.phone}
                </div>
                {(platformSettings?.loyaltyEnabled || (user.loyaltyPoints && user.loyaltyPoints > 0)) && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-bold">
                    <Star className="w-4 h-4" /> {user.loyaltyPoints?.toLocaleString()} оноо
                  </div>
                )}
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-bold text-xs uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto relative z-10">
              <button onClick={() => { logout(); router.push('/auth'); }} className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-red-100 transition-colors">
                Гарах
              </button>
            </div>
          </div>

          {/* Logistics & Growth Section */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Логистик & Өсөлт
            </h3>

            <div className="space-y-6">
              {/* Hold Toggle */}
              <div className="flex items-center justify-between p-4 rounded-[24px] bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.isConsolidationHold ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {user.isConsolidationHold ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Ачаа түр зогсоох (Hold)</div>
                    <div className="text-xs text-slate-500 font-medium">Идэвхжүүлсэн үед таны ачааг бүгдийг UB руу ачуулахгүй түр хүлээнэ (Цуглуулж багцлахад)</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleHold(!user.isConsolidationHold)}
                  className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${user.isConsolidationHold ? 'bg-slate-900' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 ${user.isConsolidationHold ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Referral Code */}
              {(platformSettings?.referralEnabled || user.referralCode) && (
                <div className="p-4 rounded-[24px] bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Найзаа урих</div>
                      <div className="text-xs text-indigo-600 font-medium">Найзаа уриад урамшуулал аваарай</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-indigo-200 px-4 py-3 rounded-xl font-mono font-bold text-indigo-900 tracking-wider">
                      {user.referralCode || 'ZAMEX-USER'}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user.referralCode || '');
                        toast.success('Код хуулагдлаа');
                      }}
                      className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* My Cargos */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/50">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Миний каргонууд
              </h3>
              {companies.length > 0 ? (
                <div className="space-y-4">
                  {companies.map((cc: any) => (
                    <div key={cc.company.id} className="group p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{cc.company.name}</div>
                          <div className="text-xs font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                            {cc.customerCode}
                          </div>
                        </div>
                      </div>
                      {cc.isPrimary && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Үндсэн</span>
                      )}
                    </div>
                  ))}
                  <button onClick={() => router.push('/companies')} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Карго нэмэх
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 font-medium mb-4">Та одоогоор ямар нэгэн карго компанид бүртгэлгүй байна.</p>
                  <button onClick={() => router.push('/companies')} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                    Карго хайх
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/50">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Шуурхай цэс
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Package, label: 'Миний захиалгууд', href: '/dashboard', color: 'text-blue-500', bg: 'bg-blue-50' },
                  //   { icon: CreditCard, label: 'Нэхэмжлэх & Төлбөр', href: '/invoices', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { icon: Star, label: 'Миний үнэлгээнүүд', href: '/ratings', color: 'text-amber-500', bg: 'bg-amber-50' },
                  { icon: Shield, label: 'Админ удирдлага', href: user.role === 'SUPER_ADMIN' ? '/admin' : '/cargo', show: ['CARGO_ADMIN', 'SUPER_ADMIN'].includes(user.role), color: 'text-purple-500', bg: 'bg-purple-50' }
                ].filter(i => i.show !== false).map((item) => (
                  <button key={item.label} onClick={() => router.push(item.href)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:translate-x-1 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
