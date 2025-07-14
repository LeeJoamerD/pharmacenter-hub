import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Activity, Lock } from 'lucide-react';
import UserSettings from './UserSettings';
import { RolePermissionManager } from './RolePermissionManager';
import { SecurityDashboard } from '@/components/auth/SecurityDashboard';
import { CrossTenantSecurityManager } from '@/components/security/CrossTenantSecurityManager';
import { SecurityMonitoring } from '@/components/security/SecurityMonitoring';
import SecuritySurveillanceDashboard from '@/components/security/SecurityDashboard';
import SecurityNotificationManager from '@/components/security/SecurityNotificationManager';
import SecurityIncidentManager from '@/components/security/SecurityIncidentManager';
import SecurityAnalyticsDashboard from '@/components/security/SecurityAnalyticsDashboard';

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
        <TabsList className="grid w-full grid-cols-6">{/* Augmenté pour plus d'onglets */}
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles et Permissions
          </TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="surveillance">Surveillance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
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

        <TabsContent value="surveillance">
          <SecuritySurveillanceDashboard />
        </TabsContent>

        <TabsContent value="notifications">
          <SecurityNotificationManager />
        </TabsContent>

        <TabsContent value="incidents">
          <SecurityIncidentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettingsWithTabs;