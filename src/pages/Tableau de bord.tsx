import { useState } from 'react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart, Calendar, PackageSearch, Users, ShoppingCart, Settings, Pill, LogOut, Home, User, UserPlus, ListChecks, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SalesView from '@/components/dashboard/SalesView';
import InventoryView from '@/components/dashboard/InventoryView';
import { useLanguage } from '@/contexts/LanguageContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Link, useNavigate } from 'react-router-dom';
import StockDashboard from '@/components/dashboard/StockDashboard';

const DashboardHome = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1 248,50 €</div>
        <p className="text-xs text-muted-foreground">+12 % par rapport à hier</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Services clients</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">42</div>
        <p className="text-xs text-muted-foreground">+8% par rapport à hier</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Produits à renouveler</CardTitle>
        <PackageSearch className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">7</div>
        <p className="text-xs text-muted-foreground">Produits sous le seuil minimum</p>
      </CardContent>
    </Card>
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Ventes des 7 derniers jours</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
          <LineChart className="h-8 w-8 text-muted" />
          <span className="ml-2 text-muted-foreground">Graphique des ventes</span>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Prochains rendez-vous</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">10:00 - Consultation M. Dupont</p>
              <p className="text-xs text-muted-foreground">Suivi traitement diabète</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">14:30 - Livraison fournisseur</p>
              <p className="text-xs text-muted-foreground">Médicaments génériques</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">16:00 - Formation équipe</p>
              <p className="text-xs text-muted-foreground">Nouveaux produits dermatologiques</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SalesModule = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t('salesManagement')}</h2>
      <p className="text-muted-foreground">{t('salesDesc')}</p>
      <SalesView />
    </div>
  );
};

const StockDashboardModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Tableau de bord du stock</h2>
    <p className="text-muted-foreground">Visualisez les données importantes concernant votre inventaire.</p>
    <StockDashboard />
  </div>
);

const InventoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Inventaire des produits</h2>
    <p className="text-muted-foreground">Suivez votre inventaire, les dates d'expiration et planifiez vos commandes.</p>
    <InventoryView />
  </div>
);

const ClientDashboardModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Tableau de bord des clients</h2>
    <p className="text-muted-foreground">Visualisez les données importantes concernant vos clients.</p>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total des clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,254</div>
          <p className="text-xs text-muted-foreground">+8% depuis le mois dernier</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nouveaux clients</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">32</div>
          <p className="text-xs text-muted-foreground">Ce mois-ci</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consultations</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">128</div>
          <p className="text-xs text-muted-foreground">Ce mois-ci</p>
        </CardContent>
      </Card>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Démographie des clients</CardTitle>
          <CardDescription>Répartition par âge et sexe</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
            <BarChart className="h-8 w-8 text-muted" />
            <span className="ml-2 text-muted-foreground">Graphique de démographie</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Clients fidèles</CardTitle>
          <CardDescription>Top 5 des clients avec le plus d'achats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Martin Dupont", visits: 24, spend: "1,240 €" },
              { name: "Marie Lambert", visits: 18, spend: "965 €" },
              { name: "Jean Lefebvre", visits: 15, spend: "820 €" },
              { name: "Sophie Moreau", visits: 12, spend: "750 €" },
              { name: "Pierre Durand", visits: 10, spend: "680 €" }
            ].map((client, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.visits} visites</p>
                  </div>
                </div>
                <div className="text-sm font-medium">{client.spend}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ClientDirectoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Répertoire des clients</h2>
    <p className="text-muted-foreground">Gérez votre base de données clients et consultez leurs informations.</p>
    
    <Card>
      <CardHeader>
        <CardTitle>Liste des clients</CardTitle>
        <CardDescription>Recherchez et filtrez vos clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
          <Users className="h-12 w-12 text-muted" />
          <span className="ml-4 text-xl text-muted-foreground">Répertoire des clients</span>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ClientHistoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Historique médical</h2>
    <p className="text-muted-foreground">Consultez et gérez l'historique médical et les traitements de vos clients.</p>
    
    <Card>
      <CardHeader>
        <CardTitle>Suivi des traitements</CardTitle>
        <CardDescription>Historique des prescriptions et consultations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
          <ListChecks className="h-12 w-12 text-muted" />
          <span className="ml-4 text-xl text-muted-foreground">Historique médical des clients</span>
        </div>
      </CardContent>
    </Card>
  </div>
);

const CalendarModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Calendrier & Rendez-vous</h2>
    <p className="text-muted-foreground">Planifiez et gérez vos rendez-vous et événements.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <Calendar className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module de calendrier</span>
    </div>
  </div>
);

const ReportsModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Analyses & Rapports</h2>
    <p className="text-muted-foreground">Accédez à des analyses détaillées et générer des rapports personnalisés.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <BarChart className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module d'analyses et de rapports</span>
    </div>
  </div>
);

const AppSidebar = ({ activeModule, setActiveModule, activeSubModule, setActiveSubModule } : 
  { activeModule : string, setActiveModule : (module : string) => void, 
    activeSubModule: string, setActiveSubModule: (subModule: string) => void }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    // Dans une vraie application, rediriger vers la page de connexion
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleMenuClick = (module: string, subModule: string = '') => {
    setActiveModule(module);
    if (subModule) {
      setActiveSubModule(subModule);
    } else {
      setActiveSubModule('');
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-6">
        <a onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
          <Pill className="h-6 w-6 text-primary" />
          <span className="text-xl font-display font-bold text-primary">PharmaSoft</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'dashboard' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('dashboard')}
                >
                  <Home className="h-5 w-5" />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'sales' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('sales')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ventes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'inventory' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('inventory')}
                >
                  <PackageSearch className="h-5 w-5" />
                  <span>Stocks</span>
                </SidebarMenuButton>
                {activeModule === 'inventory' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'stockDashboard' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('inventory', 'stockDashboard')}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Tableau de bord du stock</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'inventoryList' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('inventory', 'inventoryList')}
                      >
                        <ListChecks className="h-4 w-4" />
                        <span>Inventaire des produits</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'clients' ? 'bg-primary/10 text-primary' :''} 
                  onClick={() => handleMenuClick('clients')}
                >
                  <Users className="h-5 w-5" />
                  <span>Clients</span>
                </SidebarMenuButton>
                {activeModule === 'clients' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'clientDashboard' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('clients', 'clientDashboard')}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Tableau de bord des clients</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'clientDirectory' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('clients', 'clientDirectory')}
                      >
                        <User className="h-4 w-4" />
                        <span>Répertoire des clients</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'clientHistory' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('clients', 'clientHistory')}
                      >
                        <ListChecks className="h-4 w-4" />
                        <span>Historique médical</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'calendar' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('calendar')}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Calendrier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'reports' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('reports')}
                >
                  <BarChart className="h-5 w-5" />
                  <span>Rapports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-5 w-5" />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [activeSubModule, setActiveSubModule] = useState('');

  const renderActiveModule = () => {
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

