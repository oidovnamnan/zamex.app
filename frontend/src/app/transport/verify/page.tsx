'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, Camera, Upload, ChevronLeft,
    Truck, CreditCard, CheckCircle2, Send,
    FileText, UserCheck, Landmark, Globe
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import { api, getMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TransportVerifyPage() {
    const router = useRouter();
    const { user, fetchMe } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [verifiedVia, setVerifiedVia] = useState<'MANUAL' | 'IMONGOLIA'>('MANUAL');

    const [form, setForm] = useState({
        isForeign: false,
        officialName: '', // Transport Company Name or Carrier Name
        registrationNumber: '', // Business Reg or Owner Reg
        officialAddress: '',
        identityProofUrl: '', // Passport or ID
        businessLicenseUrl: '', // Transport License / Permit
        livePhotoUrl: '', // Owner Selfie
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
                officialName: 'Замекс Транс Ложистик ХХК',
                registrationNumber: '51009876',
                officialAddress: 'Улаанбаатар, Баянгол дүүрэг, 20-р хороо',
                identityProofUrl: 'https://i-mongolia.mn/id-card-sample.png',
                businessLicenseUrl: 'https://i-mongolia.mn/transport-license-sample.png',
                livePhotoUrl: 'https://i-mongolia.mn/photo-sample.png',
            });
            setVerifiedVia('IMONGOLIA');
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.officialName) {
            toast.error('Албан ёсны нэр оруулна уу');
            return;
        }

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
                entityType: 'COMPANY'
            });
            await fetchMe();
            toast.success('Баталгаажуулах хүсэлт амжилттай илгээгдлээ');
            router.push('/cargo'); // Or wherever transport admins go
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
                                <div className="w-8 h-8 border-4 border-[#283480] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-[#283480] uppercase tracking-widest animate-pulse">Уншиж байна...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <label className="cursor-pointer flex flex-col items-center">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform">Зураг / Файл хуулах</span>
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, field)} accept="image/*,application/pdf" />
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
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-sm font-black uppercase tracking-widest text-[#283480]">Тээвэр баталгаажуулах</h1>
                    <div className="w-11" />
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-8">
                <div className="mb-10 p-8 bg-blue-600 rounded-[40px] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
                    <Truck className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10 rotate-12" />
                    <h2 className="text-2xl font-black mb-3 relative z-10 italic uppercase">Тээврийн баталгаажуулалт</h2>
                    <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-80 relative z-10 max-w-[280px]">
                        Тээвэр зуучлал болон ложистикийн үйл ажиллагаа явуулахын тулд та өөрийн байгууллагын мэдээллээ баталгаажуулна уу.
                    </p>
                </div>

                {!form.isForeign && (
                    <div className="mb-10 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
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
                            className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black">iM</div>
                            i-Mongolia-р нэвтрэх
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-8">
                            {/* Nationality Toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Эзэмшигчийн Харьяалал</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{form.isForeign ? 'Гадаад иргэн' : 'Монгол улсын иргэн'}</p>
                                </div>
                                <div
                                    onClick={() => {
                                        setForm({ ...form, isForeign: !form.isForeign });
                                        setVerifiedVia('MANUAL');
                                    }}
                                    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${form.isForeign ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${form.isForeign ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {form.isForeign ? 'Official Name / Carrier' : 'Албан ёсны нэр / Тээвэр зууч'}
                                    </label>
                                    {verifiedVia === 'IMONGOLIA' && !form.isForeign && (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">i-Mongolia Баталгаажсан</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder={form.isForeign ? "Logistics Company Name" : "Компанийн нэр эсвэл Эзэмшигчийн нэр"}
                                    className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all ${verifiedVia === 'IMONGOLIA' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : ''}`}
                                    value={form.officialName}
                                    onChange={e => setForm({ ...form, officialName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {form.isForeign ? 'ID / Passport / Business Reg' : 'Регистрийн дугаар / РД'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={form.isForeign ? "Document Number" : "РД эсвэл Компанийн регистр"}
                                    className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all uppercase ${verifiedVia === 'IMONGOLIA' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : ''}`}
                                    value={form.registrationNumber}
                                    onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Албан ёсны хаяг {verifiedVia === 'IMONGOLIA' ? '(Сонголттой)' : ''}</label>
                                <textarea
                                    placeholder="Төв оффисын хаяг..."
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-medium focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all outline-none"
                                    value={form.officialAddress}
                                    onChange={e => setForm({ ...form, officialAddress: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-10">
                        <FileUploadInput
                            label={form.isForeign ? "Passport / ID Card" : "Иргэний үнэмлэх / Паспорт"}
                            field="identityProofUrl"
                            value={form.identityProofUrl}
                            icon={CreditCard}
                            description="Эзэмшигчийн бичиг баримтын зураг"
                        />

                        <FileUploadInput
                            label="Тээвэрлэх тусгай зөвшөөрөл"
                            field="businessLicenseUrl"
                            value={form.businessLicenseUrl}
                            icon={FileText}
                            description="Тээвэр зууч эсвэл ложистикийн гэрчилгээ"
                        />

                        <FileUploadInput
                            label="Цээж зураг (Selfie)"
                            field="livePhotoUrl"
                            value={form.livePhotoUrl}
                            icon={UserCheck}
                            description="Эзэмшигчийн одоогийн зураг"
                        />
                    </section>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-18 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group py-6"
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
