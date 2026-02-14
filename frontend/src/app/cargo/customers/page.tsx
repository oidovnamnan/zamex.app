'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Search, Filter, ChevronLeft, ChevronRight, Mail, Phone, Calendar
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

export default function CargoCustomersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (user?.companyId) {
            loadCustomers();
        } else {
            setLoading(false);
        }
    }, [page, user?.companyId, authLoading, search]);

    const loadCustomers = async () => {
        if (!user?.companyId) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) query.append('search', search);

            const { data } = await api.get(`/companies/${user.companyId}/customers?${query.toString()}`);
            setCustomers(data.data.customers);
            setTotalCount(data.data.total);
            setTotalPages(Math.ceil(data.data.total / 20) || 1);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Харилцагчид татахад алдаа гарлаа');
        }
        setLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Trigger reload via effect
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all bg-slate-50 border border-slate-100 active:scale-95">
                            <ChevronLeft className="w-5 h-5 text-[#283480]" />
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Харилцагчид</h1>
                            <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-[#283480] border border-slate-100 uppercase tracking-widest">
                                {totalCount}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white text-slate-900 border border-slate-100 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm">
                            <Filter className="w-4 h-4" /> Шүүлтүүр
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

                {/* Search */}
                <div className="bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                    <form onSubmit={handleSearch} className="relative w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Нэр, утас, кодоор хайх..."
                            className="w-full h-12 pl-12 pr-6 rounded-[20px] bg-slate-50/50 border border-slate-100 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-[#283480]/20 focus:ring-4 focus:ring-[#283480]/5 outline-none transition-all font-bold text-sm"
                        />
                    </form>
                </div>

                {/* Create Manual Customer Button (Future) */}
                {/* For now just list */}

                {/* List */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-20 flex justify-center">
                            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Харилцагч олдсонгүй</h3>
                            <p className="text-slate-500 font-medium max-w-sm">
                                Таны хайлтад тохирох харилцагч олдсонгүй эсвэл бүртгэл хоосон байна.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Код</th>
                                        <th className="px-6 py-4">Нэр</th>
                                        <th className="px-6 py-4">Холбоо барих</th>
                                        <th className="px-6 py-4">Бүртгүүлсэн</th>
                                        <th className="px-6 py-4 text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customers.map((c) => (
                                        <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all font-bold text-xs uppercase">
                                                        {c.customerCode.split('-')[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-base">{c.customerCode}</div>

                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {c.user.avatarUrl ? (
                                                        <img src={c.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                            {(c.user.firstName?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-slate-900">{c.user.firstName || 'Нэргүй'}</div>
                                                        <div className="text-xs text-slate-500">{c.user.lastName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                                                        <Phone className="w-3.5 h-3.5" /> {c.user.phone}
                                                    </div>
                                                    {c.user.email && (
                                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                            <Mail className="w-3.5 h-3.5" /> {c.user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(c.joinedAt).toLocaleDateString()}
                                                </div>
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
                    {!loading && customers.length > 0 && (
                        <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                Хуудас {page} / {totalPages}
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-11 px-6 rounded-xl border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest disabled:opacity-30 hover:bg-white hover:text-slate-600 transition-all active:scale-95 disabled:pointer-events-none"
                                >
                                    Өмнөх
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="h-11 px-6 rounded-xl bg-[#283480] text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-30 hover:bg-[#1a235c] transition-all shadow-lg shadow-blue-900/10 active:scale-95 disabled:pointer-events-none"
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
