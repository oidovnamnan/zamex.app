'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, Camera, Upload, ChevronLeft,
    User, CreditCard, CheckCircle2, Send,
    FileText, UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import { api, getMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DriverVerifyPage() {
    const router = useRouter();
    const { fetchMe } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [verifiedVia, setVerifiedVia] = useState<'MANUAL' | 'IMONGOLIA'>('MANUAL');

    const [form, setForm] = useState({
        isForeign: false,
        officialName: '',
        registrationNumber: '',
        officialAddress: '',
        identityProofUrl: '',
        livePhotoUrl: '',
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

    const handleIMongolia = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'i-Mongolia холболт хийгдэж байна...',
                success: 'i-Mongolia-с мэдээлэл амжилттай татагдлаа',
                error: 'Холболтод алдаа гарлаа',
            }
        ).then(() => {
            setForm({
                isForeign: false,
                officialName: 'Бат-Эрдэнэ Болд',
                registrationNumber: 'УУ90010112',
                officialAddress: 'Улаанбаатар, Баянзүрх дүүрэг, 26-р хороо',
                identityProofUrl: 'https://i-mongolia.mn/id-card-sample.png', // Simulated
                livePhotoUrl: 'https://i-mongolia.mn/photo-sample.png', // Simulated
            });
            setVerifiedVia('IMONGOLIA');
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict Validation
        const regRegex = /^[А-ЯӨҮа-яөүA-Za-z]{2}[0-9]{8}$/;
        const nameRegex = /^[А-ЯӨҮа-яөүA-Za-z\s.-]+$/;

        if (!form.officialName || !nameRegex.test(form.officialName)) {
            toast.error('Овог нэр буруу эсвэл хоосон байна');
            return;
        }

        if (!form.registrationNumber || !regRegex.test(form.registrationNumber)) {
            toast.error('Регистрийн дугаар буруу байна (Жишээ: АА00000000)');
            return;
        }

        // If manual, photos are required. If IMONGOLIA, they are optional (pre-verified)
        if (verifiedVia === 'MANUAL' && (!form.identityProofUrl || !form.livePhotoUrl)) {
            toast.error('Зургуудаа бүрэн оруулна уу');
            return;
        }

        setLoading(true);
        try {
            await api.post('/verification/request', {
                ...form,
                registrationNumber: form.registrationNumber.toUpperCase(),
                verifiedVia,
                entityType: 'USER'
            });
            await fetchMe();
            toast.success('Баталгаажуулах хүсэлт амжилттай илгээгдлээ');
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

            <div className={`relative h-48 rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3
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
                    <h1 className="text-sm font-black uppercase tracking-widest text-[#283480]">Бүртгэл баталгаажуулах</h1>
                    <div className="w-11" />
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-8">
                <div className="mb-10 p-6 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                    <Shield className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                    <h2 className="text-xl font-black mb-2 relative z-10">Хувийн мэдээлэл</h2>
                    <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-80 relative z-10">
                        Тээвэрлэлт хийх, ачаа авахын тулд та өөрийн иргэний үнэмлэх болон мэдээллээ баталгаажуулах шаардлагатай.
                    </p>
                </div>

                {/* i-Mongolia Quick Option */}
                <div className="mb-10 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Хурдан баталгаажуулах</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">i-Mongolia ашиглан нэг товшилтоор</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleIMongolia}
                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black">iM</div>
                        i-Mongolia-р нэвтрэх
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-8">
                            {/* Nationality Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Харьяалал</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{form.isForeign ? 'Гадаад иргэн' : 'Монгол улсын иргэн'}</p>
                                </div>
                                <div
                                    onClick={() => {
                                        setForm({ ...form, isForeign: !form.isForeign });
                                        setVerifiedVia('MANUAL');
                                    }}
                                    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${form.isForeign ? 'bg-[#283480]' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${form.isForeign ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Овог нэр</label>
                                    {verifiedVia === 'IMONGOLIA' && !form.isForeign && (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">i-Mongolia Баталгаажсан</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder={form.isForeign ? "Full Name (as in Passport)" : "Таны бүтэн нэр"}
                                    className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all ${verifiedVia === 'IMONGOLIA' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : ''}`}
                                    value={form.officialName}
                                    onChange={e => setForm({ ...form, officialName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{form.isForeign ? 'Паспорт / ID дугаар' : 'Регистрийн дугаар'}</label>
                                    {verifiedVia === 'IMONGOLIA' && !form.isForeign && (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">i-Mongolia Баталгаажсан</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder={form.isForeign ? "Passport or ID Number" : "АА00000000"}
                                    className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all uppercase ${verifiedVia === 'IMONGOLIA' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : ''}`}
                                    value={form.registrationNumber}
                                    onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Албан ёсны хаяг {verifiedVia === 'IMONGOLIA' ? '(Сонголттой)' : ''}</label>
                                <textarea
                                    placeholder={form.isForeign ? "Full address in your country or current stay" : "Сум, дүүрэг, баг, байрны дугаар..."}
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-medium focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all outline-none"
                                    value={form.officialAddress}
                                    onChange={e => setForm({ ...form, officialAddress: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-10">
                        <FileUploadInput
                            label={form.isForeign ? `Passport / ID Photo ${verifiedVia === 'IMONGOLIA' ? '(Сонголттой)' : ''}` : `Иргэний үнэмлэх ${verifiedVia === 'IMONGOLIA' ? '(Сонголттой)' : ''}`}
                            field="identityProofUrl"
                            value={form.identityProofUrl}
                            icon={form.isForeign ? FileText : CreditCard}
                            description={form.isForeign ? "Photo of your main Passport page" : "Үнэмлэхний нүүрэн талын зураг"}
                        />

                        <FileUploadInput
                            label={`Цээж зураг ${verifiedVia === 'IMONGOLIA' ? '(Сонголттой)' : ''}`}
                            field="livePhotoUrl"
                            value={form.livePhotoUrl}
                            icon={UserCheck}
                            description="Таны одоогийн зураг (Селфи)"
                        />
                    </section>

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
                                    Баталгаажуулах хүсэлт илгээх
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
