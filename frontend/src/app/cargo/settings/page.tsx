'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Building2, Smartphone, MapPin, Globe, CreditCard, ShieldCheck, Key, Plus, Trash2, Eye, Copy, Check } from 'lucide-react';
import { useEffect } from 'react';
import { api } from '@/lib/api';

export default function CargoSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Placeholder states - real implementation would fetch company details
    const [formData, setFormData] = useState({
        name: 'My Cargo',
        phone: '77000000',
        address: 'Ulaanbaatar, Mongolia',
        website: 'www.mycargo.mn',
        logoUrl: '',
        qpayMerchantId: '',
        instructions: ''
    });

    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const SCOPES = [
        { id: 'read:packages', label: 'Ачаа харах, хянах', color: 'bg-blue-100 text-blue-700' },
        { id: 'write:packages', label: 'Ачаа бүртгэх, засах', color: 'bg-purple-100 text-purple-700' },
        { id: 'read:pricing', label: 'Үнийн тариф харах', color: 'bg-emerald-100 text-emerald-700' },
        { id: 'read:info', label: 'Агуулах, Хэрэглэгч шалгах', color: 'bg-orange-100 text-orange-700' },
    ];

    useEffect(() => {
        if (user?.companyId) {
            fetchApiKeys();
            fetchAccounts();
        }
    }, [user?.companyId]);

    const fetchApiKeys = async () => {
        try {
            const { data } = await api.get('/integration/keys');
            setApiKeys(data.data.keys);
        } catch (e) {
            console.error('Failed to fetch API keys');
        }
    };

    const fetchAccounts = async () => {
        try {
            const { data } = await api.get(`/companies/${user.companyId}/payment-accounts`);
            setAccounts(data.data.accounts);
        } catch (e) {
            console.error('Failed to fetch payment accounts');
        }
    };

    const generateKey = async () => {
        const name = prompt('Түлхүүрийн нэрийг оруулна уу (Жишээ: Shopify Store):');
        if (!name) return;

        const useFullAccess = confirm('Бүх эрхийг (full_access) олгох уу? "Үгүй" гэвэл зөвхөн унших эрх олгогдоно.');
        const scopes = useFullAccess ? ['full_access'] : ['read:packages', 'read:pricing'];

        try {
            const { data } = await api.post('/integration/keys', { name, scopes });
            setNewKey(data.data.apiKey);
            fetchApiKeys();
            toast.success('Түлхүүр амжилттай үүслээ');
        } catch (e) {
            toast.error('Түлхүүр үүсгэхэд алдаа гарлаа');
        }
    };

    const addAccount = async () => {
        const type = prompt('Төрөл (BANK_MN, WECHAT, ALIPAY):', 'BANK_MN');
        if (!type) return;
        const providerName = prompt('Банкны нэр / Провайдер:');
        const accountNumber = prompt('Дансны дугаар:');
        const accountName = prompt('Данс эзэмшигч:');

        try {
            const { status, data } = await api.post(`/companies/${user.companyId}/payment-accounts`, {
                type, providerName, accountNumber, accountName
            });
            if (status === 202) {
                toast.success('Хүсэлт илгээгдлээ. Супер админ баталгаажуулсны дараа харагдана.');
            } else {
                toast.success('Данс амжилттай нэмэгдлээ');
                fetchAccounts();
            }
        } catch (e) {
            toast.error('Алдаа гарлаа');
        }
    };

    const deleteAccount = async (accountId: string) => {
        if (!confirm('Энэ дансыг устгах уу? (Супер админ баталгаажуулна)')) return;
        try {
            const { status } = await api.delete(`/companies/${user.companyId}/payment-accounts/${accountId}`);
            if (status === 202) {
                toast.success('Устгах хүсэлт илгээгдлээ');
            } else {
                toast.success('Данс устгагдлаа');
                fetchAccounts();
            }
        } catch (e) {
            toast.error('Алдаа гарлаа');
        }
    };

    const revokeKey = async (id: string) => {
        if (!confirm('Энэ түлхүүрийг идэвхгүй болгох уу?')) return;
        try {
            await api.delete(`/integration/keys/${id}`);
            fetchApiKeys();
            toast.success('Түлхүүр идэвхгүй боллоо');
        } catch (e) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Тохиргоо хадгалагдлаа');
        } catch (e) {
            toast.error('Алдаа гарлаа');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Тохиргоо</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Компанийн мэдээлэл</h2>
                            <p className="text-slate-500 text-sm">Карго компанийн ерөнхий мэдээлэл</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Компанийн нэр</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Утасны дугаар</label>
                                <input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Хаяг</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full h-11 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Bank Accounts Section */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Төлбөр хүлээн авах данснууд</h2>
                                <p className="text-slate-500 text-sm">Төлбөр шилжүүлэх болон зарлагын данснууд</p>
                            </div>
                        </div>
                        <button
                            onClick={addAccount}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Данс нэмэх
                        </button>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4 mb-6">
                        <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 font-bold leading-relaxed uppercase">
                            АНХААРУУЛГА: Дансны мэдээлэл өөрчлөх хүсэлт заавал Супер Админ-аар баталгаажсаны дараа системд шинэчлэгдэнэ. Энэ нь таны санхүүгийн аюулгүй байдлыг хангах зорилготой юм.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {accounts.length === 0 ? (
                            <div className="md:col-span-2 py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase text-xs">
                                Одоогоор бүртгэлтэй данс байхгүй байна
                            </div>
                        ) : (
                            accounts.map(acc => (
                                <div key={acc.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase">{acc.type}</span>
                                            {acc.isDefault && <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">Үндсэн</span>}
                                        </div>
                                        <button onClick={() => deleteAccount(acc.id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{acc.providerName}</div>
                                        <div className="text-xl font-black text-slate-900 tracking-tight">{acc.accountNumber}</div>
                                        <div className="text-sm font-bold text-slate-600">{acc.accountName}</div>
                                    </div>
                                    {acc.verificationStatus !== 'VERIFIED' && (
                                        <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase italic">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Баталгаажуулалт хүлээгдэж буй
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* External API Integration */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Холболтын түлхүүр (External API)</h2>
                                <p className="text-slate-500 text-sm">Гаднах систем болон онлайн дэлгүүрүүдтэй холбох</p>
                            </div>
                        </div>
                        <button
                            onClick={generateKey}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Шинэ түлхүүр
                        </button>
                    </div>

                    {newKey && (
                        <div className="mb-8 p-6 bg-amber-50 rounded-2xl border border-amber-200 animate-pulse-once">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                                    <ShieldCheck className="w-4 h-4" /> ТАНЫ ШИНЭ ТҮЛХҮҮР
                                </h3>
                                <button onClick={() => setNewKey(null)} className="text-amber-500 hover:text-amber-700 font-bold text-xs uppercase">Хаах</button>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-amber-200 flex items-center justify-between gap-4">
                                <code className="text-sm font-mono text-amber-900 break-all">{newKey}</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(newKey);
                                        toast.success('Хууллаа');
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Copy className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            <p className="mt-3 text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                                Сэрэмжлүүлэг: Энэ түлхүүрийг дахин харах боломжгүй тул аюулгүй газар хадгална уу.
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {apiKeys.length === 0 ? (
                            <div className="bg-slate-50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium whitespace-pre-wrap">
                                    Одоогоор холболтын түлхүүр байхгүй байна.{"\n"}
                                    Дэлгүүрийн холболт хийх бол дээрх "Шинэ түлхүүр" товчийг дарна уу.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-slate-100 rounded-2xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 text-left">Нэр</th>
                                            <th className="px-5 py-3 text-left">Эрхүүд (Scopes)</th>
                                            <th className="px-5 py-3 text-left">Префикс</th>
                                            <th className="px-5 py-3 text-left">Сүүлд ашигласан</th>
                                            <th className="px-5 py-3 text-left">Төлөв</th>
                                            <th className="px-5 py-3 text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {apiKeys.map(key => (
                                            <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-slate-900">{key.name}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {key.scopes?.map((s: string) => {
                                                            const scopeInfo = SCOPES.find(si => si.id === s);
                                                            if (s === 'full_access') return <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase">Full Access</span>;
                                                            return <span key={s} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${scopeInfo?.color || 'bg-slate-100 text-slate-500'}`}>{s.split(':')[1] || s}</span>
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 font-mono text-xs text-slate-500">{key.keyPrefix}...</td>
                                                <td className="px-5 py-4 text-slate-500 font-medium">
                                                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Ашиглаагүй'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${key.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {key.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => revokeKey(key.id)}
                                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                        {loading ? 'Хадгалж байна...' : <><Save className="w-5 h-5" /> Хадгалах</>}
                    </button>
                </div>
            </main>
        </div>
    );
}
