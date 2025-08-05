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

export const StockLotsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestion des Lots</h2>
        <p className="text-muted-foreground">
          Suivi et gestion complète des lots de produits pharmaceutiques
        </p>
      </div>

      <Tabs defaultValue="tracker" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Suivi
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="expirations" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Péremptions
          </TabsTrigger>
          <TabsTrigger value="fifo" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration FIFO
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Intégration Ventes
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Réconciliation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Optimisation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Lots</CardTitle>
              <CardDescription>
                Visualisez et suivez tous vos lots en temps réel
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
              <CardTitle>Détails des Lots</CardTitle>
              <CardDescription>
                Consultez les informations détaillées d'un lot spécifique
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
              <CardTitle>Alertes de Péremption</CardTitle>
              <CardDescription>
                Gérez les alertes et surveillez les dates d'expiration
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
              <CardTitle>Configuration FIFO</CardTitle>
              <CardDescription>
                Configurez les règles de rotation des stocks
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