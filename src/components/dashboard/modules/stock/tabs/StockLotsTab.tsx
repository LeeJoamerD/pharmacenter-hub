import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LotTracker } from "../LotTracker";
import { LotDetails } from "../LotDetails";
import { ExpirationAlert } from "../ExpirationAlert";
import { FIFOConfig } from "../FIFOConfig";
import { Package, AlertTriangle, Settings, Activity } from "lucide-react";

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
        <TabsList className="grid w-full grid-cols-4">
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
      </Tabs>
    </div>
  );
};