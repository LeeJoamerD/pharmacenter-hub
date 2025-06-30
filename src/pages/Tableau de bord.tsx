
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
    // Stock module with submodules
    if (activeModule === 'stock') {
      switch (activeSubModule) {
        case 'products':
          return <PlaceholderModule title="Gestion des Produits" />;
        case 'lots':
          return <PlaceholderModule title="Gestion des Lots" />;
        case 'orders':
          return <PlaceholderModule title="Commandes Fournisseurs" />;
        case 'receptions':
          return <PlaceholderModule title="Réceptions" />;
        default:
          return <StockDashboardModule />;
      }
    }
    
    // Accounting module with submodules
    if (activeModule === 'accounting') {
      switch (activeSubModule) {
        case 'accounts':
          return <PlaceholderModule title="Comptes Comptables" />;
        case 'journals':
          return <PlaceholderModule title="Journaux Comptables" />;
        case 'entries':
          return <PlaceholderModule title="Écritures Comptables" />;
        default:
          return <PlaceholderModule title="Tableau de bord Comptabilité" />;
      }
    }
    
    // Settings module with submodules
    if (activeModule === 'settings') {
      switch (activeSubModule) {
        case 'general':
          return <PlaceholderModule title="Paramètres Généraux" />;
        case 'interface':
          return <PlaceholderModule title="Paramètres Interface" />;
        case 'printers':
          return <PlaceholderModule title="Paramètres Imprimantes" />;
        case 'taxes':
          return <PlaceholderModule title="Paramètres Taxes" />;
        case 'backup':
          return <PlaceholderModule title="Paramètres Sauvegarde" />;
        case 'maintenance':
          return <PlaceholderModule title="Paramètres Maintenance" />;
        default:
          return <PlaceholderModule title="Configuration Système" />;
      }
    }
    
    // Clients module (existing)
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
    
    // Main modules
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />;
      case 'sales':
        return <SalesModule />;
      case 'reports':
        return <ReportsModule />;
      case 'assistant':
        return <PlaceholderModule title="Assistant IA" />;
      case 'chat':
        return <PlaceholderModule title="Chat PharmaSoft" />;
      
      // Administration modules
      case 'personnel':
        return <PlaceholderModule title="Gestion du Personnel" />;
      case 'insurers':
        return <PlaceholderModule title="Gestion des Assureurs" />;
      case 'companies':
        return <PlaceholderModule title="Gestion des Sociétés" />;
      case 'contracted':
        return <PlaceholderModule title="Gestion des Conventionnés" />;
      case 'suppliers':
        return <PlaceholderModule title="Gestion des Fournisseurs" />;
      case 'laboratories':
        return <PlaceholderModule title="Gestion des Laboratoires" />;
        
      default:
        return <DashboardHome />;
    }
  };

  const getModuleTitle = () => {
    // Stock module titles
    if (activeModule === 'stock') {
      switch (activeSubModule) {
        case 'products':
          return 'Gestion des Produits';
        case 'lots':
          return 'Gestion des Lots';
        case 'orders':
          return 'Commandes Fournisseurs';
        case 'receptions':
          return 'Réceptions';
        default:
          return 'Gestion des Stocks';
      }
    }
    
    // Accounting module titles
    if (activeModule === 'accounting') {
      switch (activeSubModule) {
        case 'accounts':
          return 'Comptes Comptables';
        case 'journals':
          return 'Journaux Comptables';
        case 'entries':
          return 'Écritures Comptables';
        default:
          return 'Comptabilité';
      }
    }
    
    // Settings module titles
    if (activeModule === 'settings') {
      switch (activeSubModule) {
        case 'general':
          return 'Paramètres Généraux';
        case 'interface':
          return 'Paramètres Interface';
        case 'printers':
          return 'Paramètres Imprimantes';
        case 'taxes':
          return 'Paramètres Taxes';
        case 'backup':
          return 'Paramètres Sauvegarde';
        case 'maintenance':
          return 'Paramètres Maintenance';
        default:
          return 'Paramètres';
      }
    }
    
    // Clients module titles (existing)
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
    
    // Main module titles
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'sales':
        return 'Gestion des Ventes';
      case 'reports':
        return 'Analyses & Rapports';
      case 'assistant':
        return 'Assistant IA';
      case 'chat':
        return 'Chat PharmaSoft';
      
      // Administration module titles
      case 'personnel':
        return 'Gestion du Personnel';
      case 'insurers':
        return 'Gestion des Assureurs';
      case 'companies':
        return 'Gestion des Sociétés';
      case 'contracted':
        return 'Gestion des Conventionnés';
      case 'suppliers':
        return 'Gestion des Fournisseurs';
      case 'laboratories':
        return 'Gestion des Laboratoires';
        
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
