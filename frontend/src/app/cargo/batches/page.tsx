'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Truck, Package, Check, X, Play,
  MapPin, RefreshCw, ChevronDown, ChevronRight, Scale
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

export default function BatchesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedPkgs, setSelectedPkgs] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [b, p] = await Promise.all([
        api.get('/batches?limit=50'),
        api.get('/packages?status=RECEIVED_IN_CHINA&limit=100'),
      ]);
      setBatches(b.data.data.batches);
      setPackages(p.data.data.packages.filter((p: any) => !p.batchId));
    } catch { } setLoading(false);
  };

  const createBatch = async () => {
    if (!user?.companyId) return;
    setCreating(true);
    try {
      await api.post('/batches', { companyId: user.companyId, vehicleInfo });
      toast.success('Batch үүслээ');
      setShowCreate(false); setVehicleInfo('');
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
    setCreating(false);
  };

  const addPackages = async (batchId: string) => {
    if (!selectedPkgs.length) { toast.error('Бараа сонгоно уу'); return; }
    setAdding(true);
    try {
      const { data } = await api.post(`/batches/${batchId}/packages`, { packageIds: selectedPkgs });
      toast.success(data.message);
      setSelectedPkgs([]); setSelectedBatch(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
    setAdding(false);
  };

  const closeBatch = async (id: string) => {
    try { await api.patch(`/batches/${id}/close`); toast.success('Batch хаагдлаа'); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
  };

  const departBatch = async (id: string) => {
    try { await api.patch(`/batches/${id}/depart`, {}); toast.success('Тээвэрт гарлаа'); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
  };

  const arriveBatch = async (id: string) => {
    try { await api.patch(`/batches/${id}/arrive`); toast.success('УБ-д ирлээ!'); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Алдаа'); }
  };

  const togglePkg = (id: string) => {
    setSelectedPkgs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const STATUS_ACTIONS: Record<string, { label: string; action: (id: string) => void; color: string }[]> = {
    OPEN: [
      { label: 'Хаах', action: closeBatch, color: 'btn-secondary' },
    ],
    CLOSED: [
      { label: 'Тээвэрт гаргах', action: departBatch, color: 'btn-primary' },
    ],
    DEPARTED: [
      { label: 'УБ-д ирсэн', action: arriveBatch, color: 'btn bg-emerald-600 text-white hover:bg-emerald-700' },
    ],
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all bg-slate-50 border border-slate-100 active:scale-95">
              <ArrowLeft className="w-5 h-5 text-[#283480]" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Batch удирдлага</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Тээвэрлэлтийн багц удирдлага</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-[#283480] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a235c] transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Шинэ
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Create */}
        {showCreate && (
          <div className="bg-white p-8 rounded-[32px] border-2 border-[#283480]/10 shadow-xl shadow-blue-900/5">
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight italic">Шинэ Batch үүсгэх</h3>
            <div className="space-y-4">
              <input value={vehicleInfo} onChange={e => setVehicleInfo(e.target.value)}
                placeholder="Машины мэдээлэл (Жишээ: 1234 УБА, Хөх өнгөтэй)"
                className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold placeholder:text-slate-300 focus:bg-white focus:border-[#283480]/20 focus:ring-4 focus:ring-[#283480]/5 outline-none transition-all" />
              <div className="flex gap-4">
                <button onClick={createBatch} disabled={creating} className="flex-1 h-14 bg-[#283480] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a235c] transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50">
                  {creating ? 'Үүсгэж байна...' : 'Batch үүсгэх'}
                </button>
                <button onClick={() => setShowCreate(false)} className="h-14 px-8 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Болих</button>
              </div>
            </div>
          </div>
        )}

        {/* Batches */}
        {batches.map(batch => {
          const actions = STATUS_ACTIONS[batch.status] || [];
          const isOpen = batch.status === 'OPEN';
          const isSelected = selectedBatch === batch.id;

          return (
            <div key={batch.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">{batch.batchCode}</span>
                    <ServiceTypeBadge serviceType={batch.serviceType} />
                    <StatusBadge status={batch.status} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg">
                      <Package className="w-3 h-3" /> {batch.totalPackages} бараа
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg">
                      <Scale className="w-3 h-3" /> {Number(batch.totalWeight).toFixed(1)}кг
                    </div>
                    {batch.vehicleInfo && (
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg italic">
                        <Truck className="w-3 h-3" /> {batch.vehicleInfo}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isOpen && (
                    <button onClick={() => setSelectedBatch(isSelected ? null : batch.id)}
                      className="h-10 px-6 rounded-xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-[#283480] hover:text-white transition-all shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> Бараа нэмэх
                    </button>
                  )}
                  {actions.map(a => (
                    <button key={a.label} onClick={() => a.action(batch.id)}
                      className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${a.color.includes('primary') ? 'bg-[#F9BE4A] text-slate-900 hover:bg-[#f1b02d]' :
                        a.color.includes('emerald') ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add packages panel */}
              {isSelected && (
                <div className="border-t border-slate-50 bg-slate-50/30 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">
                      Бараа сонгох
                    </h4>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                      {selectedPkgs.length} сонгосон
                    </span>
                  </div>
                  {packages.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-slate-100">
                      <Package className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Нэмэх бараа алга</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                      {packages.map(pkg => (
                        <button key={pkg.id} onClick={() => togglePkg(pkg.id)}
                          className={`group p-4 rounded-2xl flex items-center gap-4 text-left transition-all border ${selectedPkgs.includes(pkg.id) ? 'bg-white border-[#283480]/20 shadow-md ring-1 ring-[#283480]/5' : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedPkgs.includes(pkg.id) ? 'border-[#283480] bg-[#283480]' : 'border-slate-200 group-hover:border-slate-300'
                            }`}>
                            {selectedPkgs.includes(pkg.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate">{pkg.trackingNumber || pkg.order?.orderCode}</div>
                              {pkg.serviceType === 'FAST' && (
                                <span className="px-1.5 py-0.5 rounded px-1.5 py-px bg-amber-500 text-white text-[7px] font-black uppercase">Хурдан</span>
                              )}
                            </div>
                            {pkg.weightKg && <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{pkg.weightKg}кг</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedPkgs.length > 0 && (
                    <button onClick={() => addPackages(batch.id)} disabled={adding}
                      className="w-full h-14 mt-6 rounded-2xl bg-[#283480] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#1a235c] transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                      {adding ? 'Нэмж байна...' : `${selectedPkgs.length} бараа нэмэх`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && batches.length === 0 && (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Одоогоор ямар нэгэн batch үүсгээгүй байна</p>
            <button onClick={() => setShowCreate(true)} className="h-14 px-10 rounded-2xl bg-[#283480] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#1a235c] transition-all shadow-xl shadow-blue-900/20">Шинэ batch үүсгэх</button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
    DEPARTED: 'bg-amber-50 text-amber-700 border-amber-100',
    IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-100',
    ARRIVED: 'bg-green-50 text-green-700 border-green-100',
    UNLOADED: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  const labels: Record<string, string> = {
    OPEN: 'Нээлттэй',
    CLOSED: 'Хаасан',
    DEPARTED: 'Тээвэрт',
    IN_TRANSIT: 'Тээвэрт',
    ARRIVED: 'УБ-д ирсэн',
    UNLOADED: 'Буулгасан',
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
      {labels[status] || status}
    </span>
  );
}

function ServiceTypeBadge({ serviceType }: { serviceType: string }) {
  if (serviceType === 'FAST') {
    return (
      <span className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm animate-pulse-slow">
        ХУРДАН КАРГО
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider border border-slate-200">
      Стандарт
    </span>
  );
}
