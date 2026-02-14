'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Star, Package, Check, Truck, Plus, User, LogOut, MessageCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

export default function RatingsPage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRatings();
    }, []);

    const loadRatings = async () => {
        try {
            const { data } = await api.get('/ratings');
            // Assuming GET /ratings returns the user's ratings or all ratings. 
            // We might need to filter by user if the API returns everything.
            // For now, let's assume it returns a list in data.data.ratings or data.data
            setRatings(data.data?.ratings || data.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Үнэлгээний мэдээлэл авахад алдаа гарлаа');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 lg:flex overflow-x-hidden">
            {/* Sidebar */}
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
                            { icon: Truck, label: 'Карго хайх', href: '/companies' },
                            { icon: Plus, label: 'Шинэ захиалга', href: '/orders/new' },
                            { icon: Star, label: 'Миний үнэлгээ', href: '/ratings', active: true },
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

            <div className="flex-1 lg:ml-72 relative z-10 w-full max-w-full">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-40">
                    <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="lg:hidden w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <h1 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">Миний үнэлгээ</h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
                    {loading ? (
                        <div className="grid gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[32px] p-8 h-40 animate-pulse shadow-sm border border-slate-100" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {ratings.map((rating, i) => (
                                <motion.div
                                    key={rating.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                                                <Star className="w-8 h-8 fill-amber-500" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">{rating.order?.company?.name || 'Карго компани'}</h3>
                                                    <p className="text-sm font-medium text-slate-500">Захиалга: {rating.order?.orderCode || '#'}</p>
                                                </div>
                                                <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                                                    {new Date(rating.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 mb-4">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} className={`w-5 h-5 ${star <= rating.overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                                                ))}
                                                <span className="font-bold text-slate-900 ml-2">{rating.overallRating}/5</span>
                                            </div>

                                            {rating.comment && (
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-600 italic">
                                                    "{rating.comment}"
                                                </div>
                                            )}

                                            {rating.tags && rating.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {rating.tags.map((tag: string) => (
                                                        <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {ratings.length === 0 && (
                                <div className="bg-white rounded-[40px] p-20 text-center shadow-xl shadow-slate-100 border border-slate-100 max-w-2xl mx-auto mt-10">
                                    <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                        <Star className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Үнэлгээ байхгүй</h3>
                                    <p className="text-slate-400 font-medium">Та одоогоор ямар нэгэн үнэлгээ хийгээгүй байна.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
