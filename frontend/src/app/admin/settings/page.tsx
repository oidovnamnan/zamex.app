'use client';

import { useEffect, useState } from 'react';
import {
    Settings, Lock, Eye, EyeOff, Save,
    Shield, DollarSign, Globe, Cpu, Bell,
    ToggleLeft, ToggleRight, ChevronRight,
    ArrowLeft, RefreshCw, AlertTriangle,
    CheckCircle2, Server, Database, Activity, Zap, Key, Building2, Plus, Copy, Trash2, TrendingUp, Users, Gift, MapPin
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [configPwd, setConfigPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const [allCompanyKeys, setAllCompanyKeys] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [filterCompany, setFilterCompany] = useState('all');
    const [qcTiers, setQcTiers] = useState<any[]>([]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings');
            setSettings(data.data.settings);
            loadQcTiers();
        } catch (err) {
            toast.error('Тохиргоо авахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const loadQcTiers = async () => {
        try {
            const { data } = await api.get('/settings/qc-tiers');
            setQcTiers(data.data.tiers);
        } catch { }
    };

    const addQcTier = async () => {
        const name = prompt('Багцын нэр:');
        if (!name) return;
        const price = prompt('Үнэ (MNT):');
        if (!price) return;

        try {
            await api.post('/settings/qc-tiers', { name, price: parseFloat(price), description: 'Standard QC package' });
            loadQcTiers();
            toast.success('Багц нэмэгдлээ');
        } catch {
            toast.error('Алдаа гарлаа');
        }
    };

    const deleteQcTier = async (id: string) => {
        if (!confirm('Устгах уу?')) return;
        try {
            await api.delete(`/settings/qc-tiers/${id}`);
            loadQcTiers();
            toast.success('Устгагдлаа');
        } catch {
            toast.error('Алдаа гарлаа');
        }
    };

    const updateSetting = async (field: string, value: any) => {
        if (!configPwd) {
            toast.error('Тохиргооны нууц үг оруулна уу');
            return;
        }
        setSaving(true);
        try {
            // Optimistic update
            setSettings((prev: any) => ({ ...prev, [field]: value }));

            await api.put('/settings', {
                configPassword: configPwd,
                [field]: value
            });
            toast.success('Тохиргоо шинэчлэгдлээ');
            setEditField(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Хадгалахад алдаа гарлаа');
            loadSettings(); // Revert
        } finally {
            setSaving(false);
        }
    };

    const loadCompanyKeys = async () => {
        try {
            const [keysRes, compRes] = await Promise.all([
                api.get('/integration/keys'),
                api.get('/companies')
            ]);
            setAllCompanyKeys(keysRes.data.data.keys);
            setCompanies(compRes.data.data.companies);
        } catch (err) {
            console.error('Failed to load company keys');
        }
    };

    useEffect(() => {
        if (activeTab === 'company-apis') {
            loadCompanyKeys();
        }
    }, [activeTab]);

    const revokeCompanyKey = async (id: string) => {
        if (!confirm('Энэ түлхүүрийг идэвхгүй болгох уу?')) return;
        try {
            await api.delete(`/integration/keys/${id}`);
            loadCompanyKeys();
            toast.success('Түлхүүр идэвхгүй боллоо');
        } catch (err) {
            toast.error('Алдаа гарлаа');
        }
    };

    if (loading && !settings) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl animate-bounce">
                    <Settings className="w-8 h-8 text-violet-600 animate-spin-slow" />
                </div>
                <p className="text-slate-400 font-bold animate-pulse">Системийн тохиргоог уншиж байна...</p>
            </div>
        </div>
    );

    const tabs = [
        { id: 'general', label: 'Ерөнхий', icon: Globe },
        { id: 'finance', label: 'Санхүү', icon: DollarSign },
        { id: 'tax', label: 'Татвар (VAT)', icon: Activity }, // New Tax Tab
        { id: 'shield', label: 'Zamex Shield', icon: Shield },
        { id: 'integrations', label: 'API Холболт', icon: Zap },
        { id: 'customs', label: 'Тээвэр & Гааль', icon: Activity },
        { id: 'growth', label: 'Логистик & Өсөлт', icon: TrendingUp }, // New Growth Tab
        { id: 'company-apis', label: 'Компанийн API', icon: Key },
        { id: 'system', label: 'Систем', icon: Cpu },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">

                {/* 👑 Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-300">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Платформ Тохиргоо</h1>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Системийн ажиллагааны үндсэн параметрүүд
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <Server className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-600">v2.4.0 (Stable)</span>
                        </div>
                        <button onClick={loadSettings} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95">
                            <RefreshCw className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* 🔐 Security Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 rounded-[24px] border border-amber-100 p-6 md:p-8 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                            <Lock className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-amber-900 mb-1">Аюулгүй байдлын бүс</h3>
                            <p className="text-amber-700/80 text-xs md:text-sm font-medium">
                                Тохиргоог өөрчлөхийн тулд системийн тохиргооны нууц үгийг оруулна уу.
                            </p>
                        </div>
                        <div className="w-full md:w-auto relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                value={configPwd}
                                onChange={e => setConfigPwd(e.target.value)}
                                placeholder="Тохиргооны нууц үг"
                                className="w-full md:w-72 pl-4 pr-12 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-amber-500/20 transition-all outline-none"
                            />
                            <button
                                onClick={() => setShowPwd(!showPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* 📑 Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                                    ${isActive
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ⚙️ Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {activeTab === 'general' && (
                        <>
                            <div className="card md:col-span-2 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-slate-400" />
                                    <h3 className="font-bold text-slate-900">Ерөнхий тохиргоо</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    <ToggleItem
                                        label="Платформ нээлттэй эсэх"
                                        desc="Бүртгэл болон шинэ хэрэглэгч нэвтрэх эрх"
                                        field="registrationOpen"
                                        value={settings.registrationOpen}
                                        onToggle={updateSetting}
                                    />
                                    <ToggleItem
                                        label="Засварын горим (Maintenance)"
                                        desc="Идэвхжүүлсэн үед зөвхөн админ нэвтрэх боломжтой"
                                        field="maintenanceMode"
                                        value={settings.maintenanceMode}
                                        onToggle={updateSetting}
                                        danger
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'customs' && (
                        <>
                            <div className="card md:col-span-2 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="p-6 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">Гаалийн Дижитал Систем</h3>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.customsSystemEnabled}
                                        onChange={(v: boolean) => updateSetting('customsSystemEnabled', v)}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/30 text-xs text-slate-500 font-medium font-inter">
                                    Идэвхжүүлсэн үед жолооч нарт Дижитал Манифест (QR код) үүсэх бөгөөд Гаалийн байцаагчид ачааны мэдээллийг онлайн харах боломжтой болно.
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'finance' && (
                        <>
                            <ConfigSection
                                title="Санхүү & Шимтгэл"
                                icon={DollarSign}
                                color="emerald"
                                items={[
                                    { label: 'Юанийн ханш (CNY)', field: 'cnyRate', value: settings.cnyRate, suffix: '₮' },
                                    { label: 'Үндсэн шимтгэл (Fee)', field: 'defaultPlatformFeeRate', value: settings.defaultPlatformFeeRate, suffix: '%', isRate: true },
                                    { label: 'Хамгийн бага шимтгэл', field: 'minPlatformFee', value: settings.minPlatformFee, suffix: '₮' },
                                    { label: 'Хамгийн их шимтгэл', field: 'maxPlatformFee', value: settings.maxPlatformFee, suffix: '₮' },
                                    { label: 'Settlement цикл', field: 'settlementCycleDays', value: settings.settlementCycleDays, suffix: ' хоног' },
                                ]}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                                onSave={updateSetting} saving={saving}
                            />
                            <ConfigSection
                                title="Хадгаламж & Түрээс"
                                icon={Database}
                                color="blue"
                                items={[
                                    { label: 'Үнэгүй хадгалах хоног', field: 'storageFreedays', value: settings.storageFreedays, suffix: ' хоног' },
                                    { label: 'Хадгаламжийн төлбөр (Фаз 1)', field: 'storageFeePhase1', value: settings.storageFeePhase1, suffix: '₮/өдөр' },
                                    { label: 'Хадгаламжийн төлбөр (Фаз 2)', field: 'storageFeePhase2', value: settings.storageFeePhase2, suffix: '₮/өдөр' },
                                    { label: 'Тодорхойгүй бараа хадгалах', field: 'unidentifiedStorageDays', value: settings.unidentifiedStorageDays, suffix: ' хоног' },
                                ]}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                                onSave={updateSetting} saving={saving}
                            />
                        </>
                    )}

                    {activeTab === 'tax' && (
                        <>
                            <div className="card md:col-span-2 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm mb-6">
                                <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">НӨАТ (VAT / E-Barimt) Систем</h3>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.vatEnabled}
                                        onChange={(v: boolean) => updateSetting('vatEnabled', v)}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/30 text-xs text-slate-500 font-medium">
                                    Идэвхжүүлсэн үед бүх нэхэмжлэх дээр НӨАТ нэмж тооцогдох бөгөөд төлбөр төлөгдөхөд автоматаар E-Barimt үүснэ.
                                </div>
                            </div>

                            <ConfigSection
                                title="Тариф болон Хувь"
                                icon={Activity}
                                color="emerald"
                                items={[
                                    { label: 'НӨАТ-ын хувь', field: 'vatRate', value: settings.vatRate, suffix: '%', isRate: true },
                                ]}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                                onSave={updateSetting} saving={saving}
                            />

                            <ApiKeySection
                                title="🏢 PosAPI 3.0 Тохиргоо"
                                icon={Database}
                                color="blue"
                                keys={[
                                    { label: 'POS ID', field: 'ebarimtPosId', value: settings.ebarimtPosId },
                                    { label: 'Merchant ID', field: 'ebarimtMerchantId', value: settings.ebarimtMerchantId },
                                    { label: 'API URL', field: 'ebarimtApiUrl', value: settings.ebarimtApiUrl },
                                ]}
                                onSave={updateSetting} saving={saving}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                            />
                        </>
                    )}

                    {activeTab === 'shield' && (
                        <>
                            <div className="card md:col-span-2 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm mb-6">
                                <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">Zamex Shield System</h3>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.insuranceEnabled}
                                        onChange={(v: boolean) => updateSetting('insuranceEnabled', v)}
                                    />
                                </div>
                            </div>

                            <ConfigSection
                                title="Zamex Shield Тохиргоо"
                                icon={Activity}
                                color="indigo"
                                items={[
                                    { label: 'BASIC багц', field: 'insuranceBasicRate', value: settings.insuranceBasicRate, suffix: '%', isRate: true },
                                    { label: 'STANDARD багц', field: 'insuranceStandardRate', value: settings.insuranceStandardRate, suffix: '%', isRate: true },
                                    { label: 'PREMIUM багц', field: 'insurancePremiumRate', value: settings.insurancePremiumRate, suffix: '%', isRate: true },
                                ]}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                                onSave={updateSetting} saving={saving}
                            />

                            <ConfigSection
                                title="Нөхөн олговор & Сан"
                                icon={Wallet}
                                color="rose"
                                items={[
                                    { label: 'Сангийн дүүргэлтийн зорилт', field: 'insuranceFundTarget', value: settings.insuranceFundTarget || 10000000, suffix: '₮' },
                                    { label: 'Макс олговор (Эрсдэлгүй)', field: 'maxCompensationNoInsurance', value: settings.maxCompensationNoInsurance, suffix: '₮' },
                                    { label: 'BASIC Макс', field: 'insuranceBasicMax', value: settings.insuranceBasicMax, suffix: '₮' },
                                    { label: 'STANDARD Макс', field: 'insuranceStandardMax', value: settings.insuranceStandardMax, suffix: '₮' },
                                ]}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                                onSave={updateSetting} saving={saving}
                            />
                        </>
                    )}

                    {activeTab === 'integrations' && (
                        <>
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ApiKeySection
                                    title="💸 QPay Төлбөрийн Систем"
                                    icon={DollarSign}
                                    color="orange"
                                    keys={[
                                        { label: 'Merchant ID', field: 'qpayMerchantId', value: settings.qpayMerchantId },
                                        { label: 'Username', field: 'qpayUsername', value: settings.qpayUsername },
                                        { label: 'Password', field: 'qpayPassword', value: settings.qpayPassword, isSecret: true },
                                    ]}
                                    onSave={updateSetting} saving={saving}
                                    editField={editField} setEditField={setEditField}
                                    editValue={editValue} setEditValue={setEditValue}
                                />

                                <ApiKeySection
                                    title="🤖 AI & LLM Models"
                                    icon={Cpu}
                                    color="purple"
                                    keys={[
                                        { label: 'OpenAI API Key', field: 'openaiApiKey', value: settings.openaiApiKey, isSecret: true },
                                        { label: 'Gemini API Key', field: 'geminiApiKey', value: settings.geminiApiKey, isSecret: true },
                                    ]}
                                    onSave={updateSetting} saving={saving}
                                    editField={editField} setEditField={setEditField}
                                    editValue={editValue} setEditValue={setEditValue}
                                />

                                <ApiKeySection
                                    title="🏛️ E-Mongolia Integration"
                                    icon={Globe}
                                    color="blue"
                                    keys={[
                                        { label: 'Client ID', field: 'imongoliaClientId', value: settings.imongoliaClientId },
                                        { label: 'Client Secret', field: 'imongoliaClientSecret', value: settings.imongoliaClientSecret, isSecret: true },
                                    ]}
                                    onSave={updateSetting} saving={saving}
                                    editField={editField} setEditField={setEditField}
                                    editValue={editValue} setEditValue={setEditValue}
                                />

                                <ApiKeySection
                                    title="📱 SMS Services"
                                    icon={Bell}
                                    color="green"
                                    keys={[
                                        { label: 'Provider URL', field: 'smsApiUrl', value: settings.smsApiUrl },
                                        { label: 'API Key', field: 'smsApiKey', value: settings.smsApiKey, isSecret: true },
                                    ]}
                                    onSave={updateSetting} saving={saving}
                                    editField={editField} setEditField={setEditField}
                                    editValue={editValue} setEditValue={setEditValue}
                                />

                                <ApiKeySection
                                    title="☁️ Cloud Services"
                                    icon={Server}
                                    color="blue"
                                    keys={[
                                        { label: 'Google Maps Key', field: 'googleMapsApiKey', value: settings.googleMapsApiKey, isSecret: true },
                                        { label: 'Google Vision Key', field: 'googleVisionApiKey', value: settings.googleVisionApiKey, isSecret: true },
                                        { label: 'Cloudinary Name', field: 'cloudinaryCloudName', value: settings.cloudinaryCloudName },
                                        { label: 'Cloudinary API Key', field: 'cloudinaryApiKey', value: settings.cloudinaryApiKey },
                                        { label: 'Cloudinary Secret', field: 'cloudinaryApiSecret', value: settings.cloudinaryApiSecret, isSecret: true },
                                    ]}
                                    onSave={updateSetting} saving={saving}
                                    editField={editField} setEditField={setEditField}
                                    editValue={editValue} setEditValue={setEditValue}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'company-apis' && (
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-sm border border-violet-200">
                                            <Key className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Компанийн API Түлхүүрүүд</h2>
                                            <p className="text-slate-500 font-medium text-sm">Платформ дээрх бүх каргоны API холболтын удирдлага</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={filterCompany}
                                            onChange={(e) => setFilterCompany(e.target.value)}
                                            className="h-12 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                                        >
                                            <option value="all">Бүх компани</option>
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-0">
                                    {allCompanyKeys.length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                                            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200">
                                                <Key className="w-10 h-10" />
                                            </div>
                                            <p className="text-slate-400 font-bold">Одоогоор идэвхтэй API түлхүүр байхгүй байна.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-8 py-4 text-left">Компани / Нэр</th>
                                                        <th className="px-8 py-4 text-left">Префикс</th>
                                                        <th className="px-8 py-4 text-left">Сүүлд ашигласан</th>
                                                        <th className="px-8 py-4 text-left">Эрхүүд</th>
                                                        <th className="px-8 py-4 text-left">Төлөв</th>
                                                        <th className="px-8 py-4 text-right">Үйлдэл</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {allCompanyKeys
                                                        .filter(k => filterCompany === 'all' || k.companyId === filterCompany)
                                                        .map(key => {
                                                            const company = companies.find(c => c.id === key.companyId);
                                                            return (
                                                                <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-8 py-6">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                                                                {company?.codePrefix?.slice(0, 2)}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-black text-slate-900 leading-none mb-1">{company?.name || 'Unknown'}</div>
                                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{key.name}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <code className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{key.keyPrefix}...</code>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <div className="text-sm font-bold text-slate-600">
                                                                            {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Ашиглаагүй'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {key.scopes?.slice(0, 2).map((s: string) => (
                                                                                <span key={s} className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 rounded-md uppercase tracking-tight">{s.split(':')[1] || s}</span>
                                                                            ))}
                                                                            {key.scopes?.length > 2 && <span className="text-[9px] text-slate-300">+{key.scopes.length - 2}</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-6">
                                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${key.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                            {key.isActive ? 'Идэвхтэй' : 'Цуцлагдсан'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-6 text-right">
                                                                        <button
                                                                            onClick={() => revokeCompanyKey(key.id)}
                                                                            className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"
                                                                        >
                                                                            <Trash2 className="w-5 h-5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'growth' && (
                        <>
                            <div className="card md:col-span-2 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm mb-6">
                                <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">Өсөлт & Урамшуулал (Feature B)</h3>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">Referral</span>
                                            <ToggleSwitch
                                                checked={settings.referralEnabled}
                                                onChange={(v: boolean) => updateSetting('referralEnabled', v)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">Loyalty</span>
                                            <ToggleSwitch
                                                checked={settings.loyaltyEnabled}
                                                onChange={(v: boolean) => updateSetting('loyaltyEnabled', v)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50/30 text-xs text-slate-500 font-medium font-inter">
                                    Урилгын систем болон оноо цуглуулах функцийг идэвхжүүлнэ. Идэвхжүүлсэн үед хэрэглэгчид өөрийн кодоор хүн урьж бонус авах боломжтой болно.
                                </div>
                            </div>

                            <div className="card md:col-span-2 overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm mb-6">
                                <div className="p-6 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">Хүргэлтийн Цэгүүд (Feature C)</h3>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.deliveryPointsEnabled}
                                        onChange={(v: boolean) => updateSetting('deliveryPointsEnabled', v)}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/30 text-xs text-slate-500 font-medium font-inter">
                                    CU, Storabox болон өөрийн салбаруудыг хүргэлтийн цэг болгон ашиглах боломжийг идэвхжүүлнэ.
                                </div>
                            </div>

                            <ConfigSection
                                title="Өсөлтийн Параметрүүд"
                                icon={Gift}
                                color="emerald"
                                items={[
                                    { label: 'Referral бонус (MNT)', field: 'referralBonusMnt', value: settings.referralBonusMnt, suffix: '₮' },
                                    { label: 'Loyalty онооны хувь', field: 'loyaltyPointRate', value: settings.loyaltyPointRate, suffix: '%', isRate: true },
                                    { label: 'QC Системийн хувь', field: 'qcPlatformShareRate', value: settings.qcPlatformShareRate || 0.30, suffix: '%', isRate: true },
                                ]}
                                editField={editField} setEditField={setEditField}
                                editValue={editValue} setEditValue={setEditValue}
                                onSave={updateSetting} saving={saving}
                            />

                            <div className="card overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="p-6 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">QC Үйлчилгээ (Feature D)</h3>
                                    </div>
                                    <ToggleSwitch
                                        checked={settings.qcServiceEnabled}
                                        onChange={(v: boolean) => updateSetting('qcServiceEnabled', v)}
                                    />
                                </div>
                                <div className="p-6 text-xs text-slate-500 font-medium font-inter">
                                    Ачааг хүлээн авах үед чанарын шалгалт хийх, зураг болон тайлан илгээх функцийг идэвхжүүлнэ.
                                </div>
                                {settings.qcServiceEnabled && (
                                    <div className="p-6 border-t border-slate-100 bg-slate-50/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QC Багцууд (Төлбөрийн хувилбарууд)</h4>
                                            <button onClick={addQcTier} className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {qcTiers.map(tier => (
                                                <div key={tier.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">{tier.name}</div>
                                                        <div className="text-[10px] text-slate-500">{tier.description}</div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-xs font-black text-purple-600">₮{Number(tier.price).toLocaleString()}</div>
                                                        <button onClick={() => deleteQcTier(tier.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {qcTiers.length === 0 && (
                                                <div className="text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Багц тохируулаагүй байна</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6 md:col-span-2">
                            <div className="card overflow-hidden bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-slate-400" />
                                    <h3 className="font-bold text-slate-900">Системийн модулиуд</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    <ToggleItem label="Subscription (Гишүүн) систем" field="subscriptionEnabled" value={settings.subscriptionEnabled} onToggle={updateSetting} />
                                    <ToggleItem label="AI туслах систем (Chatbot)" field="aiEnabled" value={settings.aiEnabled} onToggle={updateSetting} />
                                    <ToggleItem label="i-Mongolia баталгаажуулалт" field="imongoliaEnabled" value={settings.imongoliaEnabled} onToggle={updateSetting} />
                                    <ToggleItem label="Automatic Payouts (API)" field="autoPayoutEnabled" value={settings.autoPayoutEnabled} onToggle={updateSetting} desc="Байгууллагууд руу автоматаар шилжүүлэг хийх" />
                                    <ToggleItem label="QPay төлбөрийн систем" field="qpayEnabled" value={true} onToggle={() => { }} disabled />
                                </div>
                            </div>

                            <div className="card overflow-hidden bg-rose-50 border border-rose-100 rounded-[32px] shadow-sm">
                                <div className="p-6 border-b border-rose-100 bg-rose-100/50 flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-rose-600" />
                                    <h3 className="font-bold text-rose-900">Тохиргооны нууц үг солих</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-xs font-medium text-rose-700 max-w-lg">
                                        Энэ нууц үг нь системийн эгзэгтэй тохиргоонуудыг (Шимтгэл, API түлхүүр) засахад ашиглагддаг.
                                        <b> Production орчинд гарахаас өмнө солихыг зөвлөж байна.</b>
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Одоогийн нууц үг</label>
                                            <input
                                                type="password" id="currentConfigPwd"
                                                className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none"
                                                placeholder="Одоогийн нууц үг..."
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Шинэ нууц үг</label>
                                            <input
                                                type="password" id="newConfigPwd"
                                                className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none"
                                                placeholder="Шинэ нууц үг..."
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const current = (document.getElementById('currentConfigPwd') as HTMLInputElement).value;
                                            const nextVal = (document.getElementById('newConfigPwd') as HTMLInputElement).value;
                                            if (!current || !nextVal) return toast.error('Мэдээллээ бүрэн бөглөнө үү');
                                            try {
                                                await api.put('/settings/password', { currentPassword: current, newPassword: nextVal });
                                                toast.success('Нууц үг солигдлоо. Шинэ нууц үгээрээ үйлдлээ баталгаажуулна уу.');
                                                (document.getElementById('currentConfigPwd') as HTMLInputElement).value = '';
                                                (document.getElementById('newConfigPwd') as HTMLInputElement).value = '';
                                            } catch (err: any) {
                                                toast.error(err.response?.data?.error || 'Алдаа гарлаа');
                                            }
                                        }}
                                        className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                                    >
                                        НУУЦ ҮГ ШИНЭЧЛЭХ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            </div>
        </div>
    );
}

// ═══ Components ═══

function ConfigSection({ title, icon: Icon, color, items, editField, setEditField, editValue, setEditValue, onSave, saving }: any) {
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        rose: 'bg-rose-50 text-rose-600',
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {items.map((item: any) => {
                    const isEditing = editField === item.field;
                    const displayValue = item.value !== undefined
                        ? (item.isRate ? (Number(item.value) * 100).toFixed(1) : Number(item.value).toLocaleString())
                        : '0';

                    return (
                        <div key={item.field} className="p-4 flex items-center justify-between gap-4 group hover:bg-slate-50 transition-colors">
                            <span className="text-sm text-slate-600 font-semibold">{item.label}</span>
                            {isEditing ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <input
                                        type="number" value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        className="w-24 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-right text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const finalVal = item.isRate ? parseFloat(editValue) / 100 : parseFloat(editValue);
                                                onSave(item.field, finalVal);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const finalVal = item.isRate ? parseFloat(editValue) / 100 : parseFloat(editValue);
                                            onSave(item.field, finalVal);
                                        }}
                                        disabled={saving}
                                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditField(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setEditField(item.field); setEditValue(displayValue.replace(/,/g, '')); }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white transition-all flex items-center gap-2 group/btn"
                                >
                                    <span className="text-sm font-black text-slate-900">{displayValue}{item.suffix}</span>
                                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover/btn:text-indigo-600 transition-colors" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ToggleItem({ label, desc, field, value, onToggle, disabled, danger }: any) {
    return (
        <div className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
            <div>
                <div className={`text-sm font-bold ${danger ? 'text-rose-600' : 'text-slate-700'}`}>{label}</div>
                {desc && <div className="text-xs text-slate-400 font-medium mt-0.5">{desc}</div>}
            </div>
            <ToggleSwitch checked={value} onChange={(v: boolean) => onToggle(field, v)} disabled={disabled} danger={danger} />
        </div>
    );
}

export function ToggleSwitch({ checked, onChange, disabled, danger }: any) {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${checked
                ? (danger ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : 'bg-slate-900 shadow-lg shadow-slate-900/20')
                : 'bg-slate-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
}

function Wallet(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
    )
}

function ApiKeySection({ title, icon: Icon, color, keys, onSave, saving, editField, setEditField, editValue, setEditValue }: any) {
    const colors: any = {
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {keys.map((key: any) => {
                    const isEditing = editField === key.field;
                    const maskedValue = key.isSecret && key.value ? '••••••••••••••••' : (key.value || 'Not Configured');
                    const isEmpty = !key.value;

                    return (
                        <div key={key.field} className="p-4 flex flex-col gap-2 group hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{key.label}</span>
                                {!isEditing && (
                                    <button
                                        onClick={() => { setEditField(key.field); setEditValue(key.value || ''); }}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        EDIT
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type={key.isSecret ? "password" : "text"}
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none w-full"
                                        autoFocus
                                        placeholder={`Enter ${key.label}...`}
                                    />
                                    <button
                                        onClick={() => onSave(key.field, editValue)}
                                        disabled={saving}
                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditField(null)} className="p-2 text-slate-400 hover:text-slate-600">
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className={`text-sm font-mono truncate ${isEmpty ? 'text-slate-300 italic' : 'text-slate-700'}`}>
                                    {isEmpty ? 'Хоосон' : maskedValue}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
