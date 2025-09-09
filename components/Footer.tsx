import React from 'react';
import { useI18n } from '../hooks/useI18n';

export const Footer: React.FC = () => {
  const { t } = useI18n();
  const appName = t('appName');
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gumball-dark text-gumball-light-bg py-8 mt-12 dark:bg-gumball-dark-deep dark:text-gray-300 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="font-display text-xl text-gumball-yellow mb-2">
          {t('footerThanks', { appName })}
        </p>
        <p className="text-sm">
          {t('footerRights', { year, appName })}
        </p>
        <p className="text-xs mt-2 font-techno text-gumball-green/80 hover:text-gumball-green hover:animate-subtleGlow transition-colors dark:text-gumball-green/70 dark:hover:text-gumball-green">
          {t('footerSlogan')}
        </p>
      </div>
    </footer>
  );
};