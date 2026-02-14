'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from '@/lib/firebase';
import { useEffect, useRef } from 'react';


import { Suspense } from 'react';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState<'login' | 'register' | 'otp'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp_phone' | 'otp_email'>('password');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const { login, register, verifyOtp, requestOtp, firebaseVerify } = useAuth();

  useEffect(() => {
    // Initialize reCAPTCHA verifier
    if (typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, will allow signInWithPhoneNumber.
        },
      });
    }
  }, []);


  const redirectByRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        router.push('/admin');
        break;
      case 'CARGO_ADMIN':
      case 'TRANSPORT_ADMIN':
        router.push('/cargo'); // Initial decision: keep them under /cargo or create /transport
        break;
      case 'STAFF_CHINA':
      case 'STAFF_MONGOLIA':
      case 'TRANSPORT_STAFF':
        router.push('/cargo');
        break;
      case 'DRIVER':
        router.push('/driver');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(phone, password);
      if (data.data.requireOtp) {
        setMode('otp');
        toast.success('OTP код илгээлээ');
      } else {
        toast.success('Амжилттай нэвтэрлээ');
        redirectByRole(data.data.user.role);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Нэвтрэхэд алдаа гарлаа');
    }
    setLoading(false);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMethod === 'otp_phone') {
        const formattedPhone = phone.startsWith('+') ? phone : `+976${phone}`;
        const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current!);
        setConfirmationResult(result);
        setMode('otp');
        toast.success('Баталгаажуулах код илгээлээ (Firebase)');
      } else {
        await requestOtp(undefined, email);
        setMode('otp');
        toast.success('OTP код илгээлээ');
      }
    } catch (err: any) {
      console.error('Phone request error:', err);
      toast.error(err.message || 'OTP илгээхэд алдаа гарлаа');
      // If error is related to recaptcha, reset it
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    }
    setLoading(false);
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+976${phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current!);
      setConfirmationResult(result);
      setMode('otp');
      toast.success('Бүртгэлийн код илгээлээ (Firebase)');
    } catch (err: any) {
      console.error('Register request error:', err);
      toast.error(err.message || 'Бүртгэлд алдаа гарлаа');
    }
    setLoading(false);
  };


  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (confirmationResult) {
        // Firebase verification
        const result = await confirmationResult.confirm(otp);
        const idToken = await result.user.getIdToken();

        // Finalize with backend
        const data = await firebaseVerify(
          idToken,
          mode === 'register' ? firstName : undefined,
          mode === 'register' ? password : undefined
        );
        toast.success('Амжилттай!');
        redirectByRole(data.data.user.role);
      } else {
        // Legacy backend verification (Email)
        const data = await verifyOtp(otp, undefined, email);
        toast.success('Амжилттай!');
        redirectByRole(data.data.user.role);
      }
    } catch (err: any) {
      console.error('OTP verify error:', err);
      toast.error(err.message || 'OTP буруу');
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-50/50 blur-[120px]"
        />
      </div>

      <Link href="/" className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4" />
        Нүүр хуудас
      </Link>

      <div className="w-full max-w-md relative z-10 px-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-[28px] bg-[#283480] flex items-center justify-center shadow-2xl shadow-blue-900/40 mb-5">
              <img src="/logo.png" alt="Zamex Logo" className="h-11 w-auto brightness-0 invert" />
            </div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic">ZAMEX</h1>
          </motion.div>
          <p className="text-slate-500 font-semibold mt-2">{mode === 'otp' ? 'Аюулгүй байдлын шалгалт' : 'Карго удирдлагын ухаалаг систем'}</p>
        </motion.div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* OTP Mode */}
            {mode === 'otp' && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleOtp}
              >
                <button type="button" onClick={() => setMode('login')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 transition-colors font-bold text-xs uppercase tracking-widest">
                  <ArrowLeft className="w-3.5 h-3.5" /> Буцах
                </button>
                <h2 className="text-2xl font-black text-slate-950 mb-2">Баталгаажуулах</h2>
                <p className="text-sm text-slate-500 font-semibold mb-8">
                  {authMethod === 'otp_email' ? email : phone} хаяг руу илгээсэн 4 оронтой кодыг оруулна уу.
                </p>

                <div className="mb-8 relative h-20">
                  <input
                    type="tel"
                    maxLength={confirmationResult ? 6 : 4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  <div className="flex gap-2 h-full">
                    {[...Array(confirmationResult ? 6 : 4)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-2xl flex items-center justify-center text-3xl font-black transition-all ${otp.length > i
                          ? 'bg-white border-2 border-blue-500/20 text-slate-950 shadow-sm'
                          : 'bg-slate-100 border-2 border-transparent text-slate-300'
                          }`}
                      >
                        {otp[i] || '0'}
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={otp.length !== (confirmationResult ? 6 : 4) || loading}
                  className="w-full bg-slate-950 text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                >
                  {loading ? 'Шалгаж байна...' : 'Баталгаажуулах'}
                </motion.button>
              </motion.form>
            )}

            {/* Login Mode */}
            {mode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={authMethod === 'password' ? handleLogin : handleRequestOtp}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-950 mb-1">Нэвтрэх</h2>
                  <div className="flex gap-2 mt-4 p-1 bg-slate-100/50 rounded-xl">
                    {[
                      { id: 'password', label: 'Нууц үг' },
                      { id: 'otp_phone', label: 'Утасны OTP' },
                      { id: 'otp_email', label: 'Имэйл OTP' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAuthMethod(m.id as any)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${authMethod === m.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {authMethod === 'otp_email' ? (
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Имэйл хаяг</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all outline-none" autoFocus />
                    </div>
                  ) : (
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Утасны дугаар</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        placeholder="99112233" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all outline-none" autoFocus />
                    </div>
                  )}

                  {authMethod === 'password' && (
                    <div className="group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Нууц үг</label>
                      <div className="relative">
                        <input type={showPwd ? 'text' : 'password'} value={password}
                          onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all outline-none" />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                          {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {searchParams.get('role') === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setPhone('99112233');
                        setPassword('admin123456');
                      }}
                      className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-xl text-[10px] font-bold hover:from-purple-100 hover:to-pink-100 transition-all uppercase tracking-wider border border-purple-200 shadow-sm"
                    >
                      ⭐ Demo Super Admin
                    </button>
                  )}

                  {searchParams.get('role') === 'customer' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setPhone('99887766');
                        setPassword('customer123');
                      }}
                      className="p-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors uppercase tracking-wider"
                    >
                      Demo Customer
                    </button>
                  )}

                  {searchParams.get('role') === 'cargo' && (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMethod('password');
                          setPhone('88001122');
                          setPassword('cargo123456');
                        }}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold hover:bg-indigo-100 transition-colors uppercase tracking-wider border border-indigo-100"
                      >
                        Demo Cargo Admin
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMethod('password');
                            setPhone('88440011');
                            setPassword('staffchina123');
                          }}
                          className="p-2 bg-blue-50 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors uppercase tracking-wider"
                        >
                          Demo Erlian (China)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMethod('password');
                            setPhone('88440022');
                            setPassword('staffmn123');
                          }}
                          className="p-2 bg-emerald-50 rounded-xl text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors uppercase tracking-wider"
                        >
                          Demo UB (MN)
                        </button>
                      </div>
                    </div>
                  )}

                  {searchParams.get('role') === 'driver' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setPhone('88112233');
                        setPassword('driver123456');
                      }}
                      className="p-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors uppercase tracking-wider"
                    >
                      Demo Driver
                    </button>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={
                    (authMethod === 'password' && (!phone || !password)) ||
                    (authMethod === 'otp_phone' && !phone) ||
                    (authMethod === 'otp_email' && !email) ||
                    loading
                  }
                  className="w-full bg-slate-950 text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                >
                  {loading ? 'Уншиж байна...' : authMethod === 'password' ? 'Системд нэвтрэх' : 'OTP Код авах'}
                </motion.button>

                <p className="text-center text-sm font-semibold text-slate-400 mt-6">
                  Бүртгэл байхгүй юу?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-blue-600 font-black hover:text-blue-700 transition-colors">
                    Бүртгүүлэх
                  </button>
                </p>
              </motion.form>
            )}

            {/* Register Mode */}
            {mode === 'register' && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-950 mb-1">Шинэ бүртгэл</h2>
                  <p className="text-sm text-slate-500 font-semibold mb-8">Zamex-д нэгдэж үйлчилгээгээ аваарай.</p>
                </div>

                <div className="space-y-4">
                  <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Нэр</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Бат-Эрдэнэ" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all outline-none" autoFocus />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Утасны дугаар</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="99112233" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all outline-none" />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Нууц үг</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="6+ тэмдэгт" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all outline-none" />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!firstName || !phone || password.length < 6 || loading}
                  className="w-full bg-slate-950 text-white rounded-2xl py-5 font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                >
                  {loading ? 'Бүртгэж байна...' : 'Бүртгэл үүсгэх'}
                </motion.button>

                <p className="text-center text-sm font-semibold text-slate-400 mt-6">
                  Бүртгэлтэй юу?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-blue-600 font-black hover:text-blue-700 transition-colors">
                    Нэвтрэх
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-8">
          &copy; 2026 ZAMEX LOGISTICS SYSTEM. ALL RIGHTS RESERVED.
        </p>
      </div>
      <div id="recaptcha-container" />
    </div>

  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-zamex-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
