import React, { memo, Suspense, lazy, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, Plus, Package, ShoppingCart, Eye } from 'lucide-react';
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useReceptions } from "@/hooks/useReceptions";
import { useTransporters } from "@/hooks/useTransporters";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components for better performance
const OrderList = lazy(() => import('../OrderList'));
const OrderForm = lazy(() => import('../OrderForm'));
const ReceptionForm = lazy(() => import('../ReceptionForm'));
const SupplierManager = lazy(() => import('../SupplierManager'));
const OrderTracking = lazy(() => import('../OrderTracking'));
const PerformanceOptimizedOrderList = lazy(() => import('./PerformanceOptimizedOrderList'));

// Loading component
const TabContentSkeleton = memo(() => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
));

TabContentSkeleton.displayName = 'TabContentSkeleton';

interface OptimizedSupplyTabProps {
  defaultTab?: string;
  enablePerformanceMode?: boolean;
}

const OptimizedSupplyTab = memo<OptimizedSupplyTabProps>(({ 
  defaultTab = 'liste',
  enablePerformanceMode = false 
}) => {
  // Memoized hooks to prevent unnecessary re-renders
  const suppliers = useSuppliers();
  const orders = useSupplierOrders();
  const receptions = useReceptions();
  const transporters = useTransporters();

  // Memoized tab configuration
  const tabsConfig = useMemo(() => [
    {
      value: 'liste',
      label: 'Liste commandes',
      icon: Clipboard,
      component: enablePerformanceMode ? PerformanceOptimizedOrderList : OrderList,
      props: {
        orders: orders.orders,
        loading: orders.loading,
        onRefresh: orders.refetch,
        onUpdateStatus: orders.updateOrderStatus,
        onDeleteOrder: orders.deleteOrder
      }
    },
    {
      value: 'commandes',
      label: 'Commandes',
      icon: Plus,
      component: OrderForm,
      props: {
        suppliers: suppliers.suppliers,
        onCreateOrder: orders.createOrder,
        loading: orders.loading
      }
    },
    {
      value: 'receptions',
      label: 'Réceptions',
      icon: Package,
      component: ReceptionForm,
      props: {
        orders: orders.orders,
        suppliers: suppliers.suppliers,
        onCreateReception: receptions.createReception,
        loading: receptions.loading
      }
    },
    {
      value: 'fournisseurs',
      label: 'Fournisseurs',
      icon: ShoppingCart,
      component: SupplierManager,
      props: {
        suppliers: suppliers.suppliers,
        loading: suppliers.loading,
        onCreateSupplier: suppliers.createSupplier,
        onUpdateSupplier: suppliers.updateSupplier,
        onDeleteSupplier: suppliers.deleteSupplier
      }
    },
    {
      value: 'suivi',
      label: 'Suivi',
      icon: Eye,
      component: OrderTracking,
      props: {
        orders: orders.orders,
        transporters: transporters.transporters,
        loading: orders.loading
      }
    }
  ], [
    orders.orders,
    orders.loading,
    orders.refetch,
    orders.updateOrderStatus,
    orders.deleteOrder,
    orders.createOrder,
    suppliers.suppliers,
    suppliers.loading,
    suppliers.createSupplier,
    suppliers.updateSupplier,
    suppliers.deleteSupplier,
    receptions.createReception,
    receptions.loading,
    transporters.transporters,
    enablePerformanceMode
  ]);

  // Performance monitoring
  React.useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.warn(`OptimizedSupplyTab render took ${(endTime - startTime).toFixed(2)}ms`);
      }
    };
  });

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList>
        {tabsConfig.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabsConfig.map(({ value, component: Component, props }) => (
        <TabsContent key={value} value={value}>
          <Suspense fallback={<TabContentSkeleton />}>
            <Component {...(props as any)} />
          </Suspense>
        </TabsContent>
      ))}
    </Tabs>
  );
});

OptimizedSupplyTab.displayName = 'OptimizedSupplyTab';

export default OptimizedSupplyTab;