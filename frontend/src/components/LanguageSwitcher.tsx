'use client';

import { useI18n } from '@/lib/i18n';
import { Globe, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LanguageSwitcher() {
    const { lang, setLang } = useI18n();
    const [open, setOpen] = useState(false);

    const languages = [
        { code: 'mn', label: 'Монгол', flag: '🇲🇳' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'cn', label: '中文', flag: '🇨🇳' },
    ];

    const current = languages.find(l => l.code === lang) || languages[0];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl transition-all group"
            >
                <Globe className="w-4 h-4 text-white/70 group-hover:text-white" />
                <span className="text-xs font-black text-white uppercase tracking-wider">{lang}</span>
                <ChevronDown className={`w-3 h-3 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl shadow-black/20 border border-slate-100 overflow-hidden z-50"
                        >
                            <div className="p-1.5 space-y-1">
                                {languages.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => {
                                            setLang(l.code as any);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all
                      ${lang === l.code
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{l.flag}</span>
                                            <span className="text-xs font-bold">{l.label}</span>
                                        </div>
                                        {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
