'use client';

import { create } from 'zustand';
import mn from '../i18n/mn.json';
import en from '../i18n/en.json';
import cn from '../i18n/cn.json';

type Language = 'mn' | 'en' | 'cn';

interface I18nStore {
    lang: Language;
    setLang: (lang: Language) => void;
    t: any; // Changed to 'any' to hold the translation object
}

const translations: Record<Language, any> = { mn, en, cn };

export const useI18n = create<I18nStore>((set, get) => {
    const initialLang = (typeof window !== 'undefined' ? (localStorage.getItem('zamex_lang') as Language) : 'mn') || 'mn';

    return {
        lang: initialLang,
        setLang: (lang: Language) => {
            localStorage.setItem('zamex_lang', lang);
            set({ lang });
        },
        t: translations[initialLang], // Initial value
    };
});

// Update the t object whenever lang changes
useI18n.subscribe((state) => {
    useI18n.setState({ t: translations[state.lang] || translations['mn'] });
});
