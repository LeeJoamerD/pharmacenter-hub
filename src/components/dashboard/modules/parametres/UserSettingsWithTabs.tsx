import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Settings } from 'lucide-react';
import UserSettings from './UserSettings';
import { RolePermissionManager } from './RolePermissionManager';

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles et Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserSettings />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <RolePermissionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettingsWithTabs;