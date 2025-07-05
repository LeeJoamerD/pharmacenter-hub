import React from 'react';
import ReportsDashboard from './reports/ReportsDashboard';
import SalesReports from './reports/sales/SalesReports';
import StockReports from './reports/stock/StockReports';
import FinancialReports from './reports/financial/FinancialReports';
import CustomerReports from './reports/customers/CustomerReports';
import BIDashboard from './reports/bi/BIDashboard';
import RegulatoryReports from './reports/regulatory/RegulatoryReports';
import GeospatialReports from './reports/geospatial/GeospatialReports';
import MobileReports from './reports/mobile/MobileReports';
import AIReports from './reports/ai/AIReports';
import ReportGenerator from './reports/generator/ReportGenerator';
import ComparativeReports from './reports/comparative/ComparativeReports';
import ReportsConfiguration from './reports/configuration/ReportsConfiguration';

interface RapportsModuleProps {
  activeSubModule: string;
}

const RapportsModule = ({ activeSubModule }: RapportsModuleProps) => {
  const renderContent = () => {
    switch (activeSubModule) {
      case 'ventes':
        return <SalesReports />;
      case 'stock':
        return <StockReports />;
      case 'financier':
        return <FinancialReports />;
      case 'clients':
        return <CustomerReports />;
      case 'bi':
        return <BIDashboard />;
      case 'reglementaire':
        return <RegulatoryReports />;
      case 'geospatial':
        return <GeospatialReports />;
      case 'mobile':
        return <MobileReports />;
      case 'ia':
        return <AIReports />;
      case 'generateur':
        return <ReportGenerator />;
      case 'comparatif':
        return <ComparativeReports />;
      case 'configuration':
        return <ReportsConfiguration />;
      default:
        return <ReportsDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Module Rapports</h2>
        <p className="text-muted-foreground">
          Centre de reporting et d'analyses business intelligence PharmaSoft
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default RapportsModule;