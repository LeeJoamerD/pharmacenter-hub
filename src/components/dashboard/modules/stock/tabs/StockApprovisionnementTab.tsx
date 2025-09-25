import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clipboard, Plus, Package, ShoppingCart, Eye, Edit, FileText, Settings } from 'lucide-react';
import OrderList from '../OrderList';
import OrderForm from '../OrderForm';
import EditOrderTab from '../EditOrderTab';
import ReceptionForm from '../ReceptionForm';
import ReceptionHistory from '../ReceptionHistory';
import SupplierManager from '../SupplierManager';
import OrderTracking from '../OrderTracking';
import StockSettingsDialog from '../StockSettingsDialog';
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useReceptions } from "@/hooks/useReceptions";
import { useTransporters } from "@/hooks/useTransporters";
import { useOrderLines } from "@/hooks/useOrderLines";
import { useOrderTracking } from "@/hooks/useOrderTracking";

const StockApprovisionnementTab = () => {
  const [activeTab, setActiveTab] = useState('liste');
  
  // Initialize all hooks for real data management
  const suppliers = useSuppliers();
  const orders = useSupplierOrders();
  const receptions = useReceptions();
  const transporters = useTransporters();
  const orderLines = useOrderLines();
  const orderTracking = useOrderTracking();

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
        <TabsTrigger value="modifications">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span>Modification</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="receptions">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Réceptions</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="historique">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Historique</span>
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
        <OrderList 
          orders={orders.orders}
          loading={orders.loading}
          onRefresh={orders.refetch}
          onUpdateStatus={orders.updateOrderStatus}
          onDeleteOrder={orders.deleteOrder}
        />
      </TabsContent>
      
      <TabsContent value="commandes">
        <OrderForm 
          suppliers={suppliers.suppliers}
          onCreateOrder={orders.createOrder}
          loading={orders.loading}
        />
      </TabsContent>
      
      <TabsContent value="modifications">
        <EditOrderTab 
          orders={orders.orders}
          suppliers={suppliers.suppliers}
          onUpdateOrder={orders.updateOrder}
          onUpdateOrderStatus={orders.updateOrderStatus}
          loading={orders.loading}
        />
      </TabsContent>
      
      <TabsContent value="receptions">
        <ReceptionForm 
          orders={orders.orders}
          suppliers={suppliers.suppliers}
          onCreateReception={receptions.createReception}
          onUpdateOrderStatus={orders.updateOrderStatus}
          onRefreshOrders={orders.refetch}
          loading={receptions.loading}
        />
      </TabsContent>
      
      <TabsContent value="historique">
        <ReceptionHistory />
      </TabsContent>
      
      <TabsContent value="fournisseurs">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Gestion des Fournisseurs</h3>
          <StockSettingsDialog>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres Stock
            </Button>
          </StockSettingsDialog>
        </div>
          <SupplierManager />
      </TabsContent>
      
      <TabsContent value="suivi">
        <OrderTracking 
          orders={orders.orders}
          transporters={transporters.transporters}
          loading={orders.loading}
        />
      </TabsContent>
    </Tabs>
  );
};

export default StockApprovisionnementTab;