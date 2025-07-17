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
    
  );
};