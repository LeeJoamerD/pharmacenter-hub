
import React from 'react';
import StockDashboard from '@/components/dashboard/StockDashboard';
import InventoryView from '@/components/dashboard/InventoryView';

export const StockDashboardModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Tableau de bord du stock</h2>
    <p className="text-muted-foreground">Visualisez les données importantes concernant votre inventaire.</p>
    <StockDashboard />
  </div>
);

export const InventoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Inventaire des produits</h2>
    <p className="text-muted-foreground">Suivez votre inventaire, les dates d'expiration et planifiez vos commandes.</p>
    <InventoryView />
  </div>
);
