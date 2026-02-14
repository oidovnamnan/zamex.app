'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Star, Zap, Shield, HeadphonesIcon, DollarSign, MessageCircle, Check } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const TAGS = [
  'Хурдан хүргэлт', 'Найдвартай', 'Бараа бүрэн', 'Боломжийн үнэ',
  'Удаан хүргэлт', 'Бараа гэмтсэн', 'Харилцаа муу', 'Үнэ өндөр',
];

function StarRating({ value, onChange, size = 'lg' }: { value: number; onChange: (v: number) => void; size?: 'lg' | 'sm' }) {
  const sz = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={() => onChange(i)} className="transition-transform active:scale-90">
          <Star className={`${sz} transition-colors ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}`} />
        </button>
      ))}
    </div>
  );
}

import { Suspense } from 'react';

function NewRatingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<any>(null);
  const [overall, setOverall] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [safety, setSafety] = useState(0);
  const [service, setService] = useState(0);
  const [price, setPrice] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data.data.order);
    } catch { }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!overall) { toast.error('Ерөнхий үнэлгээ өгнө үү'); return; }
    setSubmitting(true);
    try {
      await api.post('/ratings', {
        orderId,
        overallRating: overall,
        speedRating: speed || undefined,
        safetyRating: safety || undefined,
        serviceRating: service || undefined,
        priceRating: price || undefined,
        comment: comment || undefined,
        tags,
      });
      setDone(true);
      toast.success('Үнэлгээ амжилттай!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа');
    }
    setSubmitting(false);
  };

  const ratingLabel = (v: number) =>
    v === 5 ? 'Маш сайн' : v === 4 ? 'Сайн' : v === 3 ? 'Дунд' : v === 2 ? 'Муу' : v === 1 ? 'Маш муу' : '';

  if (done) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Баярлалаа!</h2>
          <p className="text-sm text-surface-400 mb-6">Таны үнэлгээ каргоны рейтингд тусгагдлаа</p>
          <div className="flex gap-1 justify-center mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-8 h-8 ${i <= overall ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}`} />
            ))}
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
            Нүүр хуудас
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost btn-sm -ml-2">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-semibold text-surface-900">Үнэлгээ өгөх</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Order info */}
        {order && (
          <div className="text-center">
            <div className="text-sm text-surface-400 mb-1">{order.company?.name}</div>
            <div className="text-sm font-mono text-surface-500">{order.orderCode}</div>
          </div>
        )}

        {/* Overall Rating */}
        <div className="card p-6 text-center">
          <h3 className="text-base font-semibold text-surface-900 mb-3">Ерөнхий үнэлгээ</h3>
          <div className="flex justify-center mb-2">
            <StarRating value={overall} onChange={setOverall} />
          </div>
          {overall > 0 && (
            <span className={`text-sm font-medium ${overall >= 4 ? 'text-emerald-600' : overall >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
              {ratingLabel(overall)}
            </span>
          )}
        </div>

        {/* Sub-ratings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">Нарийвчилсан үнэлгээ (сонголтоор)</h3>
          {[
            { label: 'Хурд', icon: Zap, value: speed, set: setSpeed, color: 'text-blue-500' },
            { label: 'Аюулгүй байдал', icon: Shield, value: safety, set: setSafety, color: 'text-emerald-500' },
            { label: 'Үйлчилгээ', icon: HeadphonesIcon, value: service, set: setService, color: 'text-violet-500' },
            { label: 'Үнэ', icon: DollarSign, value: price, set: setPrice, color: 'text-amber-500' },
          ].map(sub => (
            <div key={sub.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <sub.icon className={`w-4 h-4 ${sub.color}`} />
                <span className="text-sm text-surface-700">{sub.label}</span>
              </div>
              <StarRating value={sub.value} onChange={sub.set} size="sm" />
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-surface-700 mb-3">Шошго (сонголтоор)</h3>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tags.includes(tag)
                    ? 'bg-zamex-50 border-zamex-300 text-zamex-700'
                    : 'bg-white border-surface-200 text-surface-500 hover:border-surface-300'
                  }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="card p-5">
          <label className="text-sm font-semibold text-surface-700 mb-2 block">
            <MessageCircle className="w-4 h-4 inline text-surface-400" /> Сэтгэгдэл
          </label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Каргоны талаар сэтгэгдлээ бичнэ үү (сонголтоор)"
            className="input min-h-[80px] resize-none" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!overall || submitting}
          className="btn-primary w-full btn-lg">
          {submitting ? 'Илгээж байна...' : 'Үнэлгээ өгөх'}
        </button>
      </main>
    </div>
  );
}

export default function NewRatingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewRatingForm />
    </Suspense>
  );
}
