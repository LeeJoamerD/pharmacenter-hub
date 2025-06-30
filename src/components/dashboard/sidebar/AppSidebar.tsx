
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, PackageSearch, Users, Calendar, BarChart, 
  Settings, LogOut, Pill, LayoutDashboard, User, ListChecks, Calculator,
  Bot, MessageSquare, Shield, Building2, UserCheck, Factory, Package,
  ClipboardList, Truck, Receipt, Book, FileText, CreditCard, Printer,
  Save, Wrench, Import, Maintenance, UserCog, AlertTriangle, Bell,
  Archive, Taxes, TrendingUp, PieChart, Brain, HelpCircle } from 'lucide-react';

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
                  className={activeModule === 'stock' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('stock')}
                >
                  <PackageSearch className="h-5 w-5" />
                  <span>Stock</span>
                </SidebarMenuButton>
                {activeModule === 'stock' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'products' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('stock', 'products')}
                      >
                        <Package className="h-4 w-4" />
                        <span>Produits</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'lots' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('stock', 'lots')}
                      >
                        <Archive className="h-4 w-4" />
                        <span>Lots</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'orders' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('stock', 'orders')}
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>Commandes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'receptions' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('stock', 'receptions')}
                      >
                        <Truck className="h-4 w-4" />
                        <span>Réceptions</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'accounting' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('accounting')}
                >
                  <Calculator className="h-5 w-5" />
                  <span>Comptabilité</span>
                </SidebarMenuButton>
                {activeModule === 'accounting' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'accounts' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('accounting', 'accounts')}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Comptes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'journals' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('accounting', 'journals')}
                      >
                        <Book className="h-4 w-4" />
                        <span>Journaux</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'entries' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('accounting', 'entries')}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Écritures</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
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
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'settings' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('settings')}
                >
                  <Settings className="h-5 w-5" />
                  <span>Paramètres</span>
                </SidebarMenuButton>
                {activeModule === 'settings' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'general' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('settings', 'general')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Général</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'interface' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('settings', 'interface')}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Interface</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'printers' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('settings', 'printers')}
                      >
                        <Printer className="h-4 w-4" />
                        <span>Imprimantes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'taxes' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('settings', 'taxes')}
                      >
                        <Taxes className="h-4 w-4" />
                        <span>Taxes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'backup' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('settings', 'backup')}
                      >
                        <Save className="h-4 w-4" />
                        <span>Sauvegarde</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'maintenance' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('settings', 'maintenance')}
                      >
                        <Wrench className="h-4 w-4" />
                        <span>Maintenance</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'assistant' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('assistant')}
                >
                  <Bot className="h-5 w-5" />
                  <span>Assistant IA</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'chat' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('chat')}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'personnel' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('personnel')}
                >
                  <Users className="h-5 w-5" />
                  <span>Personnel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'insurers' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('insurers')}
                >
                  <Shield className="h-5 w-5" />
                  <span>Assureurs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'companies' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('companies')}
                >
                  <Building2 className="h-5 w-5" />
                  <span>Sociétés</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'contracted' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('contracted')}
                >
                  <UserCheck className="h-5 w-5" />
                  <span>Conventionnés</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'clients' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('clients')}
                >
                  <User className="h-5 w-5" />
                  <span>Clients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'suppliers' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('suppliers')}
                >
                  <Truck className="h-5 w-5" />
                  <span>Fournisseurs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'laboratories' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('laboratories')}
                >
                  <Factory className="h-5 w-5" />
                  <span>Laboratoires</span>
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
