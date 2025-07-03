import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, Plus, Package, ShoppingCart, Eye } from 'lucide-react';
import OrderList from '../OrderList';
import OrderForm from '../OrderForm';
import ReceptionForm from '../ReceptionForm';
import SupplierManager from '../SupplierManager';
import OrderTracking from '../OrderTracking';

const StockApprovisionnementTab = () => {
  const [activeTab, setActiveTab] = useState('liste');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="liste">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            <span>Liste commandes</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="commandes">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Commandes</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="receptions">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Réceptions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="fournisseurs">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Fournisseurs</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="suivi">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Suivi</span>
          </div>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="liste">
        <OrderList />
      </TabsContent>
      
      <TabsContent value="commandes">
        <OrderForm />
      </TabsContent>
      
      <TabsContent value="receptions">
        <ReceptionForm />
      </TabsContent>
      
      <TabsContent value="fournisseurs">
        <SupplierManager />
      </TabsContent>
      
      <TabsContent value="suivi">
        <OrderTracking />
      </TabsContent>
    </Tabs>
  );
};

export default StockApprovisionnementTab;