'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Truck, Shield, Zap,
  Package, Check, Trophy, Timer,
  Plus, User, LogOut
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';
import MobileNav from '@/components/MobileNav';

export default function CompaniesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    try {
      const { data } = await api.get('/companies');
      setCompanies(data.data.companies);
    } catch { }
    setLoading(false);
  };

  const joinCompany = async (companyId: string) => {
    setJoining(companyId);
    try {
      const { data } = await api.post(`/companies/${companyId}/join`);
      toast.success(`${data.message}\nТаны код: ${data.data.customerCode}`);
      loadCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    }
    setJoining(null);
  };

  const isJoined = (companyId: string) =>
    user?.customerCompanies?.some((cc: any) => cc.company.id === companyId);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex overflow-x-hidden">
      {/* Sidebar */}
      {user && (
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
                { icon: Truck, label: 'Карго хайх', href: '/companies', active: true },
                { icon: Plus, label: 'Шинэ захиалга', href: '/orders/new' },
                { icon: Star, label: 'Миний үнэлгээ', href: '/ratings' },
                { icon: User, label: 'Профайл', href: '/profile' },
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
      )}

      <div className={`flex-1 ${user ? 'lg:ml-72' : ''} relative z-10 w-full max-w-full`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="lg:hidden w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">Карго компаниуд</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Updates</span>
              </div>

              {!user && (
                <button
                  onClick={() => router.push('/auth')}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  Нэвтрэх
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12 pb-24">
          {loading ? (
            <div className="grid lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-[32px] p-8 h-64 animate-pulse shadow-sm border border-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid lg:grid-cols-1 gap-6">
              {companies.map((c, i) => {
                const r = c.ratingsSummary;
                const price = c.pricingRules?.[0]?.pricePerKg;
                const joined = isJoined(c.id);

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.005 }}
                    className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-32 bg-slate-50/50 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-50/50 transition-colors duration-500" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                      {/* Left: Icon & Rank */}
                      <div className="flex-shrink-0">
                        <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-3xl shadow-lg border-4 border-white ${i === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 shadow-amber-100' :
                          i === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 shadow-slate-100' :
                            i === 2 ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-500 shadow-orange-100' :
                              'bg-slate-50 text-slate-300'
                          }`}>
                          {i === 0 ? <Trophy className="w-10 h-10 drop-shadow-sm" /> : <span className="font-black opacity-50">{i + 1}</span>}
                        </div>
                      </div>

                      {/* Middle: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{c.name}</h3>
                          {joined && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5 shadow-sm shadow-emerald-100">
                              <Check className="w-3 h-3 stroke-[3]" /> Verified Member
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-6 mb-6">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-4 h-4 ${star <= (Number(r?.averageRating) || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                              ))}
                            </div>
                            <span className="font-bold text-slate-900">{r?.averageRating ? Number(r.averageRating).toFixed(1) : '0.0'}</span>
                            <span className="text-slate-400 text-sm">({r?.totalRatings || 0})</span>
                          </div>
                          <div className="flex gap-2">
                            {c.pricingRules?.slice(0, 2).map((rule: any) => (
                              <div key={rule.id} className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 ${rule.serviceType === 'FAST' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                {rule.serviceType === 'FAST' && <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />}
                                ₮{Number(rule.pricePerKg).toLocaleString()}
                                <span className="opacity-40 font-normal">/ кг</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Хурд</span>
                              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(Number(r?.avgSpeed || 0) / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-900">{Number(r?.avgSpeed || 0).toFixed(1)}/5.0</span>
                          </div>

                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Аюулгүй</span>
                              <Shield className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(Number(r?.avgSafety || 0) / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-900">{Number(r?.avgSafety || 0).toFixed(1)}/5.0</span>
                          </div>

                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 col-span-2 lg:col-span-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Timer className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Хугацаа</span>
                            </div>
                            <div className="text-lg font-black text-slate-900">
                              ~{r?.avgDeliveryDays ? Math.round(Number(r.avgDeliveryDays)) : '-'} <span className="text-xs font-bold text-slate-400 uppercase">хоног</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row md:flex-col gap-3 w-full md:w-48 flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 pl-0 md:pl-8">
                        {joined ? (
                          <button
                            onClick={() => router.push(`/orders/new?companyId=${c.id}`)}
                            className="flex-1 w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 group-hover:scale-105 duration-300"
                          >
                            <Package className="w-4 h-4" /> Захиалга
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!user) {
                                router.push('/auth');
                              } else {
                                joinCompany(c.id);
                              }
                            }}
                            disabled={joining === c.id}
                            className="flex-1 w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 group-hover:scale-105 duration-300"
                          >
                            {joining === c.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Бүртгүүлэх'}
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/companies/${c.id}`)}
                          className="flex-1 w-full bg-white text-slate-900 border-2 border-slate-100 rounded-2xl py-4 font-bold text-xs uppercase tracking-widest hover:border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                          Дэлгэрэнгүй
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && companies.length === 0 && (
            <div className="bg-white rounded-[40px] p-20 text-center shadow-xl shadow-slate-100 border border-slate-100 max-w-2xl mx-auto mt-10">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                <Truck className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Компани олдсонгүй</h3>
              <p className="text-slate-400 font-medium">Одоогоор системд бүртгэлтэй карго компани алга байна.</p>
            </div>
          )}
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
