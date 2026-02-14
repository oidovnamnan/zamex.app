'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, Camera, Upload, ChevronLeft,
    Building2, CreditCard, CheckCircle2, Send,
    FileText, UserCheck, Landmark, Globe, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/store';
import { api, getMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CargoVerifyPage() {
    const router = useRouter();
    const { user, fetchMe } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [verifiedVia, setVerifiedVia] = useState<'MANUAL' | 'IMONGOLIA'>('MANUAL');
    const [platformSettings, setPlatformSettings] = useState<any>(null);

    useEffect(() => {
        api.get('/settings/public').then(({ data }) => {
            setPlatformSettings(data.data.settings);
        }).catch(() => { });
    }, []);

    const [isCompany, setIsCompany] = useState(true);
    const [form, setForm] = useState({
        nationality: 'Mongolia', // Mongolia, China, Other
        otherCountry: '',
        tradingName: user?.company?.name || '',
        officialName: '', // Company Legal Name
        ownerName: '', // Owner Name (New)
        registrationNumber: '', // Company Reg or Owner Reg
        officialAddress: '',
        identityProofUrl: '', // Passport or ID
        businessLicenseUrl: '', // Company License
        livePhotoUrl: '', // Owner Selfie
    });

    useEffect(() => {
        if (user?.company?.name && !form.tradingName) {
            setForm(prev => ({ ...prev, tradingName: user.company?.name || '' }));
        }
    }, [user]);

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
                nationality: 'Mongolia',
                otherCountry: '',
                tradingName: 'Замекс Карго',
                officialName: 'Замекс Карго ХХК',
                ownerName: 'Д.Болд',
                registrationNumber: '61001234',
                officialAddress: 'Улаанбаатар, Сүхбаатар дүүрэг, 8-р хороо',
                identityProofUrl: 'https://i-mongolia.mn/id-card-sample.png',
                businessLicenseUrl: 'https://i-mongolia.mn/license-sample.png',
                livePhotoUrl: 'https://i-mongolia.mn/photo-sample.png',
            });
            setVerifiedVia('IMONGOLIA');
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.tradingName || form.tradingName.length < 2) {
            toast.error('Каргоны нэр оруулна уу');
            return;
        }

        if (!form.officialName) {
            toast.error(isCompany ? 'Байгууллагын нэр оруулна уу' : 'Овог нэр оруулна уу');
            return;
        }

        if (isCompany && !form.ownerName) {
            toast.error('Эзэмшигчийн нэрийг оруулна уу');
            return;
        }


        if (verifiedVia === 'MANUAL' && (!form.identityProofUrl || !form.livePhotoUrl)) {
            toast.error('Зургуудаа бүрэн оруулна уу');
            return;
        }

        if (isCompany && !form.businessLicenseUrl && verifiedVia === 'MANUAL') {
            toast.error('Байгууллагын гэрчилгээний зураг шаардлагатай');
            return;
        }

        if (form.nationality === 'Other' && !form.otherCountry) {
            toast.error('Улсын нэрийг оруулна уу');
            return;
        }

        setLoading(true);
        try {
            await api.post('/verification/request', {
                ...form,
                isForeign: form.nationality !== 'Mongolia',
                country: form.nationality === 'Other' ? form.otherCountry : (form.nationality === 'China' ? 'China' : 'Mongolia'),
                registrationNumber: form.registrationNumber.toUpperCase(),
                verifiedVia,
                entityType: 'COMPANY'
            });
            await fetchMe();
            toast.success('Баталгаажуулах хүсэлт амжилттай илгээгдлээ');
            router.push('/cargo');
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
                    <h1 className="text-sm font-black uppercase tracking-widest text-[#283480]">Карго баталгаажуулах</h1>
                    <div className="w-11" />
                </div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-8">
                <div className="mb-10 p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                    <Landmark className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10 rotate-12" />
                    <h2 className="text-2xl font-black mb-3 relative z-10 italic uppercase">Бизнес баталгаажуулалт</h2>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed opacity-80 relative z-10 max-w-[280px]">
                        Карго үйл ажиллагаа явуулахын тулд та өөрийн аж ахуйн нэгж эсвэл хувь хүний мэдээллээ баталгаажуулна уу.
                    </p>
                </div>

                {form.nationality === 'Mongolia' && platformSettings?.imongoliaEnabled && (
                    <div className="mb-10 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-[#283480] flex items-center justify-center">
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
                            className="w-full h-16 bg-[#283480] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#1e2761] transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black">iM</div>
                            i-Mongolia-р нэвтрэх
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    <section className="space-y-6">
                        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-8">
                            {/* Entity Type Toggle */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Бизнесийн төрөл</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-[24px] border border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCompany(true)}
                                        className={`h-14 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all ${isCompany ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Хуулийн этгээд
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCompany(false)}
                                        className={`h-14 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all ${!isCompany ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Хувь хүн
                                    </button>
                                </div>

                                {!isCompany && (
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3">
                                        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase">
                                            Байгууллагын эрхээр баталгаажуулбал харилцагчийн итгэл нэмэгдэж, гүйлгээний лимит өндөр байх давуу талтай.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Cargo Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-blue-600">
                                    Каргоны нэр (Trading Name) *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Жишээ: Замекс Карго"
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-slate-900 border-l-4 border-l-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                                    value={form.tradingName}
                                    onChange={e => setForm({ ...form, tradingName: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Nationality Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-slate-400" />
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Эзэмшигчийн Харьяалал</h4>
                                </div>
                                <div className="relative">
                                    <select
                                        value={form.nationality}
                                        onChange={(e) => {
                                            setForm({ ...form, nationality: e.target.value });
                                            setVerifiedVia('MANUAL');
                                        }}
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold text-sm appearance-none focus:ring-2 focus:ring-blue-600/20 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="Mongolia">Монгол</option>
                                        <option value="China">Хятад</option>
                                        <option value="Other">Бусад</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>

                                {form.nationality === 'Other' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <input
                                            type="text"
                                            placeholder="Улсын нэрийг оруулна уу..."
                                            className="w-full h-14 bg-white border border-blue-200 rounded-2xl px-6 font-bold text-sm focus:ring-4 focus:ring-blue-600/10 outline-none shadow-sm"
                                            value={form.otherCountry}
                                            onChange={e => setForm({ ...form, otherCountry: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {isCompany ? 'Компанийн оноосон нэр (Legal Name)' : 'Овог Нэр (Owner Name)'}
                                    </label>
                                    {verifiedVia === 'IMONGOLIA' && form.nationality === 'Mongolia' && (
                                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">i-Mongolia Баталгаажсан</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder={isCompany ? "ХХК, Компанийн бүтэн нэр" : "Бичиг баримт дээрх бүтэн нэр"}
                                    className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all ${verifiedVia === 'IMONGOLIA' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : ''}`}
                                    value={form.officialName}
                                    onChange={e => setForm({ ...form, officialName: e.target.value })}
                                    required
                                />
                            </div>

                            {isCompany && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Эзэмшигчийн овог нэр (Owner Name)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Д.Болд"
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all"
                                        value={form.ownerName}
                                        onChange={e => setForm({ ...form, ownerName: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {isCompany ? 'Компанийн Регистрийн дугаар' : 'Иргэний Регистрийн дугаар (РД)'}
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    placeholder={isCompany ? "Регистрийн 7-10 оронтой тоо" : "Жишээ: АА12345678"}
                                    className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-black text-lg focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all uppercase ${verifiedVia === 'IMONGOLIA' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : ''}`}
                                    value={form.registrationNumber}
                                    onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Албан ёсны хаяг (Салбар, агуулахын хаяг)</label>
                                <textarea
                                    placeholder="УБ, СХД, 1-р хороо, 123 тоот..."
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-medium focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all outline-none"
                                    value={form.officialAddress}
                                    onChange={e => setForm({ ...form, officialAddress: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-10">
                        <FileUploadInput
                            label={form.nationality !== 'Mongolia' ? "Passport / ID Card" : "Иргэний үнэмлэх / Паспорт"}
                            field="identityProofUrl"
                            value={form.identityProofUrl}
                            icon={CreditCard}
                            description="Эзэмшигчийн бичиг баримтын зураг"
                        />

                        <FileUploadInput
                            label="Үйл ажиллагааны зөвшөөрөл"
                            field="businessLicenseUrl"
                            value={form.businessLicenseUrl}
                            icon={FileText}
                            description="Аж ахуйн нэгжийн гэрчилгээ (Сонголттой)"
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
                            className="w-full h-18 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group py-6"
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
