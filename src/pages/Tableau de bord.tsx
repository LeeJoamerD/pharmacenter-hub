
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Import components
import AppSidebar from '@/components/dashboard/sidebar/AppSidebar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import PersonnelModule from '@/components/dashboard/modules/PersonnelModule';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PartnerModule from '@/components/dashboard/modules/PartnerModule';
import ReferentielModule from '@/components/dashboard/modules/ReferentielModule';
import ClientModule from '@/components/dashboard/modules/ClientModule';
import ParametresModule from '@/components/dashboard/modules/ParametresModule';
import DocumentModule from '@/components/dashboard/modules/DocumentModule';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeSubModule, setActiveSubModule] = useState('');

  const renderActiveModule = () => {
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        case 'personnel':
          return <PersonnelModule />;
        case 'partenaires':
          return <PartnerModule />;
        case 'référentiel':
          return <ReferentielModule />;
        case 'clients':
          return <ClientModule />;
        case 'documents':
          return <DocumentModule />;
        case '':
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }
    
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />;
      case 'parametres':
        return <ParametresModule />;
      default:
        return <DashboardHome />;
    }
  };

  const getModuleTitle = () => {
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        case 'personnel':
          return 'Gestion du Personnel';
        case 'partenaires':
          return 'Gestion des Partenaires';
        case 'référentiel':
          return 'Référentiel Produits';
        case 'clients':
          return 'Gestion des Clients';
        case 'documents':
          return 'Bibliothèque de Documents';
        case '':
          return 'Dashboard Administration';
        default:
          return 'Dashboard Administration';
      }
    }
    
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'parametres':
        return 'Configuration Système';
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
