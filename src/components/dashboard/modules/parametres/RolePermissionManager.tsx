import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Shield, Users, Settings, Package, DollarSign, FileText, Building2, Network } from 'lucide-react';

interface Permission {
  id: string;
  code_permission: string;
  nom_permission: string;
  description: string;
  categorie: string;
}

interface Role {
  id: string;
  nom_role: string;
  description: string;
  niveau_hierarchique: number;
}

interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  accorde: boolean;
}

const categoryIcons = {
  users: Users,
  pharmacy: Building2,
  sales: DollarSign,
  stock: Package,
  accounting: FileText,
  reports: FileText,
  settings: Settings,
  network: Network,
};

const categoryLabels = {
  users: 'Utilisateurs',
  pharmacy: 'Pharmacie',
  sales: 'Ventes',
  stock: 'Stock',
  accounting: 'Comptabilité',
  reports: 'Rapports',
  settings: 'Paramètres',
  network: 'Réseau',
};

export const RolePermissionManager: React.FC = () => {
  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Queries pour récupérer les données
  const { data: roles = [], isLoading: rolesLoading } = useTenantQueryWithCache(
    ['roles'],
    'roles',
    '*',
    {},
    { orderBy: { column: 'niveau_hierarchique', ascending: true } }
  );

  const { data: permissions = [], isLoading: permissionsLoading } = useTenantQueryWithCache(
    ['permissions'],
    'permissions',
    '*',
    {},
    { orderBy: { column: 'categorie', ascending: true } }
  );

  const { data: rolePermissions = [], isLoading: rolePermissionsLoading, refetch: refetchRolePermissions } = useTenantQueryWithCache(
    ['role-permissions'],
    'roles_permissions',
    '*'
  );

  // Mutation pour mettre à jour les permissions
  const updatePermissionMutation = useTenantMutation(
    'roles_permissions',
    'update',
    {
      onSuccess: () => {
        toast({
          title: "Permission mise à jour",
          description: "La permission a été mise à jour avec succès.",
        });
        refetchRolePermissions();
      },
      onError: (error) => {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la permission.",
          variant: "destructive",
        });
      },
    }
  );

  // Grouper les permissions par catégorie
  const permissionsByCategory = (permissions as Permission[]).reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    if (!acc[permission.categorie]) {
      acc[permission.categorie] = [];
    }
    acc[permission.categorie].push(permission);
    return acc;
  }, {});

  // Vérifier si une permission est accordée pour un rôle
  const isPermissionGranted = (roleId: string, permissionId: string): boolean => {
    const rolePermission = rolePermissions.find(
      (rp: RolePermission) => rp.role_id === roleId && rp.permission_id === permissionId
    );
    return rolePermission?.accorde || false;
  };

  // Basculer une permission pour un rôle
  const togglePermission = async (roleId: string, permissionId: string, currentValue: boolean) => {
    const rolePermission = rolePermissions.find(
      (rp: RolePermission) => rp.role_id === roleId && rp.permission_id === permissionId
    );

    if (rolePermission) {
      await updatePermissionMutation.mutateAsync({
        id: rolePermission.id,
        accorde: !currentValue,
      });
    }
  };

  const selectedRoleData = roles.find((role: Role) => role.id === selectedRole);

  if (rolesLoading || permissionsLoading || rolePermissionsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des rôles et permissions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Rôles et Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configurez les permissions pour chaque rôle de votre pharmacie. 
            Vous pouvez activer ou désactiver n'importe quelle permission pour chaque rôle.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des rôles */}
        <Card>
          <CardHeader>
            <CardTitle>Rôles disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {roles.map((role: Role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRole === role.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="font-medium">{role.nom_role}</div>
                    <div className="text-xs opacity-70">{role.description}</div>
                    <Badge variant="outline" className="mt-1">
                      Niveau {role.niveau_hierarchique}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Configuration des permissions */}
        <div className="lg:col-span-2">
          {selectedRoleData ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Permissions pour : {selectedRoleData.nom_role}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedRoleData.description}
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                      const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                      
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-3">
                            <IconComponent className="h-4 w-4" />
                            <h3 className="font-semibold">
                              {categoryLabels[category as keyof typeof categoryLabels] || category}
                            </h3>
                          </div>
                          
                          <div className="space-y-3 ml-6">
                            {categoryPermissions.map((permission: Permission) => {
                              const isGranted = isPermissionGranted(selectedRole, permission.id);
                              
                              return (
                                <div key={permission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="font-medium">{permission.nom_permission}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {permission.description}
                                    </div>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {permission.code_permission}
                                    </Badge>
                                  </div>
                                  <Switch
                                    checked={isGranted}
                                    onCheckedChange={() => togglePermission(selectedRole, permission.id, isGranted)}
                                    disabled={updatePermissionMutation.isPending}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          
                          <Separator className="my-4" />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Sélectionnez un rôle</h3>
                  <p className="text-muted-foreground">
                    Choisissez un rôle dans la liste pour configurer ses permissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};