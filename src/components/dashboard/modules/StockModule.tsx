import React from 'react';
import StockDashboard from './stock/StockDashboard';
import CurrentStockTab from './stock/current/CurrentStockTab';
import { StockLotsTab } from './stock/tabs/StockLotsTab';
import StockApprovisionnementTab from './stock/tabs/StockApprovisionnementTab';
import StockMouvementsTab from './stock/tabs/StockMouvementsTab';
import StockInventairesTab from './stock/tabs/StockInventairesTab';
import StockAlertesTab from './stock/tabs/StockAlertesTab';
import StockAnalysesTab from './stock/tabs/StockAnalysesTab';
import StockConfigurationTab from './stock/tabs/StockConfigurationTab';

interface StockModuleProps {
  activeSubModule: string;
}

const StockModule = ({ activeSubModule }: StockModuleProps) => {

  const renderContent = () => {
    switch (activeSubModule) {
      case 'stock actuel':
        return <CurrentStockTab />;
      case 'lots':
        return <StockLotsTab />;
      case 'approvisionnement':
        return <StockApprovisionnementTab />;
      case 'mouvements':
        return <StockMouvementsTab />;
      case 'inventaires':
        return <StockInventairesTab />;
      case 'alertes':
        return <StockAlertesTab />;
      case 'analyses':
        return <StockAnalysesTab />;
      case 'configuration':
        return <StockConfigurationTab />;
      default:
        return <StockDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion de Stock</h2>
        <p className="text-muted-foreground">
          Module complet de gestion des stocks, produits et approvisionnements
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default StockModule;