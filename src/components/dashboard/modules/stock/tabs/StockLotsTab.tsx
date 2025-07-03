import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Eye, AlertTriangle, Settings } from 'lucide-react';
import LotTracker from '../LotTracker';
import LotDetails from '../LotDetails';
import ExpirationAlert from '../ExpirationAlert';
import FIFOConfig from '../FIFOConfig';

const StockLotsTab = () => {
  return (
    <Tabs value="tracker" defaultValue="tracker" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tracker">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Suivi</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="details">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Détails</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="expiration">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Péremptions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="fifo">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configuration FIFO</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="tracker">
        <LotTracker />
      </TabsContent>
      
      <TabsContent value="details">
        <LotDetails />
      </TabsContent>
      
      <TabsContent value="expiration">
        <ExpirationAlert />
      </TabsContent>
      
      <TabsContent value="fifo">
        <FIFOConfig />
      </TabsContent>
    </Tabs>
  );
};

export default StockLotsTab;