import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building, Users, Palette, Lock, Printer, RefreshCw, Briefcase, Wrench, Globe } from 'lucide-react';
import GeneralSettings from './parametres/GeneralSettings';
import UserSettingsWithTabs from './parametres/UserSettingsWithTabs';
import InterfaceSettings from './parametres/InterfaceSettings';
import SecuritySettings from './parametres/SecuritySettings';
import PrintSettings from './parametres/PrintSettings';
import BackupSettings from './parametres/BackupSettings';
import BusinessSettings from './parametres/BusinessSettings';
import MaintenanceSettings from './parametres/MaintenanceSettings';

const ParametresModule = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Général
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="interface" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Interface
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Sécurité
              </TabsTrigger>
              <TabsTrigger value="print" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Impression
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sauvegarde
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Métiers
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Maintenance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <GeneralSettings />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <UserSettingsWithTabs />
            </TabsContent>

            <TabsContent value="interface" className="mt-6">
              <InterfaceSettings />
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="print" className="mt-6">
              <PrintSettings />
            </TabsContent>

            <TabsContent value="backup" className="mt-6">
              <BackupSettings />
            </TabsContent>

            <TabsContent value="business" className="mt-6">
              <BusinessSettings />
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <MaintenanceSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametresModule;