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
    // Administration module with all submodules
    if (activeModule === 'administration') {
      switch (activeSubModule) {
        // Gestion du Personnel
        case 'gestion-personnel':
          return <PlaceholderModule title="📋 Gestion du Personnel" />;
        case 'employes':
          return <PlaceholderModule title="Employés" />;
        case 'plannings':
          return <PlaceholderModule title="Plannings & Horaires" />;
        case 'roles-permissions':
          return <PlaceholderModule title="Rôles & Permissions" />;
        case 'sessions-caisse':
          return <PlaceholderModule title="Sessions de Caisse" />;
        case 'journal-activite':
          return <PlaceholderModule title="Journal d'Activité" />;
        
        // Gestion des Partenaires
        case 'gestion-partenaires':
          return <PlaceholderModule title="🤝 Gestion des Partenaires" />;
        case 'assureurs':
          return <PlaceholderModule title="Assureurs" />;
        case 'societes-conventionnees':
          return <PlaceholderModule title="Sociétés Conventionnées" />;
        case 'conventionnes':
          return <PlaceholderModule title="Conventionnés" />;
        case 'fournisseurs':
          return <PlaceholderModule title="Fournisseurs" />;
        case 'laboratoires':
          return <PlaceholderModule title="Laboratoires" />;
        
        // Gestion des Produits
        case 'gestion-produits':
          return <PlaceholderModule title="📦 Gestion des Produits" />;
        case 'catalogue-produits':
          return <PlaceholderModule title="Catalogue Produits" />;
        case 'familles-produits':
          return <PlaceholderModule title="Familles de Produits" />;
        case 'rayons':
          return <PlaceholderModule title="Rayons" />;
        case 'categories-tarification':
          return <PlaceholderModule title="Catégories de Tarification" />;
        case 'tarification-prix':
          return <PlaceholderModule title="Tarification & Prix" />;
        
        // Gestion des Clients
        case 'gestion-clients':
          return <PlaceholderModule title="👥 Gestion des Clients" />;
        case 'clients-tous':
          return <PlaceholderModule title="Clients (tous types)" />;
        case 'segments-clients':
          return <PlaceholderModule title="Segments Clients" />;
        case 'limites-credit':
          return <PlaceholderModule title="Limites de Crédit" />;
        
        // Paramètres Système
        case 'parametres-systeme':
          return <PlaceholderModule title="⚙️ Paramètres Système" />;
        case 'parametres-generaux':
          return <PlaceholderModule title="Paramètres Généraux" />;
        case 'interface-affichage':
          return <PlaceholderModule title="Interface & Affichage" />;
        case 'alertes-notifications':
          return <PlaceholderModule title="Alertes & Notifications" />;
        case 'sauvegardes':
          return <PlaceholderModule title="Sauvegardes" />;
        case 'import-export':
          return <PlaceholderModule title="Import/Export" />;
        case 'maintenance':
          return <PlaceholderModule title="Maintenance" />;
        
        // Configuration Matériel
        case 'configuration-materiel':
          return <PlaceholderModule title="🖨️ Configuration Matériel" />;
        case 'imprimantes':
          return <PlaceholderModule title="Imprimantes" />;
        case 'caisses':
          return <PlaceholderModule title="Caisses" />;
        
        // Configuration Financière
        case 'configuration-financiere':
          return <PlaceholderModule title="💰 Configuration Financière" />;
        case 'taxes':
          return <PlaceholderModule title="Taxes" />;
        case 'comptes-depenses':
          return <PlaceholderModule title="Comptes de Dépenses" />;
        case 'parametres-facturation':
          return <PlaceholderModule title="Paramètres de Facturation" />;
        
        // Rapports & Audit
        case 'rapports-audit':
          return <PlaceholderModule title="📊 Rapports & Audit" />;
        case 'journal-activite-audit':
          return <PlaceholderModule title="Journal d'Activité (Audit)" />;
        case 'statistiques-rh':
          return <PlaceholderModule title="Statistiques RH" />;
        case 'performance-partenaires':
          return <PlaceholderModule title="Performance Partenaires" />;
        case 'audit-trail':
          return <PlaceholderModule title="Audit Trail" />;
        
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
        // Gestion du Personnel
        case 'gestion-personnel':
          return '📋 Gestion du Personnel';
        case 'employes':
          return 'Employés';
        case 'plannings':
          return 'Plannings & Horaires';
        case 'roles-permissions':
          return 'Rôles & Permissions';
        case 'sessions-caisse':
          return 'Sessions de Caisse';
        case 'journal-activite':
          return 'Journal d\'Activité';
        
        // Gestion des Partenaires
        case 'gestion-partenaires':
          return '🤝 Gestion des Partenaires';
        case 'assureurs':
          return 'Assureurs';
        case 'societes-conventionnees':
          return 'Sociétés Conventionnées';
        case 'conventionnes':
          return 'Conventionnés';
        case 'fournisseurs':
          return 'Fournisseurs';
        case 'laboratoires':
          return 'Laboratoires';
        
        // Gestion des Produits
        case 'gestion-produits':
          return '📦 Gestion des Produits';
        case 'catalogue-produits':
          return 'Catalogue Produits';
        case 'familles-produits':
          return 'Familles de Produits';
        case 'rayons':
          return 'Rayons';
        case 'categories-tarification':
          return 'Catégories de Tarification';
        case 'tarification-prix':
          return 'Tarification & Prix';
        
        // Gestion des Clients
        case 'gestion-clients':
          return '👥 Gestion des Clients';
        case 'clients-tous':
          return 'Clients (tous types)';
        case 'segments-clients':
          return 'Segments Clients';
        case 'limites-credit':
          return 'Limites de Crédit';
        
        // Paramètres Système
        case 'parametres-systeme':
          return '⚙️ Paramètres Système';
        case 'parametres-generaux':
          return 'Paramètres Généraux';
        case 'interface-affichage':
          return 'Interface & Affichage';
        case 'alertes-notifications':
          return 'Alertes & Notifications';
        case 'sauvegardes':
          return 'Sauvegardes';
        case 'import-export':
          return 'Import/Export';
        case 'maintenance':
          return 'Maintenance';
        
        // Configuration Matériel
        case 'configuration-materiel':
          return '🖨️ Configuration Matériel';
        case 'imprimantes':
          return 'Imprimantes';
        case 'caisses':
          return 'Caisses';
        
        // Configuration Financière
        case 'configuration-financiere':
          return '💰 Configuration Financière';
        case 'taxes':
          return 'Taxes';
        case 'comptes-depenses':
          return 'Comptes de Dépenses';
        case 'parametres-facturation':
          return 'Paramètres de Facturation';
        
        // Rapports & Audit
        case 'rapports-audit':
          return '📊 Rapports & Audit';
        case 'journal-activite-audit':
          return 'Journal d\'Activité (Audit)';
        case 'statistiques-rh':
          return 'Statistiques RH';
        case 'performance-partenaires':
          return 'Performance Partenaires';
        case 'audit-trail':
          return 'Audit Trail';
        
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
