'use client';

import { useEffect, useState } from 'react';
import {
    AlertTriangle, Search, Filter, ChevronRight,
    Calendar, User, Building2, Clock, CheckCircle2,
    XCircle, Info, MoreHorizontal, ArrowLeft,
    Image as ImageIcon, ZoomIn, X, Wallet,
    Shield, Check
} from 'lucide-react';
import { api, getMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selected, setSelected] = useState<any>(null);
    const [reviewing, setReviewing] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [approvedAmount, setApprovedAmount] = useState<number>(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Stats
    const stats = {
        total: returns.length,
        opened: returns.filter(r => r.status === 'OPENED').length,
        review: returns.filter(r => r.status === 'UNDER_REVIEW').length,
        resolved: returns.filter(r => ['APPROVED', 'REJECTED', 'RESOLVED'].includes(r.status)).length,
    };

    useEffect(() => { loadReturns(); }, [statusFilter]);

    const loadReturns = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/returns', {
                params: { status: statusFilter !== 'ALL' ? statusFilter : undefined }
            });
            setReturns(data.data.returns);
        } catch (err) {
            toast.error('Буцаалтын жагсаалт авахад алдаа гарлаа');
        } finally { setLoading(false); }
    };

    const handleReview = async (id: string, status: string) => {
        setReviewing(true);
        try {
            await api.patch(`/returns/${id}/review`, {
                status,
                reviewNotes,
                approvedAmount: status === 'APPROVED' ? Number(approvedAmount) : 0
            });
            toast.success('Амжилттай шийдвэрлэлээ');
            setSelected(null);
            setReviewNotes('');
            setApprovedAmount(0);
            loadReturns();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        } finally { setReviewing(false); }
    };

    const filteredReturns = returns.filter(r =>
        r.returnCode.toLowerCase().includes(search.toLowerCase()) ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.customer?.firstName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">

                {/* 👑 Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Буцаалт шийдвэрлэлт</h1>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Гомдол, буцаалт, нөхөн олговрын хүсэлтүүд
                        </p>
                    </div>
                </div>

                {/* 📊 Animated Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Нийт гомдол" value={stats.total} icon={AlertTriangle} color="slate" />
                    <StatCard label="Шинэ хүсэлт" value={stats.opened} icon={Clock} color="rose" active />
                    <StatCard label="Хянаж буй" value={stats.review} icon={Search} color="amber" />
                    <StatCard label="Шийдвэрлэсэн" value={stats.resolved} icon={CheckCircle2} color="emerald" />
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-320px)] min-h-[600px]">

                    {/* List Panel */}
                    <div className={`lg:w-[420px] flex flex-col bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-500 ${selected ? 'hidden lg:flex' : 'flex'}`}>
                        {/* List Header */}
                        <div className="p-5 border-b border-slate-100 space-y-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                                {['ALL', 'OPENED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusFilter(tab)}
                                        className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                                            ${statusFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab === 'ALL' ? 'Бүгд' : tab === 'OPENED' ? 'Шинэ' : tab === 'UNDER_REVIEW' ? 'Хянах' : tab === 'APPROVED' ? 'Баталсан' : 'Татгалзсан'}
                                    </button>
                                ))}
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Код, нэрээр хайх..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* List Items */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                                    ))
                                ) : filteredReturns.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                                        <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="text-sm font-bold">Хүсэлт олдсонгүй</p>
                                    </div>
                                ) : filteredReturns.map((item, i) => (
                                    <motion.button
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelected(item)}
                                        className={`w-full p-4 rounded-[24px] border text-left transition-all duration-300 group relative overflow-hidden
                                            ${selected?.id === item.id
                                                ? 'border-purple-600 bg-slate-900 text-white shadow-xl shadow-purple-900/20 scale-[1.02]'
                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${selected?.id === item.id ? 'text-slate-400' : 'text-purple-600'}`}>
                                                {item.returnCode}
                                            </span>
                                            <StatusBadge status={item.status} small />
                                        </div>
                                        <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2">{item.title}</h3>
                                        <div className="flex items-center gap-2 text-[11px] opacity-60 font-medium">
                                            <span>{item.customer?.firstName}</span>
                                            <span className="w-1 h-1 rounded-full bg-current" />
                                            <span>{new Date(item.createdAt).toLocaleDateString('mn-MN')}</span>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={selected.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 bg-white rounded-[40px] border border-slate-200/60 shadow-2xl shadow-slate-200/50 flex flex-col overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-50/50 rounded-full -mr-24 -mt-24 pointer-events-none" />

                                {/* Detail Header */}
                                <div className="p-8 pb-6 border-b border-slate-100 relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                                        <div className="flex items-start gap-5">
                                            <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center shadow-lg text-rose-500 flex-shrink-0">
                                                <AlertTriangle className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                        {selected.returnType.replace(/_/g, ' ')}
                                                    </span>
                                                    <StatusBadge status={selected.status} />
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selected.title}</h2>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        {(selected.status === 'OPENED' || selected.status === 'UNDER_REVIEW') && (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Нөхөн төлбөр (₮)</label>
                                                    <input
                                                        type="number"
                                                        value={approvedAmount}
                                                        onChange={e => setApprovedAmount(Number(e.target.value))}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleReview(selected.id, 'APPROVED')} disabled={reviewing}
                                                        className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                                        Батлах
                                                    </button>
                                                    <button onClick={() => handleReview(selected.id, 'REJECTED')} disabled={reviewing}
                                                        className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95">
                                                        Татгалзах
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Liability Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Захиалагч</div>
                                                <div className="font-bold text-slate-900">{selected.customer?.firstName}</div>
                                                <div className="text-xs font-medium text-slate-500">{selected.customer?.phone}</div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-4 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-4 -mt-4" />
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-rose-100 shadow-sm text-rose-500 relative z-10">
                                                <Info className="w-5 h-5" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Хариуцагч тал</div>
                                                <div className="font-bold text-rose-900">{getPartyLabel(selected.liableParty)}</div>
                                                <div className="text-[10px] font-semibold text-rose-600/80 leading-tight mt-0.5">{selected.liabilityReason}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Scroll */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Гомдлын дэлгэрэнгүй</h3>
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-700 leading-relaxed text-justify">
                                            {selected.description}
                                        </div>
                                    </div>

                                    {/* Evidence Photos */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Нотолгоо зургууд
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {selected.evidencePhotos?.length > 0 ? (
                                                selected.evidencePhotos.map((img: string, i: number) => (
                                                    <div key={i} onClick={() => setPreviewImage(img)} className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 group relative cursor-zoom-in shadow-sm hover:shadow-lg transition-all">
                                                        <img src={getMediaUrl(img)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <div className="p-2 bg-white/90 backdrop-blur rounded-xl shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                                                                <ZoomIn className="w-5 h-5 text-slate-900" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
                                                    <span className="text-xs font-bold text-slate-400">Зураг оруулаагүй байна</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Notes Input */}
                                    {(selected.status === 'OPENED' || selected.status === 'UNDER_REVIEW') && (
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <h4 className="text-sm font-black text-slate-900">Шийдвэрийн тайлбар</h4>
                                            </div>
                                            <textarea
                                                className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none text-sm font-medium text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                                                placeholder="шийдвэр гаргах болсон шалтгаан, нэмэлт тайлбар..."
                                                value={reviewNotes}
                                                onChange={e => setReviewNotes(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                            </motion.div>
                        ) : (
                            <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-slate-200 border-dashed">
                                <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mb-6 relative group">
                                    <AlertTriangle className="w-14 h-14 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Хүсэлт сонгоно уу</h2>
                                <p className="text-slate-400 max-w-sm font-medium">Зүүн талын жагсаалтаас буцаалтын хүсэлт сонгож дэлгэрэнгүй мэдээллийг харна уу.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Lightbox */}
                <AnimatePresence>
                    {previewImage && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setPreviewImage(null)}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
                        >
                            <motion.img
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                src={getMediaUrl(previewImage)}
                                className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <X className="w-8 h-8" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ═══ Helpers ═══

function StatCard({ label, value, icon: Icon, color, active }: any) {
    const colors: any = {
        slate: 'bg-slate-50 text-slate-600',
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <div className={`p-5 rounded-[24px] border transition-all duration-300 ${active ? 'bg-white shadow-xl border-slate-200 ring-2 ring-rose-500/10' : 'bg-white border-slate-200/60'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {active && <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</div>
        </div>
    );
}

function StatusBadge({ status, small }: any) {
    const s: any = {
        OPENED: { label: 'Шинэ', bg: 'bg-blue-100', text: 'text-blue-700' },
        UNDER_REVIEW: { label: 'Хянаж буй', bg: 'bg-amber-100', text: 'text-amber-700' },
        APPROVED: { label: 'Батлагдсан', bg: 'bg-emerald-100', text: 'text-emerald-700' },
        REJECTED: { label: 'Татгалзсан', bg: 'bg-rose-100', text: 'text-rose-700' },
        RESOLVED: { label: 'Шийдвэрлэсэн', bg: 'bg-slate-100', text: 'text-slate-700' },
    };
    const c = s[status] || s.OPENED;
    return (
        <span className={`${small ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'} rounded-lg font-black uppercase tracking-wider ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

function getPartyLabel(party: string) {
    const p: any = {
        'CARGO_TRANSIT': 'Карго (Тээвэр)',
        'CARGO_MONGOLIA': 'Карго (Монгол)',
        'CHINA_CARRIER': 'Хятад тээвэр',
        'SELLER': 'Худалдагч',
        'CUSTOMER': 'Заخیалагч',
        'UNDETERMINED': 'Тодорхойгүй'
    };
    return p[party] || party;
}
