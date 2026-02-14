'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Filter, Plus, MapPin, Package,
    Truck, Clock, ChevronRight, AlertCircle,
    CheckCircle2, Info, ArrowRight, ShieldCheck, X,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import MobileNav from '@/components/MobileNav';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Listing {
    id: string;
    title: string;
    description: string;
    type: 'CARGO_WANTED' | 'TRANSPORT_OFFERED' | 'LOAD_REQUEST';
    status: string;
    price?: number;
    currency: string;
    volume?: number;
    weight?: number;
    origin?: string;
    destination?: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName?: string;
        isVerified: boolean;
        avatarUrl?: string;
    };
    company?: {
        name: string;
        isVerified: boolean;
        logoUrl?: string;
    };
}

export default function MarketplacePage() {
    const { user, fetchMe } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'CARGO_WANTED',
        price: '',
        currency: 'MNT',
        volume: '',
        weight: '',
        origin: '',
        destination: '',
    });

    useEffect(() => {
        loadListings();
        if (!user) fetchMe();
    }, []);

    const loadListings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/marketplace');
            setListings(data.data);
        } catch (err) {
            console.error(err);
            toast.error('Зар татахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateListing = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.isVerified) {
            toast.error('Зар тавихын тулд эхлээд баталгаажуулалт хийлгэнэ үү');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                price: formData.price ? parseFloat(formData.price) : undefined,
                volume: formData.volume ? parseFloat(formData.volume) : undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
            };

            await api.post('/marketplace', payload);
            toast.success('Зар амжилттай нэмэгдлээ');
            setShowCreateModal(false);
            setFormData({
                title: '',
                description: '',
                type: 'CARGO_WANTED',
                price: '',
                currency: 'MNT',
                volume: '',
                weight: '',
                origin: '',
                destination: '',
            });
            loadListings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Зар нэмэхэд алдаа гарлаа');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredListings = listings.filter(l => {
        const matchesType = filter === 'ALL' || l.type === filter;
        const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.destination?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'CARGO_WANTED': return { label: 'Ачаа авна', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Package };
            case 'TRANSPORT_OFFERED': return { label: 'Тээвэр санал болгож байна', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Truck };
            case 'LOAD_REQUEST': return { label: 'Ачаа явуулна', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Info };
            default: return { label: type, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Info };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 font-outfit">
            {/* Premium Glass Header */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 lg:h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>

                        <Link href="/dashboard" className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-[#283480] flex items-center justify-center shadow-2xl shadow-blue-900/20 group-hover:scale-105 transition-transform overflow-hidden">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic uppercase">Marketplace</h1>
                                <span className="text-[10px] text-slate-400 font-extrabold tracking-[0.2em] uppercase mt-1.5 block">Verified Logistics Network</span>
                            </div>
                        </Link>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary h-14 px-8 rounded-2xl shadow-2xl shadow-blue-900/20 hover:-translate-y-1 active:scale-95 transition-all text-sm font-black uppercase tracking-widest"
                    >
                        <Plus className="w-5 h-5" /> Зар нэмэх
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Search & Filter Bar - Enhanced */}
                <div className="flex flex-col lg:flex-row gap-6 mb-12">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-blue-600/5 rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#283480] transition-colors" />
                        <input
                            type="text"
                            placeholder="Ачаа эсвэл тээвэр хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-16 pr-6 bg-white border border-slate-200 rounded-[24px] text-lg font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-[#283480]/50 outline-none transition-all shadow-sm group-hover:shadow-md"
                        />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                        {['ALL', 'CARGO_WANTED', 'TRANSPORT_OFFERED', 'LOAD_REQUEST'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`h-16 px-8 rounded-[20px] text-[11px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${filter === t
                                    ? 'bg-[#283480] border-[#283480] text-white shadow-xl shadow-blue-900/20'
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                {t === 'ALL' ? 'Бүх зарууд' : getTypeLabel(t).label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fraud Prevention Banner - Ultra Premium */}
                <div className="relative group mb-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-900 rounded-[40px] blur-3xl opacity-20 transition-opacity" />
                    <div className="bg-gradient-to-br from-[#283480] via-[#1A235D] to-[#0F172A] rounded-[40px] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10 max-w-3xl">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 mb-8"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Safety Protocol Active</span>
                            </motion.div>

                            <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight leading-tight italic">
                                Зөвхөн баталгаажсан <br /> <span className="text-[#F9BE4A]">субъектууд</span> зар тавьдаг
                            </h2>
                            <p className="text-blue-100 text-base lg:text-lg leading-relaxed mb-10 font-medium opacity-80 max-w-2xl">
                                Луйвар болон хуурамч заруудаас сэргийлэх үүднээс Zamex Marketplace дээр зөвхөн <span className="text-white font-black underline decoration-amber-500/50 underline-offset-4">Verification</span> хийлгэсэн хэрэглэгчид болон байгууллагууд зар тавих боломжтой.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 100% Баталгаатай
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" /> Аюулгүй тээвэр
                                </div>
                            </div>
                        </div>

                        {/* 3D-ish Background Decoration */}
                        <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-[40%] h-full opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                            <ShieldCheck className="w-full h-full" />
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/20 blur-[100px] rounded-full" />
                    </div>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white/50 border border-slate-100 rounded-[32px] h-[400px] animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : filteredListings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-[40px] p-24 text-center shadow-lg"
                    >
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Search className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Зар олдсонгүй</h3>
                        <p className="text-slate-500 font-medium mt-3 max-w-xs mx-auto">Хайлтын нөхцөлөө өөрчлөөд дахин оролдоно уу эсвэл шинээр зар нэмнэ үү.</p>
                        <button onClick={() => { setSearchQuery(''); setFilter('ALL'); }} className="mt-8 text-blue-600 font-black text-sm uppercase tracking-widest hover:underline decoration-2">Бүх зар харах</button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredListings.map((l, index) => {
                            const config = getTypeLabel(l.type);
                            const Icon = config.icon;
                            return (
                                <motion.div
                                    key={l.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white border border-slate-200/60 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 group flex flex-col relative overflow-hidden"
                                >
                                    {/* Type Ribbon */}
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 ${config.color}`}>
                                            <Icon className="w-4 h-4" /> {config.label}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" /> {dayjs(l.createdAt).fromNow()}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#283480] transition-colors line-clamp-2 min-h-[3.5rem] tracking-tight mb-8 leading-tight">
                                        {l.title}
                                    </h3>

                                    {/* Visual Route */}
                                    <div className="relative mb-10 px-2">
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex flex-col items-center gap-2 group/pin cursor-default">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover/pin:bg-[#283480] group-hover/pin:text-white transition-colors">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[80px]">{l.origin || 'N/A'}</span>
                                            </div>

                                            <div className="flex-1 flex flex-col items-center px-4 -mt-6">
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">ROUTE</div>
                                                <div className="w-full h-[2px] bg-slate-100 relative">
                                                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-indigo-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                                                    <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-indigo-600 shadow-lg scale-0 group-hover:scale-100 transition-transform duration-700 delay-300" />
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-2 group/pin cursor-default text-right">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover/pin:bg-indigo-600 group-hover/pin:text-white transition-colors">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[80px]">{l.destination || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-xs font-bold text-slate-500 mb-8 bg-slate-50/50 p-4 rounded-[24px] border border-slate-100">
                                        {l.weight && <div className="flex items-center gap-2 text-slate-600"><Truck className="w-4 h-4 text-blue-500" /> <span className="font-black">{l.weight}кг</span></div>}
                                        {l.volume && <div className="flex items-center gap-2 text-slate-600"><Package className="w-4 h-4 text-indigo-500" /> <span className="font-black">{l.volume}м³</span></div>}
                                        <div className="flex-1 text-right text-base font-black text-[#283480]">
                                            {l.price ? `${l.price.toLocaleString()} ${l.currency}` : 'Тохиролцоно'}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner">
                                                {l.company?.logoUrl ? <img src={l.company.logoUrl} className="w-full h-full object-cover" /> : <div className="font-black text-[10px] text-slate-400">{(l.company?.name || l.user.firstName).slice(0, 1)}</div>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">{l.company?.name || l.user.firstName}</span>
                                                    <VerifiedBadge isVerified={l.company?.isVerified || l.user.isVerified} className="scale-75 origin-left" />
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{l.company ? 'Verified Logistics' : 'Regular User'}</span>
                                            </div>
                                        </div>
                                        <button className="h-11 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-600/20 active:scale-95">
                                            Харах
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Create Listing Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Шинэ зар нэмэх</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Тээвэр болон ачааны мэдээллээ оруулна уу.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <form onSubmit={handleCreateListing} className="space-y-6">
                                {/* Type Selection */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Зарын төрөл</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'CARGO_WANTED', label: 'Ачаа авна', icon: Package },
                                            { id: 'TRANSPORT_OFFERED', label: 'Тээвэр санал болгох', icon: Truck },
                                            { id: 'LOAD_REQUEST', label: 'Ачаа явуулна', icon: Info }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: t.id })}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.type === t.id
                                                    ? 'border-[#283480] bg-[#283480]/5 text-[#283480]'
                                                    : 'border-slate-100 hover:border-slate-200 text-slate-400'
                                                    }`}
                                            >
                                                <t.icon className="w-6 h-6" />
                                                <span className="text-[10px] font-black uppercase tracking-tight">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Гарчиг</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-bold"
                                            placeholder="Жишээ: УБ-аас Бээжин рүү 5т ачаа авна"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Тайлбар</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-medium resize-none"
                                            placeholder="Дэлгэрэнгүй мэдээллээ энд бичнэ үү..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Хаанаас (Origin)</label>
                                        <input
                                            type="text"
                                            value={formData.origin}
                                            onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-bold"
                                            placeholder="Улаанбаатар"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Хаашаа (Destination)</label>
                                        <input
                                            type="text"
                                            value={formData.destination}
                                            onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-bold"
                                            placeholder="Эрээн"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Үнэ ({formData.currency})</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Жин (кг)</label>
                                        <input
                                            type="number"
                                            value={formData.weight}
                                            onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Эзэлхүүн (м³)</label>
                                        <input
                                            type="number"
                                            value={formData.volume}
                                            onChange={e => setFormData({ ...formData, volume: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#283480]/30 transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-14 bg-[#283480] hover:bg-[#1A235D] disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#283480]/20 transition-all"
                                >
                                    {submitting ? 'Түр хүлээнэ үү...' : 'Нийтлэх'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <MobileNav />
        </div>
    );
}
