
'use client';

import Link from 'next/link';
import { Package, Search, Plus, Truck, UserCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
    const pathname = usePathname();

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        const baseClass = "flex flex-col items-center justify-center w-14 h-full transition-colors";
        return `${baseClass} ${isActive ? 'text-[#283480]' : 'text-slate-400 hover:text-[#283480]'}`;
    };

    return (
        <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 h-20 px-6 flex items-center justify-between z-50 md:hidden">
            <Link href="/" className={getLinkClass('/')}>
                {pathname === '/' && <div className="w-1 h-1 rounded-full bg-[#283480] mb-1" />}
                <Package className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest mt-1">Нүүр</span>
            </Link>

            <Link href="/tracking" className={getLinkClass('/tracking')}>
                {pathname === '/tracking' && <div className="w-1 h-1 rounded-full bg-[#283480] mb-1" />}
                <Search className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Хайх</span>
            </Link>

            <div className="relative -top-6">
                <Link href="/marketplace" className="w-16 h-16 bg-[#283480] rounded-[24px] shadow-xl shadow-[#283480]/30 flex items-center justify-center text-white active:scale-95 transition-all border-4 border-slate-100">
                    <Plus className="w-8 h-8" />
                </Link>
            </div>

            <Link href="/companies" className={getLinkClass('/companies')}>
                {pathname === '/companies' && <div className="w-1 h-1 rounded-full bg-[#283480] mb-1" />}
                <Truck className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Автопарк</span>
            </Link>

            <Link href="/profile" className={getLinkClass('/profile')}>
                {pathname === '/profile' && <div className="w-1 h-1 rounded-full bg-[#283480] mb-1" />}
                <UserCheck className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Профайл</span>
            </Link>
        </nav>
    );
}
