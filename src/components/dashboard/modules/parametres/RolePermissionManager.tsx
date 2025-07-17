import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
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
  const { 
    data: rolePermissions = [], 
    isLoading: rolePermissionsLoading 
  } = useRolePermissionsByRole(selectedRoleId);

  const updateRolePermissions = useUpdateRolePermissions();

  // Sélectionner le premier rôle par défaut
  React.useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des données. Veuillez actualiser la page.
        </AlertDescription>
      </Alert>
    );
  }

  // État de chargement
  if (rolesLoading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuration des Rôles et Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuration des Rôles et Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un rôle et configurez ses permissions. Vous pouvez activer ou désactiver n'importe quelle permission pour chaque rôle.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bloc 1: Liste des rôles */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Rôles disponibles</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {(roles as Role[]).map((role) => (
                    <Card 
                      key={role.id}
                      className={`cursor-pointer transition-colors ${
                        selectedRoleId === role.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{role.nom_role}</span>
                            {role.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {role.description}
                              </p>
                            )}
                          </div>
                          {selectedRoleId === role.id && (
                            <Badge variant="secondary">Sélectionné</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Bloc 2: Permissions du rôle sélectionné */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Permissions pour : {selectedRole?.nom_role}
                </h3>
                <div className="flex gap-2">
                  {hasChanges && (
                    <Button variant="outline" onClick={handleCancel}>
                      Annuler
                    </Button>
                  )}
                  <Button 
                    onClick={handleSave}
                    disabled={!hasChanges || updateRolePermissions.isPending}
                  >
                    {updateRolePermissions.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </div>
              
              {rolePermissionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            {getCategoryDisplayName(category)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {categoryPermissions.map((permission) => (
                              <div 
                                key={permission.id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                              >
                                <div>
                                  <span className="text-sm font-medium">
                                    {permission.nom_permission}
                                  </span>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {permission.description}
                                    </p>
                                  )}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};