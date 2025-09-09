import React from 'react';
import { useI18n } from '../hooks/useI18n';

const GlobeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);


export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useI18n();

    const toggleLanguage = () => {
        const newLanguage = language === 'en' ? 'ar' : 'en';
        setLanguage(newLanguage);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="relative p-2 rounded-full text-white hover:bg-gumball-yellow/20 dark:hover:bg-gumball-yellow/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gumball-yellow flex items-center justify-center overflow-hidden w-[5.5rem] h-10"
            aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
        >
            <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-in-out" style={{ transform: language === 'en' ? 'translateY(0)' : 'translateY(-100%)' }}>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <GlobeIcon />
                    <span className="font-semibold">EN</span>
                </div>
            </span>
            <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-in-out" style={{ transform: language === 'ar' ? 'translateY(0)' : 'translateY(100%)' }}>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <GlobeIcon />
                    <span className="font-semibold">ع</span>
                </div>
            </span>
        </button>
    );
};
