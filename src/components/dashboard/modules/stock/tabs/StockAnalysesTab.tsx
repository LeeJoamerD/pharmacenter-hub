import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, ChartBar, TrendingUp, Eye, Clipboard } from 'lucide-react';

const StockAnalysesTab = () => {
  return (
    <Tabs defaultValue="valorisation" className="space-y-6">
      <TabsList>
        <TabsTrigger value="valorisation">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Valorisation</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="abc">
          <div className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            <span>Analyse ABC</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="rotation">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Rotation</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="previsions">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Prévisions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="conformite">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>Conformité</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="valorisation">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Valorisation Stocks</h3>
          <p className="text-muted-foreground">Module valorisation à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="abc">
        <div className="text-center py-12">
          <ChartBar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Classification ABC</h3>
          <p className="text-muted-foreground">Analyse ABC à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="rotation">
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Taux de Rotation</h3>
          <p className="text-muted-foreground">Analyse rotation à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="previsions">
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Prévisions</h3>
          <p className="text-muted-foreground">Module prévisions à implémenter</p>
        </div>
      </TabsContent>
      
      <TabsContent value="conformite">
        <div className="text-center py-12">
          <Clipboard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Rapports Conformité</h3>
          <p className="text-muted-foreground">Module conformité à implémenter</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default StockAnalysesTab;