'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Truck, Camera, Upload, ChevronLeft,
    CreditCard, FileText, CheckCircle2, AlertCircle,
    Info, Car, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';

const VEHICLE_TYPES = [
    { value: 'TRUCK', label: 'Ачааны машин (Truck)', icon: Truck },
    { value: 'VAN', label: 'Ван (Van)', icon: Truck },
    { value: 'SEMIRAIL', label: 'Чиргүүл (Semirail)', icon: Truck },
    { value: 'TRAILER', label: 'Жижиг чиргүүл (Trailer)', icon: Truck },
    { value: 'OTHER', label: 'Бусад (Other)', icon: Truck },
];

export default function VehicleRegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    const [form, setForm] = useState({
        plateNumber: '',
        model: '',
        type: 'TRUCK',
        registrationCert: '',
        licensePhotoUrl: '',
        vehiclePhotoUrl: '',
        diagnosticPhotoUrl: '',
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(field);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm(prev => ({ ...prev, [field]: data.data.url }));
            toast.success('Амжилттай хуулагдлаа');
        } catch (err) {
            toast.error('Файл хуулахад алдаа гарлаа');
        } finally {
            setUploading(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!form.plateNumber || !form.model || !form.registrationCert || !form.licensePhotoUrl) {
            toast.error('Шаардлагатай мэдээллүүдийг бүрэн оруулна уу');
            return;
        }

        setLoading(true);
        try {
            await api.post('/vehicles', form);
            toast.success('Автомашины бүртгэлийн хүсэлт амжилттай илгээгдлээ');
            router.push('/driver');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Хүсэлт илгээхэд алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const FileUploadInput = ({ label, field, value, icon: Icon, description }: any) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest leading-none">{label}</label>
                {value && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            {description && <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">{description}</p>}

            <div className={`relative h-44 rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3
                ${value ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30'}`}>

                {value ? (
                    <>
                        <img src={getMediaUrl(value)} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-xl transition-transform active:scale-95">
                                Солих
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, field)} accept="image/*" />
                            </label>
                        </div>
                    </>
                ) : (
                    <>
                        {uploading === field ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Уншиж байна...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <label className="cursor-pointer flex flex-col items-center">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform">Зураг авах / Хуулах</span>
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, field)} accept="image/*" />
                                </label>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-10">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-sm font-black uppercase tracking-widest text-[#283480]">Автомашин бүртгүүлэх</h1>
                    <div className="w-11" /> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Basic Info */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Info className="w-4 h-4 text-blue-600" />
                            </div>
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Ерөнхий мэдээлэл</h2>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Автомашины улсын дугаар</label>
                                <input
                                    type="text"
                                    placeholder="0000 УБA"
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all uppercase"
                                    value={form.plateNumber}
                                    onChange={e => setForm({ ...form, plateNumber: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Марк, Модель</label>
                                <input
                                    type="text"
                                    placeholder="Hyundai Porter 2"
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                                    value={form.model}
                                    onChange={e => setForm({ ...form, model: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Тээврийн хэрэгслийн төрөл</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {VEHICLE_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, type: type.value })}
                                            className={`h-14 rounded-2xl px-6 flex items-center justify-between border transition-all font-bold text-sm
                                                ${form.type === type.value
                                                    ? 'border-[#283480] bg-[#283480] text-white shadow-lg shadow-blue-900/20'
                                                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <type.icon className={`w-5 h-5 ${form.type === type.value ? 'text-white' : 'text-slate-400'}`} />
                                                <span>{type.label}</span>
                                            </div>
                                            {form.type === type.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Document Photos */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-amber-600" />
                            </div>
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Баримт бичиг</h2>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-10">
                            <FileUploadInput
                                label="Жолоочийн үнэмлэх"
                                field="licensePhotoUrl"
                                value={form.licensePhotoUrl}
                                icon={CreditCard}
                                description="Нүүрэн талын зураг"
                            />

                            <FileUploadInput
                                label="Тээврийн хэрэгслийн гэрчилгээ"
                                field="registrationCert"
                                value={form.registrationCert}
                                icon={FileText}
                                description="Дэлгэсэн байдалтай зураг"
                            />
                        </div>
                    </section>

                    {/* Vehicle Photos */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Camera className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Автомашины зураг</h2>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-10">
                            <FileUploadInput
                                label="Автомашины гадна зураг"
                                field="vehiclePhotoUrl"
                                value={form.vehiclePhotoUrl}
                                icon={Car}
                                description="Улсын дугаар харагдахуйц"
                            />

                            <FileUploadInput
                                label="Оношлогоо / Техникийн байдал"
                                field="diagnosticPhotoUrl"
                                value={form.diagnosticPhotoUrl}
                                icon={AlertCircle}
                                description="Сүүлийн оношлогооны хуудас (Сонголтоор)"
                            />
                        </div>
                    </section>

                    {/* Submit Bar */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-18 bg-[#283480] text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group py-6"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Бүртгүүлэх хүсэлт илгээх
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6 leading-relaxed">
                            Хүсэлт илгээснээс хойш 24 цагийн дотор <br />манай ажилтан шалгаж баталгаажуулна.
                        </p>
                    </div>
                </form>
            </main>
        </div>
    );
}
