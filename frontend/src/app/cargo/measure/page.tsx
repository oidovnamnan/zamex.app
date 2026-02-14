'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Scale, Package, Ruler, QrCode, Check, X, Search } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function MeasurePage() {
    const router = useRouter();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [pkg, setPkg] = useState<any>(null);
    const [weightKg, setWeightKg] = useState('');
    const [lengthCm, setLengthCm] = useState('');
    const [widthCm, setWidthCm] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const searchPackage = async () => {
        if (!trackingNumber.trim()) {
            toast.error('Tracking number оруулна уу');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.get(`/packages/search?trackingNumber=${trackingNumber.trim()}`);
            if (data.data) {
                setPkg(data.data);
                // Pre-fill if already measured
                if (data.data.weightKg) setWeightKg(data.data.weightKg.toString());
                if (data.data.lengthCm) setLengthCm(data.data.lengthCm.toString());
                if (data.data.widthCm) setWidthCm(data.data.widthCm.toString());
                if (data.data.heightCm) setHeightCm(data.data.heightCm.toString());
            } else {
                toast.error('Бараа олдсонгүй');
                setPkg(null);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
            setPkg(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!pkg) return;

        const weight = parseFloat(weightKg);
        const length = parseFloat(lengthCm);
        const width = parseFloat(widthCm);
        const height = parseFloat(heightCm);

        if (!weight || weight <= 0) {
            toast.error('Жин оруулна уу');
            return;
        }

        if (!length || !width || !height || length <= 0 || width <= 0 || height <= 0) {
            toast.error('Хэмжээ оруулна уу');
            return;
        }

        setSaving(true);
        try {
            await api.patch(`/packages/${pkg.id}/measure`, {
                weightKg: weight,
                lengthCm: length,
                widthCm: width,
                heightCm: height,
            });
            toast.success('Хэмжилт амжилттай хадгалагдлаа!');
            // Reset
            setTrackingNumber('');
            setPkg(null);
            setWeightKg('');
            setLengthCm('');
            setWidthCm('');
            setHeightCm('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-gradient-to-br from-[#283480] via-[#1a235c] to-[#0f1333] px-3 pt-6 pb-5 sticky top-0 z-40">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-white tracking-tight uppercase">
                            Хэмжилт
                        </h1>
                        <p className="text-blue-200 text-xs font-medium mt-0.5">
                            Барааны жин, хэмжээ оруулах
                        </p>
                    </div>
                    <div className="w-9 h-9 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/20">
                        <Scale className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchPackage()}
                        placeholder="Tracking number..."
                        className="w-full h-11 pl-10 pr-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                    <button
                        onClick={searchPackage}
                        disabled={loading}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 bg-white text-[#283480] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                        {loading ? (
                            <div className="w-3 h-3 border-2 border-[#283480]/30 border-t-[#283480] rounded-full animate-spin" />
                        ) : (
                            <Search className="w-3 h-3" />
                        )}
                        Хайх
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="px-3 pt-4 pb-20">
                {pkg ? (
                    <div className="space-y-3">
                        {/* Package Info */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                        {pkg.trackingNumber}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {pkg.owner?.firstName || 'Харилцагч'} • {pkg.status}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Weight */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                                    <Scale className="w-4 h-4 text-white" />
                                </div>
                                <label className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                    Жин (кг) *
                                </label>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={weightKg}
                                onChange={(e) => setWeightKg(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-lg text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#283480]/20 focus:border-[#283480]/30 transition-all"
                            />
                        </div>

                        {/* Dimensions */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                                    <Ruler className="w-4 h-4 text-white" />
                                </div>
                                <label className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                    Хэмжээ (см) *
                                </label>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Урт</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={lengthCm}
                                        onChange={(e) => setLengthCm(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Өргөн</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={widthCm}
                                        onChange={(e) => setWidthCm(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Өндөр</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={heightCm}
                                        onChange={(e) => setHeightCm(e.target.value)}
                                        placeholder="0"
                                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Volume Calculation */}
                        {lengthCm && widthCm && heightCm && (
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-blue-900 uppercase tracking-wide">
                                        Эзлэхүүн
                                    </span>
                                    <span className="text-lg font-black text-blue-600">
                                        {(parseFloat(lengthCm) * parseFloat(widthCm) * parseFloat(heightCm) / 1000000).toFixed(4)} м³
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <QrCode className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
                            Бараа хайх
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                            Tracking number оруулаад хайна уу
                        </p>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Button */}
            {pkg && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-3 z-40">
                    <button
                        onClick={handleSave}
                        disabled={saving || !weightKg || !lengthCm || !widthCm || !heightCm}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Хадгалж байна...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Хэмжилт хадгалах
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
