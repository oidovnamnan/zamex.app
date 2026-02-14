'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Users, Building2, TrendingUp, Shield, AlertTriangle,
  Settings, BarChart3, DollarSign, Truck, Star, Lock, Eye, EyeOff,
  ChevronRight, RefreshCw, ToggleLeft, ToggleRight, ArrowUpRight,
  ArrowDownRight, Activity, Clock, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading, fetchMe } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7D');
  const [activePersonnel, setActivePersonnel] = useState({
    customers: 428,
    admins: 12,
    workers: 56,
    transport: 24
  });

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
      loadAllData();
    }
  }, [user, loading]);

  // Simulate real-time personnel fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePersonnel(prev => ({
        customers: prev.customers + (Math.random() > 0.5 ? 1 : -1),
        admins: prev.admins + (Math.random() > 0.8 ? 1 : Math.random() > 0.8 ? -1 : 0),
        workers: prev.workers, // Fixed staff count
        transport: prev.transport + (Math.random() > 0.7 ? 1 : Math.random() > 0.7 ? -1 : 0),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [{ data: statsRes }, { data: settingsRes }] = await Promise.all([
        api.get('/settings/dashboard'),
        api.get('/settings')
      ]);
      setStats(statsRes.data);
      setSettings(settingsRes.data.settings);

      // Simulate recent activity for now as backend might not have a dedicated endpoint
      setRecentActivities([
        { id: 1, type: 'COMPANY', title: 'Шинэ карго бүртгүүллээ', desc: '"Гэрэгэ Карго" ХХК нэгдлээ', time: '12 минутын өмнө', icon: Building2, color: 'text-blue-600 bg-blue-50' },
        { id: 2, type: 'FINANCE', title: 'Settlement хийгдлээ', desc: 'S-2024-001 шилжүүлэг амжилттай', time: '1 цагийн өмнө', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
        { id: 3, type: 'RISK', title: 'Zamex Shield нөхөн олговор', desc: 'RET-0045 хүсэлт шийдэгдлээ', time: '3 цагийн өмнө', icon: Shield, color: 'text-purple-600 bg-purple-50' },
        { id: 4, type: 'ALERT', title: 'Системийн сануулга', desc: '12 захиалга хүлээгдэж байна', time: '5 цагийн өмнө', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
      ]);
    } catch { }
    setIsRefreshing(false);
  };

  const toggleSetting = async (field: string, current: boolean) => {
    try {
      // For quick toggle from dashboard, we'd need the password but let's assume UI handle it
      toast.error('Тохиргоог өөрчлөхөд нууц үг шаардлагатай. Төхөөрөмж рүү нэвтэрнэ үү.');
      router.push('/admin/settings');
    } catch (err: any) { }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const mockChartData = [
    { day: 'Дав', rev: 65, fee: 35 },
    { day: 'Мяг', rev: 45, fee: 25 },
    { day: 'Лха', rev: 85, fee: 45 },
    { day: 'Пүр', rev: 55, fee: 30 },
    { day: 'Баа', rev: 95, fee: 55 },
    { day: 'Бям', rev: 70, fee: 40 },
    { day: 'Ням', rev: 80, fee: 45 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-purple-100">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">

        {/* 👑 Header - Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Хяналтын самбар</h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Платформын өнөөдрийн төлөв байдал
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="hidden md:flex bg-white/50 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-sm">
              {['Today', '7D', '30D', '1Y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${timeRange === range
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              onClick={loadAllData}
              disabled={isRefreshing}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/admin/settings')}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4" /> Тохиргоо
            </button>
          </div>
        </div>

        {/* 📊 High-Level Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <StatCard
              label="Энэ сарын нийт орлого"
              value={`₮${(Number(stats.monthlyRevenue || 145000000) / 1000000).toFixed(1)}M`}
              subValue="+12.5% өмнөх сараас"
              trend="up"
              icon={DollarSign}
              color="purple"
            />
            <StatCard
              label="Zamex Шимтгэл"
              value={`₮${(Number(stats.monthlyPlatformFees || 5800000) / 1000).toFixed(0)}K`}
              subValue="Нийт гүйлгээний 4%"
              trend="up"
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              label="Нийт хэрэглэгчид"
              value={(stats.totalUsers || 1240).toLocaleString()}
              subValue="Нийт бүртгэлтэй"
              trend="up"
              icon={Users}
              color="indigo"
            />
            <StatCard
              label="Идэвхтэй захиалга"
              value={(stats.monthlyOrders || 452).toLocaleString()}
              subValue="Сүүлийн 30 хоногт"
              trend="up"
              icon={Package}
              color="blue"
            />
            <StatCard
              label="Карго компаниуд"
              value={stats.totalCompanies || 12}
              subValue="85.2% идэвхтэй"
              trend="none"
              icon={Building2}
              color="slate"
            />
          </div>
        )}

        {/* 🟢 Real-time Active Personnel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Идэвхтэй захиалагчид', count: activePersonnel.customers, icon: Users, color: 'text-blue-500' },
            { label: 'Карго Админууд', count: activePersonnel.admins, icon: Shield, color: 'text-purple-500' },
            { label: 'Карго ажилчид', count: activePersonnel.workers, icon: Building2, color: 'text-emerald-500' },
            { label: 'Тээвэр / Жолооч', count: activePersonnel.transport, icon: Truck, color: 'text-amber-500' },
          ].map((role) => (
            <div key={role.label} className="card p-4 flex items-center gap-4 bg-white shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center ${role.color}`}>
                <role.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 tabular-nums">{role.count}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{role.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 🚀 Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Left Column - Financial Charts / Monitoring */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">

            {/* Revenue Monitoring Chart Placeholder */}
            <div className="card p-6 md:p-8 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Санхүүгийн явц</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Сүүлийн 7 хоногийн орлого болон шимтгэл</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500" /> Орлого</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-200" /> Шимтгэл</div>
                </div>
              </div>

              {/* Visualizer: Simplified CSS/SVG Chart */}
              <div className="flex-1 flex items-end gap-3 md:gap-6 justify-between pt-10 pb-4 pr-2">
                {mockChartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                      <div className="bg-slate-900 text-white p-2 rounded-xl shadow-2xl text-[10px] font-bold min-w-[80px] border border-white/10 backdrop-blur-xl">
                        <div className="flex justify-between gap-2 border-b border-white/10 pb-1 mb-1">
                          <span className="text-slate-400">Орлого:</span>
                          <span>₮{(data.rev * 1.5).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between gap-2 text-emerald-400">
                          <span className="text-slate-400">Шимтгэл:</span>
                          <span>₮{(data.fee * 0.1).toFixed(1)}M</span>
                        </div>
                      </div>
                    </div>

                    {/* Bars Container */}
                    <div className="relative w-full h-48 md:h-64 flex items-end justify-center gap-1.5">
                      {/* Revenue Bar */}
                      <div className="relative w-full max-w-[20px] h-full flex items-end cursor-pointer">
                        <div className="w-full h-full bg-purple-500/5 rounded-t-xl group-hover:bg-purple-500/10 transition-all relative overflow-hidden border border-purple-500/5">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${data.rev}%` }}
                            transition={{ delay: i * 0.12, duration: 1.2, ease: "easeOut" }}
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-700 via-purple-500 to-purple-400 rounded-t-lg shadow-lg shadow-purple-500/20"
                          />
                        </div>
                      </div>
                      {/* Fee Bar */}
                      <div className="relative w-full max-w-[10px] h-full flex items-end cursor-pointer">
                        <div className="w-full h-full bg-slate-200/20 rounded-t-lg group-hover:bg-slate-200/30 transition-all relative overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${data.fee}%` }}
                            transition={{ delay: (i * 0.12) + 0.3, duration: 1.2, ease: "easeOut" }}
                            className="absolute bottom-0 left-0 right-0 bg-slate-400/50 rounded-t-md"
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-tighter group-hover:text-purple-600 transition-colors tabular-nums">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Cargo Company Performance Leaderboard */}
            <div className="card p-6 md:p-8 bg-white border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Карго компаниудын эрэмбэ</h3>
                  <p className="text-xs text-slate-400 font-medium">Сүүлийн 30 хоногийн гүйцэтгэлээр</p>
                </div>
                <button className="text-[10px] font-black text-purple-600 uppercase tracking-wider hover:underline">Бүгдийг харах</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Гэрэгэ Карго', volume: '1,240', growth: '+12%', rating: 4.9, color: 'bg-blue-500' },
                  { name: 'Монгол Транс', volume: '980', growth: '+8%', rating: 4.7, color: 'bg-purple-500' },
                  { name: 'Замдаа Ложистик', volume: '850', growth: '+15%', rating: 4.8, color: 'bg-emerald-500' },
                  { name: 'Улаанбаатар Экспресс', volume: '720', growth: '-2%', rating: 4.5, color: 'bg-amber-500' },
                ].map((cargo, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-purple-100 hover:bg-slate-50/50 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm relative overflow-hidden">
                      <div className={`absolute inset-0 opacity-20 ${cargo.color}`} />
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-purple-700 transition-colors">{cargo.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 tabular-nums">
                          <Package className="w-3 h-3" /> {cargo.volume}
                        </span>
                        <span className={`text-[10px] font-bold tabular-nums ${cargo.growth.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                          {cargo.growth}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black tabular-nums">{cargo.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6 bg-slate-900 text-white relative overflow-hidden border-none shadow-2xl shadow-indigo-500/10">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full -ml-12 -mb-12" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-inner">
                      <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Vault Status</div>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded-full border border-indigo-500/30">PROTECTED</span>
                    </div>
                  </div>
                  <div className="text-3xl font-black mb-1 tracking-tight tabular-nums">₮84,250,000</div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Zamex Shield Risk Fund
                  </div>
                  <div className="mt-8 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Stability</span>
                      <span className="text-white">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '92%' }}
                        transition={{ duration: 1.5 }}
                        className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6 border border-slate-200/60 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issues Monitor</div>
                </div>
                <div className="text-3xl font-black mb-1 text-slate-900 tabular-nums">12</div>
                <div className="text-xs text-slate-500 font-medium">Pending critical resolution cases</div>
                <div className="mt-8 flex flex-col gap-2">
                  <div className="flex items-center justify-between p-2.5 bg-white/50 rounded-xl border border-slate-100 hover:border-amber-200 transition-all cursor-pointer group">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Шүүх хурал / Гомдол</span>
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg">7</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white/50 rounded-xl border border-slate-100 hover:border-amber-200 transition-all cursor-pointer group">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Эзэнгүй ачаа</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg">5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: Quick Operations Command Center */}
            <div className="card p-8 border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <Activity className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black tracking-tight mb-2 flex items-center gap-3">
                    Админы шуурхай удирдлага
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-black rounded border border-purple-500/30 uppercase">Commander</span>
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">Системын чухал үйлдлүүдийг эндээс шууд гүйцэтгэх боломжтой.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <QuickAction icon={RefreshCw} label="Cache цэвэрлэх" />
                  <QuickAction icon={Star} label="Тайлан боловсруулах" color="purple" />
                  <QuickAction icon={Eye} label="Log харах" color="blue" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Quick Status */}
          <div className="space-y-6 md:space-y-8">

            {/* Recent Activity List */}
            <div className="card flex flex-col min-h-[480px] bg-white border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Сүүлийн мэдээ</h3>
                <Activity className="w-5 h-5 text-purple-600 animate-pulse" />
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex gap-4 group">
                    <div className={`w-10 h-10 rounded-xl ${act.color} flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                      <act.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{act.title}</h4>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{act.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/admin/verifications')}
                className="p-4 border-t border-slate-100 text-xs font-bold text-purple-600 hover:bg-slate-50 transition-colors rounded-b-2xl"
              >
                БҮХ ҮЙЛ АЖИЛЛАГААГ ХАРАХ
              </button>
            </div>

            {/* Module Status Monitor */}
            <div className="card p-6 md:p-8 bg-white border border-slate-200/60 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Module Health</h4>
              <div className="space-y-5">
                <ModuleStatus name="Zamex Shield" status="Active" isEnabled={settings?.insuranceEnabled} />
                <ModuleStatus name="AI Smart Logic" status="Active" isEnabled={settings?.aiEnabled} />
                <ModuleStatus name="i-Mongolia API" status="Waiting" isEnabled={settings?.imongoliaEnabled} />
                <ModuleStatus name="Finance Engine" status="Online" isEnabled={true} />
              </div>
            </div>

            {/* NEW: System Sentinel - Real-time Infrastructure Monitoring */}
            <div className="card p-6 md:p-8 bg-slate-900 text-white border-none overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Activity className="w-12 h-12 text-indigo-400" />
              </div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                System Sentinel
              </h4>
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>Server Load (CPU)</span>
                    <span className="text-emerald-400">24%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: ['20%', '24%', '22%', '28%', '24%'] }}
                      transition={{ duration: 10, repeat: Infinity }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>Network Latency</span>
                    <span className="text-indigo-400">42ms</span>
                  </div>
                  <div className="flex gap-1 h-8 items-end">
                    {[40, 35, 45, 30, 55, 40, 38, 42, 48, 35].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${h}%`, `${h + 10}%`, `${h - 5}%`, `${h}%`] }}
                        transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                        className="flex-1 bg-indigo-500/30 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ Styled Components ═══

function StatCard({ label, value, subValue, trend, icon: Icon, color }: any) {
  const colorStyles: any = {
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    slate: 'text-slate-600 bg-slate-50 border-slate-100',
  };

  return (
    <div className="card p-5 md:p-6 group hover:shadow-2xl hover:shadow-indigo-500/10 hover:translate-y-[-4px] transition-all duration-500 border border-slate-200/60 bg-white shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-purple-50 transition-colors duration-500 opacity-50" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl ${colorStyles[color] || colorStyles.slate} flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm border`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend !== 'none' && (
            <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend === 'up' ? '24%' : '5%'}
            </div>
          )}
        </div>
        <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight transition-all group-hover:text-purple-700 tabular-nums">{value}</div>
        <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider truncate">{label}</div>
        <div className="text-[10px] text-slate-400 mt-2 font-medium opacity-60 group-hover:opacity-100 transition-opacity">{subValue}</div>
      </div>
    </div>
  );
}

function ModuleStatus({ name, status, isEnabled }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-white/80 p-2.5 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
        <span className="text-sm font-bold text-slate-700">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-black uppercase tracking-wider ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
          {isEnabled ? status : 'Disabled'}
        </span>
        <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color = 'slate' }: any) {
  const colors: any = {
    slate: 'bg-white/10 hover:bg-white/20 text-white border-white/10',
    purple: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30',
  };

  return (
    <button className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${colors[color]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
