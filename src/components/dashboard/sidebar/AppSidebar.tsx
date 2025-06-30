
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
  Save, Wrench, Import, UserCog, AlertTriangle, Bell,
  Archive, TrendingUp, PieChart, Brain, HelpCircle } from 'lucide-react';

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
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'administration' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('administration')}
                >
                  <Users className="h-5 w-5" />
                  <span>Administration</span>
                </SidebarMenuButton>
                {activeModule === 'administration' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'personnel' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'personnel')}
                      >
                        <Users className="h-4 w-4" />
                        <span>Personnel</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'assureurs' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'assureurs')}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Assureurs</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'societes' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'societes')}
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Sociétés</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'conventionnes' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'conventionnes')}
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Conventionnés</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'clients' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'clients')}
                      >
                        <User className="h-4 w-4" />
                        <span>Clients</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'fournisseurs' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'fournisseurs')}
                      >
                        <Truck className="h-4 w-4" />
                        <span>Fournisseurs</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'laboratoires' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'laboratoires')}
                      >
                        <Factory className="h-4 w-4" />
                        <span>Laboratoires</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
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
                        className={activeSubModule === 'produits' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('stock', 'produits')}
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
                        className={activeSubModule === 'commandes' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('stock', 'commandes')}
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
                  className={activeModule === 'ventes' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('ventes')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ventes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'comptabilite' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('comptabilite')}
                >
                  <Calculator className="h-5 w-5" />
                  <span>Comptabilité</span>
                </SidebarMenuButton>
                {activeModule === 'comptabilite' && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'comptes' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('comptabilite', 'comptes')}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Comptes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'journaux' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('comptabilite', 'journaux')}
                      >
                        <Book className="h-4 w-4" />
                        <span>Journaux</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'ecritures' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('comptabilite', 'ecritures')}
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
                  className={activeModule === 'rapports' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('rapports')}
                >
                  <BarChart className="h-5 w-5" />
                  <span>Rapports</span>
                </SidebarMenuButton>
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
                  <span>Chat-PharmaSoft</span>
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
