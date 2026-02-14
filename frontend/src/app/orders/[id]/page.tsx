'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Copy, Package, Truck, MapPin, Shield, Clock,
  CheckCircle2, AlertTriangle, CreditCard, Star, ChevronRight,
  ExternalLink, RotateCcw, User, LogOut, Plus, Pause, Play
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Захиалга үүссэн', icon: Package },
  { key: 'RECEIVED_IN_CHINA', label: 'Эрээнд ирсэн', icon: MapPin },
  { key: 'BATCHED', label: 'Тээвэрт бэлэн', icon: Clock },
  { key: 'DEPARTED', label: 'Тээвэрт гарсан', icon: Truck },
  { key: 'AT_CUSTOMS', label: 'Гааль дээр', icon: Shield },
  { key: 'ARRIVED_MN', label: 'УБ-д ирсэн', icon: MapPin },
  { key: 'SHELVED_MN', label: 'Агуулахад байгаа', icon: Clock },
  { key: 'READY_FOR_PICKUP', label: 'Авахад бэлэн', icon: CreditCard },
  { key: 'DELIVERED', label: 'Олгосон', icon: CheckCircle2 },
];

const STATUS_ORDER = ['PENDING', 'PRE_ANNOUNCED', 'RECEIVED_IN_CHINA', 'MEASURED', 'CATEGORIZED',
  'SHELVED_CHINA', 'BATCHED', 'DEPARTED', 'IN_TRANSIT', 'AT_CUSTOMS', 'CUSTOMS_CLEARED',
  'ARRIVED_MN', 'SHELVED_MN', 'READY_FOR_PICKUP', 'DELIVERED'];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<any[]>([]);
  const [qcTiers, setQcTiers] = useState<any[]>([]);
  const [showQcSelector, setShowQcSelector] = useState(false);
  const [payingQc, setPayingQc] = useState(false);

  useEffect(() => {
    loadOrder();
    loadSettings();
    loadDeliveryPoints();
  }, [id]);

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/settings/public');
      setPlatformSettings(data.data.settings);
      setQcTiers(data.data.qcTiers || []);
    } catch { }
  };

  const loadDeliveryPoints = async () => {
    try {
      const { data } = await api.get('/delivery-points/public');
      setDeliveryPoints(data.data.points);
    } catch { }
  };

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data.order);
    } catch { toast.error('Захиалга олдсонгүй'); router.back(); }
    setLoading(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Хуулагдлаа');
  };

  const toggleOrderHold = async () => {
    try {
      await api.patch(`/orders/${id}/hold`);
      loadOrder();
      toast.success(order.isHold ? 'Ачааг ачуулахаар суллалаа' : 'Ачааг түр зогсоолоо');
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  const requestQC = async (tierId: string) => {
    try {
      await api.patch(`/orders/${id}/qc-request`, { qcTierId: tierId });
      loadOrder();
      setShowQcSelector(false);
      toast.success('QC шалгалт хүсэлт илгээгдлээ');
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  const payQC = async () => {
    setPayingQc(true);
    try {
      await api.post(`/orders/${id}/qc-pay`);
      loadOrder();
      toast.success('Төлбөр амжилттай. Шалгалт эхэллээ.');
    } catch {
      toast.error('Төлбөр амжилтгүй');
    }
    setPayingQc(false);
  };

  const setDeliveryPoint = async (pointId: string) => {
    try {
      await api.patch(`/delivery-points/orders/${id}`, { deliveryPointId: pointId });
      loadOrder();
      toast.success('Хүлээн авах цэг хадгалагдлаа');
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return null;

  const pkg = order.package;
  const ins = order.insurance;
  const currentStatus = pkg?.status || order.status;
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  const getStepState = (stepKey: string) => {
    const stepIdx = STATUS_ORDER.indexOf(stepKey);
    if (stepIdx < 0) return 'upcoming';
    if (currentIdx >= stepIdx) return 'completed';
    if (currentIdx === stepIdx - 1) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-surface-50 lg:flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-white flex-col fixed h-screen z-50 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">ZAMEX</span>
          </div>
          <nav className="space-y-2">
            {[
              { icon: Package, label: 'Хяналтын самбар', href: '/dashboard' },
              { icon: Truck, label: 'Карго хайх', href: '/companies' },
              { icon: Plus, label: 'Шинэ захиалга', href: '/orders/new', active: true },
              { icon: Star, label: 'Миний үнэлгээ', href: '/ratings' },
              { icon: User, label: 'Профайл', href: '/profile' },
            ].map((item) => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium text-sm ${item.active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                <item.icon className={`w-5 h-5 ${item.active ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/10">
          <button onClick={() => { logout(); router.push('/auth'); }} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" /> Гарах
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        <header className="bg-white/80 backdrop-blur-xl border-b border-surface-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900 truncate">
                  {order.productTitle || 'Захиалгын дэлгэрэнгүй'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono font-bold border border-slate-200">
                  {order.package?.status || order.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-mono mt-0.5 max-w-md truncate">{order.orderCode}</p>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Timeline & Shipping */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-surface-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Барааны явц</h3>
                <div className="relative pl-2">
                  {/* Vertical Line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100" />

                  <div className="space-y-6 relative">
                    {TIMELINE_STEPS.map((step, i) => {
                      const state = getStepState(step.key);
                      const Icon = step.icon;
                      const isCompleted = state === 'completed';
                      const isCurrent = state === 'current';

                      return (
                        <div key={step.key} className="flex gap-4 relative">
                          {/* Dot */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                            isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100' :
                              'bg-slate-100 text-slate-300'
                            }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className={`flex-1 pt-1 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-bold text-sm ${isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>{step.label}</h4>
                                {/* Timestamps logic ... */}
                                {isCompleted && step.key === 'RECEIVED_IN_CHINA' && pkg?.receivedAt && (
                                  <p className="text-xs text-slate-500 mt-0.5">{new Date(pkg.receivedAt).toLocaleString('mn-MN')}</p>
                                )}
                                {isCompleted && step.key === 'DEPARTED' && pkg?.departedAt && (
                                  <p className="text-xs text-slate-500 mt-0.5">{new Date(pkg.departedAt).toLocaleString('mn-MN')}</p>
                                )}
                                {isCompleted && step.key === 'ARRIVED_MN' && pkg?.arrivedMnAt && (
                                  <p className="text-xs text-slate-500 mt-0.5">{new Date(pkg.arrivedMnAt).toLocaleString('mn-MN')}</p>
                                )}
                                {isCompleted && step.key === 'DELIVERED' && pkg?.deliveredAt && (
                                  <p className="text-xs text-slate-500 mt-0.5">{new Date(pkg.deliveredAt).toLocaleString('mn-MN')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && order.status !== 'COMPLETED' && (
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-surface-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Хүргэлтийн хаяг</h3>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide">China Warehouse</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-4 border border-slate-100">
                    {order.shippingAddress.copy_all}
                  </div>
                  <button onClick={() => copyText(order.shippingAddress.copy_all)} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                    <Copy className="w-4 h-4" /> Хаяг хуулах
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Details & Actions */}
            <div className="space-y-6">
              {/* Product Card */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-surface-200">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-400" />
                  Барааны мэдээлэл
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 text-sm">Карго</span>
                    <span className="font-bold text-slate-900 text-sm">{order.company?.name}</span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-slate-500 text-sm">Tracking</span>
                      <button onClick={() => copyText(order.trackingNumber)} className="font-mono font-bold text-blue-600 text-sm hover:underline flex items-center gap-1">
                        {order.trackingNumber} <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {pkg?.shippingCost && (
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-slate-500 text-sm">Тээвэр</span>
                      <span className="font-black text-slate-900 text-sm">₮{Number(pkg.shippingCost).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <a href={order.productUrl} target="_blank" rel="noopener" className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-sm transition-colors">
                      <ExternalLink className="w-4 h-4" /> Линк үзэх
                    </a>
                  </div>
                </div>
              </div>

              {/* Zamex Shield Card */}
              {ins && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[24px] p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">Zamex Shield</h3>
                        <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{ins.planSlug} Plan</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-white/80">
                        <span>Хураамж</span>
                        <span className="font-bold text-white">₮{Number(ins.premium).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-white/80">
                        <span>Нөхөн олговор</span>
                        <span className="font-bold text-white">Up to ₮{Number(ins.maxPayout).toLocaleString()}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Active Protection
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Return / Actions */}
              {pkg && ['DELIVERED', 'READY_FOR_PICKUP', 'ARRIVED_MN'].includes(pkg.status) && (
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-surface-200">
                  <button onClick={() => router.push(`/returns/new?orderId=${order.id}`)}
                    className="w-full py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Буцаалт хүсэх
                  </button>
                </div>
              )}

              {/* Advanced Logistics Section (Feature A & D) */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-surface-200 space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Логистик үйлчилгээ</h3>

                {/* Hold Toggle */}
                <button
                  onClick={toggleOrderHold}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${order.isHold ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.isHold ? 'bg-amber-500 text-white' : 'bg-white text-slate-400'}`}>
                      {order.isHold ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Ачаа түр саатуулах</div>
                      <div className="text-[10px] font-medium text-slate-500">Цуглуулж баглах бол түр зогсооно</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${order.isHold ? 'text-amber-500' : 'text-slate-300'}`} />
                </button>

                {/* QC Request */}
                {platformSettings?.qcServiceEnabled !== false && !order.qcRequested && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowQcSelector(!showQcSelector)}
                      className="w-full p-4 rounded-2xl flex items-center justify-between bg-purple-50 border border-purple-100 hover:border-purple-300 transition-all font-inter"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-white text-purple-600 flex items-center justify-center shadow-sm">
                          <Star className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">QC Шалгалт хүсэх</div>
                          <div className="text-[10px] font-medium text-purple-500">Барааг задалж чанарыг шалгуулах</div>
                        </div>
                      </div>
                      <Plus className={`w-5 h-5 text-purple-400 transition-transform ${showQcSelector ? 'rotate-45' : ''}`} />
                    </button>

                    {showQcSelector && (
                      <div className="grid grid-cols-1 gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        {qcTiers.map(tier => (
                          <button
                            key={tier.id}
                            onClick={() => requestQC(tier.id)}
                            className="p-3 rounded-xl bg-white border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-slate-800">{tier.name}</div>
                                <div className="text-[10px] text-slate-400">{tier.description}</div>
                              </div>
                              <div className="text-xs font-black text-purple-600">₮{Number(tier.price).toLocaleString()}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {order.qcRequested && order.qcStatus === 'PENDING_PAYMENT' && (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-3 font-inter">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase">QC Төлбөр хүлээгдэж байна</div>
                        <div className="text-[10px] font-bold text-amber-600">Үйлчилгээ идэвхжүүлэхэд төлбөр төлнө үү</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-y border-amber-200/50">
                      <span className="text-xs font-medium text-slate-500">QC Багц: <span className="font-bold text-slate-800">{order.qcTier?.name || 'Standard'}</span></span>
                      <span className="text-sm font-black text-slate-900">₮{Number(order.qcServiceFee).toLocaleString()}</span>
                    </div>
                    <button
                      disabled={payingQc}
                      onClick={payQC}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {payingQc ? 'ТӨЛБӨР ШАЛГАЖ БАЙНА...' : 'QPAY-ЭЭР ТӨЛӨХ'}
                    </button>
                  </div>
                )}

                {order.qcRequested && order.qcStatus === 'PAID' && !pkg?.qcCompleted && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">QC Төлбөр баталгаажсан</div>
                      <div className="text-[10px] font-medium text-emerald-600">Агуулахын ажилтан барааг шалгаж байна.</div>
                    </div>
                  </div>
                )}

                {/* QC Report View */}
                {pkg?.qcCompleted && (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-4 font-inter">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">QC Тайлан</div>
                        <div className="text-[10px] font-bold text-emerald-600">Шалгалт амжилттай</div>
                      </div>
                    </div>

                    {pkg.qcNotes && (
                      <div className="bg-white/60 p-3 rounded-lg text-xs font-medium text-slate-700 leading-relaxed italic border border-emerald-100">
                        "{pkg.qcNotes}"
                      </div>
                    )}

                    {pkg.qcPhotos && Array.isArray(pkg.qcPhotos) && pkg.qcPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {pkg.qcPhotos.map((photo: string, i: number) => (
                          <div key={i} className="aspect-square rounded-lg bg-white border border-emerald-100 overflow-hidden group relative">
                            <img src={photo} className="w-full h-full object-cover" />
                            <a href={photo} target="_blank" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-4 h-4 text-white" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {pkg.qcReportUrl && (
                      <a href={pkg.qcReportUrl} target="_blank" className="flex items-center justify-center gap-2 py-2.5 bg-white text-emerald-600 font-bold text-xs rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Бүрэн тайланг үзэх
                      </a>
                    )}
                  </div>
                )}

                {/* Delivery Point Selection (Feature C) */}
                {platformSettings?.deliveryPointsEnabled && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-inter">Хүлээн авах цэг</h4>
                      {order.deliveryPoint && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider font-inter">Сонгосон</span>
                      )}
                    </div>

                    {order.deliveryPoint ? (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between font-inter">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{order.deliveryPoint.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{order.deliveryPoint.address}</div>
                        </div>
                        <button onClick={() => setDeliveryPoint('')} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Өөрчлөх</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {deliveryPoints.map(point => (
                          <button
                            key={point.id}
                            onClick={() => setDeliveryPoint(point.id)}
                            className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group font-inter"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{point.name}</div>
                                <div className="text-[10px] text-slate-400 group-hover:text-blue-500 truncate max-w-[200px]">{point.address}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        {deliveryPoints.length === 0 && (
                          <div className="text-[10px] text-slate-400 italic text-center py-2 font-inter">Боломжит цэг байхгүй байна</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
