'use client';

import { useEffect, useState } from 'react';
import {
    Shield, Check, X, Eye, Clock,
    Truck, User, Building2, ChevronLeft,
    ExternalLink, MapPin, Phone, Calendar,
    Filter, Search, Info, ArrowLeft,
    FileText, CheckCircle2, AlertCircle,
    MoreVertical, ZoomIn
} from 'lucide-react';
import { api, getMediaUrl } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VerificationsAdminPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);
    const [reviewing, setReviewing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'USER' | 'VEHICLE' | 'COMPANY'>('ALL');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [search, setSearch] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => { loadRequests(); }, [activeTab]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const params = activeTab !== 'ALL' ? { type: activeTab } : {};
            const { data } = await api.get('/verification', { params });
            const list = data.data;
            setRequests(list);

            // Calc stats
            setStats({
                total: list.length,
                pending: list.filter((r: any) => r.status === 'PENDING').length,
                approved: list.filter((r: any) => r.status === 'APPROVED').length,
                rejected: list.filter((r: any) => r.status === 'REJECTED').length,
            });
        } catch (err) {
            toast.error('Мэдээлэл авахад алдаа гарлаа');
        } finally { setLoading(false); }
    };

    const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !rejectionReason) {
            toast.error('Татгалзсан шалтгаанаа бичнэ үү');
            return;
        }
        setReviewing(true);
        try {
            await api.patch(`/verification/${id}/review`, { status, rejectionReason });
            toast.success(status === 'APPROVED' ? 'Амжилттай баталгаажууллаа' : 'Татгалзлаа');
            setSelected(null);
            setRejectionReason('');
            loadRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        } finally { setReviewing(false); }
    };

    const filteredRequests = requests.filter(r =>
        r.officialName?.toLowerCase().includes(search.toLowerCase()) ||
        r.registrationNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">

                {/* 👑 Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Баталгаажуулалт</h1>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-900" />
                            Хэрэглэгч, байгууллага, тээврийн хэрэгслийн хүсэлтүүд
                        </p>
                    </div>
                </div>

                {/* 📊 Animated Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Нийт хүсэлт" value={stats.total} icon={FileText} color="slate" />
                    <StatCard label="Хүлээгдэж буй" value={stats.pending} icon={Clock} color="amber" active />
                    <StatCard label="Баталгаажсан" value={stats.approved} icon={CheckCircle2} color="emerald" />
                    <StatCard label="Татгалзсан" value={stats.rejected} icon={X} color="rose" />
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-320px)] min-h-[600px]">

                    {/* List Panel */}
                    <div className={`lg:w-[450px] flex flex-col bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-500 ${selected ? 'hidden lg:flex' : 'flex'}`}>
                        {/* List Header */}
                        <div className="p-5 border-b border-slate-100 space-y-4 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                {(['ALL', 'USER', 'VEHICLE', 'COMPANY'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                            ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab === 'ALL' ? 'Бүгд' : tab === 'USER' ? 'Жолооч' : tab === 'VEHICLE' ? 'Машин' : 'Компани'}
                                    </button>
                                ))}
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Нэр, дугаараар хайх..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Valid List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {loading && requests.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
                                    ))
                                ) : filteredRequests.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                                        <Shield className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="text-sm font-bold">Хүсэлт олдсонгүй</p>
                                    </div>
                                ) : filteredRequests.map((req, i) => (
                                    <motion.button
                                        key={req.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelected(req)}
                                        className={`w-full p-4 rounded-[24px] border text-left transition-all duration-300 group relative overflow-hidden
                                            ${selected?.id === req.id
                                                ? 'border-purple-600 bg-slate-900 text-white shadow-xl shadow-purple-900/20 scale-[1.02]'
                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-sm
                                                ${selected?.id === req.id ? 'bg-white/10 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                                                <EntityIcon type={req.entityType} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${selected?.id === req.id ? 'text-slate-400' : 'text-slate-400'}`}>
                                                        {req.entityType}
                                                    </span>
                                                    <span className="text-[10px] font-medium opacity-60">
                                                        {new Date(req.createdAt).toLocaleDateString('mn-MN')}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold truncate text-sm leading-tight mb-1.5">
                                                    {req.officialName || 'Unknown Corp'}
                                                </h3>
                                                <StatusBadge status={req.status} small />
                                            </div>
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
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32 pointer-events-none" />

                                {/* Detail Header */}
                                <div className="p-8 pb-6 border-b border-slate-100 relative z-10">
                                    <div className="flex items-start justify-between gap-4 mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-20 h-20 rounded-[28px] bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200">
                                                <EntityIcon type={selected.entityType} size="lg" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                        {selected.entityType === 'USER' ? 'Жолооч' : selected.entityType === 'VEHICLE' ? 'Тээврийн хэрэгсэл' : 'Байгууллага'}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-xs font-bold text-slate-400">{selected.registrationNumber}</span>
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selected.officialName}</h2>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-medium text-slate-500">{selected.officialAddress || 'Хаяг тодорхойгүй'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <StatusBadge status={selected.status} />
                                            <button onClick={() => setSelected(null)} className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    {selected.status === 'PENDING' && (
                                        <div className="flex gap-3 bg-slate-50 p-2 rounded-[20px] border border-slate-100">
                                            <button onClick={() => handleReview(selected.id, 'APPROVED')} disabled={reviewing}
                                                className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Батлах
                                            </button>
                                            <button onClick={() => handleReview(selected.id, 'REJECTED')} disabled={reviewing}
                                                className="flex-1 py-3.5 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                                <X className="w-4 h-4" /> Татгалзах
                                            </button>
                                        </div>
                                    )}

                                    {selected.status === 'REJECTED' && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-xs font-black text-red-600 uppercase tracking-wide mb-1">Татгалзсан шалтгаан</h4>
                                                <p className="text-sm font-medium text-red-800 leading-relaxed">{selected.rejectionReason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Documents Grid */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 custom-scrollbar">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Бичиг баримтууд
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            <DocCard label="Иргэний үнэмлэх / Лиценз" url={selected.identityProofUrl} onPreview={() => setPreviewImage(selected.identityProofUrl)} />
                                            <DocCard label="Гэрчилгээ / Зөвшөөрөл" url={selected.businessLicenseUrl} onPreview={() => setPreviewImage(selected.businessLicenseUrl)} />
                                            <DocCard label="Одоогийн зураг / Селфи" url={selected.livePhotoUrl} onPreview={() => setPreviewImage(selected.livePhotoUrl)} />
                                            {selected.entityType === 'VEHICLE' && (
                                                <DocCard label="Тээврийн хэрэгслийн гэрчилгээ" url={selected.registrationCert} onPreview={() => setPreviewImage(selected.registrationCert)} />
                                            )}
                                        </div>
                                    </div>

                                    {selected.status === 'PENDING' && (
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Info className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900">Татгалзах тайлбар</h4>
                                                    <p className="text-xs text-slate-500 font-medium">Хэрэв татгалзаж байгаа бол шалтгаанаа тодорхой бичнэ үү</p>
                                                </div>
                                            </div>
                                            <textarea
                                                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none text-sm font-medium text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-slate-400"
                                                placeholder="Жишээ: Бичиг баримтын зураг бүдэг, уншигдахгүй байна..."
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-slate-200 border-dashed">
                                <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mb-6 relative group">
                                    <Shield className="w-14 h-14 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute -right-2 -top-2 w-12 h-12 bg-white shadow-xl rounded-2xl flex items-center justify-center border border-slate-100 animate-bounce">
                                        <Check className="w-6 h-6 text-emerald-500" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Хүсэлт сонгоно уу</h2>
                                <p className="text-slate-400 max-w-sm font-medium">Зүүн талын жагсаалтаас баталгаажуулах хүсэлтээ сонгож дэлгэрэнгүй мэдээллийг харна уу.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
                    >
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
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
    );
}

// ═══ Helper Components ═══

function StatCard({ label, value, icon: Icon, color, active }: any) {
    const colors: any = {
        slate: 'bg-slate-50 text-slate-600 border-slate-100 peer-checked:bg-slate-900 peer-checked:text-white',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
        <div className={`p-5 rounded-[24px] border transition-all duration-300 cursor-default group hover:shadow-lg ${active ? 'bg-white shadow-xl border-slate-200 ring-2 ring-purple-500/10' : 'bg-white border-slate-200/60'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {active && <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse" />}
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</div>
        </div>
    );
}

function StatusBadge({ status, small }: any) {
    const config: any = {
        PENDING: { label: 'Хүлээгдэж буй', bg: 'bg-amber-100', text: 'text-amber-700' },
        APPROVED: { label: 'Батлагдсан', bg: 'bg-emerald-100', text: 'text-emerald-700' },
        REJECTED: { label: 'Татгалзсан', bg: 'bg-rose-100', text: 'text-rose-700' },
    };
    const c = config[status] || config.PENDING;

    return (
        <span className={`${small ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'} rounded-lg font-black uppercase tracking-wider ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

function EntityIcon({ type, size }: any) {
    const s = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    switch (type) {
        case 'VEHICLE': return <Truck className={s} />;
        case 'USER': return <User className={s} />;
        case 'COMPANY': return <Building2 className={s} />;
        default: return <Shield className={s} />;
    }
}

function DocCard({ label, url, onPreview }: any) {
    if (!url) return (
        <div className="bg-slate-100/50 border border-slate-200 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center opacity-60 min-h-[180px]">
            <Clock className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-xs font-bold text-slate-400">{label}</span>
            <span className="text-[10px] text-slate-300 mt-1">Оруулаагүй</span>
        </div>
    );

    return (
        <div onClick={onPreview} className="group relative bg-white p-2 rounded-3xl border border-slate-200 shadow-sm cursor-zoom-in hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden min-h-[180px] flex flex-col">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                <img src={getMediaUrl(url)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                        <ZoomIn className="w-6 h-6 text-slate-900" />
                    </div>
                </div>
            </div>
            <div className="p-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5 line-clamp-1">{label}</div>
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Хуулагдсан
                </div>
            </div>
        </div>
    );
}
