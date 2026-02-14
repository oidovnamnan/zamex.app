'use client';

import { useEffect, useState } from 'react';
import {
    Shield, Check, X, Eye,
    CreditCard, Building2, User,
    Landmark, FileCheck, AlertCircle,
    ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function FinancialApprovalsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedReq, setSelectedReq] = useState<any>(null);

    useEffect(() => { loadRequests(); }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/companies/admin/financial-requests?status=PENDING');
            setRequests(data.data.requests);
        } catch (err) {
            toast.error('Мэдээлэл авахад алдаа гарлаа');
        } finally { setLoading(false); }
    };

    const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (status === 'REJECTED' && !rejectionReason) {
            toast.error('Татгалзсан шалтгаанаа бичнэ үү');
            return;
        }

        if (!confirm(status === 'APPROVED' ? 'Энэ өөрчлөлтийг батлах уу?' : 'Энэ хүсэлтээс татгалзах уу?')) return;

        setReviewing(id);
        try {
            await api.patch(`/companies/admin/financial-requests/${id}/review`, { status, rejectionReason });
            toast.success(status === 'APPROVED' ? 'Амжилттай батлагдлаа' : 'Татгалзлаа');
            setRejectionReason('');
            setSelectedReq(null);
            loadRequests();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        } finally { setReviewing(null); }
    };

    const formatChangeType = (type: string) => {
        switch (type) {
            case 'CREATE': return { label: 'Шинээр үүсгэх', color: 'bg-emerald-100 text-emerald-700' };
            case 'UPDATE': return { label: 'Өөрчлөх', color: 'bg-blue-100 text-blue-700' };
            case 'DELETE': return { label: 'Устгах', color: 'bg-rose-100 text-rose-700' };
            default: return { label: type, color: 'bg-slate-100 text-slate-700' };
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                <Landmark className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Санхүүгийн Хүсэлтүүд</h1>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-900" />
                            Дансны мэдээлэл өөрчлөх хүсэлтүүдийг хянах
                        </p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm font-bold text-slate-600 text-sm">
                        Нийт хүлээгдэж буй: {requests.length}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white rounded-[32px] animate-pulse" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                        <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">Хүсэлт байхгүй байна</h3>
                        <p className="text-slate-500">Одоогоор шийдвэрлэх шаардлагатай санхүүгийн өөрчлөлт алга.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {requests.map((req) => {
                                const typeConfig = formatChangeType(req.changeType);
                                const isSelected = selectedReq?.id === req.id;

                                return (
                                    <motion.div
                                        layout
                                        key={req.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`bg-white rounded-[32px] border transition-all duration-300 overflow-hidden flex flex-col
                                            ${isSelected ? 'border-purple-200 ring-4 ring-purple-500/10 shadow-xl' : 'border-slate-200 shadow-sm hover:shadow-lg'}`}
                                    >
                                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 leading-tight">{req.company?.name || 'Unknown Company'}</h3>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                                                        {req.requester?.firstName} • {req.requester?.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${typeConfig.color}`}>
                                                {typeConfig.label}
                                            </span>
                                        </div>

                                        <div className="p-6 flex-1 space-y-4">
                                            {req.changeType === 'DELETE' ? (
                                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-3 text-rose-800">
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                    <p className="text-xs font-medium leading-relaxed">
                                                        Энэ дансыг устгах хүсэлт ирсэн байна. Баталснаар данс бүр мөсөн устахыг анхаарна уу.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Шинэ мэдээлэл</div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <InfoItem label="Дансны төрөл" value={req.requestedData.type} />
                                                        <InfoItem label="Банк / Провайдер" value={req.requestedData.providerName} />
                                                        <InfoItem label="Дансны дугаар" value={req.requestedData.accountNumber} highlight />
                                                        <InfoItem label="Данс эзэмшигч" value={req.requestedData.accountName} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                                            {isSelected ? (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                                    <textarea
                                                        className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none resize-none placeholder:text-slate-400"
                                                        placeholder="Татгалзах шалтгаан (Заавал бичих)..."
                                                        value={rejectionReason}
                                                        onChange={e => setRejectionReason(e.target.value)}
                                                        rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleReview(req.id, 'APPROVED')}
                                                            disabled={reviewing === req.id}
                                                            className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            {reviewing === req.id ? 'Уншиж байна...' : <><Check className="w-4 h-4" /> Батлах</>}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReview(req.id, 'REJECTED')}
                                                            disabled={reviewing === req.id}
                                                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <X className="w-4 h-4" /> Татгалзах
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedReq(req)}
                                                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 group"
                                                >
                                                    Шийдвэрлэх <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({ label, value, highlight }: any) {
    if (!value) return null;
    return (
        <div className={`p-3 rounded-2xl ${highlight ? 'bg-purple-50 border border-purple-100 col-span-2' : 'bg-slate-100/50 border border-slate-100'}`}>
            <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${highlight ? 'text-purple-400' : 'text-slate-400'}`}>{label}</div>
            <div className={`text-sm font-bold truncate ${highlight ? 'text-purple-900 text-lg' : 'text-slate-700'}`}>{value}</div>
        </div>
    );
}
