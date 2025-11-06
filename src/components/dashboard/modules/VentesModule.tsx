import React from 'react';
import SalesDashboard from './sales/SalesDashboard';
import CashManagement from './sales/CashManagement';
import POSInterface from './sales/POSInterface';
import EncaissementDashboard from './sales/EncaissementDashboard';
import TransactionHistory from './sales/TransactionHistory';
import TransactionHistoryConnected from './sales/TransactionHistoryConnected';
import ReturnsExchanges from './sales/ReturnsExchanges';
import ReturnsExchangesConnected from './sales/ReturnsExchangesConnected';
import InvoiceModuleConnected from './sales/InvoiceModuleConnected';
import SalesAnalytics from './sales/SalesAnalytics';
import { CreditManagerConnected } from './sales/CreditManagerConnected';
import PromotionsManagerConnected from './sales/PromotionsManagerConnected';
import SalesConfiguration from './sales/SalesConfiguration';

interface VentesModuleProps {
  activeSubModule: string;
}

const VentesModule = ({ activeSubModule }: VentesModuleProps) => {
  const renderContent = () => {
    switch (activeSubModule) {
      case 'caisses':
        return <CashManagement />;
      case 'point de vente':
        return <POSInterface />;
      case 'encaissements':
        return <EncaissementDashboard />;
      case 'historique':
        return <TransactionHistoryConnected />;
      case 'retours':
        return <ReturnsExchangesConnected />;
      case 'facturation':
        return <InvoiceModuleConnected />;
      case 'analytics':
        return <SalesAnalytics />;
      case 'crédit':
        return <CreditManagerConnected />;
      case 'promotions':
        return <PromotionsManagerConnected />;
      case 'configuration':
        return <SalesConfiguration />;
      default:
        return <SalesDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Ventes</h2>
        <p className="text-muted-foreground">
          Module complet de gestion des ventes, encaissements et point de vente
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default VentesModule;