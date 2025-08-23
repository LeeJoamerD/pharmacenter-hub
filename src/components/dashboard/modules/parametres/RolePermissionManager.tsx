import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Loader2, Users } from 'lucide-react';
import { 
  useRoles, 
  usePermissions, 
  useRolePermissionsByRole, 
  useUpdateRolePermissions,
  groupPermissionsByCategory,
  getCategoryDisplayName,
  type Role,
  type Permission
} from '@/hooks/useRolesPermissions';

export const RolePermissionManager: React.FC = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Charger les données depuis la base
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useRoles();
  const { data: permissions = [], isLoading: permissionsLoading, error: permissionsError } = usePermissions();

  // Debug
  console.log('Debug RolePermissionManager:', {
    roles,
    permissions,
    rolesLoading,
    permissionsLoading,
    rolesError,
    permissionsError
  });
  const { 
    data: rolePermissions = [], 
    isLoading: rolePermissionsLoading 
  } = useRolePermissionsByRole(selectedRoleId);

  const updateRolePermissions = useUpdateRolePermissions();

  // Sélectionner le premier rôle par défaut et refetch ses permissions
  React.useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Réinitialiser les changements locaux quand on change de rôle
  React.useEffect(() => {
    setHasChanges(false);
  }, [selectedRoleId]);

  // Grouper les permissions par catégorie
  const groupedPermissions = useMemo(() => {
    return groupPermissionsByCategory(permissions as Permission[]);
  }, [permissions]);

  // Obtenir les permissions actives pour le rôle sélectionné
  const activePermissionIds = useMemo(() => {
    return (rolePermissions as any[])
      .filter(rp => rp.accorde)
      .map(rp => rp.permission_id);
  }, [rolePermissions]);

  // État local pour les modifications en cours
  const [localPermissions, setLocalPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Synchroniser l'état local avec les données de la base
  React.useEffect(() => {
    setLocalPermissions(activePermissionIds);
    setHasChanges(false);
  }, [activePermissionIds]);

  // Gérer le changement d'une permission
  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    setLocalPermissions(prev => {
      const newPermissions = enabled
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId);
      
      setHasChanges(JSON.stringify(newPermissions.sort()) !== JSON.stringify(activePermissionIds.sort()));
      return newPermissions;
    });
  };

  // Sauvegarder les modifications
  const handleSave = () => {
    if (!selectedRoleId) return;
    
    updateRolePermissions.mutate({
      roleId: selectedRoleId,
      permissionIds: localPermissions
    });
    setHasChanges(false);
  };

  // Annuler les modifications
  const handleCancel = () => {
    setLocalPermissions(activePermissionIds);
    setHasChanges(false);
  };

  // Vérifier si une permission est activée
  const isPermissionEnabled = (permissionId: string) => {
    return localPermissions.includes(permissionId);
  };

  // Gestion des erreurs
  if (rolesError || permissionsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestion des Rôles et Permissions</h2>
            <p className="text-muted-foreground">
              Configurez les permissions pour chaque rôle de votre équipe
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des données. 
            {rolesError && ` Rôles: ${rolesError.message}`}
            {permissionsError && ` Permissions: ${permissionsError.message}`}
            {!roles?.length && !rolesError && " Aucun rôle n'est défini dans le système."}
            {!permissions?.length && !permissionsError && " Aucune permission n'est définie dans le système."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // État de chargement
  if (rolesLoading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestion des Rôles et Permissions</h2>
            <p className="text-muted-foreground">
              Configurez les permissions pour chaque rôle de votre équipe
            </p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Chargement des rôles...</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Chargement des permissions...</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier s'il y a des données à afficher
  if (!rolesLoading && !permissionsLoading && (!roles?.length || !permissions?.length)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestion des Rôles et Permissions</h2>
            <p className="text-muted-foreground">
              Configurez les permissions pour chaque rôle de votre équipe
            </p>
          </div>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {!roles?.length && "Aucun rôle disponible. "}
            {!permissions?.length && "Aucune permission disponible. "}
            Les données de rôles et permissions doivent être configurées par un administrateur système.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Rôles et Permissions</h2>
          <p className="text-muted-foreground">
            Configurez les permissions pour chaque rôle de votre équipe
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Liste des rôles */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rôles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roles?.length > 0 ? roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      selectedRoleId === role.id ? 'bg-primary/10 border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{role.nom_role}</h4>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                      <Badge variant={role.is_active ? 'default' : 'secondary'}>
                        {role.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </button>
                )) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun rôle disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions du rôle sélectionné */}
        <div className="col-span-8">
          {selectedRoleId ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions - {selectedRole?.nom_role}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={!hasChanges || updateRolePermissions.isPending}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges || updateRolePermissions.isPending}
                    >
                      {updateRolePermissions.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rolePermissionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid grid-cols-2 gap-4">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                            {getCategoryDisplayName(category)}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryPermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm">{permission.nom_permission}</h5>
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description || permission.code_permission}
                                  </p>
                                </div>
                                <Switch
                                  checked={isPermissionEnabled(permission.id)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(permission.id, checked)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez un rôle</h3>
                <p className="text-muted-foreground">
                  Choisissez un rôle dans la liste pour configurer ses permissions
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};