import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import { algerianWilayas } from '../data/algeria-shipping-data';

export const ShippingCalculatorPage: React.FC = () => {
    const { t } = useI18n();
    
    const [selectedWilayaCode, setSelectedWilayaCode] = useState<string>('');
    const [selectedCommune, setSelectedCommune] = useState<string>('');
    
    const wilayasList = useMemo(() => {
        return Object.entries(algerianWilayas).map(([code, data]) => ({
            code: code,
            name: `${code} - ${data.name}`
        }));
    }, []);

    const communesList = useMemo(() => {
        if (!selectedWilayaCode) return [];
        return algerianWilayas[selectedWilayaCode].communes;
    }, [selectedWilayaCode]);

    const shippingPrice = useMemo(() => {
        if (!selectedWilayaCode) return null;
        return algerianWilayas[selectedWilayaCode].deliveryPrice;
    }, [selectedWilayaCode]);

    // Reset commune when wilaya changes
    useEffect(() => {
        setSelectedCommune('');
    }, [selectedWilayaCode]);

    const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedWilayaCode(e.target.value);
    };

    const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCommune(e.target.value);
    };

    const inputBaseClass = "block w-full px-4 py-3 text-base bg-white dark:bg-gumball-dark border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gumball-pink focus:border-gumball-pink text-gumball-dark dark:text-gumball-light-bg";

    return (
        <div className="animate-fadeIn max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display text-gumball-blue dark:text-gumball-blue/90 mb-8 text-center" dir="rtl">
                {t('shippingCalculatorTitle')}
            </h1>

            <div className="bg-white dark:bg-gumball-dark-card rounded-xl shadow-2xl p-6 md:p-8 space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-s-4 border-blue-400 dark:border-blue-500 rounded-md" dir="rtl">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{t('shippingInfoMessage')}</p>
                </div>

                <div>
                    <label htmlFor="wilaya-select" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2" dir="rtl">
                        {t('selectWilaya')}
                    </label>
                    <select
                        id="wilaya-select"
                        value={selectedWilayaCode}
                        onChange={handleWilayaChange}
                        className={inputBaseClass}
                        aria-label={t('selectWilaya')}
                        dir="rtl"
                    >
                        <option value="">{t('wilayaPlaceholder')}</option>
                        {wilayasList.map(wilaya => (
                            <option key={wilaya.code} value={wilaya.code}>{wilaya.name}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="commune-select" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2" dir="rtl">
                        {t('selectCommune')}
                    </label>
                    <select
                        id="commune-select"
                        value={selectedCommune}
                        onChange={handleCommuneChange}
                        className={inputBaseClass}
                        disabled={!selectedWilayaCode}
                        aria-label={t('selectCommune')}
                        dir="rtl"
                    >
                        <option value="">
                            {selectedWilayaCode ? t('communePlaceholder') : t('communeDisabledPlaceholder')}
                        </option>
                        {communesList.map(commune => (
                            <option key={commune} value={commune}>{commune}</option>
                        ))}
                    </select>
                </div>

                <div className="text-center pt-6 mt-4 border-t-2 border-dashed border-gumball-yellow/80">
                    <p className="text-xl font-techno text-gumball-purple dark:text-gumball-purple/80 mb-2" dir="rtl">
                        {t('shippingCostLabel')}
                    </p>
                    <div className="p-4 bg-gumball-green/10 dark:bg-gumball-green/20 rounded-lg inline-block">
                        <p className="text-4xl font-display text-gumball-green">
                            {shippingPrice !== null ? `${shippingPrice.toLocaleString()}` : t('notAvailable')}
                            <span className="text-2xl ms-2">{shippingPrice !== null ? t('currencyUnit') : ''}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
