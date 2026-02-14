'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package, Search, Filter, ChevronRight,
    Calendar, User, Building2, Truck,
    ExternalLink, MoreVertical, Shield,
    CheckCircle2, AlertCircle, Clock,
    TrendingUp, ArrowUpRight, Inbox,
    Activity, MapPin, Hash, ShoppingBag, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const statuses = [
        { label: 'Бүгд', value: 'ALL', color: 'slate' },
        { label: 'Хүлээгдэж буй', value: 'PENDING', color: 'amber' },
        { label: 'Зарласан', value: 'PRE_ANNOUNCED', color: 'blue' },
        { label: 'Агуулахад ирсэн', value: 'RECEIVED', color: 'purple' },
        { label: 'Замд гарсан', value: 'DEPARTED', color: 'indigo' },
        { label: 'УБ-д ирсэн', value: 'ARRIVED_MN', color: 'emerald' },
        { label: 'Хүргэгдсэн', value: 'DELIVERED', color: 'slate' },
    ];

    useEffect(() => {
        loadOrders();
    }, [statusFilter, search, page]);

    const loadOrders = async () => {
        setLoading(true);
        console.log('Loading orders...');
        try {
            const token = localStorage.getItem('zamex_token');
            console.log('Token exists:', !!token);
            const { data } = await api.get('/orders', {
                params: {
                    status: statusFilter !== 'ALL' ? statusFilter : undefined,
                    search: search || undefined,
                    page,
                    limit: 10
                }
            });
            setOrders(data.data.orders);
            setTotal(data.data.total);
        } catch (err: any) {
            console.error('API Error:', err);
            toast.error(err.response?.data?.error || 'Захиалгын жагсаалт авахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const s = statuses.find(st => st.value === status) || statuses[0];
        const styles: any = {
            amber: 'bg-amber-50 text-amber-600 border-amber-100',
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            slate: 'bg-slate-50 text-slate-600 border-slate-100',
        };
        return {
            label: s.label,
            style: styles[s.color] || styles.slate
        };
    };

    // Calculate stats for KPI
    const stats = [
        { label: 'Нийт захиалга', value: total, icon: Inbox, color: 'purple', trend: '+12.5%' },
        { label: 'Хүлээгдэж буй', value: orders.filter(o => o.status === 'PENDING').length, icon: Clock, color: 'amber', trend: 'Жагсаалтаас' },
        { label: 'Замд яваа', value: orders.filter(o => ['RECEIVED', 'DEPARTED'].includes(o.status)).length, icon: Truck, color: 'blue', trend: 'Идэвхтэй' },
        { label: 'Хүргэгдсэн', value: orders.filter(o => o.status === 'DELIVERED').length, icon: CheckCircle2, color: 'emerald', trend: 'Нийт' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-10">

                {/* 👑 Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                <ShoppingBag className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Бүх Захиалга</h1>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            Систем дээрх нийт захиалгуудын нэгдсэн хяналт
                        </p>
                    </div>
                </div>

                {/* 📊 KPI Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="card p-6 bg-white border border-slate-200/60 shadow-sm group hover:shadow-xl transition-all duration-500 relative overflow-hidden rounded-[32px]"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${s.color === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        s.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            s.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">{s.trend}</span>
                                </div>
                                <div className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter mb-1">{s.value}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 🔍 Search & Filters */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-3xl border border-slate-200/60 shadow-sm">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Захиалгын код, хэрэглэгчийн нэр, тээвэрлэлтийн дугаараар хайх..."
                                className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                            />
                        </div>
                        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
                            {statuses.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === tab.value
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 📋 Orders List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-32 bg-white rounded-[32px] animate-pulse border border-slate-100" />
                            ))
                        ) : orders.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-24 text-center bg-white border border-slate-200/60 shadow-sm border-dashed rounded-[48px] flex flex-col items-center justify-center">
                                <div className="w-28 h-28 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 relative">
                                    <Package className="w-14 h-14 text-slate-200" />
                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Search className="w-5 h-5 text-purple-400" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Захиалга олдсонгүй</h3>
                                <p className="text-slate-400 font-medium mt-4 max-w-sm mx-auto">Таны хайлтын нөхцөлд тохирох захиалга байхгүй байна. Шүүлтүүрээ өөрчилнө үү.</p>
                                <button onClick={() => { setSearch(''); setStatusFilter('ALL'); }} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-600 transition-all active:scale-95 shadow-xl shadow-slate-200">
                                    Бүх шүүлтүүрийг цэвэрлэх
                                </button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {orders.map((order, i) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        idx={i}
                                        status={getStatusConfig(order.status)}
                                        onView={() => router.push(`/admin/orders/${order.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Pagination Placeholder */}
                    {total > 10 && (
                        <div className="flex items-center justify-center pt-8">
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Өмнөх</button>
                                <div className="flex items-center px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Хуудас {page} / {Math.ceil(total / 10)}</div>
                                <button onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Дараах</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderCard({ order, idx, status, onView }: any) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card p-6 bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500 group rounded-[32px] relative overflow-hidden"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    {/* Product Image / Icon */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] bg-slate-50 flex-shrink-0 p-1 border border-slate-100 overflow-hidden relative">
                        {order.productImages?.[0] ? (
                            <img src={order.productImages[0]} alt="" className="w-full h-full object-cover rounded-[18px]" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <Package className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                        )}
                        <div className="absolute top-1 left-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-lg border border-slate-100 text-[8px] font-black text-slate-500 uppercase">
                            {order.productPlatform || 'N/A'}
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-lg">
                                <Hash className="w-3 h-3 text-purple-400" />
                                <span className="text-[10px] font-black tracking-tight">{order.orderCode}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${status.style}`}>
                                {status.label}
                            </div>
                            {order.insurance && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-100 text-[9px] font-black">
                                    <ShieldCheck className="w-3 h-3" /> {order.insurance.planSlug}
                                </div>
                            )}
                        </div>

                        <h3 className="text-base md:text-lg font-black text-slate-900 truncate group-hover:text-purple-600 transition-colors uppercase tracking-tight">
                            {order.productTitle || 'Гарчиггүй бараа'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <User className="w-3 h-3 text-slate-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-600">{order.customer?.firstName}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{order.customer?.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                                    <Building2 className="w-3 h-3 text-purple-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{order.company?.name}</span>
                            </div>
                            {order.trackingNumber && (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                        <Truck className="w-3 h-3 text-blue-400" />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-500">{order.trackingNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side Stats & Action */}
                <div className="flex items-center justify-between lg:flex-col lg:items-end lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                    <div className="text-right space-y-1">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Үүсгэсэн огноо</div>
                        <div className="text-xs font-black text-slate-900 flex items-center gap-2 justify-end">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(order.createdAt).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <button onClick={onView} className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm group/btn">
                        Дэлгэрэнгүй <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
