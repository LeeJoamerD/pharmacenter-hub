import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building, Users, Palette, Lock, Printer, RefreshCw, Briefcase, Wrench, Globe, Bell, Network, Cog } from 'lucide-react';
import GeneralSettings from './parametres/GeneralSettings';
import UserSettingsWithTabs from './parametres/UserSettingsWithTabs';
import InterfaceSettings from './parametres/InterfaceSettings';
import SecuritySettings from './parametres/SecuritySettings';
import PrintSettings from './parametres/PrintSettings';
import BackupSettings from './parametres/BackupSettings';
import BusinessSettings from './parametres/BusinessSettings';
import MaintenanceSettings from './parametres/MaintenanceSettings';
import IntegrationsSettings from './parametres/IntegrationsSettings';
import AlertesSettings from './parametres/AlertesSettings';
import MultiSitesSettings from './parametres/MultiSitesSettings';
import AdvancedSettings from './parametres/AdvancedSettings';

interface ParametresModuleProps {
  activeSubModule: string;
}

const ParametresModule = ({ activeSubModule }: ParametresModuleProps) => {
  const getIcon = () => {
    switch (activeSubModule) {
      case 'général':
        return <Building className="h-5 w-5" />;
      case 'utilisateurs':
        return <Users className="h-5 w-5" />;
      case 'interface':
        return <Palette className="h-5 w-5" />;
      case 'sécurité':
        return <Lock className="h-5 w-5" />;
      case 'impressions':
        return <Printer className="h-5 w-5" />;
      case 'sauvegarde':
        return <RefreshCw className="h-5 w-5" />;
      case 'intégrations':
        return <Globe className="h-5 w-5" />;
      case 'métiers':
        return <Briefcase className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'alertes':
        return <Bell className="h-5 w-5" />;
      case 'multi-sites':
        return <Network className="h-5 w-5" />;
      case 'avancé':
        return <Cog className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (activeSubModule) {
      case 'général':
        return 'Paramètres Généraux';
      case 'utilisateurs':
        return 'Gestion des Utilisateurs';
      case 'interface':
        return 'Interface Utilisateur';
      case 'sécurité':
        return 'Sécurité';
      case 'impressions':
        return 'Configuration Impression';
      case 'sauvegarde':
        return 'Sauvegarde & Restauration';
      case 'intégrations':
        return 'Intégrations';
      case 'métiers':
        return 'Paramètres Métiers';
      case 'maintenance':
        return 'Maintenance Système';
      case 'alertes':
        return 'Configuration des Alertes';
      case 'multi-sites':
        return 'Multi-Sites';
      case 'avancé':
        return 'Paramètres Avancés';
      default:
        return 'Configuration Système';
    }
  };

  const renderContent = () => {
    switch (activeSubModule) {
      case 'général':
        return <GeneralSettings />;
      case 'utilisateurs':
        return <UserSettingsWithTabs />;
      case 'interface':
        return <InterfaceSettings />;
      case 'sécurité':
        return <SecuritySettings />;
      case 'impressions':
        return <PrintSettings />;
      case 'sauvegarde':
        return <BackupSettings />;
      case 'intégrations':
        return <IntegrationsSettings />;
      case 'métiers':
        return <BusinessSettings />;
      case 'maintenance':
        return <MaintenanceSettings />;
      case 'alertes':
        return <AlertesSettings />;
      case 'multi-sites':
        return <MultiSitesSettings />;
      case 'avancé':
        return <AdvancedSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametresModule;
