'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, CheckCircle2, Clock, Building2, Plus, X,
  ChevronDown, ChevronUp, Calendar, RefreshCw,
  ArrowRightLeft, Wallet, TrendingUp, Search, Filter, ExternalLink,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => { load(); loadCompanies(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settlements?limit=50');
      setSettlements(data.data.settlements);
    } catch {
      toast.error('Settlement жагсаалт авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data } = await api.get('/companies');
      setCompanies(data.data.companies);
    } catch { }
  };

  const generate = async () => {
    if (!companyId) return;
    setCreating(true);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    try {
      await api.post('/settlements/generate', {
        companyId,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString()
      });
      toast.success('Settlement амжилттай үүслээ');
      setShowCreate(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    } finally {
      setCreating(false);
    }
  };

  const markTransferred = async (id: string, e: any, payoutData: any) => {
    e.stopPropagation();
    try {
      await api.patch(`/settlements/${id}/transfer`, payoutData);
      toast.success('Шилжүүлэг амжилттай хийгдлээ');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    }
  };

  const onAction = async (id: string, action: string, body: any) => {
    try {
      await api.patch(`/settlements/${id}/${action}`, body);
      toast.success('Амжилттай');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    }
  };

  // Calculate Stats
  const stats = {
    totalSettled: settlements.filter(s => s.status === 'COMPLETED').reduce((acc, s) => acc + Number(s.netAmount), 0),
    pendingAmount: settlements.filter(s => s.status === 'PENDING').reduce((acc, s) => acc + Number(s.netAmount), 0),
    pendingCount: settlements.filter(s => s.status === 'PENDING').length,
  };

  const filteredSettlements = settlements.filter(s => {
    const matchesSearch = s.company?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">

        {/* 👑 Premium Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Санхүү & Settlement</h1>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Карго компаниудын төлбөр тооцооны удирдлага
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="btn-ghost btn-sm text-slate-400 hover:text-slate-600">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Шинэ тооцоолол</span>
            </button>
          </div>
        </div>

        {/* 📊 Animated KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Нийт шилжүүлсэн"
            value={`₮${stats.totalSettled.toLocaleString()}`}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Хүлээгдэж буй дүн"
            value={`₮${stats.pendingAmount.toLocaleString()}`}
            icon={Clock}
            color="amber"
            active
          />
          <StatCard
            label="Хүлээгдэж буй тоо"
            value={stats.pendingCount}
            icon={ArrowRightLeft}
            color="blue"
          />
        </div>

        {/* Filters & Content */}
        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col">

          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar w-fit">
              {['ALL', 'PENDING', 'COMPLETED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                                        ${statusFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab === 'ALL' ? 'Бүгд' : tab === 'PENDING' ? 'Хүлээгдэж буй' : 'Дууссан'}
                </button>
              ))}
            </div>
            <div className="relative group w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Карго компаниар хайх..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence>
              {loading && settlements.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                ))
              ) : filteredSettlements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <DollarSign className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-bold">Тооцоолол байхгүй</p>
                </div>
              ) : (
                filteredSettlements.map((s, i) => (
                  <SettlementCard
                    key={s.id}
                    data={s}
                    isExpanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onTransfer={(e: any, body: any) => markTransferred(s.id, e, body)}
                    onAction={(id: string, action: string, body: any) => onAction(id, action, body)}
                    index={i}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ✨ Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                    <Wallet className="w-7 h-7 text-violet-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Шинэ тооцоолол</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">
                    Сонгосон карго компанийн сүүлийн 7 хоногийн орлогыг тооцоолж settlement үүсгэнэ.
                  </p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Карго компани</label>
                    <div className="relative">
                      <select
                        value={companyId}
                        onChange={e => setCompanyId(e.target.value)}
                        className="w-full text-base font-bold text-slate-900 bg-slate-50 border-none rounded-2xl p-4 appearance-none focus:ring-2 focus:ring-violet-500/20"
                      >
                        <option value="">Компани сонгох...</option>
                        {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Цуцлах
                    </button>
                    <button
                      onClick={generate}
                      disabled={creating || !companyId}
                      className="flex-[2] py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                      {creating ? 'Үүсгэж байна...' : 'Тооцоолол үүсгэх'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ═══ Components ═══

function StatCard({ label, value, icon: Icon, color, active }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className={`p-6 rounded-[24px] border transition-all duration-300 ${active ? 'bg-white shadow-xl border-slate-200 ring-2 ring-violet-500/10' : 'bg-white border-slate-200/60'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {active && <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />}
      </div>
      <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function SettlementCard({ data, isExpanded, onToggle, onTransfer, onAction, index }: any) {
  const isPending = data.status === 'PENDING';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`overflow-hidden rounded-[24px] border transition-all duration-300 ${isExpanded ? 'bg-white shadow-xl ring-2 ring-violet-500/10 border-transparent' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
        }`}
    >
      <div onClick={onToggle} className="p-5 flex items-center justify-between cursor-pointer gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {data.company?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-900 truncate">{data.company?.name}</h3>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                {isPending ? 'Хүлээгдэж буй' : 'Дууссан'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(data.periodStart).toLocaleDateString('mn-MN')} — {new Date(data.periodEnd).toLocaleDateString('mn-MN')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-lg font-black text-slate-900 tracking-tight">₮{Number(data.netAmount).toLocaleString()}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Цэвэр дүн</div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'bg-slate-100 rotate-180' : 'text-slate-400'}`}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50"
          >
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Тооцооллын задаргаа</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-600">Нийт тээврийн орлого</span>
                  <span className="font-bold text-slate-900">₮{Number(data.totalShippingRevenue).toLocaleString()}</span>
                </div>
                <div className="space-y-1 pt-2 border-t border-dashed border-slate-200">
                  <div className="flex justify-between items-center text-xs text-rose-500 font-medium">
                    <span>Zamex шимтгэл (Platform Fee)</span>
                    <span>-₮{Number(data.totalPlatformFees).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-rose-500 font-medium">
                    <span>Банкны шимтгэл (QPay)</span>
                    <span>-₮{Number(data.totalQpayFees).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-rose-500 font-medium">
                    <span>Буцаалт (Refunds)</span>
                    <span>-₮{Number(data.totalRefunds).toLocaleString()}</span>
                  </div>
                </div>

                {data.carrierId && (
                  <div className="pt-4 space-y-2 border-t border-slate-100 border-dashed">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Original Amount:</span>
                      <span>₮{Number(data.originalAmount || data.netAmount).toLocaleString()}</span>
                    </div>
                    {data.adjustmentAmount !== 0 && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-amber-600">
                        <span>Adjustment:</span>
                        <span>{data.adjustmentAmount > 0 ? '+' : ''}₮{Number(data.adjustmentAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {data.adjustmentNote && (
                      <div className="p-2 bg-amber-50 rounded-lg text-[10px] text-amber-700 italic border border-amber-100/50">
                        "{data.adjustmentNote}"
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 leading-none">Шилжүүлэх дүн</span>
                    {data.carrierId && <span className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-tighter">Transport Share</span>}
                  </div>
                  <span className="font-black text-xl text-violet-600">₮{Number(data.netAmount).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions & Bank Info */}
              <div className="flex flex-col space-y-4">
                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Төлбөр хүлээн авах сувгууд</h4>
                    <span className="text-[9px] font-bold text-slate-300 uppercase">{data.company?.paymentAccounts?.length || 0} бүртгэлтэй</span>
                  </div>

                  <div className="space-y-3">
                    {data.company?.paymentAccounts?.length > 0 ? (
                      data.company.paymentAccounts.map((acc: any) => (
                        <div key={acc.id} className={`p-3 rounded-2xl border transition-all ${acc.isDefault ? 'bg-violet-50/30 border-violet-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] ${acc.type.includes('BANK') ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                              {acc.type.split('_')[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-black text-slate-900 truncate">{acc.providerName || acc.type}</div>
                                {acc.isDefault && <span className="px-1.5 py-0.5 rounded bg-violet-600 text-[8px] font-black text-white uppercase tracking-tighter">Default</span>}
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold truncate">
                                {acc.accountNumber || acc.identifier || 'Дугааргүй'}
                              </div>
                              {acc.accountName && <div className="text-[9px] text-slate-400 font-medium truncate italic">{acc.accountName}</div>}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Fallback to old flat fields if no collection exists yet */
                      <div className="space-y-4">
                        {(data.company?.bankAccountMn || data.company?.bankNameMn) && (
                          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 items-center flex gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-blue-500" /> Bank Transfer
                            </div>
                            <div className="text-xs font-bold text-slate-900">{data.company?.bankNameMn}</div>
                            <div className="text-[10px] font-bold text-slate-500">{data.company?.bankAccountMn}</div>
                            <div className="text-[9px] font-medium text-slate-400 italic">{data.company?.bankAccountNameMn}</div>
                          </div>
                        )}
                        {(data.company?.wechatId || data.company?.alipayId) && (
                          <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 items-center flex gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" /> Digital Wallets
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[8px] text-slate-400 font-black uppercase">WeChat</div>
                                <div className="text-[10px] font-bold text-slate-900">{data.company?.wechatId || '—'}</div>
                              </div>
                              <div>
                                <div className="text-[8px] text-slate-400 font-black uppercase">Alipay</div>
                                <div className="text-[10px] font-bold text-slate-900">{data.company?.alipayId || '—'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {!(data.company?.bankAccountMn || data.company?.wechatId || data.company?.alipayId) && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Дансны мэдээлэл бүртгэгдээгүй</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Logic for Carrier Settlements */}
                {data.carrierId && data.status !== 'COMPLETED' && (
                  <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider">Approval & Verification</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border flex flex-col gap-1 ${data.hubApprovalStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Hub Admin</span>
                        <div className="flex items-center gap-1.5">
                          {data.hubApprovalStatus === 'APPROVED' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                          <span className="text-[10px] font-bold text-slate-700">{data.hubApprovalStatus || 'WAITING'}</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border flex flex-col gap-1 ${data.carrierApprovalStatus === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-200' : data.carrierApprovalStatus === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Carrier Admin</span>
                        <div className="flex items-center gap-1.5">
                          {data.carrierApprovalStatus === 'ACCEPTED' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : data.carrierApprovalStatus === 'REJECTED' ? <X className="w-3 h-3 text-rose-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                          <span className="text-[10px] font-bold text-slate-700">{data.carrierApprovalStatus || 'WAITING'}</span>
                        </div>
                      </div>
                    </div>

                    {data.status === 'DISPUTED' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Тээвэрлэгч тооцоог үл зөвшөөрсөн байна. Дахин хянана уу.</span>
                      </div>
                    )}

                    {/* Cargo Hub Actions */}
                    {data.hubApprovalStatus === 'PENDING' && (
                      <div className="space-y-3 pt-2 border-t border-indigo-100">
                        <div className="flex gap-2">
                          <input type="number" placeholder="Adjustment (+/-)" className="flex-1 p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold" onBlur={(e) => data._adj = e.target.value} />
                          <input type="text" placeholder="Note" className="flex-[2] p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold" onBlur={(e) => data._note = e.target.value} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => onAction(data.id, 'hub-review', { adjustmentAmount: data._adj, adjustmentNote: data._note, status: data._adj ? 'ADJUSTED' : 'APPROVED' })} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Hub Approve</button>
                        </div>
                      </div>
                    )}

                    {/* Carrier Actions */}
                    {data.hubApprovalStatus !== 'PENDING' && data.carrierApprovalStatus === 'PENDING' && (
                      <div className="flex gap-2 pt-2 border-t border-indigo-100">
                        <button onClick={() => onAction(data.id, 'carrier-review', { status: 'ACCEPTED' })} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Accept Amount</button>
                        <button onClick={() => onAction(data.id, 'carrier-review', { status: 'REJECTED' })} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Dispute</button>
                      </div>
                    )}
                  </div>
                )}

                {isPending && (data.status === 'CARRIER_ACCEPTED' || !data.carrierId) ? (
                  <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                    <div className="flex gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900">Шилжүүлэг баталгаажуулах</h4>
                        <p className="text-xs text-amber-700 mt-1">Гүйлгээний баримт хавсаргаж хаана уу.</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <input
                        type="text"
                        placeholder="Гүйлгээний утга/утга (Reference)"
                        className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                        onBlur={(e) => (data._transferRef = e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Баримтын URL (Screenshot Link)"
                        className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                        onBlur={(e) => (data._receiptUrl = e.target.value)}
                      />
                    </div>

                    <button
                      onClick={(e) => {
                        const ref = data._transferRef || `TR-${Date.now()}`;
                        const receipt = data._receiptUrl;
                        onTransfer(e, { transferReference: ref, transferReceiptUrl: receipt });
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Шилжүүлсэн гэж тэмдэглэх</span>
                    </button>
                  </div>
                ) : data.status === 'COMPLETED' ? (
                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-900">Шилжүүлсэн</h4>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">{new Date(data.transferredAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {data.transferReceiptUrl && (
                        <a
                          href={data.transferReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-white p-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> ГҮЙЛГЭЭНИЙ БАРИМТ
                        </a>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">REFERENCE: {data.transferReference}</div>
                  </div>
                ) : data.carrierId && data.status !== 'CARRIER_ACCEPTED' ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Батлах процесс хүлээгдэж байна</p>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
