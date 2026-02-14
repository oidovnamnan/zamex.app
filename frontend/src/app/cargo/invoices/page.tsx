'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Search, CreditCard, Filter, ChevronRight,
    ChevronLeft, Download, CheckCircle, Clock, AlertCircle, XCircle, Activity
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CargoInvoicesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, amount: 0 });

    useEffect(() => {
        loadInvoices();
    }, [page, statusFilter]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (statusFilter !== 'ALL') query.append('status', statusFilter);

            const { data } = await api.get(`/invoices?${query.toString()}`);
            setInvoices(data.data.invoices);
            setTotalPages(Math.ceil(data.data.total / 20) || 1);

            // Calculate stats from current batch (ideally backend provides this)
            const totalAmount = data.data.invoices.reduce((acc: number, inv: any) => acc + inv.totalAmount, 0);
            setStats({
                total: data.data.total,
                paid: data.data.invoices.filter((i: any) => i.status === 'PAID').length,
                pending: data.data.invoices.filter((i: any) => ['SENT', 'DRAFT'].includes(i.status)).length,
                amount: totalAmount
            });

        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Нэхэмжлэх татахад алдаа гарлаа');
        }
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement search logic here or add 'q' param to API
        toast.success('Хайлт хийгдлээ');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-500" />
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Нэхэмжлэхүүд</h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Шүүлтүүр
                        </button>
                        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Тайлан
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Нийт нэхэмжлэх</div>
                        <div className="text-3xl font-black text-slate-900">{stats.total}</div>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 shadow-sm flex flex-col justify-between">
                        <div className="text-emerald-600 text-sm font-bold uppercase tracking-wider mb-2">Төлөгдсөн</div>
                        <div className="text-3xl font-black text-emerald-900">{stats.paid}</div>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 shadow-sm flex flex-col justify-between">
                        <div className="text-amber-600 text-sm font-bold uppercase tracking-wider mb-2">Хүлээгдэж буй</div>
                        <div className="text-3xl font-black text-amber-900">{stats.pending}</div>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 shadow-sm flex flex-col justify-between">
                        <div className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-2">Нийт дүн</div>
                        <div className="text-3xl font-black text-blue-900">₮{stats.amount.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        {['ALL', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setPage(1); }}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${statusFilter === status
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {getStatusLabel(status)}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Нэхэмжлэх дугаар..."
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm"
                        />
                    </form>
                </div>

                {/* Invoices List */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Нэхэмжлэх олдсонгүй</h3>
                            <p className="text-slate-500 font-medium max-w-sm">
                                Одоогоор ямар нэгэн нэхэмжлэх үүсээгүй эсвэл шүүлтүүрт тохирох багаа байхгүй байна.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Код</th>
                                        <th className="px-6 py-4">Харилцагч</th>
                                        <th className="px-6 py-4">Төлбөр</th>
                                        <th className="px-6 py-4">Төлөв</th>
                                        <th className="px-6 py-4">Огноо</th>
                                        <th className="px-6 py-4 text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => router.push(`/cargo/invoices/${inv.id}`)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{inv.invoiceCode}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{inv.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{inv.customer?.firstName || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500">{inv.customer?.phone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-slate-900">₮{inv.totalAmount.toLocaleString()}</div>
                                                <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                                                    <span>Суурь: ₮{inv.shippingAmount.toLocaleString()}</span>
                                                    {inv.vatAmount > 0 && <span className="text-emerald-600 font-bold">НӨАТ: ₮{inv.vatAmount.toLocaleString()}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <StatusBadge status={inv.status} />
                                                    {inv.ebarimtLottery && (
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded text-[9px] font-black text-amber-700 border border-amber-100 uppercase tracking-tighter">
                                                            <Activity className="w-2.5 h-2.5" />
                                                            Сугалаа: {inv.ebarimtLottery}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {new Date(inv.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors ml-auto">
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && invoices.length > 0 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-sm text-slate-500 font-medium">
                                Хуудас {page} / {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                    Өмнөх
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase disabled:opacity-50 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
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
        DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
        SENT: 'bg-blue-50 text-blue-700 border-blue-100',
        PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        OVERDUE: 'bg-red-50 text-red-700 border-red-100',
        CANCELLED: 'bg-slate-100 text-slate-400 border-slate-200 line-through',
        REFUNDED: 'bg-purple-50 text-purple-700 border-purple-100',
    };

    const icons: Record<string, any> = {
        DRAFT: Clock,
        SENT: AlertCircle,
        PAID: CheckCircle,
        OVERDUE: XCircle,
        CANCELLED: XCircle,
        REFUNDED: Clock,
    };

    const labels: Record<string, string> = {
        DRAFT: 'Ноорог',
        SENT: 'Илгээсэн',
        PAID: 'Төлөгдсөн',
        OVERDUE: 'Хугацаа хэтэрсэн',
        CANCELLED: 'Цуцлагдсан',
        REFUNDED: 'Буцаагдсан',
    };

    const Icon = icons[status] || Clock;

    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-100'} flex items-center gap-1.5 w-fit`}>
            <Icon className="w-3 h-3" />
            {labels[status] || status}
        </span>
    );
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        ALL: 'Бүгд',
        SENT: 'Илгээсэн',
        PAID: 'Төлөгдсөн',
        OVERDUE: 'Хэтэрсэн',
        CANCELLED: 'Цуцалсан',
    };
    return labels[status] || status;
}
