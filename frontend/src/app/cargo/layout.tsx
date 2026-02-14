'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import {
    Package, Truck, Users, BarChart3,
    CheckCircle2, Box, TrendingUp, LogOut, QrCode, Settings, Lock,
    Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function CargoLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const getNavigation = () => {
        const isVerified = user?.company?.verificationStatus === 'APPROVED' || user?.role === 'SUPER_ADMIN';

        const base = [
            { label: 'Хяналтын самбар', icon: BarChart3, href: '/cargo' },
            { label: 'Бүх бараа', icon: Package, href: '/cargo/packages', locked: !isVerified },
        ];

        if (user?.role === 'STAFF_CHINA') {
            return [
                ...base,
                { label: 'Бараа хүлээн авах (CN)', icon: QrCode, href: '/staff/scanner', locked: !isVerified },
                { label: 'Batch ачих (Loading)', icon: Truck, href: '/cargo/batches', locked: !isVerified },
                { label: 'Тохиргоо', icon: Settings, href: '/cargo/settings' },
            ];
        }

        if (user?.role === 'STAFF_MONGOLIA') {
            return [
                ...base,
                { label: 'Batch хүлээн авах (Arrival)', icon: Truck, href: '/cargo/batches', locked: !isVerified },
                { label: 'Бараа олголт (Pickup)', icon: CheckCircle2, href: '/cargo/pickup', locked: !isVerified },
                { label: 'Тохиргоо', icon: Settings, href: '/cargo/settings' },
            ];
        }

        // Admin / Super Admin
        const adminLinks = [
            { label: 'Хяналтын самбар', icon: BarChart3, href: '/cargo' },
            { label: 'Бараа хүлээн авах', icon: QrCode, href: '/staff/scanner', locked: !isVerified },
            { label: 'Бүх бараа', icon: Package, href: '/cargo/packages', locked: !isVerified },
            { label: 'Batch удирдлага', icon: Truck, href: '/cargo/batches', locked: !isVerified },
            { label: 'Бараа олгох', icon: CheckCircle2, href: '/cargo/pickup', locked: !isVerified },
            { label: 'Нэхэмжлэх', icon: Box, href: '/cargo/invoices', locked: !isVerified },
            { label: 'Харилцагчид', icon: Users, href: '/cargo/customers', locked: !isVerified },
            { label: 'Marketplace', icon: TrendingUp, href: '/marketplace', locked: !isVerified },
        ];

        if (user?.role === 'CARGO_ADMIN' || user?.role === 'SUPER_ADMIN') {
            adminLinks.push({ label: 'Багийн удирдлага', icon: Users, href: '/cargo/team' });
        }

        adminLinks.push({ label: 'Тохиргоо', icon: Settings, href: '/cargo/settings' });

        return adminLinks;
    };

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const navigation = getNavigation();

    const SidebarContent = () => (
        <>
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <img src="/logo.png" alt="Zamex Logo" className="h-6 w-auto brightness-0 invert" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tighter text-white uppercase italic">ZAMEX</span>
                    </div>
                </div>
                <nav className="space-y-2">
                    {navigation.map((item: any) => {
                        const isActive = pathname === item.href;
                        const isLocked = item.locked;
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (isLocked) {
                                        toast.error('Үйл ажиллагаа явуулахын тулд баталгаажуулах шаардлагатай', {
                                            style: { background: '#0f172a', color: '#fff', borderRadius: '16px', fontWeight: 'bold' }
                                        });
                                        return;
                                    }
                                    router.push(item.href);
                                }}
                                className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl transition-all font-medium text-sm ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : isLocked
                                        ? 'text-slate-600 cursor-not-allowed grayscale'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : isLocked ? 'text-slate-700' : 'text-slate-500'}`} />
                                    {item.label}
                                </div>
                                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-700" />}
                            </button>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto p-8 border-t border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{user?.firstName}</div>
                        <div className="text-xs text-slate-500">{user?.role}</div>
                    </div>
                </div>
                <button onClick={() => { logout(); router.push('/auth'); }} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                    <LogOut className="w-5 h-5" /> Гарах
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            {/* Mobile Menu Button - Floating Glass Style */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-5 left-5 z-[40] w-11 h-11 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl flex items-center justify-center text-slate-900 border border-white/50 active:scale-90 transition-all duration-300 group"
            >
                <Menu className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Mobile Sidebar Overlay with AnimatePresence */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[50] bg-slate-900/60 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsMobileOpen(false)}
                        />

                        {/* Sidebar Drawer */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-full w-[300px] bg-slate-900 text-white flex flex-col shadow-2xl shadow-black/50 z-[60] lg:hidden"
                        >
                            <SidebarContent />
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 border border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-slate-900 text-white flex-col fixed h-screen z-50 overflow-y-auto">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
