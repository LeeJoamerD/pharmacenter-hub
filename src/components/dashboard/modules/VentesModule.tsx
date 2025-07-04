import React from 'react';
import SalesDashboard from './sales/SalesDashboard';
import CashManagement from './sales/CashManagement';
import POSInterface from './sales/POSInterface';
import EncaissementDashboard from './sales/EncaissementDashboard';
import TransactionHistory from './sales/TransactionHistory';
import ReturnsExchanges from './sales/ReturnsExchanges';
import InvoiceModule from './sales/InvoiceModule';
import SalesAnalytics from './sales/SalesAnalytics';

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
        return <TransactionHistory />;
      case 'retours':
        return <ReturnsExchanges />;
      case 'facturation':
        return <InvoiceModule />;
      case 'analytics':
        return <SalesAnalytics />;
      case 'crédit':
        return <div className="p-8 text-center text-muted-foreground">Gestion Crédit - À implémenter</div>;
      case 'promotions':
        return <div className="p-8 text-center text-muted-foreground">Promotions & Fidélité - À implémenter</div>;
      case 'configuration':
        return <div className="p-8 text-center text-muted-foreground">Configuration Ventes - À implémenter</div>;
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