
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import SalesView from '@/components/dashboard/SalesView';

const SalesModule = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t('salesManagement')}</h2>
      <p className="text-muted-foreground">{t('salesDesc')}</p>
      <SalesView />
    </div>
  );
};

export default SalesModule;
