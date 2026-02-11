import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, Package, ChartBar, TrendingUp, FileUp } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import InventorySessions from '../InventorySessions';
import InventoryEntry from '../InventoryEntry';
import InventoryReconciliation from '../InventoryReconciliation';
import InventoryReports from '../InventoryReports';
import { InventoryExcelImport } from '../InventoryExcelImport';
import { useLanguage } from "@/contexts/LanguageContext";

const StockInventairesTab = () => {
  console.log('[StockInventairesTab] Rendering component');
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('');

  console.log('[StockInventairesTab] State:', { activeTab, selectedSessionId });

  const handleViewSession = (sessionId: string, sessionType?: string) => {
    console.log('[StockInventairesTab] handleViewSession called', { sessionId, sessionType });
    setSelectedSessionId(sessionId);
    setSelectedSessionType(sessionType || '');
    setActiveTab('saisie');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="sessions">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>{t('inventorySessions')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="saisie">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>{t('inventoryEntry')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="import-excel">
          <div className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span>{t('excelImport')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="reconciliation">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>{t('reconciliation')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="rapports">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>{t('reports')}</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      {activeTab === 'sessions' && (
        <ErrorBoundary>
          <InventorySessions onViewSession={handleViewSession} />
        </ErrorBoundary>
      )}
      
      {activeTab === 'saisie' && (
        <ErrorBoundary>
          <InventoryEntry selectedSessionId={selectedSessionId} selectedSessionType={selectedSessionType} />
        </ErrorBoundary>
      )}
      
      {activeTab === 'import-excel' && (
        <ErrorBoundary>
          <InventoryExcelImport />
        </ErrorBoundary>
      )}
      
      {activeTab === 'reconciliation' && (
        <ErrorBoundary>
          <InventoryReconciliation />
        </ErrorBoundary>
      )}
      
      {activeTab === 'rapports' && (
        <ErrorBoundary>
          <InventoryReports />
        </ErrorBoundary>
      )}
    </Tabs>
  );
};

export default StockInventairesTab;
