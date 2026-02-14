'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Truck, MapPin, Package, LogOut, Navigation,
    CheckCircle2, Clock, ChevronRight, QrCode,
    Map as MapIcon, Shield, Activity, BarChart3,
    AlertCircle, User as UserIcon, Warehouse
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Batch {
    id: string;
    batchCode: string;
    status: string;
    totalPackages: number;
    totalWeight: number;
    departedAt?: string;
    arrivedAt?: string;
    vehicleInfo?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleType?: string;
}

export default function DriverDashboard() {
    const router = useRouter();
    const { user, loading: authLoading, fetchMe, logout } = useAuth();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        totalPackages: 0
    });

    // Handle initial hydration
    useEffect(() => {
        fetchMe();
    }, []);

    // Handle auth redirection and data loading
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth');
            return;
        }

        if (user.role !== 'DRIVER') {
            router.push('/dashboard');
            return;
        }

        // Only if we are a driver and not already loading, fetch data
        if (!loading && !dataLoaded) {
            loadDriverData();
        }
    }, [user, authLoading, dataLoaded]);

    const loadDriverData = async () => {
        setLoading(true);
        try {
            const [batchesRes, vehiclesRes] = await Promise.all([
                api.get('/batches'),
                api.get('/vehicles/my')
            ]);

            const fetchedBatches = batchesRes.data.data.batches;
            setBatches(fetchedBatches);
            setVehicles(vehiclesRes.data.data);

            const active = fetchedBatches.filter((b: Batch) => ['LOADING', 'DEPARTED', 'IN_TRANSIT', 'AT_CUSTOMS'].includes(b.status)).length;
            const completed = fetchedBatches.filter((b: Batch) => ['ARRIVED', 'UNLOADED'].includes(b.status)).length;
            const totalPkg = fetchedBatches.reduce((acc: number, b: Batch) => acc + (b.totalPackages || 0), 0);

            setStats({ active, completed, totalPackages: totalPkg });
            setDataLoaded(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const activeBatch = batches.find(b => ['LOADING', 'DEPARTED', 'IN_TRANSIT', 'AT_CUSTOMS'].includes(b.status));
    const verifiedVehicle = vehicles.find(v => v.isVerified);
    const pendingVehicle = vehicles.find(v => v.status === 'PENDING');

    const handleUpdateStatus = async (batchId: string, action: 'depart' | 'arrive') => {
        try {
            const { data } = await api.patch(`/batches/${batchId}/${action}`);
            toast.success(action === 'depart' ? 'Аялал эхэллээ. Замдаа болгоомжтой яваарай!' : 'Хүрэх газартаа ирлээ.');
            loadDriverData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
    };

    if (authLoading || (loading && !batches.length)) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#283480] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#283480] font-bold animate-pulse">ZAMEX TRANSPORT</p>
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 pb-20">
            {/* Top Navigation */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[14px] bg-[#283480] flex items-center justify-center shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
                            <img src="/logo.png" alt="Zamex Logo" className="h-6 w-auto brightness-0 invert" />
                        </div>
                        <div>
                            <span className="block text-lg font-black tracking-tighter text-[#283480] leading-none uppercase italic">ZAMEX</span>
                            <span className="text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase mt-1 block">Logistics Driver</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center relative">
                            <Activity className="w-5 h-5 text-slate-400" />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </button>
                        <button onClick={() => { logout(); router.push('/auth'); }}
                            className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all group">
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-8 space-y-8">
                {/* Driver Identity */}
                <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-duration-500" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Сайн байна уу, {user.firstName}!</h1>
                                {user.isVerified && <div className="bg-blue-600 rounded-full p-1 shadow-lg shadow-blue-600/30"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>}
                            </div>
                            <p className="text-slate-500 font-bold text-sm">Өнөөдрийн аялал тань аюулгүй байх болтугай.</p>
                        </div>
                        <div className="w-16 h-16 rounded-[22px] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex items-center justify-center overflow-hidden ring-4 ring-slate-50">
                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="text-2xl font-black text-slate-200 uppercase">{user.firstName[0]}</div>}
                        </div>
                    </div>
                </div>

                {/* Verification Action Card */}
                {!user.isVerified ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-[#283480] to-[#1A235D] rounded-[32px] p-8 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-black mb-2">{user.verificationStatus === 'PENDING' ? 'Хүсэлт илгээгдсэн' : 'Бүртгэлээ баталгаажуулна уу'}</h3>
                            <p className="text-white/60 text-sm font-medium leading-relaxed mb-8">
                                {user.verificationStatus === 'PENDING'
                                    ? 'Таны хүсэлтийг манай ажилтан шалгаж байна. Тун удахгүй баталгаажих болно.'
                                    : 'Тээвэрлэлт эхлүүлэхийн тулд таны бүртгэл баталгаажсан байх шаардлагатай.'}
                            </p>
                            {user.verificationStatus === 'PENDING' ? (
                                <div className="w-full bg-white/10 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center border border-white/20">
                                    <Clock className="w-5 h-5 mr-3 animate-pulse" /> Шалгаж байна
                                </div>
                            ) : (
                                <button onClick={() => router.push('/driver/verify')}
                                    className="w-full bg-white text-[#283480] h-14 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#F9BE4A] transition-all shadow-xl active:scale-95">
                                    Хүсэлт илгээх
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : !verifiedVehicle ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[32px] p-8 text-white shadow-2xl shadow-amber-900/40 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-black mb-2">{pendingVehicle ? 'Автомашин шалгагдаж байна' : 'Автомашинаа бүртгүүлнэ үү'}</h3>
                            <p className="text-white/80 text-sm font-medium leading-relaxed mb-8">
                                {pendingVehicle
                                    ? 'Таны автомашины мэдээллийг манай ажилтан шалгаж байна. Тун удахгүй хариу очих болно.'
                                    : 'Тээвэрлэлт хийхийн тулд та өөрийн автомашинаа бүртгүүлж, баталгаажуулсан байх ёстой.'}
                            </p>
                            {!pendingVehicle && (
                                <button onClick={() => router.push('/driver/vehicle/register')}
                                    className="w-full bg-white text-amber-600 h-14 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#283480] hover:text-white transition-all shadow-xl active:scale-95">
                                    Автомашин бүртгүүлэх
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : null}

                {/* Performance Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Нийт бараа</div>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Package className="w-4 h-4 text-blue-600" /></div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalPackages}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Дууссан аялал</div>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.completed}</div>
                    </div>
                </div>

                {/* Primary Action Button */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => router.push('/staff/scanner')}
                        className="bg-[#F9BE4A] text-[#283480] p-6 rounded-[32px] font-black shadow-xl shadow-amber-500/10 border border-amber-400 flex flex-col gap-4 active:scale-95 transition-all text-left group">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <QrCode className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest opacity-60">Сканнердах</div>
                            <div className="text-lg">Бараа ачих</div>
                        </div>
                    </button>
                    <button className="bg-white border border-slate-200 p-6 rounded-[32px] font-black flex flex-col gap-4 active:scale-95 transition-all text-left shadow-sm group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MapIcon className="w-7 h-7 text-[#283480]" />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest text-slate-400">Газрын зураг</div>
                            <div className="text-lg text-slate-900">Бүх агуулах</div>
                        </div>
                    </button>
                </div>

                {/* Active Trip Dashboard */}
                {activeBatch ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Идэвхтэй тээвэр</h2>
                            </div>
                            <span className="text-[10px] font-black text-[#283480] uppercase tracking-widest">Live Updates</span>
                        </div>

                        {/* Premium Trip Ticket */}
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                            {/* Header Stripe */}
                            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

                            <div className="p-8">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Batch Number</div>
                                        <div className="text-3xl font-black text-[#283480] tracking-tighter uppercase italic">{activeBatch.batchCode}</div>
                                    </div>
                                    <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                                        <div className="text-xs font-black text-blue-600 uppercase tracking-widest">{activeBatch.status}</div>
                                    </div>
                                </div>

                                {/* Timeline Visual */}
                                <div className="flex items-start gap-6 relative px-2 mb-10">
                                    <div className="absolute left-[21px] top-4 bottom-4 w-px bg-slate-100" />
                                    <div className="flex flex-col items-center gap-12 relative z-10">
                                        <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                                        <div className="h-10 border-l-2 border-dashed border-slate-200" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                                    </div>
                                    <div className="flex-1 space-y-12">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Одоо байгаа</div>
                                                <div className="text-lg font-black text-slate-900">Эрээн хот, Агуулах</div>
                                                <div className="text-xs text-slate-500 font-bold mt-1">Cargo-China Transit Hub</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Төлөв</div>
                                                <div className="text-sm font-black text-emerald-500">Бэлэн болсон</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Хүрэх цэг</div>
                                            <div className="text-lg font-black text-slate-900">Улаанбаатар, Төв салбар</div>
                                            <div className="text-xs text-slate-500 font-bold mt-1">Main Logistics Hub</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Chart/Wave Visual */}
                                <div className="relative h-24 bg-slate-50 rounded-[24px] overflow-hidden mb-8 border border-slate-100 flex items-center justify-center">
                                    <div className="absolute inset-0 p-4 opacity-5 flex items-end gap-1">
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div key={i} className="flex-1 bg-[#283480]" style={{ height: `${Math.random() * 100}%` }} />
                                        ))}
                                    </div>
                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className="text-center px-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Жин (кг)</div>
                                            <div className="text-xl font-black text-[#283480]">{activeBatch.totalWeight}</div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200" />
                                        <div className="text-center px-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Бараа тоо</div>
                                            <div className="text-xl font-black text-[#283480]">{activeBatch.totalPackages}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Updates */}
                                <div className="flex flex-col gap-3">
                                    {activeBatch.status === 'LOADING' || activeBatch.status === 'CLOSED' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(activeBatch.id, 'depart')}
                                            className="w-full h-16 bg-[#283480] text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                        >
                                            <Navigation className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            Аялал эхлүүлэх
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateStatus(activeBatch.id, 'arrive')}
                                            className="w-full h-16 bg-emerald-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle2 className="w-6 h-6" /> Хүрэлцэн ирсэн
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <button className="h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest gap-2 border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <Package className="w-4 h-4" /> Жагсаалт
                                        </button>
                                        <button className="h-14 bg-slate-50 text-[#283480] rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest gap-2 border border-slate-100 hover:bg-slate-100 transition-colors">
                                            <Shield className="w-4 h-4" /> Бичиг баримт
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tracking Map (Mock) */}
                        <div className="relative h-56 bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden group">
                            <div className="absolute inset-0 opacity-40 bg-slate-200 bg-cover bg-center" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="w-6 h-6 bg-blue-600/30 rounded-full animate-ping absolute inset-0" />
                                    <div className="w-6 h-6 bg-[#283480] rounded-full relative z-10 border-4 border-white shadow-2xl flex items-center justify-center">
                                        <Truck className="w-2.5 h-2.5 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-6 inset-x-6">
                                <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-white shadow-lg flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                                            <Activity className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Live Status</div>
                                            <div className="text-sm font-black text-slate-900 tracking-tight">82 km/h • GPS Active</div>
                                        </div>
                                    </div>
                                    <button className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Navigation className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] p-16 border border-slate-200 border-dashed text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                                <Warehouse className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Аялал олдсонгүй</h3>
                            <p className="text-slate-500 font-bold text-sm max-w-[200px] mx-auto leading-relaxed">
                                Танд одоогоор оноогдсон идэвхтэй тээвэр байхгүй байна.
                            </p>
                        </div>
                    </div>
                )}

                {/* Logistics History */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Түүх гарсан</h2>
                        <button className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-blue-50">All History</button>
                    </div>

                    <div className="space-y-4">
                        {batches.filter(b => ['ARRIVED', 'UNLOADED'].includes(b.status)).slice(0, 3).map((batch) => (
                            <div key={batch.id} className="bg-white border border-slate-200/60 p-6 rounded-[32px] flex items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/20 transition-all cursor-pointer group shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-[20px] bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform ring-1 ring-emerald-100">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-lg tracking-tight uppercase italic">{batch.batchCode}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                            <Clock className="w-3.5 h-3.5" /> {(batch.arrivedAt || batch.departedAt) ? new Date(batch.arrivedAt || batch.departedAt || '').toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }) : 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-900 text-sm tracking-tighter">{batch.totalPackages} pkgs</div>
                                    <div className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block uppercase tracking-[0.2em]">Success</div>
                                </div>
                            </div>
                        ))}
                        {batches.filter(b => ['ARRIVED', 'UNLOADED'].includes(b.status)).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                                <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                                <div className="text-sm font-bold opacity-40 uppercase tracking-widest italic tracking-tighter">No recent history</div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
