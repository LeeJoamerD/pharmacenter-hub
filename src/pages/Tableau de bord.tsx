
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

// Temporary placeholder components for new modules
const PlaceholderModule = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
    <div className="text-center">
      <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">Module en cours de développement</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeSubModule, setActiveSubModule] = useState('');

  const renderActiveModule = () => {
    // Administration module with submodules
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        case 'personnel':
          return <PlaceholderModule title="Gestion du Personnel" />;
        case 'assureurs':
          return <PlaceholderModule title="Gestion des Assureurs" />;
        case 'societes':
          return <PlaceholderModule title="Gestion des Sociétés" />;
        case 'conventionnes':
          return <PlaceholderModule title="Gestion des Conventionnés" />;
        case 'clients':
          return <PlaceholderModule title="Gestion des Clients" />;
        case 'fournisseurs':
          return <PlaceholderModule title="Gestion des Fournisseurs" />;
        case 'laboratoires':
          return <PlaceholderModule title="Gestion des Laboratoires" />;
        default:
          return <PlaceholderModule title="Tableau de bord Administration" />;
      }
    }
    
    // Stock module with submodules
    if (activeModule === 'stock') {
      switch (activeSubModule) {
        case 'produits':
          return <PlaceholderModule title="Gestion des Produits" />;
        case 'lots':
          return <PlaceholderModule title="Gestion des Lots" />;
        case 'commandes':
          return <PlaceholderModule title="Commandes Fournisseurs" />;
        case 'receptions':
          return <PlaceholderModule title="Réceptions" />;
        default:
          return <StockDashboardModule />;
      }
    }
    
    // Comptabilité module with submodules
    if (activeModule === 'comptabilite') {
      switch (activeSubModule) {
        case 'comptes':
          return <PlaceholderModule title="Comptes Comptables" />;
        case 'journaux':
          return <PlaceholderModule title="Journaux Comptables" />;
        case 'ecritures':
          return <PlaceholderModule title="Écritures Comptables" />;
        default:
          return <PlaceholderModule title="Tableau de bord Comptabilité" />;
      }
    }
    
    // Main modules
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />;
      case 'ventes':
        return <SalesModule />;
      case 'rapports':
        return <ReportsModule />;
      case 'assistant':
        return <PlaceholderModule title="Assistant IA" />;
      case 'chat':
        return <PlaceholderModule title="Chat-PharmaSoft" />;
        
      default:
        return <DashboardHome />;
    }
  };

  const getModuleTitle = () => {
    // Administration module titles
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        case 'personnel':
          return 'Gestion du Personnel';
        case 'assureurs':
          return 'Gestion des Assureurs';
        case 'societes':
          return 'Gestion des Sociétés';
        case 'conventionnes':
          return 'Gestion des Conventionnés';
        case 'clients':
          return 'Gestion des Clients';
        case 'fournisseurs':
          return 'Gestion des Fournisseurs';
        case 'laboratoires':
          return 'Gestion des Laboratoires';
        default:
          return 'Administration';
      }
    }
    
    // Stock module titles
    if (activeModule === 'stock') {
      switch (activeSubModule) {
        case 'produits':
          return 'Gestion des Produits';
        case 'lots':
          return 'Gestion des Lots';
        case 'commandes':
          return 'Commandes Fournisseurs';
        case 'receptions':
          return 'Réceptions';
        default:
          return 'Gestion des Stocks';
      }
    }
    
    // Comptabilité module titles
    if (activeModule === 'comptabilite') {
      switch (activeSubModule) {
        case 'comptes':
          return 'Comptes Comptables';
        case 'journaux':
          return 'Journaux Comptables';
        case 'ecritures':
          return 'Écritures Comptables';
        default:
          return 'Comptabilité';
      }
    }
    
    // Main module titles
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'ventes':
        return 'Gestion des Ventes';
      case 'rapports':
        return 'Analyses & Rapports';
      case 'assistant':
        return 'Assistant IA';
      case 'chat':
        return 'Chat-PharmaSoft';
        
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
