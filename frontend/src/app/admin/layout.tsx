'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import {
    BarChart3, Building2, Package, Shield, AlertTriangle,
    DollarSign, Settings, LogOut, Lock, Menu, X, Users, Layers, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const navigation = [
        { label: t.admin.dashboard, icon: BarChart3, href: '/admin' },
        { label: t.admin.users, icon: Users, href: '/admin/users' },
        { label: t.admin.companies, icon: Building2, href: '/admin/companies' },
        { label: t.admin.orders, icon: Package, href: '/admin/orders' },
        { label: t.admin.verifications, icon: Shield, href: '/admin/verifications' },
        { label: t.admin.returns, icon: AlertTriangle, href: '/admin/returns' },
        { label: t.admin.shield, icon: Shield, href: '/admin/insurance' },
        { label: t.admin.settlements, icon: DollarSign, href: '/admin/settlements' },
        { label: 'Санхүүгийн Хүсэлт', icon: Landmark, href: '/admin/financial-approvals' },
        { label: 'Системийн Аудит', icon: Layers, href: '/admin/audit' },
        { label: t.admin.settings, icon: Settings, href: '/admin/settings' },
    ];

    const SidebarContent = () => (
        <>
            <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8 md:mb-10">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                        <Lock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-lg md:text-xl font-black tracking-tighter text-white uppercase">SUPER ADMIN</span>
                    </div>
                </div>
                <nav className="space-y-1.5 md:space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.href)}
                                className={`w-full flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl transition-all font-medium text-xs md:text-sm ${isActive
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto p-6 md:p-8 border-t border-white/10">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm md:text-base">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-bold text-white truncate">{user?.firstName}</div>
                        <div className="text-[10px] md:text-xs text-slate-500">Super Admin</div>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); router.push('/auth'); }}
                    className="flex items-center gap-2 md:gap-3 text-slate-400 hover:text-white transition-colors text-xs md:text-sm font-medium"
                >
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" /> {t.admin.logout}
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-surface-50 lg:flex">
            {/* Mobile Menu Button - Floating Glass Style */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-[40] w-10 h-10 md:w-11 md:h-11 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl flex items-center justify-center text-slate-900 border border-white/50 active:scale-90 transition-all duration-300 group"
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
                            className="fixed left-0 top-0 h-full w-[280px] md:w-[300px] bg-slate-900 text-white flex flex-col shadow-2xl shadow-black/50 z-[60] lg:hidden overflow-y-auto"
                        >
                            <SidebarContent />
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 border border-white/5"
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
            <main className="flex-1 lg:ml-72 w-full pt-14 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
