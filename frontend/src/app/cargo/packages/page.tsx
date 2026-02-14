'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package, Search, Filter, ChevronDown,
    ChevronLeft, ChevronRight, Box, ArrowUpDown
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CargoPackagesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadPackages();
    }, [page, statusFilter]);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (statusFilter !== 'ALL') query.append('status', statusFilter);
            if (search) query.append('q', search);

            const { data } = await api.get(`/packages?${query.toString()}`);
            setPackages(data.data.packages);
            setTotalPages(data.data.totalPages || 1);
        } catch (err) {
            toast.error('Алдэа гарлаа');
        }
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadPackages();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
                <div className="px-3 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-all bg-slate-50 border border-slate-100 active:scale-95">
                            <ChevronLeft className="w-4 h-4 text-[#283480]" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Бүх бараа</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Нийт жагсаалт</p>
                        </div>
                    </div>
                    <button className="bg-[#283480] text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-[#1a235c] transition-all shadow-md active:scale-95">
                        CSV
                    </button>
                </div>
            </header>

            <main className="px-3 py-4 space-y-3">

                {/* Filters - Compact */}
                <div className="space-y-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Мөрдөх код, захиалгын дугаар..."
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#283480]/30 focus:ring-2 focus:ring-[#283480]/10 outline-none transition-all font-medium text-sm"
                        />
                    </form>

                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {['ALL', 'RECEIVED_IN_CHINA', 'IN_TRANSIT', 'ARRIVED_MN', 'DELIVERED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setPage(1); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${statusFilter === status
                                    ? 'bg-[#283480] text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List - Compact */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {packages.map((pkg) => (
                                <div key={pkg.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors cursor-pointer active:bg-slate-100" onClick={() => router.push(`/cargo/packages/${pkg.id}`)}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <Package className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-black text-slate-900 truncate">{pkg.trackingNumber || 'No Tracking'}</div>
                                                <div className="text-[10px] text-slate-500 font-medium truncate">{pkg.customer?.firstName || 'Unknown'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ServiceBadge serviceType={pkg.serviceType} />
                                            <StatusBadge status={pkg.status} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 font-medium">{pkg.weightKg ? `${pkg.weightKg} кг` : '-'}</span>
                                        <span className="text-slate-400 font-medium">{new Date(pkg.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {packages.length === 0 && (
                                <div className="px-6 py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold mb-1">Бараа олдсонгүй</h3>
                                    <p className="text-slate-500 text-sm">Хайлт хийх эсвэл шүүлтүүрээ өөрчилнө үү</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination - Compact */}
                    {!loading && packages.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                                {page} / {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-9 px-4 rounded-lg border border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-wider disabled:opacity-30 hover:bg-white hover:text-slate-600 transition-all active:scale-95 disabled:pointer-events-none"
                                >
                                    Өмнөх
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-9 px-4 rounded-lg bg-[#283480] text-white font-black text-[9px] uppercase tracking-wider disabled:opacity-30 hover:bg-[#1a235c] transition-all shadow-md active:scale-95 disabled:pointer-events-none"
                                >
                                    Дараах
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
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
            {labels[status] || status}
        </span>
    );
}

function ServiceBadge({ serviceType }: { serviceType: string }) {
    if (serviceType === 'FAST') {
        return (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[8px] font-black uppercase tracking-tighter shadow-sm animate-pulse-slow">
                Хурдан
            </span>
        );
    }
    return (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-tighter">
            Энгийн
        </span>
    );
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        ALL: 'Бүгд',
        RECEIVED_IN_CHINA: 'Эрээнд',
        IN_TRANSIT: 'Замд',
        ARRIVED_MN: 'УБ-д',
        DELIVERED: 'Хүргэгдсэн',
    };
    return labels[status] || status;
}
