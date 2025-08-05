import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, Package, Calculator, BarChart, 
  Settings, LogOut, Pill, Shield, Bot, MessageCircle, Users, Handshake, Tag, User, Lock, 
  Clipboard, ChartBar, RefreshCw, DollarSign, CreditCard, Receipt, Briefcase, Target, 
  Building, Banknote, Smartphone, Wrench, Map, Globe, Palette, Search, TrendingUp, 
  Eye, GraduationCap, Folder, Paperclip, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS, ROLES } from '@/types/permissions';

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
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { personnel } = useAuth();
  
  // Vérifier les permissions en utilisant le rôle du personnel
  const userRole = personnel?.role || 'Employé';
  const roleConfig = ROLES[userRole];
  const hasStockAccess = roleConfig?.permissions.includes(PERMISSIONS.STOCK_VIEW) || false;
  
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
    if (subModule) {
      setActiveModule(module);
      setActiveSubModule(subModule);
    } else {
      // Toggle menu expansion
      if (expandedMenus.includes(module)) {
        setExpandedMenus(expandedMenus.filter(m => m !== module));
      } else {
        setExpandedMenus([...expandedMenus, module]);
      }
      setActiveModule(module);
      setActiveSubModule('');
    }
  };

  const subMenus = {
    administration: [
      { name: 'Personnel', icon: Users },
      { name: 'Partenaires', icon: Handshake },
      { name: 'Référentiel', icon: Package },
      { name: 'Clients', icon: User },
      { name: 'Sécurité', icon: Lock },
      { name: 'Documents', icon: Clipboard },
      { name: 'Analytics', icon: ChartBar },
      { name: 'Workflows', icon: RefreshCw },
      { name: 'Configuration', icon: Settings }
    ],
    stock: [
      { name: 'Stock Actuel', icon: Eye },
      { name: 'Lots', icon: Tag },
      { name: 'Approvisionnement', icon: Clipboard },
      { name: 'Mouvements', icon: ChartBar },
      { name: 'Inventaires', icon: Clipboard },
      { name: 'Alertes', icon: RefreshCw },
      { name: 'Analyses', icon: TrendingUp },
      { name: 'Configuration', icon: Settings }
    ],
    ventes: [
      { name: 'Caisses', icon: DollarSign },
      { name: 'Point de Vente', icon: ShoppingCart },
      { name: 'Encaissements', icon: CreditCard },
      { name: 'Historique', icon: Clipboard },
      { name: 'Retours', icon: RefreshCw },
      { name: 'Facturation', icon: Receipt },
      { name: 'Analytics', icon: ChartBar },
      { name: 'Crédit', icon: Briefcase },
      { name: 'Promotions', icon: Target },
      { name: 'Configuration', icon: Settings }
    ],
    comptabilite: [
      { name: 'Plan Comptable', icon: ChartBar },
      { name: 'Journalisation', icon: Clipboard },
      { name: 'Factures', icon: Receipt },
      { name: 'Paiements', icon: CreditCard },
      { name: 'Analytique', icon: TrendingUp },
      { name: 'Fiscal', icon: Building },
      { name: 'Bancaire', icon: Banknote },
      { name: 'Rapports', icon: Clipboard },
      { name: 'Audit', icon: Lock },
      { name: 'Intégrations', icon: RefreshCw },
      { name: 'Tableaux de Bord', icon: ChartBar },
      { name: 'Configuration', icon: Settings }
    ],
    rapports: [
      { name: 'Ventes', icon: ChartBar },
      { name: 'Stock', icon: Package },
      { name: 'Financier', icon: DollarSign },
      { name: 'Clients', icon: Users },
      { name: 'Business Intelligence', icon: Target },
      { name: 'Réglementaire', icon: Clipboard },
      { name: 'Géospatial', icon: Map },
      { name: 'Mobile', icon: Smartphone },
      { name: 'IA/Prédictif', icon: Bot },
      { name: 'Générateur', icon: Wrench },
      { name: 'Comparatif', icon: TrendingUp },
      { name: 'Configuration', icon: Settings }
    ],
    parametres: [
      { name: 'Général', icon: Building },
      { name: 'Utilisateurs', icon: Users },
      { name: 'Interface', icon: Palette },
      { name: 'Sécurité', icon: Lock },
      { name: 'Impressions', icon: Clipboard },
      { name: 'Sauvegarde', icon: RefreshCw },
      { name: 'Intégrations', icon: RefreshCw },
      { name: 'Métiers', icon: Briefcase },
      { name: 'Maintenance', icon: Wrench },
      { name: 'Alertes', icon: ChartBar },
      { name: 'Multi-sites', icon: Globe },
      { name: 'Avancé', icon: Settings }
    ],
    assistant: [
      { name: 'Diagnostic', icon: Search },
      { name: 'Prévisions', icon: TrendingUp },
      { name: 'Recommandations', icon: Target },
      { name: 'Automatisation', icon: Bot },
      { name: 'Chat IA', icon: MessageCircle },
      { name: 'Sentiment', icon: Eye },
      { name: 'Stocks IA', icon: Package },
      { name: 'Vision', icon: Eye },
      { name: 'Expert Pharma', icon: Pill },
      { name: 'Expert Comptable', icon: DollarSign },
      { name: 'Analytics Avancées', icon: ChartBar },
      { name: 'Intégrations', icon: RefreshCw },
      { name: 'Apprentissage', icon: GraduationCap },
      { name: 'Configuration', icon: Settings }
    ],
    chat: [
      { name: 'Messagerie Réseau', icon: MessageCircle },
      { name: 'Multi-Officines', icon: Building },
      { name: 'Canaux Réseau', icon: Folder },
      { name: 'Administration Centrale', icon: Shield },
      { name: 'Assistant IA Réseau', icon: Bot },
      { name: 'Intégrations Réseau', icon: RefreshCw },
      { name: 'Sécurité Réseau', icon: Lock },
      { name: 'Productivité Collaborative', icon: Zap },
      { name: 'Analytics Réseau', icon: ChartBar },
      { name: 'Pharma Tools Réseau', icon: Pill },
      { name: 'Multi-canaux Réseau', icon: Globe },
      { name: 'Personnalisation Réseau', icon: Palette },
      { name: 'Administration Réseau', icon: Settings }
    ]
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
                {expandedMenus.includes('administration') && (
                  <SidebarMenuSub>
                    {subMenus.administration.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('administration', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              {hasStockAccess && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className={activeModule === 'stock' ? 'bg-primary/10 text-primary' : ''} 
                    onClick={() => handleMenuClick('stock')}
                  >
                    <Package className="h-5 w-5 text-orange-600" />
                    <span>Stock</span>
                  </SidebarMenuButton>
                  {expandedMenus.includes('stock') && (
                    <SidebarMenuSub>
                      {subMenus.stock.map((item, index) => (
                        <SidebarMenuSubItem key={index}>
                          <SidebarMenuSubButton 
                            onClick={() => handleMenuClick('stock', item.name.toLowerCase().replace(' ', '-'))}
                            className={`cursor-pointer ${activeSubModule === item.name.toLowerCase().replace(' ', '-') ? 'bg-primary/10 text-primary' : ''}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'ventes' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('ventes')}
                >
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span>Ventes</span>
                </SidebarMenuButton>
                {expandedMenus.includes('ventes') && (
                  <SidebarMenuSub>
                    {subMenus.ventes.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('ventes', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'comptabilite' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('comptabilite')}
                >
                  <Calculator className="h-5 w-5 text-red-600" />
                  <span>Comptabilité</span>
                </SidebarMenuButton>
                {expandedMenus.includes('comptabilite') && (
                  <SidebarMenuSub>
                    {subMenus.comptabilite.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('comptabilite', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'rapports' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('rapports')}
                >
                  <BarChart className="h-5 w-5 text-indigo-600" />
                  <span>Rapports</span>
                </SidebarMenuButton>
                {expandedMenus.includes('rapports') && (
                  <SidebarMenuSub>
                    {subMenus.rapports.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('rapports', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'assistant' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('assistant')}
                >
                  <Bot className="h-5 w-5 text-cyan-600" />
                  <span>Assistant IA</span>
                </SidebarMenuButton>
                {expandedMenus.includes('assistant') && (
                  <SidebarMenuSub>
                    {subMenus.assistant.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('assistant', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'chat' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('chat')}
                >
                  <MessageCircle className="h-5 w-5 text-pink-600" />
                  <span>Chat-PharmaSoft</span>
                </SidebarMenuButton>
                {expandedMenus.includes('chat') && (
                  <SidebarMenuSub>
                    {subMenus.chat.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('chat', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Paramètres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={activeModule === 'parametres' ? 'bg-primary/10 text-primary' : ''} 
                  onClick={() => handleMenuClick('parametres')}
                >
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span>Paramètres</span>
                </SidebarMenuButton>
                {expandedMenus.includes('parametres') && (
                  <SidebarMenuSub>
                    {subMenus.parametres.map((item, index) => (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton 
                          onClick={() => handleMenuClick('parametres', item.name.toLowerCase())}
                          className={`cursor-pointer ${activeSubModule === item.name.toLowerCase() ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
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