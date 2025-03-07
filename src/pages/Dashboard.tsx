
import { useState } from 'react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart, Calendar, PackageSearch, Users, ShoppingCart, Settings, Pill, LogOut, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Components for different sections
const DashboardHome = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">€1,248.50</div>
        <p className="text-xs text-muted-foreground">+12% par rapport à hier</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Clients servis</CardTitle>
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

const SalesModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Gestion des Ventes</h2>
    <p className="text-muted-foreground">Gérez vos ventes, ordonnances et transactions clients.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <ShoppingCart className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module de caisse et ventes</span>
    </div>
  </div>
);

const InventoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Gestion des Stocks</h2>
    <p className="text-muted-foreground">Suivez votre inventaire, les dates d'expiration et planifiez vos commandes.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <PackageSearch className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module de gestion des stocks</span>
    </div>
  </div>
);

const ClientsModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Gestion des Clients</h2>
    <p className="text-muted-foreground">Gérez votre base de données clients et leur historique médical.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <Users className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module de gestion des clients</span>
    </div>
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
    <p className="text-muted-foreground">Accédez à des analyses détaillées et générez des rapports personnalisés.</p>
    <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
      <BarChart className="h-12 w-12 text-muted" />
      <span className="ml-4 text-xl text-muted-foreground">Module d'analyses et rapports</span>
    </div>
  </div>
);

const AppSidebar = ({ activeModule, setActiveModule }: { activeModule: string, setActiveModule: (module: string) => void }) => {
  const { toast } = useToast();
  
  const handleLogout = () => {
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès.",
    });
    // Dans une vraie application, rediriger vers la page de connexion
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-6">
        <a href="#" className="flex items-center gap-2">
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
                  onClick={() => setActiveModule('dashboard')}
                >
                  <Home className="h-5 w-5" />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'sales' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => setActiveModule('sales')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ventes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'inventory' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => setActiveModule('inventory')}
                >
                  <PackageSearch className="h-5 w-5" />
                  <span>Stocks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'clients' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => setActiveModule('clients')}
                >
                  <Users className="h-5 w-5" />
                  <span>Clients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'calendar' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => setActiveModule('calendar')}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Calendrier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'reports' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => setActiveModule('reports')}
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

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />;
      case 'sales':
        return <SalesModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'clients':
        return <ClientsModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'reports':
        return <ReportsModule />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">
                {activeModule === 'dashboard' && 'Tableau de bord'}
                {activeModule === 'sales' && 'Gestion des Ventes'}
                {activeModule === 'inventory' && 'Gestion des Stocks'}
                {activeModule === 'clients' && 'Gestion des Clients'}
                {activeModule === 'calendar' && 'Calendrier & Rendez-vous'}
                {activeModule === 'reports' && 'Analyses & Rapports'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">Aide</Button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                AD
              </div>
            </div>
          </div>
          <div className="p-6">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
