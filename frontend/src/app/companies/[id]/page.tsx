'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Star, Package, Check, Truck, Plus, User, LogOut,
    Shield, Zap, Timer, MapPin, Globe, Phone, Mail
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

function CompanyDetailContent() {
    const router = useRouter();
    const params = useParams();
    const { user, logout } = useAuth();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [activeTab, setActiveTab] = useState<'reviews' | 'about'>('reviews');
    const [eligibleOrder, setEligibleOrder] = useState<string | null>(null);

    const companyId = params.id as string;

    useEffect(() => {
        loadCompany();
        if (user) checkEligibility();
    }, [companyId, user]);

    const checkEligibility = async () => {
        try {
            // Fetch user orders for this company
            // Assuming the API supports filtering by companyId
            const { data } = await api.get('/orders', { params: { companyId } });
            const orders = data.data.orders || [];

            // Find an order that is delivered/completed and not yet rated
            // Note: Adjust status check based on actual backend enum
            const orderToRate = orders.find((o: any) =>
                ['DELIVERED', 'COMPLETED'].includes(o.status) && !o.rating
            );

            if (orderToRate) {
                setEligibleOrder(orderToRate.id);
            }
        } catch (err) {
            console.error('Failed to check eligibility', err);
        }
    };

    const loadCompany = async () => {
        try {
            const { data } = await api.get(`/companies/${companyId}`);
            setCompany(data.data.company);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Компанийн мэдээлэл авахад алдаа гарлаа');
            // setTimeout(() => router.back(), 2000);
        }
        setLoading(false);
    };

    const joinCompany = async () => {
        if (!user) {
            router.push('/auth');
            return;
        }
        setJoining(true);
        try {
            const { data } = await api.post(`/companies/${companyId}/join`);
            toast.success(`${data.message}\nТаны код: ${data.data.customerCode}`);
            // Reload to update joined status if returned in company data
            loadCompany();
            // Or manually update local state if needed
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
        setJoining(false);
    };

    const isJoined = user?.customerCompanies?.some((cc: any) => cc.company.id === companyId);
    const r = company?.ratingsSummary;
    const price = company?.pricingRules?.[0]?.pricePerKg;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Компани олдсонгүй</h1>
                <button onClick={() => router.back()} className="text-blue-600 font-medium hover:underline">Буцах</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 lg:flex overflow-x-hidden">
            {/* Sidebar with mobile check */}
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
                            <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">Компанийн дэлгэрэнгүй</h1>
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
                </header>

                <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12 space-y-8">
                    {/* Top Card */}
                    <div className="bg-white rounded-[40px] p-6 lg:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">

                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-[32px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-sm">
                                    <Truck className="w-10 h-10 text-slate-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{company.name}</h1>
                                        {company.isVerified && (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5">
                                                <Check className="w-3 h-3 stroke-[3]" /> Баталгаажсан
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            <span className="text-slate-900 font-bold">{r?.averageRating ? Number(r.averageRating).toFixed(1) : '0.0'}</span>
                                            <span>({r?.totalRatings || 0} үнэлгээ)</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                        <div className="text-blue-600 font-bold">
                                            Avg. {r?.avgDeliveryDays ? Math.round(Number(r.avgDeliveryDays)) : '-'} өдөр
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                {isJoined ? (
                                    <button onClick={() => router.push(`/orders/new?companyId=${company.id}`)} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Шинэ захиалга
                                    </button>
                                ) : (
                                    <button
                                        onClick={joinCompany}
                                        disabled={joining}
                                        className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {joining ? 'Уншиж байна...' : 'Бүртгүүлэх'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-10">
                            {company.pricingRules?.map((rule: any) => (
                                <div key={rule.id} className={`p-5 rounded-3xl border transition-all ${rule.serviceType === 'FAST' ? 'bg-amber-50 border-amber-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-[9px] font-black uppercase tracking-widest ${rule.serviceType === 'FAST' ? 'text-amber-600' : 'text-slate-400'}`}>
                                            {rule.serviceType === 'FAST' ? 'Хурдан' : 'Стандарт'} үнэ
                                        </div>
                                        {rule.serviceType === 'FAST' && <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div className="text-xl font-black text-slate-900">
                                        ₮{Number(rule.pricePerKg || 0).toLocaleString()}
                                        <span className="text-[10px] font-bold text-slate-400 ml-1">/ кг</span>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Хурд</div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-xl font-black text-slate-900">{Number(r?.avgSpeed || 0).toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Аюулгүй</div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                    <span className="text-xl font-black text-slate-900">{Number(r?.avgSafety || 0).toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Бүрэн бүтэн</div>
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    <span className="text-xl font-black text-slate-900">
                                        {r ? (100 - Number(r.damageRate || 0)).toFixed(1) : '100'}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'reviews' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Хэрэглэгчийн үнэлгээ
                        </button>
                        <button
                            onClick={() => setActiveTab('about')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'about' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Мэдээлэл & Холбоо барих
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-[300px]">
                        {activeTab === 'reviews' ? (
                            <div className="space-y-6">
                                {/* Write Review Button Section */}
                                {user && (
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-900">Нийт үнэлгээ ({company.ratings?.length || 0})</h3>
                                        {eligibleOrder ? (
                                            <button
                                                onClick={() => router.push(`/ratings/new?orderId=${eligibleOrder}`)}
                                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-2"
                                            >
                                                <Star className="w-4 h-4 fill-white" /> Үнэлгээ өгөх
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-help" title="Та энэ каргогоор үйлчлүүлж, бараагаа хүлээн авсан тохиолдолд үнэлгээ өгөх боломжтой.">
                                                Үнэлгээ өгөх эрхгүй байна
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Reviews List */}
                                {company.ratings && company.ratings.length > 0 ? (
                                    company.ratings.map((rating: any, i: number) => (
                                        <motion.div
                                            key={rating.id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                        {rating.user?.firstname?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{rating.user?.firstname || 'Хэрэглэгч'}</div>
                                                        <div className="text-xs text-slate-400">{new Date(rating.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} className={`w-4 h-4 ${star <= rating.overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-100 fill-slate-100'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {rating.comment && (
                                                <p className="text-slate-600 leading-relaxed mb-4">{rating.comment}</p>
                                            )}
                                            {rating.tags && rating.tags.length > 0 && (
                                                <div className="flex gap-2">
                                                    {rating.tags.map((tag: string) => (
                                                        <span key={tag} className="px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 border border-slate-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                                        <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900">Үнэлгээ байхгүй байна</h3>
                                        <p className="text-slate-400">Одоогоор энэ компанид үнэлгээ ирээгүй байна.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                    <h3 className="text-lg font-black text-slate-900">Холбоо барих</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                                <Phone className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase">Утас</div>
                                                <div className="font-bold text-slate-900">{company.phone || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase">Имэйл</div>
                                                <div className="font-bold text-slate-900">{company.email || '-'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase">Хаяг</div>
                                                <div className="font-bold text-slate-900">{company.address || 'Улаанбаатар хот'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-900 mb-4">Танилцуулга</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {company.description || 'Тус компани нь олон улсын тээвэр зуучлалын чиглэлээр үйл ажиллагаа явуулдаг...'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}

// Icon for empty reviews
function MessageCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    );
}

export default function CompanyDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
            <CompanyDetailContent />
        </Suspense>
    )
}
