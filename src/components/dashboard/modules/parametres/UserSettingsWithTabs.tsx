import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Activity, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import UserSettings from './UserSettings';
import { RolePermissionManager } from './RolePermissionManager';
import { SecurityDashboard } from './SecurityDashboard';
import SecuritySurveillance from './SecuritySurveillance';
import SecurityNotifications from './SecurityNotifications';
import SecurityIncidents from './SecurityIncidents';
import SecuritySystemIntegration from '@/components/security/SecuritySystemIntegration';
import SecurityValidationTests from '@/components/security/SecurityValidationTests';
import TempLogin from '@/components/TempLogin';

const UserSettingsWithTabs = () => {
  const { user, loading } = useAuth();
  const { tenantId } = useTenant();
  const { t } = useLanguage();

  // Si pas d'utilisateur connecté, afficher le formulaire de connexion
  if (!loading && !user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('loginRequired')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('loginRequiredDesc')}
            </p>
          </CardHeader>
          <CardContent>
            <TempLogin />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si pas de tenant ID, afficher le chargement
  if (!tenantId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('loadingWorkspace')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('initializingWorkspace')}
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('userPermissionsManagement')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('userPermissionsDesc')}
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('usersTab')}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('rolesPermissionsTab')}
          </TabsTrigger>
          <TabsTrigger value="security">{t('securityTab')}</TabsTrigger>
          <TabsTrigger value="surveillance">{t('surveillanceTab')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('notificationsTab')}</TabsTrigger>
          <TabsTrigger value="incidents">{t('incidentsTab')}</TabsTrigger>
          <TabsTrigger value="integration">{t('integratedSystemTab')}</TabsTrigger>
          <TabsTrigger value="tests">{t('securityTestsTab')}</TabsTrigger>
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
                {t('sessionActivityMonitoring')}
              </CardTitle>
              <CardDescription>
                {t('monitorActiveSessionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surveillance">
          <SecuritySurveillance />
        </TabsContent>

        <TabsContent value="notifications">
          <SecurityNotifications />
        </TabsContent>

        <TabsContent value="incidents">
          <SecurityIncidents />
        </TabsContent>

        <TabsContent value="integration">
          <SecuritySystemIntegration />
        </TabsContent>

        <TabsContent value="tests">
          <SecurityValidationTests />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettingsWithTabs;