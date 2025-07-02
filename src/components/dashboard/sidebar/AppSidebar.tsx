
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, Package, Calculator, BarChart, 
  Settings, LogOut, Pill, Shield, Bot, MessageCircle } from 'lucide-react';

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
                  <Home className="h-5 w-5 text-blue-600" />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'administration' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('administration')}
                >
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span>Administration</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'ventes' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('ventes')}
                >
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>Ventes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'stock' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('stock')}
                >
                  <Package className="h-5 w-5 text-orange-600" />
                  <span>Stock</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'comptabilite' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('comptabilite')}
                >
                  <Calculator className="h-5 w-5 text-red-600" />
                  <span>Comptabilité</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'rapports' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('rapports')}
                >
                  <BarChart className="h-5 w-5 text-indigo-600" />
                  <span>Rapports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'assistant' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('assistant')}
                >
                  <Bot className="h-5 w-5 text-cyan-600" />
                  <span>Assistant IA</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'chat' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('chat')}
                >
                  <MessageCircle className="h-5 w-5 text-pink-600" />
                  <span>Chat-PharmaSoft</span>
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
                  <Settings className="h-5 w-5 text-gray-600" />
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
