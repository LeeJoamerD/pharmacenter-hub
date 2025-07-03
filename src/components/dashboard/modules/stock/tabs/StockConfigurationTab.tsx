import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Package, AlertTriangle, DollarSign } from 'lucide-react';
import StockGeneralConfig from '../config/StockGeneralConfig';
import AlertsConfig from '../config/AlertsConfig';
import PricingConfig from '../config/PricingConfig';

const StockConfigurationTab = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Général</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Alertes</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Tarification</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <StockGeneralConfig />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AlertsConfig />
        </TabsContent>
        
        <TabsContent value="pricing">
          <PricingConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockConfigurationTab;