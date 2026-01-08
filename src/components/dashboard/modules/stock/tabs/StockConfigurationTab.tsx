import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, AlertTriangle, DollarSign, FileSpreadsheet } from 'lucide-react';
import StockGeneralConfig from '../config/StockGeneralConfig';
import AlertsConfig from '../config/AlertsConfig';
import PricingConfig from '../config/PricingConfig';
import ExcelMappingConfig from '../config/ExcelMappingConfig';
import { useLanguage } from "@/contexts/LanguageContext";

const StockConfigurationTab = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{t('generalConfig')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{t('alertsConfig')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>{t('pricingConfig')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="excel-mapping">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{t('excelMapping')}</span>
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
        
        <TabsContent value="excel-mapping">
          <ExcelMappingConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockConfigurationTab;
