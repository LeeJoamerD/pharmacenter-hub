import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBar, Settings, Package, Eye } from 'lucide-react';
import StockMovementJournal from '../StockMovementJournal';
import StockAdjustments from '../StockAdjustments';
import StockTransfers from '../StockTransfers';
import StockAudit from '../StockAudit';
import { useLanguage } from "@/contexts/LanguageContext";

const StockMouvementsTab = () => {
  const { t } = useLanguage();
  
  return (
    <Tabs defaultValue="journal" className="space-y-6">
      <TabsList>
        <TabsTrigger value="journal">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>{t('journal')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="ajustements">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>{t('adjustments')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="transferts">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>{t('transfers')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="audit">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{t('audit')}</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="journal">
        <StockMovementJournal />
      </TabsContent>
      
      <TabsContent value="ajustements">
        <StockAdjustments />
      </TabsContent>
      
      <TabsContent value="transferts">
        <StockTransfers />
      </TabsContent>
      
      <TabsContent value="audit">
        <StockAudit />
      </TabsContent>
    </Tabs>
  );
};

export default StockMouvementsTab;
