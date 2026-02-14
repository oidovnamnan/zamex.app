'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera, Search, Package, Check, AlertTriangle, Scale,
  QrCode, Keyboard, ArrowLeft, X, Plus, Minus, History,
  ChevronRight, Box, User, Settings, Zap, Truck
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

type ScanMode = 'idle' | 'manual' | 'result';

interface ScannedItem {
  id: string; // package ID
  code: string;
  status: 'success' | 'warning';
  timestamp: Date;
  details?: string;
}

export default function StaffScannerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const companyId = user?.companyId;

  const [mode, setMode] = useState<ScanMode>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<ScannedItem[]>([]);

  // Manual entry
  const [orderCode, setOrderCode] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [serviceType, setServiceType] = useState<'STANDARD' | 'FAST'>('STANDARD');

  const handleReceive = async () => {
    if (!companyId) { toast.error('Компани тодорхойгүй'); return; }
    setLoading(true);
    try {
      const body: any = { companyId };
      if (orderCode) body.orderCode = orderCode;
      if (trackingNumber) body.trackingNumber = trackingNumber;
      if (weightKg) body.weightKg = parseFloat(weightKg);
      if (lengthCm) body.lengthCm = parseFloat(lengthCm);
      if (widthCm) body.widthCm = parseFloat(widthCm);
      if (heightCm) body.heightCm = parseFloat(heightCm);
      if (shelfLocation) body.shelfLocation = shelfLocation;
      body.serviceType = serviceType;

      const { data } = await api.post('/packages/receive', body);
      const pkg = data.data.package;
      const unident = data.data.unidentified;

      setResult(data.data);
      setMode('result');

      // Add to history
      const newItem: ScannedItem = {
        id: pkg?.id || unident?.id || Date.now().toString(),
        code: pkg?.orderCode || unident?.tempCode || 'Unknown',
        status: pkg?.matched ? 'success' : 'warning',
        timestamp: new Date(),
        details: pkg?.customerName || 'Эзэнгүй'
      };
      setRecentScans(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10

      if (pkg?.matched) {
        toast.success(`Бүртгэгдлээ: ${pkg.orderCode}`);
      } else {
        toast('Эзэнгүй бараа', { icon: '⚠️' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setMode('idle');
    setResult(null);
    setOrderCode('');
    setTrackingNumber('');
    setWeightKg('');
    setLengthCm('');
    setWidthCm('');
    setHeightCm('');
    setShelfLocation('');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-safe">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg shadow-slate-900/20">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Бараа хүлээн авах</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{user?.firstName} • STAFF</div>
            </div>
          </div>
          <button onClick={() => router.push('/cargo')} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* ═══ IDLE: Main Menu ═══ */}
        {mode === 'idle' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Big Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              <button className="relative overflow-hidden group w-full bg-slate-900 rounded-[32px] p-1 text-left shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-fullblur-3xl -mr-10 -mt-10" />
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[28px] p-8 relative z-10 border border-slate-700/50">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Камераар скан</h2>
                  <p className="text-sm text-slate-400 font-medium">Шошго уншуулж AI-р таниулах</p>
                </div>
              </button>

              <button onClick={() => setMode('manual')}
                className="w-full bg-white rounded-[32px] p-1 text-left shadow-xl shadow-slate-200/50 border border-slate-100 active:scale-[0.98] transition-all">
                <div className="bg-white rounded-[28px] p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Keyboard className="w-7 h-7 text-slate-900" />
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-500">Manual</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Гараар оруулах</h3>
                  <p className="text-xs text-slate-400 font-medium">Код, tracking, хэмжээс...</p>
                </div>
              </button>
            </div>

            {/* Recent History */}
            {recentScans.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Сүүлд бүртгэсэн</h3>
                  <button className="text-xs font-bold text-blue-600">Түүх</button>
                </div>
                <div className="space-y-3">
                  {recentScans.map((scan) => (
                    <div key={scan.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scan.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {scan.status === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{scan.code}</div>
                          <div className="text-xs text-slate-500">{scan.details} • {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ MANUAL ENTRY ═══ */}
        {mode === 'manual' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="flex items-center gap-4">
              <button onClick={resetForm} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">Мэдээлэл оруулах</h2>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-2 block">Захиалгын код</label>
                  <input value={orderCode} onChange={e => setOrderCode(e.target.value.toUpperCase())}
                    placeholder="CGE-..."
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-2 block">Tracking дугаар</label>
                  <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="SF..."
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-2 block">Тээврийн төрөл</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType('STANDARD')}
                    className={`h-14 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${serviceType === 'STANDARD' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                    <Truck className={`w-4 h-4 ${serviceType === 'STANDARD' ? 'text-blue-400' : 'text-slate-400'}`} />
                    Стандарт
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('FAST')}
                    className={`h-14 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${serviceType === 'FAST' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                  >
                    <Zap className={`w-4 h-4 ${serviceType === 'FAST' ? 'text-white' : 'text-amber-500'}`} />
                    Хурдан
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-2 block flex items-center gap-1">Жин (кг)</label>
                  <input type="number" step="0.01" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                    placeholder="0.0"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-2 block">Тавиур</label>
                  <input value={shelfLocation} onChange={e => setShelfLocation(e.target.value)}
                    placeholder="A-1"
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center uppercase" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 mb-2 block">Хэмжээс (см)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={lengthCm} onChange={e => setLengthCm(e.target.value)} placeholder="Урт" className="h-12 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-900 outline-none focus:border-blue-500" />
                  <input type="number" value={widthCm} onChange={e => setWidthCm(e.target.value)} placeholder="Өргөн" className="h-12 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-900 outline-none focus:border-blue-500" />
                  <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="Өндөр" className="h-12 rounded-xl bg-slate-50 border border-slate-200 text-center font-bold text-slate-900 outline-none focus:border-blue-500" />
                </div>
                {lengthCm && widthCm && heightCm && (
                  <div className="mt-3 text-center">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold font-mono">
                      CBM: {(parseFloat(lengthCm) * parseFloat(widthCm) * parseFloat(heightCm) / 1000000).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

            </div>

            <button onClick={handleReceive} disabled={loading || (!orderCode && !trackingNumber)}
              className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-6">
              {loading ? 'Уншиж байна...' : 'Барааг бүртгэх'}
            </button>
          </div>
        )}

        {/* ═══ RESULT ═══ */}
        {mode === 'result' && result && (
          <div className="flex flex-col h-[calc(100vh-140px)] animate-in zoom-in-95 duration-300 items-center justify-center text-center">

            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl ${result.package.matched
              ? 'bg-emerald-500 shadow-emerald-500/40'
              : 'bg-amber-500 shadow-amber-500/40'
              }`}>
              {result.package.matched ? (
                <Check className="w-12 h-12 text-white stroke-[3]" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-white stroke-[3]" />
              )}
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {result.package.matched ? 'Амжилттай' : 'Эзэнгүй бараа'}
            </h2>

            <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">
              {result.package.matched
                ? `${result.package.customerName} харилцагчийн бараа бүртгэгдлээ.`
                : 'Захиалгын мэдээлэл олдсонгүй. Системд эзэнгүй бараагаар бүртгэлээ.'}
            </p>

            <div className="w-full bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Код</span>
                  <span className="font-mono font-bold text-slate-900 text-lg">
                    {result.package.matched ? result.package.orderCode : result.unidentified?.tempCode}
                  </span>
                </div>
                {result.package.weightKg && (
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">Жин</span>
                    <span className="font-bold text-slate-900">{result.package.weightKg} кг</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Төлөв</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-black uppercase ${result.package.matched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {result.package.matched ? 'Баталгаажсан' : 'Хүлээгдэж буй'}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm mt-auto space-y-3 pb-8">
              <button onClick={resetForm}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Settings className="w-5 h-5" /> Дараагийн бараа
              </button>
              <button onClick={() => router.push('/cargo')} className="text-slate-400 font-bold text-sm py-2">
                Админ самбар луу буцах
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
