import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, ChartBar, TrendingUp, Eye, Clipboard } from 'lucide-react';
import StockValorisation from '../analysis/StockValorisation';
import ABCAnalysis from '../analysis/ABCAnalysis';
import RotationAnalysis from '../analysis/RotationAnalysis';
import ForecastAnalysis from '../analysis/ForecastAnalysis';
import ComplianceReports from '../analysis/ComplianceReports';
import { useLanguage } from "@/contexts/LanguageContext";

const StockAnalysesTab = () => {
  const { t } = useLanguage();
  
  return (
    <Tabs defaultValue="valorisation" className="space-y-6">
      <TabsList>
        <TabsTrigger value="valorisation">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>{t('stockValorisation')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="abc">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>{t('abcAnalysis')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="rotation">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>{t('rotationAnalysis')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="previsions">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{t('forecastAnalysis')}</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="conformite">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>{t('complianceReports')}</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="valorisation">
        <StockValorisation />
      </TabsContent>
      
      <TabsContent value="abc">
        <ABCAnalysis />
      </TabsContent>
      
      <TabsContent value="rotation">
        <RotationAnalysis />
      </TabsContent>
      
      <TabsContent value="previsions">
        <ForecastAnalysis />
      </TabsContent>
      
      <TabsContent value="conformite">
        <ComplianceReports />
      </TabsContent>
    </Tabs>
  );
};

export default StockAnalysesTab;
