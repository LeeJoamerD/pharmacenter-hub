import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Upload, List, FileSpreadsheet } from 'lucide-react';
import GlobalAccountingPlanTable from './GlobalAccountingPlanTable';
import GlobalAccountingPlanImport from './GlobalAccountingPlanImport';
import GlobalAccountingPlansList from './GlobalAccountingPlansList';

const GlobalAccountingPlanManager = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('comptes');
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setActiveTab('comptes');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          Plans Comptables Globaux
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les référentiels comptables (SYSCOHADA, PCG France, UEMOA, IFRS...) accessibles par toutes les pharmacies
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Plans disponibles
          </TabsTrigger>
          <TabsTrigger value="comptes" className="gap-2">
            <List className="h-4 w-4" />
            Comptes du plan
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importer depuis Excel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <GlobalAccountingPlansList 
            key={refreshKey} 
            onSelectPlan={handleSelectPlan}
          />
        </TabsContent>

        <TabsContent value="comptes" className="mt-6">
          <GlobalAccountingPlanTable 
            key={`${refreshKey}-${selectedPlanId}`} 
            selectedPlanId={selectedPlanId}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <GlobalAccountingPlanImport onSuccess={handleImportSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalAccountingPlanManager;
