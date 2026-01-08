import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LotTracker } from "../LotTracker";
import { LotDetails } from "../LotDetails";
import { ExpirationAlert } from "../ExpirationAlert";
import { FIFOConfig } from "../FIFOConfig";
import { SalesIntegration } from "../integrations/SalesIntegration";
import { InventoryIntegration } from "../integrations/InventoryIntegration";
import { LotAnalytics } from "../advanced/LotAnalytics";
import { LotOptimization } from "../advanced/LotOptimization";
import { 
  Package, AlertTriangle, Settings, Activity, 
  ShoppingCart, Clipboard, BarChart3, Target 
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const StockLotsTab = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('lotManagement')}</h2>
        <p className="text-muted-foreground">
          {t('lotManagementDescription')}
        </p>
      </div>

      <Tabs defaultValue="tracker" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('lotTracking')}
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('lotDetails')}
          </TabsTrigger>
          <TabsTrigger value="expirations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('expirations')}
          </TabsTrigger>
          <TabsTrigger value="fifo" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('fifoConfiguration')}
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t('salesIntegration')}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            {t('reconciliation')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('analytics')}
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('optimization')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <Card>
            <CardHeader>
              <CardTitle>{t('lotTracking')}</CardTitle>
              <CardDescription>
                {t('viewTrackLotsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LotTracker />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>{t('lotDetails')}</CardTitle>
              <CardDescription>
                {t('lotDetailsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LotDetails />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expirations">
          <Card>
            <CardHeader>
              <CardTitle>{t('expirationAlerts')}</CardTitle>
              <CardDescription>
                {t('expirationAlertsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpirationAlert />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fifo">
          <Card>
            <CardHeader>
              <CardTitle>{t('fifoConfiguration')}</CardTitle>
              <CardDescription>
                {t('fifoConfigDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FIFOConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <SalesIntegration />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryIntegration />
        </TabsContent>

        <TabsContent value="analytics">
          <LotAnalytics />
        </TabsContent>

        <TabsContent value="optimization">
          <LotOptimization />
        </TabsContent>
      </Tabs>
    </div>
  );
};
