
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Package, MapPin, Clock } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

export default function TrackingPage() {
    const router = useRouter();
    const [trackingId, setTrackingId] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingId.trim()) {
            router.push(`/tracking/${trackingId.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-24 font-outfit">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Ачаа хайх</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-8">
                <div className="bg-[#283480] rounded-[32px] p-8 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden mb-12">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-2 tracking-tight">Ачаа хяналт</h2>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-8">Захиалгын дугаар оруулна уу</p>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                    placeholder="ZMX-7729..."
                                    className="w-full bg-white/10 border border-white/20 h-14 pl-12 pr-4 rounded-2xl text-white placeholder:text-white/20 font-bold focus:outline-none focus:ring-4 focus:ring-white/10 transition-all"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!trackingId.trim()}
                                className="w-full bg-[#F9BE4A] text-[#283480] h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                Ачааг хайх
                            </button>
                        </form>
                    </div>
                </div>

                {/* Recent Searches or Info */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Сүүлд хайсан</h3>
                    </div>

                    <div className="bg-white rounded-[24px] p-1 border border-slate-100 shadow-sm">
                        <button className="w-full p-4 hover:bg-slate-50 rounded-[20px] transition-colors flex items-center gap-4 text-left group">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <Package className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-black text-slate-900 text-sm mb-1 group-hover:text-blue-900">ZMX-8821-99</div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Улаанбаатар</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2цаг өмнө</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-blue-100 group-hover:text-blue-500">
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </button>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    );
}
