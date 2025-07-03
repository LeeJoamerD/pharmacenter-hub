import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, Package, ChartBar, TrendingUp } from 'lucide-react';
import InventorySessions from '../InventorySessions';
import InventoryEntry from '../InventoryEntry';
import InventoryReconciliation from '../InventoryReconciliation';
import InventoryReports from '../InventoryReports';

const StockInventairesTab = () => {
  return (
    <Tabs defaultValue="sessions" className="space-y-6">
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
      
      <TabsContent value="sessions">
        <InventorySessions />
      </TabsContent>
      
      <TabsContent value="saisie">
        <InventoryEntry />
      </TabsContent>
      
      <TabsContent value="reconciliation">
        <InventoryReconciliation />
      </TabsContent>
      
      <TabsContent value="rapports">
        <InventoryReports />
      </TabsContent>
    </Tabs>
  );
};

export default StockInventairesTab;