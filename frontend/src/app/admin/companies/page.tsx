'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Building2, Star, Users, Search, X, ChevronRight,
  TrendingUp, ShieldCheck, Activity, Phone, MoreHorizontal,
  Settings2, Trash2, ExternalLink, Mail, CheckCircle2,
  AlertCircle, Globe, Wallet
} from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ToggleSwitch } from '../settings/page';

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    slug: '',
    codePrefix: '',
    phone: '',
    email: '',
    description: '',
    cargoType: 'ERLIAN_UB',
    isVerified: false,
    selectedSpecializations: [] as string[],
    bankNameMn: '',
    bankAccountMn: '',
    bankAccountNameMn: '',
    wechatId: '',
    alipayId: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [showPayments, setShowPayments] = useState<any>(null); // Company object if showing payments
  const [showPenalties, setShowPenalties] = useState<any>(null); // Company object if showing penalties

  useEffect(() => {
    load();
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    let specs = [];
    try {
      const { data } = await api.get('/specializations');
      specs = data.data.specializations || [];
    } catch {
      specs = [
        { id: 'spec_1', nameMn: 'Хувцас, загвар', slug: 'clothing' },
        { id: 'spec_2', nameMn: 'Электрон бараа', slug: 'electronics' },
        { id: 'spec_3', nameMn: 'Овор ихтэй ачаа', slug: 'oversized' },
        { id: 'spec_4', nameMn: 'Шингэн бараа, гоо сайхан', slug: 'liquids' },
        { id: 'spec_5', nameMn: 'Авто сэлбэг, техник', slug: 'autoparts' },
        { id: 'spec_6', nameMn: 'Хүнс, түргэн муудах', slug: 'food' },
        { id: 'spec_7', nameMn: 'Хагарч болзошгүй', slug: 'fragile' },
        { id: 'spec_8', nameMn: 'Бичиг хэрэг, ном', slug: 'stationery' },
        { id: 'spec_9', nameMn: 'Барилгын материал', slug: 'construction' },
        { id: 'spec_10', nameMn: 'Гэр ахуй, тавилга', slug: 'home' },
        { id: 'spec_11', nameMn: 'Батарей, аюултай ачаа', slug: 'dangerous' },
        { id: 'spec_12', nameMn: 'Эм, бэлдмэл', slug: 'medicine' },
      ];
    }
    setSpecializations(specs);
    setForm(prev => ({ ...prev, selectedSpecializations: specs.map((s: any) => s.id) }));
  };

  const load = async () => {
    try {
      const { data } = await api.get('/companies');
      setCompanies(data.data.companies);
    } catch {
      toast.error('Дата ачааллахад алдаа гарлаа');
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.codePrefix) {
      toast.error('Нэр, код оруулна уу');
      return;
    }
    setSaving(true);
    try {
      await api.post('/companies', {
        ...form,
        specializationIds: form.selectedSpecializations
      });
      toast.success('Компани амжилттай нэмэгдлээ');
      setShowAdd(false);
      setForm({
        name: '', nameEn: '', slug: '', codePrefix: '', phone: '', email: '',
        description: '', cargoType: 'ERLIAN_UB', isVerified: false,
        selectedSpecializations: specializations.map(s => s.id),
        bankNameMn: '', bankAccountMn: '', bankAccountNameMn: '',
        wechatId: '', alipayId: '',
      });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    }
    setSaving(false);
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await api.patch(`/companies/${id}`, { isActive: !current });
      toast.success('Төлөв амжилттай солигдлоо');
      load();
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  const deleteCompany = async (id: string) => {
    if (!confirm('Энэ компанийг устгахдаа итгэлтэй байна уу?')) return;
    try {
      await api.delete(`/companies/${id}`);
      toast.success('Компани устгагдлаа');
      load();
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  const filtered = companies.filter(c => {
    const matchesSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.codePrefix?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'ALL' ||
      (activeTab === 'ACTIVE' && c.isActive) ||
      (activeTab === 'INACTIVE' && !c.isActive);
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.isActive).length,
    delivering: 4280, // Simulation
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-10">

        {/* 👑 Premium Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Карго Компаниуд</h1>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Тээвэрлэгч түншүүдийн нэгдсэн удирдлагын төв
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> ШИНЭ КОМПАНИ НЭМЭХ
          </button>
        </div>

        {/* 📊 KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CompanyStatCard
            label="Нийт компани" value={stats.total} icon={Building2} color="slate" trend="+2"
            subLabel="Системд бүртгэлтэй"
          />
          <CompanyStatCard
            label="Идэвхтэй" value={stats.active} icon={CheckCircle2} color="emerald" trend="none"
            subLabel="Үйл ажиллагаа хэвийн"
          />
          <CompanyStatCard
            label="Түр зогссон" value={stats.total - stats.active} icon={AlertCircle} color="amber" trend="none"
            subLabel="Идэвхгүй төлөвтэй"
          />
          <CompanyStatCard
            label="Дундаж үнэлгээ" value="4.8" icon={Star} color="purple" trend="+0.2"
            subLabel="Хэрэглэгчдийн сэтгэл ханамж"
          />
        </div>

        {/* 🔍 Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Компанийн нэр эсвэл кодоор хайх..."
              className="w-full pl-11 pr-4 py-4 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? 'bg-white text-slate-900 shadow-md border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'ALL' ? 'Бүгд' : tab === 'ACTIVE' ? 'Идэвхтэй' : 'Идэвхгүй'}
              </button>
            ))}
          </div>
        </div>

        {/* 🏗️ Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card p-8 bg-white border border-purple-200 shadow-2xl shadow-purple-500/5 space-y-8 relative overflow-hidden rounded-[40px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </div>
                      Шинэ компани бүртгэх
                    </h3>
                    <button onClick={() => setShowAdd(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"><X className="w-6 h-6" /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormInput label="Компанийн нэр *" value={form.name} onChange={(v: string) => setForm({ ...form, name: v, slug: v.toLowerCase().replace(/\s+/g, '-') })} placeholder="Гэрэгэ Карго" />
                    <FormInput label="Англи нэр" value={form.nameEn} onChange={(v: string) => setForm({ ...form, nameEn: v })} placeholder="Gerege Cargo LLC" />
                    <FormInput label="Техник код *" value={form.codePrefix} onChange={(v: string) => setForm({ ...form, codePrefix: v.toUpperCase() })} maxLength={4} placeholder="CGE1" mono />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Тээвэрлэлтийн төрөл</label>
                      <select value={form.cargoType} onChange={e => setForm({ ...form, cargoType: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-0 transition-all font-bold text-slate-900 outline-none">
                        <option value="ERLIAN_UB">Эрээн & УБ салбартай</option>
                        <option value="ERLIAN_ONLY">Зөвхөн Эрээн салбартай</option>
                        <option value="UB_ONLY">Зөвхөн УБ салбартай</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    <FormInput label="Утас" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} placeholder="9911...." icon={Phone} />
                    <FormInput label="И-мэйл" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} placeholder="contact@zamex.mn" icon={Mail} />
                    <div className="space-y-2 flex flex-col justify-end">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between h-[58px]">
                        <span className="text-xs font-bold text-slate-600">БАГАЛГААЖСАН ЭСЭХ</span>
                        <button onClick={() => setForm({ ...form, isVerified: !form.isVerified })} className={`w-12 h-6 rounded-full transition-all relative ${form.isVerified ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isVerified ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Мэргэшсэн чиглэлүүд (Specializations)</label>
                      <button onClick={() => {
                        const allIds = specializations.map(s => s.id);
                        setForm({ ...form, selectedSpecializations: form.selectedSpecializations.length === allIds.length ? [] : allIds });
                      }} className="text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest underline decoration-2 underline-offset-4">
                        {form.selectedSpecializations.length === specializations.length ? 'Бүгдийг цуцлах' : 'Бүгдийг сонгох'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                      {specializations.map(s => (
                        <button key={s.id} onClick={() => {
                          const sel = form.selectedSpecializations.includes(s.id)
                            ? form.selectedSpecializations.filter(id => id !== s.id)
                            : [...form.selectedSpecializations, s.id];
                          setForm({ ...form, selectedSpecializations: sel });
                        }} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${form.selectedSpecializations.includes(s.id) ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'}`}>
                          {s.nameMn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 mt-8">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Санхүү болон Төлбөр хүлээн авах мэдээлэл</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50 border border-slate-200 rounded-[32px]">
                      <FormInput label="Банкны нэр (MN)" value={form.bankNameMn} onChange={(v: string) => setForm({ ...form, bankNameMn: v })} placeholder="Хаан Банк" />
                      <FormInput label="Дансны дугаар" value={form.bankAccountMn} onChange={(v: string) => setForm({ ...form, bankAccountMn: v })} placeholder="5000......" />
                      <FormInput label="Дансны нэр" value={form.bankAccountNameMn} onChange={(v: string) => setForm({ ...form, bankAccountNameMn: v })} placeholder="Гэрэгэ Карго ХХК" />
                      <FormInput label="WeChat ID" value={form.wechatId} onChange={(v: string) => setForm({ ...form, wechatId: v })} placeholder="wechat_id" />
                      <FormInput label="Alipay ID" value={form.alipayId} onChange={(v: string) => setForm({ ...form, alipayId: v })} placeholder="alipay_account" />
                    </div>
                  </div>

                  <div className="space-y-2 mt-8">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Компанийн дэлгэрэнгүй тайлбар</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:border-purple-500 focus:ring-0 transition-all font-medium text-slate-900 min-h-[120px] resize-none" placeholder="Бизнесийн тухай мэдээлэл..." />
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button onClick={handleAdd} disabled={saving} className="flex-1 py-5 bg-purple-600 text-white rounded-3xl font-black text-sm shadow-2xl shadow-purple-300 active:scale-95 transition-all uppercase tracking-widest">
                      {saving ? 'ТҮР ХҮЛЭЭНЭ ҮҮ...' : 'ШИНЭ КОМПАНИЙГ ХАДГАЛАХ'}
                    </button>
                    <button onClick={() => setShowAdd(false)} className="px-12 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-sm hover:bg-slate-200 transition-all uppercase tracking-widest">
                      ЦУЦЛАХ
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📋 Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <PremiumCompanyCard
                  company={c}
                  onManage={(comp: any) => setShowPayments(comp)}
                  onManagePenalties={(comp: any) => setShowPenalties(comp)}
                  onToggle={() => toggleStatus(c.id, c.isActive)}
                  onDelete={() => deleteCompany(c.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 🔍 Empty State */}
        {filtered.length === 0 && (
          <div className="card p-24 text-center bg-white border border-slate-200/60 shadow-sm border-dashed rounded-[48px] flex flex-col items-center justify-center">
            <div className="w-28 h-28 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 relative">
              <Building2 className="w-14 h-14 text-slate-200" />
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Үр дүн олдсонгүй</h3>
            <p className="text-slate-400 font-medium mt-4 max-w-sm mx-auto">Таны хайлтын нөхцөлд тохирох компани байхгүй байна. Шүүлтүүрээ өөрчилнө үү.</p>
            <button onClick={() => { setSearch(''); setActiveTab('ALL'); }} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-600 transition-all active:scale-95 shadow-xl shadow-slate-200">
              Бүх шүүлтүүрийг цэвэрлэх
            </button>
          </div>
        )}
        {/* Payment Methods Modal */}
        <PaymentMethodsModal
          company={showPayments}
          onClose={() => setShowPayments(null)}
          onRefresh={load}
        />
        {/* Penalty Modal */}
        <PenaltyModal
          company={showPenalties}
          onClose={() => setShowPenalties(null)}
          onRefresh={load}
        />
      </div>
    </div>
  );
}

// ═══ Styled Helper Components ═══

function FormInput({ label, value, onChange, placeholder, maxLength, mono, icon: Icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-11' : 'px-5'} p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-0 transition-all font-bold text-slate-900 outline-none ${mono ? 'font-mono uppercase' : ''}`}
        />
      </div>
    </div>
  );
}

function CompanyStatCard({ label, value, icon: Icon, color, trend, subLabel }: any) {
  const colors: any = {
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="card p-8 bg-white border border-slate-200/60 shadow-sm group hover:shadow-2xl transition-all duration-500 relative overflow-hidden rounded-[32px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-sm border`}>
            <Icon className="w-7 h-7" />
          </div>
          {trend !== 'none' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600">{trend}</span>
            </div>
          )}
        </div>
        <div className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter mb-2">{value}</div>
        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
        <p className="text-[10px] text-slate-400 font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">{subLabel}</p>
      </div>
    </div>
  );
}

function PremiumCompanyCard({ company, onManage, onManagePenalties, onToggle, onDelete }: any) {
  const r = company.ratingsSummary;

  return (
    <div className="card bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden group rounded-[40px]">
      <div className="p-8 space-y-7">
        {/* Card Top */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-slate-200 group-hover:bg-purple-600 group-hover:rotate-3 transition-all duration-500">
                {company.codePrefix.slice(0, 4)}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center ${company.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <h3 className="text-lg font-black text-slate-900 max-w-[180px] group-hover:text-purple-700 transition-colors uppercase tracking-tight leading-none">{company.name}</h3>
                {company.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-50" />}
                {/* Strikes Indicator */}
                {company.strikeCount > 0 && (
                  <div className="flex items-center gap-0.5 px-2 py-0.5 bg-red-50 rounded-lg border border-red-100">
                    {[...Array(company.strikeCount)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl uppercase">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> {company.cargoType?.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-300" /> {company.nameEn || 'Нэр оруулаагүй'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); onManage(company); }}
              title="Төлбөрийн данс удирдах"
              className="p-3 hover:bg-violet-50 text-slate-400 hover:text-violet-600 rounded-2xl transition-all"
            >
              <Wallet className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onManagePenalties(company); }} // New handler
              title="Зөрчил / Strikes"
              className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all relative"
            >
              <AlertCircle className="w-5 h-5" />
              {company.strikeCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />}
            </button>
            <button onClick={onToggle} title="Төлөв солих" className="p-3 hover:bg-slate-50 text-slate-400 hover:text-purple-600 rounded-2xl transition-all">
              <Activity className="w-5 h-5" />
            </button>
            <button onClick={onDelete} title="Устгах" className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Specializations Preview */}
        <div className="flex flex-wrap gap-2">
          {company.specializations?.slice(0, 3).map((s: any) => (
            <span key={s.id} className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">
              {s.nameMn}
            </span>
          ))}
          {company.specializations?.length > 3 && (
            <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-3 py-1.5 rounded-xl">
              +{company.specializations.length - 3}
            </span>
          )}
        </div>

        {/* Simulated Activity Graph */}
        <div className="h-14 w-full flex items-end justify-between gap-1.5 px-1">
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={i} initial={{ height: 6 }}
              animate={{ height: [12, 32, 18, 44, 22, 54, 34, 16][i % 8] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.08, repeatType: 'reverse' }}
              className={`w-full rounded-full transition-all duration-700 ${company.isActive ? 'bg-purple-100 group-hover:bg-purple-600/20' : 'bg-slate-50'}`}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-6 py-8 border-y border-slate-50">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Deliveries</p>
            <div className="text-xl font-black text-slate-900 tabular-nums flex items-center gap-3">
              {r?.totalDelivered || 0}
              <div className="text-[10px] text-emerald-500 font-black bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 12%
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Quality Score</p>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(r?.averageRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
                ))}
              </div>
              <span className="text-xl font-black text-slate-900">{Number(r?.averageRating || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            {company.phone && (
              <button title={company.phone} className="w-11 h-11 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                <Phone className="w-5 h-5" />
              </button>
            )}
            {company.email && (
              <button title={company.email} className="w-11 h-11 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                <Mail className="w-5 h-5" />
              </button>
            )}
          </div>

          <button onClick={onManage} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.1em] hover:bg-purple-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
            Manage Center
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsModal({ company, onClose, onRefresh }: any) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'BANK_MN',
    providerName: '',
    accountNumber: '',
    accountName: '',
    identifier: '',
    isDefault: false
  });

  useEffect(() => {
    if (company) loadAccounts();
  }, [company]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/companies/${company.id}/payment-accounts`);
      setAccounts(data.data.accounts);
    } catch { }
    setLoading(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post(`/companies/${company.id}/payment-accounts`, form);
      toast.success('Данс амжилттай нэмэгдлээ');
      setShowAdd(false);
      setForm({ type: 'BANK_MN', providerName: '', accountNumber: '', accountName: '', identifier: '', isDefault: false });
      loadAccounts();
      onRefresh();
    } catch {
      toast.error('Алдаа гарлаа');
    }
    setSaving(false);
  };

  const toggleAccount = async (accId: string, current: boolean) => {
    try {
      await api.patch(`/companies/${company.id}/payment-accounts/${accId}`, { isActive: !current });
      loadAccounts();
      onRefresh();
    } catch { }
  };

  const setDefault = async (accId: string) => {
    try {
      await api.patch(`/companies/${company.id}/payment-accounts/${accId}`, { isDefault: true });
      loadAccounts();
      onRefresh();
    } catch { }
  };

  const deleteAccount = async (accId: string) => {
    if (!confirm('Дансыг устгах уу?')) return;
    try {
      await api.delete(`/companies/${company.id}/payment-accounts/${accId}`);
      loadAccounts();
      onRefresh();
    } catch { }
  };

  if (!company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{company.name}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Төлбөрийн хэрэгслүүд удирдах</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {showAdd ? (
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 space-y-6">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">Шинэ данс нэмэх</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Төрөл</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-violet-500">
                    <option value="BANK_MN">Монгол Банк (IBAN)</option>
                    <option value="WECHAT">WeChat Pay</option>
                    <option value="ALIPAY">Alipay</option>
                    <option value="BANK_CN">Хятад Банк</option>
                    <option value="OTHER">Бусад</option>
                  </select>
                </div>
                <FormInput label="Банк / Сувгийн нэр" value={form.providerName} onChange={(v: string) => setForm({ ...form, providerName: v })} placeholder="Хаан Банк, WeChat г.м" />
                {form.type.includes('BANK') ? (
                  <>
                    <FormInput label="Дансны дугаар" value={form.accountNumber} onChange={(v: string) => setForm({ ...form, accountNumber: v })} placeholder="5000..." />
                    <FormInput label="Дансны нэр" value={form.accountName} onChange={(v: string) => setForm({ ...form, accountName: v })} placeholder="Гэрэгэ ХХК" />
                  </>
                ) : (
                  <FormInput label="ID / Холбоос" value={form.identifier} onChange={(v: string) => setForm({ ...form, identifier: v })} placeholder="ID or Number" />
                )}
              </div>
              <div className="flex items-center gap-4 pt-2">
                <button onClick={handleCreate} disabled={saving} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Данс хадгалах</button>
                <button onClick={() => setShowAdd(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100">Цуцлах</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-all group">
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Шинэ төлбөрийн хэрэгсэл нэмэх</span>
            </button>
          )}

          <div className="space-y-4">
            {accounts.map(acc => (
              <div key={acc.id} className={`p-6 rounded-[32px] border transition-all flex items-center justify-between ${acc.isActive ? 'bg-white shadow-sm border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] ${acc.type.includes('BANK') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {acc.type.split('_')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">{acc.providerName || acc.type}</h4>
                      {acc.isDefault && <span className="px-2 py-0.5 rounded-lg bg-violet-600 text-[8px] font-black text-white uppercase tracking-tighter">Default</span>}
                    </div>
                    <p className="text-sm font-bold text-slate-500">{acc.accountNumber || acc.identifier}</p>
                    {acc.accountName && <p className="text-[10px] text-slate-400 font-medium italic">{acc.accountName}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!acc.isDefault && acc.isActive && (
                    <button onClick={() => setDefault(acc.id)} className="px-3 py-1.5 hover:bg-violet-50 text-violet-600 text-[10px] font-black uppercase rounded-lg">Үндсэн болгох</button>
                  )}
                  <ToggleSwitch checked={acc.isActive} onChange={() => toggleAccount(acc.id, acc.isActive)} />
                  <button onClick={() => deleteAccount(acc.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PenaltyModal({ company, onClose, onRefresh }: any) {
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) loadPenalties();
  }, [company]);

  const loadPenalties = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/companies/${company.id}/penalties`);
      setPenalties(data.data.penalties);
    } catch { }
    setLoading(false);
  };

  const handleAddPenalty = async () => {
    if (!reason || reason.length < 5) return toast.error('Шалтгаанаа дэлгэрэнгүй бичнэ үү');
    setSaving(true);
    try {
      await api.post(`/companies/${company.id}/penalties`, { reason });
      toast.success('Зөрчил бүртгэгдлээ');
      setReason('');
      loadPenalties();
      onRefresh();
    } catch {
      toast.error('Алдаа гарлаа');
    }
    setSaving(false);
  };

  const handleResolvePenalty = async (id: string) => {
    if (!confirm('Энэ зөрчлийг шийдвэрлэж, сануулгыг хасах уу?')) return;
    try {
      await api.delete(`/companies/${company.id}/penalties/${id}`);
      toast.success('Зөрчил шийдвэрлэгдлээ');
      loadPenalties();
      onRefresh();
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  if (!company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900">{company.name}</h2>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${i < company.strikeCount ? 'bg-red-500 animate-pulse' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-500" />
              Зөрчил & Сануулгын систем
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">

          {/* Add Penalty Form */}
          <div className="bg-white p-6 rounded-[32px] border border-red-100 shadow-xl shadow-red-500/5 space-y-4">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              Шинэ зөрчил бүртгэх (Strike)
            </h3>
            <div className="flex gap-3">
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Зөрчлийн шалтгаан (Жишээ: Ачаа дутсан, гомдол барагдуулаагүй...)"
                className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
              />
              <button
                onClick={handleAddPenalty}
                disabled={saving || !reason}
                className="px-6 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                НЭМЭХ
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium pl-1">
              * 3 дахь зөрчил (Strike) бүртгэгдвэл компанийн үйл ажиллагаа автоматаар зогсоно.
            </p>
          </div>

          {/* Penalties List */}
          <div className="space-y-4">
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-2">Зөрчлийн түүх ({penalties.length})</h3>

            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin" /></div>
            ) : penalties.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-sm bg-white rounded-[32px] border border-dashed border-slate-200">
                Одоогоор зөрчил бүртгэгдээгүй байна ✅
              </div>
            ) : (
              penalties.map((p) => (
                <div key={p.id} className={`p-6 rounded-[32px] border transition-all flex items-start justify-between group ${p.isActive ? 'bg-white border-red-100 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${p.isActive ? 'bg-red-50 text-red-500' : 'bg-slate-200 text-slate-400'}`}>
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${p.isActive ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'}`}>
                          {p.isActive ? 'Active Strike' : 'Resolved'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(p.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm leading-relaxed">{p.reason}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          👮‍♂️ {p.issuer?.firstName || 'Admin'}
                        </span>
                        {p.resolvedAt && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            ✅ Шийдвэрлэсэн: {new Date(p.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {p.isActive && (
                    <button
                      onClick={() => handleResolvePenalty(p.id)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                    >
                      Шийдвэрлэх
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

