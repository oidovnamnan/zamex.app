'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Camera, Upload, AlertTriangle, Package,
  Truck, ShieldX, Ban, HelpCircle, Check, X
} from 'lucide-react';
import { api, getMediaUrl } from '@/lib/api';
import toast from 'react-hot-toast';

const RETURN_TYPES = [
  { slug: 'DAMAGED_IN_TRANSIT', label: 'Тээврийн явцад гэмтсэн', icon: Truck, color: 'text-red-600 bg-red-50', desc: 'Бараа тээвэрлэлтийн явцад эвдэрсэн' },
  { slug: 'LOST_IN_TRANSIT', label: 'Тээврийн явцад алга болсон', icon: Package, color: 'text-red-600 bg-red-50', desc: 'Бараа олдохгүй байна' },
  { slug: 'DAMAGED_AT_UB', label: 'УБ агуулахад гэмтсэн', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', desc: 'УБ-д ирсний дараа гэмтсэн' },
  { slug: 'WRONG_DELIVERY', label: 'Буруу бараа олгосон', icon: ShieldX, color: 'text-orange-600 bg-orange-50', desc: 'Захиалсан бараа биш' },
  { slug: 'DAMAGED_AT_CHINA', label: 'Эрээнд гэмтсэн', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', desc: 'Хятад талд ирэхэд гэмтсэн' },
  { slug: 'NOT_ARRIVED_UB', label: 'УБ-д ирээгүй', icon: Package, color: 'text-orange-600 bg-orange-50', desc: 'Хугацаа хэтэрсэн, бараа ирээгүй' },
  { slug: 'CUSTOMS_REJECTED', label: 'Гаалиас буцаасан', icon: Ban, color: 'text-red-600 bg-red-50', desc: 'Гаалийн шалгалтаар буцаагдсан' },
  { slug: 'WRONG_ITEM', label: 'Худалдагч буруу бараа илгээсэн', icon: HelpCircle, color: 'text-gray-600 bg-gray-50', desc: 'Захиалсан зүйл биш' },
  { slug: 'QUALITY_ISSUE', label: 'Чанарын асуудал', icon: HelpCircle, color: 'text-gray-600 bg-gray-50', desc: 'Доголдолтой бараа' },
  { slug: 'OTHER', label: 'Бусад', icon: HelpCircle, color: 'text-gray-600 bg-gray-50', desc: 'Дээрх ангилалд багтахгүй' },
];

import { Suspense } from 'react';

function NewReturnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [step, setStep] = useState(1);
  const [order, setOrder] = useState<any>(null);
  const [returnType, setReturnType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data.data.order);
    } catch { toast.error('Захиалга олдсонгүй'); }
  };

  const handleSubmit = async () => {
    if (!orderId || !returnType || !title || !description) {
      toast.error('Бүх талбар бөглөнө үү'); return;
    }
    if (photos.length === 0) {
      toast.error('Зураг оруулна уу'); return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/returns', {
        orderId,
        returnType,
        title,
        description,
        evidencePhotos: photos.length > 0 ? photos : ['placeholder_evidence.jpg'],
      });
      setResult(data.data.return);
      setStep(3);
      toast.success('Буцаалт илгээгдлээ!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа');
    }
    setSubmitting(false);
  };

  // Auto-fill title from type
  useEffect(() => {
    const type = RETURN_TYPES.find(t => t.slug === returnType);
    if (type && !title) setTitle(type.label);
  }, [returnType]);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => step > 1 && step < 3 ? setStep(step - 1) : router.back()} className="btn-ghost btn-sm -ml-2">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-semibold text-surface-900">
            {step === 3 ? 'Буцаалт илгээгдлээ' : 'Буцаалт нээх'}
          </h1>
        </div>
        {step < 3 && (
          <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1.5">
            {[1, 2].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-amber-500' : 'bg-surface-200'}`} />
            ))}
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">

        {/* Order info */}
        {order && step < 3 && (
          <div className="card p-4 mb-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-surface-400" />
            <div>
              <div className="text-sm font-semibold text-surface-900">{order.productTitle || order.orderCode}</div>
              <div className="text-xs text-surface-400 font-mono">{order.orderCode} • {order.company?.name}</div>
            </div>
          </div>
        )}

        {/* Step 1: Select type */}
        {step === 1 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-surface-600 mb-3">Ямар асуудал гарсан бэ?</h2>
            {RETURN_TYPES.map(type => (
              <button key={type.slug} onClick={() => { setReturnType(type.slug); setStep(2); }}
                className={`card w-full p-4 text-left flex items-center gap-3 transition-all ${returnType === type.slug ? 'border-2 border-amber-500 ring-2 ring-amber-500/10' : 'hover:shadow-card-hover'
                  }`}>
                <div className={`w-10 h-10 rounded-xl ${type.color} flex items-center justify-center flex-shrink-0`}>
                  <type.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-900">{type.label}</div>
                  <div className="text-xs text-surface-400">{type.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Details + Evidence */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="badge-yellow mb-2">
              {RETURN_TYPES.find(t => t.slug === returnType)?.label}
            </div>

            <div>
              <label className="input-label">Гарчиг</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Товч тайлбар" className="input" />
            </div>

            <div>
              <label className="input-label">Дэлгэрэнгүй тайлбар *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Яг юу болсон, бараа ямар байдалтай байгааг бичнэ үү. Жишээ: Хайрцаг нь нухагдсан, дотор утасны гэр хагарсан..."
                className="input min-h-[100px] resize-none" />
              <p className="text-xs text-surface-400 mt-1">10+ тэмдэгт</p>
            </div>

            <div>
              <label className="input-label">Нотлох зураг *</label>
              <div className="grid grid-cols-3 gap-2">
                {/* Photo placeholders */}
                {[0, 1, 2].map(i => (
                  <label key={i}
                    className="aspect-square rounded-xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition relative overflow-hidden">
                    {photos[i] ? (
                      <div className="w-full h-full">
                        <img src={getMediaUrl(photos[i])} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <X className="w-5 h-5 text-white" onClick={(e) => {
                            e.preventDefault();
                            const newPhotos = [...photos];
                            newPhotos[i] = '';
                            setPhotos(newPhotos);
                          }} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-surface-300" />
                        <span className="text-[10px] text-surface-400 mt-1">Зураг {i + 1}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          const t = toast.loading('Зураг хуулж байна...');
                          try {
                            const { data } = await api.post('/upload', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            const newPhotos = [...photos];
                            newPhotos[i] = data.data.path;
                            setPhotos(newPhotos);
                            toast.success('Амжилттай', { id: t });
                          } catch (err) {
                            toast.error('Зураг хуулахад алдаа гарлаа', { id: t });
                          }
                        }
                      }} />
                  </label>
                ))}
              </div>
              <p className="text-xs text-surface-400 mt-1">Гэмтэл, бараа, хайрцагны зураг оруулна уу</p>
            </div>

            <button onClick={handleSubmit}
              disabled={submitting || !description || description.length < 10}
              className="btn btn-lg w-full bg-amber-600 text-white hover:bg-amber-700">
              {submitting ? 'Илгээж байна...' : 'Буцаалт илгээх'}
            </button>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="space-y-5 pt-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 mb-1">Буцаалт илгээгдлээ</h2>
              <p className="text-sm text-surface-400">Карго компани шалгаж хариу өгнө</p>
            </div>

            <div className="card p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Буцаалтын код</span>
                <span className="font-mono font-bold text-surface-900">{result.returnCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Хариуцагч (автомат)</span>
                <span className="font-medium text-surface-900">{result.liableParty}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Шалтгаан</span>
                <span className="text-xs text-surface-600 text-right max-w-[60%]">{result.liabilityReason}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              💡 AI автоматаар хариуцагчийг тодорхойлсон. Карго компани шалгаад эцсийн шийдвэр гаргана.
            </div>

            <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
              Нүүр хуудас руу
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NewReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewReturnForm />
    </Suspense>
  );
}
