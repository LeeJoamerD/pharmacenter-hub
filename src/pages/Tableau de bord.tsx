
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Import components
import AppSidebar from '@/components/dashboard/sidebar/AppSidebar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import SalesModule from '@/components/dashboard/modules/SalesModule';
import CalendarModule from '@/components/dashboard/modules/CalendarModule';
import ReportsModule from '@/components/dashboard/modules/ReportsModule';
import { StockDashboardModule, InventoryModule } from '@/components/dashboard/modules/StockModule';
import { ClientDashboardModule, ClientDirectoryModule, ClientHistoryModule } from '@/components/dashboard/modules/ClientModule';
import PersonnelModule from '@/components/dashboard/modules/PersonnelModule';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeSubModule, setActiveSubModule] = useState('');

  const renderActiveModule = () => {
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        case 'personnel':
          return <PersonnelModule />;
        default:
          return <PersonnelModule />;
      }
    }
    
    if (activeModule === 'inventory') {
      switch (activeSubModule) {
        case 'stockDashboard':
          return <StockDashboardModule />;
        case 'inventoryList':
          return <InventoryModule />;
        default:
          return <StockDashboardModule />;
      }
    }
    
    if (activeModule === 'clients') {
      switch (activeSubModule) {
        case 'clientDashboard':
          return <ClientDashboardModule />;
        case 'clientDirectory':
          return <ClientDirectoryModule />;
        case 'clientHistory':
          return <ClientHistoryModule />;
        default:
          return <ClientDashboardModule />;
      }
    }
    
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />;
      case 'sales':
        return <SalesModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'reports':
        return <ReportsModule />;
      default:
        return <DashboardHome />;
    }
  };

  const getModuleTitle = () => {
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        case 'personnel':
          return 'Gestion du Personnel';
        default:
          return 'Administration';
      }
    }
    
    if (activeModule === 'inventory') {
      switch (activeSubModule) {
        case 'stockDashboard':
          return 'Tableau de bord du stock';
        case 'inventoryList':
          return 'Inventaire des produits';
        default:
          return 'Gestion des Stocks';
      }
    }
    
    if (activeModule === 'clients') {
      switch (activeSubModule) {
        case 'clientDashboard':
          return 'Tableau de bord des clients';
        case 'clientDirectory':
          return 'Répertoire des clients';
        case 'clientHistory':
          return 'Historique médical';
        default:
          return 'Gestion des Clients';
      }
    }
    
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'sales':
        return 'Gestion des Ventes';
      case 'calendar':
        return 'Calendrier & Rendez-vous';
      case 'reports':
        return 'Analyses & Rapports';
      default:
        return 'Tableau de bord';
    }
  };

  return (
    <SidebarProvider>
      <CurrencyProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar 
            activeModule={activeModule} 
            setActiveModule={setActiveModule} 
            activeSubModule={activeSubModule} 
            setActiveSubModule={setActiveSubModule} 
          />
          <main className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="text-xl font-bold">
                  {getModuleTitle()}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">Aide</Button>
              </div>
            </div>
            <div className="p-6">
              {renderActiveModule()}
            </div>
          </main>
        </div>
      </CurrencyProvider>
    </SidebarProvider>
  );
};

export default Dashboard;
