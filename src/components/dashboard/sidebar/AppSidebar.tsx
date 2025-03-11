
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, PackageSearch, Users, Calendar, BarChart, 
  Settings, LogOut, Pill, LayoutDashboard, User, ListChecks } from 'lucide-react';

interface AppSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  activeSubModule: string;
  setActiveSubModule: (subModule: string) => void;
}

const AppSidebar = ({ 
  activeModule, 
  setActiveModule, 
  activeSubModule, 
  setActiveSubModule 
}: AppSidebarProps) => {
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

export default AppSidebar;
