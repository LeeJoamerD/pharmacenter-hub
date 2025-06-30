
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
  Archive, TrendingUp, PieChart, Brain, HelpCircle, Flask, Clock,
  Key, DollarSign, Activity, BarChart3, FileSpreadsheet, Cog } from 'lucide-react';

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
                        className={activeSubModule === 'gestion-personnel' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'gestion-personnel')}
                      >
                        <ListChecks className="h-4 w-4" />
                        <span>📋 Gestion du Personnel</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'gestion-personnel' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'employes' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'employes')}
                            >
                              <Users className="h-3 w-3" />
                              <span>Employés</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'plannings' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'plannings')}
                            >
                              <Clock className="h-3 w-3" />
                              <span>Plannings & Horaires</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'roles-permissions' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'roles-permissions')}
                            >
                              <Key className="h-3 w-3" />
                              <span>Rôles & Permissions</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'sessions-caisse' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'sessions-caisse')}
                            >
                              <DollarSign className="h-3 w-3" />
                              <span>Sessions de Caisse</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'journal-activite' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'journal-activite')}
                            >
                              <Activity className="h-3 w-3" />
                              <span>Journal d'Activité</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'gestion-partenaires' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'gestion-partenaires')}
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>🤝 Gestion des Partenaires</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'gestion-partenaires' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'assureurs' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'assureurs')}
                            >
                              <Shield className="h-3 w-3" />
                              <span>Assureurs</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'societes-conventionnees' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'societes-conventionnees')}
                            >
                              <Building2 className="h-3 w-3" />
                              <span>Sociétés Conventionnées</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'conventionnes' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'conventionnes')}
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Conventionnés</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'fournisseurs' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'fournisseurs')}
                            >
                              <Truck className="h-3 w-3" />
                              <span>Fournisseurs</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'laboratoires' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'laboratoires')}
                            >
                              <Flask className="h-3 w-3" />
                              <span>Laboratoires</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'gestion-produits' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'gestion-produits')}
                      >
                        <Package className="h-4 w-4" />
                        <span>📦 Gestion des Produits</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'gestion-produits' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'catalogue-produits' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'catalogue-produits')}
                            >
                              <Package className="h-3 w-3" />
                              <span>Catalogue Produits</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'familles-produits' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'familles-produits')}
                            >
                              <Archive className="h-3 w-3" />
                              <span>Familles de Produits</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'rayons' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'rayons')}
                            >
                              <ClipboardList className="h-3 w-3" />
                              <span>Rayons</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'categories-tarification' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'categories-tarification')}
                            >
                              <Receipt className="h-3 w-3" />
                              <span>Catégories de Tarification</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'tarification-prix' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'tarification-prix')}
                            >
                              <DollarSign className="h-3 w-3" />
                              <span>Tarification & Prix</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'gestion-clients' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'gestion-clients')}
                      >
                        <User className="h-4 w-4" />
                        <span>👥 Gestion des Clients</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'gestion-clients' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'clients-tous' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'clients-tous')}
                            >
                              <Users className="h-3 w-3" />
                              <span>Clients (tous types)</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'segments-clients' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'segments-clients')}
                            >
                              <BarChart3 className="h-3 w-3" />
                              <span>Segments Clients</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'limites-credit' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'limites-credit')}
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Limites de Crédit</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'parametres-systeme' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'parametres-systeme')}
                      >
                        <Cog className="h-4 w-4" />
                        <span>⚙️ Paramètres Système</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'parametres-systeme' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'parametres-generaux' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'parametres-generaux')}
                            >
                              <Settings className="h-3 w-3" />
                              <span>Paramètres Généraux</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'interface-affichage' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'interface-affichage')}
                            >
                              <LayoutDashboard className="h-3 w-3" />
                              <span>Interface & Affichage</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'alertes-notifications' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'alertes-notifications')}
                            >
                              <Bell className="h-3 w-3" />
                              <span>Alertes & Notifications</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'sauvegardes' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'sauvegardes')}
                            >
                              <Save className="h-3 w-3" />
                              <span>Sauvegardes</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'import-export' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'import-export')}
                            >
                              <Import className="h-3 w-3" />
                              <span>Import/Export</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'maintenance' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'maintenance')}
                            >
                              <Wrench className="h-3 w-3" />
                              <span>Maintenance</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'configuration-materiel' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'configuration-materiel')}
                      >
                        <Printer className="h-4 w-4" />
                        <span>🖨️ Configuration Matériel</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'configuration-materiel' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'imprimantes' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'imprimantes')}
                            >
                              <Printer className="h-3 w-3" />
                              <span>Imprimantes</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'caisses' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'caisses')}
                            >
                              <DollarSign className="h-3 w-3" />
                              <span>Caisses</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'configuration-financiere' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'configuration-financiere')}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>💰 Configuration Financière</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'configuration-financiere' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'taxes' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'taxes')}
                            >
                              <Receipt className="h-3 w-3" />
                              <span>Taxes</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'comptes-depenses' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'comptes-depenses')}
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Comptes de Dépenses</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'parametres-facturation' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'parametres-facturation')}
                            >
                              <FileText className="h-3 w-3" />
                              <span>Paramètres de Facturation</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        className={activeSubModule === 'rapports-audit' ? 'bg-primary/10 text-primary' : ''}
                        onClick={() => handleMenuClick('administration', 'rapports-audit')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>📊 Rapports & Audit</span>
                      </SidebarMenuSubButton>
                      {activeSubModule === 'rapports-audit' && (
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'journal-activite-audit' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'journal-activite-audit')}
                            >
                              <Activity className="h-3 w-3" />
                              <span>Journal d'Activité</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'statistiques-rh' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'statistiques-rh')}
                            >
                              <BarChart3 className="h-3 w-3" />
                              <span>Statistiques RH</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'performance-partenaires' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'performance-partenaires')}
                            >
                              <TrendingUp className="h-3 w-3" />
                              <span>Performance Partenaires</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              className={activeSubModule === 'audit-trail' ? 'bg-primary/10 text-primary' : ''}
                              onClick={() => handleMenuClick('administration', 'audit-trail')}
                            >
                              <FileSpreadsheet className="h-3 w-3" />
                              <span>Audit Trail</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      )}
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
