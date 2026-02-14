'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Link2, Shield, Copy, Check, Package, ChevronRight, Truck, Star, User, LogOut, Plus, AlertCircle, Image, Upload, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const PROTECTION_PLANS = [
  {
    slug: null, name: 'Үндсэн нөхцөл', desc: 'Каргоны энгийн тээвэрлэлт. Эрсдэлийг хэрэглэгч бүрэн хариуцна.', price: '₮0',
    icon: Shield, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200'
  },
  {
    slug: 'BASIC', name: 'Энгийн', desc: 'Барааны үнийн 50%-ийг буцаан олгоно. (₮500K хүртэл)', price: '3%',
    icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200'
  },
  {
    slug: 'STANDARD', name: 'Стандарт', desc: 'Барааны үнийн 80%-ийг буцаан олгоно. (₮2M хүртэл)', price: '5%',
    icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', recommended: true
  },
  {
    slug: 'PREMIUM', name: 'Премиум', desc: 'Барааны үнийн 100%-ийг бүтэн олгоно. (₮10M хүртэл)', price: '8%',
    icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200'
  },
];

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<'product' | 'order' | null>(null);

  // Form
  const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
  const [productUrl, setProductUrl] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [insurancePlan, setInsurancePlan] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<'STANDARD' | 'FAST'>('STANDARD');

  // Images
  const [productImage, setProductImage] = useState('');
  const [orderImage, setOrderImage] = useState('');

  // Result
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const companies = user?.customerCompanies || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'order') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Зөвхөн зураг эсвэл PDF файл оруулна уу');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файлын хэмжээ 5MB-аас их байна');
      return;
    }

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (type === 'product') {
        setProductImage(data.data.url);
      } else {
        setOrderImage(data.data.url);
      }
      toast.success('Амжилттай хуулагдлаа');
    } catch (err) {
      console.error(err);
      toast.error('Зураг хуулахад алдаа гарлаа');
    }
    setUploading(null);
  };

  const handleSubmit = async () => {
    if (!companyId) { toast.error('Карго сонгоно уу'); return; }
    setSubmitting(true);
    try {
      const body: any = { companyId };
      if (productUrl) body.productUrl = productUrl;
      if (productTitle) body.productTitle = productTitle;
      if (productPrice) body.productPrice = parseFloat(productPrice);
      if (productDescription) body.productDescription = productDescription;
      if (trackingNumber) body.trackingNumber = trackingNumber;
      if (insurancePlan) body.insurancePlanSlug = insurancePlan;
      body.serviceType = serviceType;

      // Images
      if (productImage) body.productImages = [productImage];
      if (orderImage) body.productScreenshot = orderImage;

      const { data } = await api.post('/orders', body);
      setResult(data.data.order);
      setStep(3);
      toast.success('Захиалга үүслээ!');

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#283480', '#F9BE4A', '#45B69F']
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Алдаа гарлаа');
    }
    setSubmitting(false);
  };

  const copyAddress = () => {
    if (result?.shippingAddress?.copy_all) {
      navigator.clipboard.writeText(result.shippingAddress.copy_all);
      setCopied(true);
      toast.success('Хаяг хуулагдлаа!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const steps = [
    { num: 1, label: 'Мэдээлэл' },
    { num: 2, label: 'Zamex Shield' },
    { num: 3, label: 'Баталгаажуулах' }
  ];

  return (
    <div className="min-h-screen bg-surface-50 lg:flex">
      {/* Desktop Sidebar */}
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
          <div className="max-w-3xl mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center gap-4">
            <button onClick={() => step > 1 && step < 3 ? setStep(step - 1) : router.back()}
              className="w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              {step === 3 ? 'Захиалга амжилттай 🎉' : 'Шинэ захиалга'}
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          {/* Progress Steps */}
          {step < 3 && (
            <div className="mb-10">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-surface-200 -z-10" />
                {steps.map((s) => (
                  <div key={s.num} className="flex flex-col items-center gap-2 bg-surface-50 px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${s.num <= step
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                      : 'bg-surface-200 text-surface-500'
                      }`}>
                      {s.num < step ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <span className={`text-xs font-semibold ${s.num <= step ? 'text-blue-600' : 'text-surface-400'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-xl shadow-slate-200/50 border border-surface-100">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Карго компани *</label>
                  <div className="relative">
                    <select value={companyId} onChange={e => setCompanyId(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-2xl p-4 pr-10 font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none">
                      <option value="">Сонгох...</option>
                      {companies.map((cc: any) => (
                        <option key={cc.company.id} value={cc.company.id}>
                          {cc.company.name} ({cc.customerCode})
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                  {companies.length === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                      <div>
                        Та хараахан карго компанитай холбогдоогүй байна.
                        <button onClick={() => router.push('/companies')} className="ml-1 font-bold underline">Карго хайх</button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Тээврийн төрөл *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setServiceType('STANDARD')}
                      className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all text-left ${serviceType === 'STANDARD' ? 'border-slate-900 bg-slate-900 text-white' : 'border-surface-200 bg-surface-50 text-slate-600 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <Truck className={`w-5 h-5 ${serviceType === 'STANDARD' ? 'text-blue-400' : 'text-slate-400'}`} />
                        {serviceType === 'STANDARD' && <Check className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm">Стандарт</div>
                        <div className={`text-[10px] ${serviceType === 'STANDARD' ? 'text-slate-400' : 'text-slate-500'}`}>Энгийн хугацаатай</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceType('FAST')}
                      className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all text-left ${serviceType === 'FAST' ? 'border-amber-500 bg-amber-500 text-white' : 'border-surface-200 bg-surface-50 text-slate-600 hover:border-slate-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <Plus className={`w-5 h-5 ${serviceType === 'FAST' ? 'text-white' : 'text-amber-500'}`} />
                        {serviceType === 'FAST' && <Check className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-inherit">Хурдан Карго</div>
                        <div className={`text-[10px] ${serviceType === 'FAST' ? 'text-amber-100' : 'text-slate-500'}`}>Жижиг ачаанд</div>
                      </div>
                    </button>
                  </div>
                </div>

                {serviceType === 'FAST' && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2">
                    <div className="flex gap-3">
                      <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-amber-900 leading-none mb-1">Хурдан Каргоны мэдээлэл</div>
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                          Энэ төрөл нь жижиг оворын барааг (гал тогооны хэрэгсэл, хувцас, гоо сайхны бүтээгдэхүүн г.м) хамгийн богино хугацаанд хүргэх зориулалттай.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Барааны линк</label>
                    <div className="relative group">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input value={productUrl} onChange={e => setProductUrl(e.target.value)}
                        placeholder="https://item.taobao.com/..."
                        className="w-full pl-12 bg-surface-50 border border-surface-200 rounded-2xl p-4 font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Барааны нэр</label>
                    <input value={productTitle} onChange={e => setProductTitle(e.target.value)}
                      placeholder="iPhone 15 гэр, Хар өнгө"
                      className="w-full bg-surface-50 border border-surface-200 rounded-2xl p-4 font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Үнэ (¥)</label>
                      <input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)}
                        placeholder="199"
                        className="w-full bg-surface-50 border border-surface-200 rounded-2xl p-4 font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                        Tracking Number <span className="text-slate-400 text-xs font-normal">(заавал биш)</span>
                      </label>
                      <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                        placeholder="SF123..."
                        className="w-full bg-surface-50 border border-surface-200 rounded-2xl p-4 font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400" />
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed px-1">
                        * Энэ нь таны захиалга хийсэн дэлгүүр (Taobao, 1688 г.м) барааг илгээсний дараа өгдөг хүргэлтийн код юм.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Image Upload */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Барааны зураг *</label>
                      <div className="relative group">
                        {productImage ? (
                          <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-slate-100 group-hover:border-blue-500 transition-colors">
                            <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                            <button onClick={() => setProductImage('')} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-slate-600 hover:text-red-500 transition-colors shadow-sm">
                              <LogOut className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 bg-surface-50 cursor-pointer hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                              {uploading === 'product' ? (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Image className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Зураг оруулах</span>
                            <span className="text-[10px] text-slate-400 mt-1 max-w-[80%] text-center">JPG, PNG, WEBP (Max 5MB)</span>
                            <input type="file" className="hidden" accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'product')} disabled={!!uploading} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Order Screenshot Upload */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Захиалгын скриншот *</label>
                      <div className="relative group">
                        {orderImage ? (
                          <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-slate-100 group-hover:border-blue-500 transition-colors">
                            <img src={orderImage} alt="Order" className="w-full h-full object-cover" />
                            <button onClick={() => setOrderImage('')} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-slate-600 hover:text-red-500 transition-colors shadow-sm">
                              <LogOut className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 bg-surface-50 cursor-pointer hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                              {uploading === 'order' ? (
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Скриншот оруулах</span>
                            <span className="text-[10px] text-slate-400 mt-1 max-w-[80%] text-center">Таобао захиалгын хэсэг</span>
                            <input type="file" className="hidden" accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'order')} disabled={!!uploading} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Тайлбар / Тэмдэглэл</label>
                    <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)}
                      placeholder="Өнгө, хэмжээ, тоо ширхэг..."
                      className="w-full bg-surface-50 border border-surface-200 rounded-2xl p-4 font-medium text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 min-h-[100px] resize-none" />
                  </div>
                </div>

                <button onClick={() => {
                  if (!productUrl && !productImage) { toast.error('Барааны линк эсвэл зураг заавал оруулна уу'); return; }
                  if (!orderImage) { toast.error('Захиалгын скриншот заавал оруулна уу'); return; }
                  setStep(2);
                }} disabled={!companyId || !!uploading}
                  className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  Zamex Shield сонгох <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Zamex Shield сонгох</h2>
                  <p className="text-slate-500 text-sm">Бараа эвдэрсэн, алга болсон тохиолдолд нөхөн олговор авна.</p>
                </div>

                <div className="grid gap-3">
                  {PROTECTION_PLANS.map(plan => (
                    <button key={plan.slug || 'none'}
                      onClick={() => setInsurancePlan(plan.slug)}
                      className={`relative w-full text-left p-4 lg:p-5 rounded-2xl border-2 transition-all flex items-start gap-4 group ${insurancePlan === plan.slug
                        ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-500/10'
                        : 'border-transparent bg-surface-50 hover:bg-surface-100 hover:border-surface-200'
                        }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.bg} ${plan.color}`}>
                        <plan.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${insurancePlan === plan.slug ? 'text-blue-900' : 'text-slate-900'}`}>{plan.name}</span>
                          <span className={`font-black ${plan.color}`}>{plan.price}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[90%]">{plan.desc}</p>
                      </div>
                      {plan.recommended && (
                        <span className="absolute -top-3 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-blue-500/30">
                          САНАЛ БОЛГОХ
                        </span>
                      )}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-1 ${insurancePlan === plan.slug ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}>
                        {insurancePlan === plan.slug && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold disabled:opacity-50 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/10">
                  {submitting ? 'Уншиж байна...' : 'Захиалга үүсгэх'}
                </button>
              </div>
            )}

            {step === 3 && result && (
              <div className="text-center py-6">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <Check className="w-8 h-8 text-white stroke-[3]" />
                  </div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-2">Захиалга үүслээ!</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Таны захиалга бүртгэгдлээ. Тээвэрлэлтийн хаягийг хуулан Taobao/1688 захиалга дээрээ ашиглана уу.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Хүргэлтийн хаяг</span>
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">CHINA WAREHOUSE</span>
                  </div>
                  <p className="font-mono text-sm text-slate-800 leading-relaxed break-all bg-white p-4 rounded-xl border border-slate-100 mb-4">
                    {result.shippingAddress?.copy_all}
                  </p>
                  <button onClick={copyAddress}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}>
                    {copied ? <><Check className="w-4 h-4" /> Амжилттай хууллаа</> : <><Copy className="w-4 h-4" /> Хаягийг хуулах</>}
                  </button>
                </div>

                <div className="flex gap-4 max-w-lg mx-auto">
                  <button onClick={() => router.push('/dashboard')} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-colors">
                    Нүүр хуудас
                  </button>
                  <button onClick={() => { setStep(1); setResult(null); setProductUrl(''); setProductTitle(''); setProductPrice(''); setProductDescription(''); setTrackingNumber(''); }}
                    className="flex-1 bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Дахин захиалга
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewOrderForm />
    </Suspense>
  );
}
