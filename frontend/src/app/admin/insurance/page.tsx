'use client';

import { useEffect, useState } from 'react';
import {
  Shield, TrendingUp, TrendingDown, DollarSign,
  Calendar, RefreshCw, Activity, Wallet,
  ArrowUpRight, ArrowDownLeft, CheckCircle2,
  AlertCircle, FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RiskFundPage() {
  const [balance, setBalance] = useState(0);
  const [target, setTarget] = useState(10000000);
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/insurance/fund');
      setBalance(data.data.balance || 0);
      setTarget(data.data.target || 10000000);
      setTransactions(data.data.transactions || []);
      setStats({
        totalIn: data.data.totalIn || 0,
        totalOut: data.data.totalOut || 0
      });
    } catch (err) {
      toast.error('Мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fundHealth = balance > 0 ? Math.min((balance / target) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">

        {/* 👑 Premium Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Zamex Shield</h1>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Эрсдэлийн сангийн удирдлагын систем
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Шинэчлэх</span>
          </button>
        </div>

        {/* 💎 Main Balance Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 md:p-10 shadow-2xl shadow-slate-900/20 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-widest text-xs mb-3">
                <Wallet className="w-4 h-4" />
                Нийт үлдэгдэл
              </div>
              <div className="text-5xl md:text-6xl font-black tracking-tight mb-2">
                ₮{balance.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Сангийн төлөв: <span className="text-white">Хэвийн</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-300">Сангийн дүүргэлт (Жилийн төлөвлөгөө)</span>
                <span className="text-sm font-black text-white">{fundHealth.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fundHealth}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 rounded-full"
                />
              </div>
              <div className="mt-4 flex justify-between text-xs font-medium text-slate-400">
                <span>0₮</span>
                <span>{target.toLocaleString()}₮ (Зорилт)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Flow Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-xl shadow-slate-200/50 flex items-center justify-between group hover:border-emerald-200 transition-colors"
          >
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Нийт орлого (Premiums)</div>
              <div className="text-3xl font-black text-slate-900">₮{stats.totalIn.toLocaleString()}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <ArrowUpRight className="w-7 h-7 text-emerald-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-xl shadow-slate-200/50 flex items-center justify-between group hover:border-rose-200 transition-colors"
          >
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Нийт зарлага (Claims)</div>
              <div className="text-3xl font-black text-slate-900">₮{stats.totalOut.toLocaleString()}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <ArrowDownLeft className="w-7 h-7 text-rose-500" />
            </div>
          </motion.div>
        </div>

        {/* 📝 Transaction List */}
        <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Гүйлгээний түүх</h3>
                <p className="text-xs font-medium text-slate-400">Сүүлийн 100 гүйлгээ</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading && transactions.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6 flex items-center justify-between animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-100 rounded" />
                      <div className="w-20 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-24 h-6 bg-slate-100 rounded" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Гүйлгээ олдсонгүй</h3>
                <p className="text-slate-400 text-sm">Одоогоор ямар нэгэн гүйлгээ хийгдээгүй байна.</p>
              </div>
            ) : (
              transactions.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm
                                            ${t.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {t.amount > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm mb-1">{t.description || 'Тайлбаргүй гүйлгээ'}</div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(t.createdAt).toLocaleDateString('mn-MN', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider">
                          {t.transactionType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-black tabular-nums tracking-tight ${t.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString()}₮
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
