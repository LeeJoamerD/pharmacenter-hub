import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Activity, Lock } from 'lucide-react';
import UserSettings from './UserSettings';
import { RolePermissionManager } from './RolePermissionManager';
import { SecurityDashboard } from '@/components/auth/SecurityDashboard';
import { CrossTenantSecurityManager } from '@/components/security/CrossTenantSecurityManager';
import { SecurityMonitoring } from '@/components/security/SecurityMonitoring';

const UserSettingsWithTabs = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Utilisateurs et Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gérez les utilisateurs de votre pharmacie et configurez leurs permissions de manière dynamique.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles et Permissions
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sessions & Activité
          </TabsTrigger>
          <TabsTrigger value="cross-tenant" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Sécurité Inter-Pharmacie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserSettings />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <RolePermissionManager />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Surveillance des sessions et activité
              </CardTitle>
              <CardDescription>
                Surveillez les sessions actives et l'activité de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-tenant" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Monitoring de sécurité cross-tenant
                </CardTitle>
                <CardDescription>
                  Surveillez les violations et incidents de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityMonitoring />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configuration cross-tenant
                </CardTitle>
                <CardDescription>
                  Gérez les accès et permissions entre pharmacies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CrossTenantSecurityManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettingsWithTabs;