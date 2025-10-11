import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, Package, ChartBar, TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import InventorySessions from '../InventorySessions';
import InventoryEntry from '../InventoryEntry';
import InventoryReconciliation from '../InventoryReconciliation';
import InventoryReports from '../InventoryReports';

const StockInventairesTab = () => {
  console.log('[StockInventairesTab] Rendering component');
  
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  console.log('[StockInventairesTab] State:', { activeTab, selectedSessionId });

  const handleViewSession = (sessionId: string) => {
    console.log('[StockInventairesTab] handleViewSession called', { sessionId });
    setSelectedSessionId(sessionId);
    setActiveTab('saisie');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="sessions">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>Sessions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="saisie">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Saisie</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="reconciliation">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>Réconciliation</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="rapports">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Rapports</span>
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
          <InventoryEntry selectedSessionId={selectedSessionId} />
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