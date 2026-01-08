import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, AlertTriangle, Tag, Settings } from 'lucide-react';
import AlertsDashboard from '../AlertsDashboard';
import LowStockAlerts from '../LowStockAlerts';
import ExpirationMonitor from '../ExpirationMonitor';
import AlertConfiguration from '../AlertConfiguration';
import { useLanguage } from "@/contexts/LanguageContext";

const StockAlertesTab = () => {
  const { t } = useLanguage();
  
  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList>
        <TabsTrigger value="dashboard">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>{t('dashboard')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="stock-faible">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('lowStock')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="peremption">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>{t('expiration')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="configuration">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>{t('configuration')}</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard">
        <AlertsDashboard />
      </TabsContent>
      
      <TabsContent value="stock-faible">
        <LowStockAlerts />
      </TabsContent>
      
      <TabsContent value="peremption">
        <ExpirationMonitor />
      </TabsContent>
      
      <TabsContent value="configuration">
        <AlertConfiguration />
      </TabsContent>
    </Tabs>
  );
};

export default StockAlertesTab;
