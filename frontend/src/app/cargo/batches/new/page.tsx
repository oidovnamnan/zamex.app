'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, Package, Plus, X, Check, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

export default function NewBatchPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [vehicleInfo, setVehicleInfo] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [serviceType, setServiceType] = useState<'STANDARD' | 'FAST'>('STANDARD');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!user?.companyId) {
            toast.error('Компани олдсонгүй');
            return;
        }

        if (!vehicleInfo.trim()) {
            toast.error('Машины мэдээлэл оруулна уу');
            return;
        }

        setCreating(true);
        try {
            const payload = {
                companyId: user.companyId,
                vehicleInfo: vehicleInfo.trim(),
                driverName: driverName.trim() || undefined,
                driverPhone: driverPhone.trim() || undefined,
                notes: notes.trim() || undefined,
                serviceType: serviceType,
            };

            await api.post('/batches', payload);
            toast.success('Batch амжилттай үүслээ!');
            router.push('/cargo/batches');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-gradient-to-br from-[#283480] via-[#1a235c] to-[#0f1333] px-4 pt-6 pb-5 sticky top-0 z-40">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-white tracking-tight uppercase">
                            Шинэ Batch
                        </h1>
                        <p className="text-blue-200 text-xs font-medium mt-0.5">
                            Тээврийн багц үүсгэх
                        </p>
                    </div>
                    <div className="w-9 h-9 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/20">
                        <Truck className="w-4 h-4 text-white" />
                    </div>
                </div>
            </header>

            {/* Form */}
            <div className="px-3 pt-4 pb-20">
                <div className="space-y-3">
                    {/* Vehicle Info */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <label className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                Машины мэдээлэл *
                            </label>
                        </div>
                        <input
                            type="text"
                            value={vehicleInfo}
                            onChange={(e) => setVehicleInfo(e.target.value)}
                            placeholder="Жишээ: УБ 1234 АА"
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 focus:border-[#283480]/30 transition-all"
                        />
                    </div>

                    {/* Service Type Selection */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wide mb-3">
                            Тээврийн төрөл *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setServiceType('STANDARD')}
                                className={`h-12 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border-2 ${serviceType === 'STANDARD' ? 'bg-[#283480] border-[#283480] text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                            >
                                <Truck className={`w-3.5 h-3.5 ${serviceType === 'STANDARD' ? 'text-blue-300' : ''}`} />
                                СТАНДАРТ
                            </button>
                            <button
                                type="button"
                                onClick={() => setServiceType('FAST')}
                                className={`h-12 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border-2 ${serviceType === 'FAST' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                            >
                                <Plus className={`w-3.5 h-3.5 ${serviceType === 'FAST' ? 'rotate-45' : ''}`} />
                                ХУРДАН КАРГО
                            </button>
                        </div>
                    </div>

                    {/* Driver Info */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                                <Package className="w-4 h-4 text-white" />
                            </div>
                            <label className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                Жолоочийн мэдээлэл
                            </label>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                placeholder="Жолоочийн нэр (сонголтоор)"
                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 focus:border-[#283480]/30 transition-all"
                            />
                            <input
                                type="tel"
                                value={driverPhone}
                                onChange={(e) => setDriverPhone(e.target.value)}
                                placeholder="Утас (сонголтоор)"
                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 focus:border-[#283480]/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wide mb-3">
                            Тэмдэглэл
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Нэмэлт мэдээлэл (сонголтоор)"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 focus:border-[#283480]/30 transition-all resize-none"
                        />
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wide mb-1">
                                    Batch үүссэний дараа
                                </h3>
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    Та бараануудыг энэ batch-д нэмж, хаагаад тээвэрт гаргах боломжтой.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 z-40">
                <button
                    onClick={handleCreate}
                    disabled={creating || !vehicleInfo.trim()}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#283480] to-[#1a235c] text-white font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                    {creating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Үүсгэж байна...
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            Batch үүсгэх
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
