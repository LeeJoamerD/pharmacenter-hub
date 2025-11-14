
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { SystemSettingsSync } from '@/components/system-settings/SystemSettingsSync';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
import AnalyticsModule from '@/components/dashboard/modules/AnalyticsModule';
import WorkflowModule from '@/components/dashboard/modules/WorkflowModule';
import StockModule from '@/components/dashboard/modules/StockModule';
import VentesModule from '@/components/dashboard/modules/VentesModule';
import ComptabiliteModule from '@/components/dashboard/modules/ComptabiliteModule';
import RapportsModule from '@/components/dashboard/modules/RapportsModule';
import AssistantIAModule from '@/components/dashboard/modules/AssistantIAModule';
import { useAuth } from '@/contexts/AuthContext';
import ChatNetworkModule from '@/components/dashboard/modules/ChatNetworkModule';
import { NavigationProvider } from '@/contexts/NavigationContext';

// Fonction pour extraire les initiales
const getUserInitials = (personnel: any, user: any) => {
  if (personnel?.prenoms && personnel?.noms) {
    const firstNameInitial = personnel.prenoms.charAt(0).toUpperCase();
    const lastNameInitial = personnel.noms.charAt(0).toUpperCase();
    return `${firstNameInitial}${lastNameInitial}`;
  }
  
  if (user?.user_metadata?.name) {
    const nameParts = user.user_metadata.name.split(' ');
    if (nameParts.length >= 2) {
      const initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
      return initials;
    }
    const initial = nameParts[0].charAt(0).toUpperCase();
    return initial;
  }
  
  if (user?.email) {
    const initial = user.email.charAt(0).toUpperCase();
    return initial;
  }
  
  return 'U';
};

// Fonction pour obtenir le nom complet
const getFullUserName = (personnel: any, user: any) => {
  if (personnel?.prenoms && personnel?.noms) {
    const fullName = `${personnel.prenoms} ${personnel.noms}`;
    return fullName;
  }
  
  if (user?.user_metadata?.name) {
    return user.user_metadata.name;
  }
  
  const fallback = user?.email || 'Utilisateur';
  return fallback;
};

// Composant Avatar avec initiales
const UserAvatar = ({ initials }: { initials: string }) => (
  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
    {initials}
  </div>
);

const Dashboard = () => {
  const { signOut, personnel, pharmacy, user, connectedPharmacy } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeSubModule, setActiveSubModule] = useState('');

  // Protection : Vérifier qu'une pharmacie est connectée
  const activePharmacy = pharmacy || connectedPharmacy;
  const isPharmacyConnected = !!activePharmacy;

  useEffect(() => {
    // Vérifier l'état de connexion
    if (!user) {
      console.log('DASHBOARD: Aucun utilisateur authentifié, redirection vers accueil');
      toast({
        title: "Accès non autorisé",
        description: "Vous devez vous connecter pour accéder au tableau de bord.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (!isPharmacyConnected) {
      console.log('DASHBOARD: Aucune pharmacie connectée, redirection vers accueil');
      toast({
        title: "Pharmacie requise",
        description: "Vous devez connecter une pharmacie pour accéder au tableau de bord.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    console.log('DASHBOARD: Accès autorisé -', 'User:', !!user, 'Pharmacie:', activePharmacy?.name);
  }, [user, isPharmacyConnected, activePharmacy, navigate, toast]);

  // Afficher un écran de chargement si pas encore connecté
  if (!user || !isPharmacyConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Vérification des accès...</h2>
          <p className="text-muted-foreground">
            Vérification de votre connexion et de votre pharmacie
          </p>
        </div>
      </div>
    );
  }

  // Calculer les initiales et le nom complet
  const userInitials = getUserInitials(personnel, user);
  const fullUserName = getFullUserName(personnel, user);

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
        case 'analytics':
          return <AnalyticsModule />;
        case 'workflows':
          return <WorkflowModule />;
        case '':
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }
    
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />;
      case 'stock':
        return <StockModule activeSubModule={activeSubModule} />;
      case 'ventes':
        return <VentesModule activeSubModule={activeSubModule} />;
      case 'comptabilite':
        return <ComptabiliteModule activeSubModule={activeSubModule} />;
      case 'rapports':
        return <RapportsModule activeSubModule={activeSubModule} />;
      case 'assistant':
        return <AssistantIAModule activeSubModule={activeSubModule} />;
      case 'chat':
        return <ChatNetworkModule activeSubModule={activeSubModule} />;
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
        case 'analytics':
          return 'Analyses et Reporting';
        case 'workflows':
          return 'Workflows & Automatisation';
        case '':
          return 'Dashboard Administration';
        default:
          return 'Dashboard Administration';
      }
    }
    
    switch (activeModule) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'stock':
        return 'Gestion de Stock';
      case 'ventes':
        return 'Gestion des Ventes';
      case 'comptabilite':
        return 'Module Comptabilité';
      case 'rapports':
        return 'Module Rapports';
      case 'assistant':
        return 'Assistant IA';
      case 'chat':
        return 'Chat PharmaSoft Réseau';
      case 'parametres':
        return 'Configuration Système';
      default:
        return 'Tableau de bord';
    }
  };

  return (
    <NavigationProvider
      activeModule={activeModule}
      activeSubModule={activeSubModule}
      setActiveModule={setActiveModule}
      setActiveSubModule={setActiveSubModule}
    >
      <SidebarProvider>
        <SystemSettingsSync />
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
                  {personnel && (
                    <span className="text-sm text-muted-foreground">
                      {personnel.prenoms} {personnel.noms} - {pharmacy?.name}
                    </span>
                  )}
                  <Button variant="outline" size="sm">Aide</Button>
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground hover:bg-muted/50 h-8 gap-2"
                        >
                          <UserAvatar initials={userInitials} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border shadow-lg">
                        <DropdownMenuLabel className="pb-1">
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium">{fullUserName}</span>
                            <span className="text-sm text-muted-foreground font-normal">
                              {user.email}
                            </span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Se déconnecter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <div className="p-6">
                {renderActiveModule()}
              </div>
            </main>
          </div>
        </CurrencyProvider>
      </SidebarProvider>
    </NavigationProvider>
  );
};

export default Dashboard;
