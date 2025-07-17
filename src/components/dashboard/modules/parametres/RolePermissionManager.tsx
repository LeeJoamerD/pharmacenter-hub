import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

export const RolePermissionManager: React.FC = () => {
  const { toast } = useToast();
  
  // État pour la gestion des rôles et permissions
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});

  // Liste complète des rôles disponibles
  const availableRoles = [
    { id: 'Admin', name: 'Administrateur' },
    { id: 'Pharmacien', name: 'Pharmacien' },
    { id: 'Vendeur', name: 'Vendeur' },
    { id: 'Caissier', name: 'Caissier' },
    { id: 'Gestionnaire de stock', name: 'Gestionnaire de Stock' },
    { id: 'Comptable', name: 'Comptable' },
    { id: 'Employé', name: 'Employé' },
    { id: 'Partenaire', name: 'Partenaire' }
  ];

  // Liste complète des permissions organisées par catégorie
  const allPermissions = {
    'Gestion Générale': [
      { id: 'system_admin', name: 'Accès complet au système' },
      { id: 'system_config', name: 'Configuration système' },
      { id: 'users_manage', name: 'Gestion des utilisateurs' },
      { id: 'reports_access', name: 'Accès aux rapports' },
      { id: 'reports_accounting', name: 'Rapports comptables' },
    ],
    'Gestion Stock': [
      { id: 'stock_view', name: 'Consultation du stock' },
      { id: 'stock_manage', name: 'Gestion du stock' },
      { id: 'inventory_adjust', name: 'Ajustements d\'inventaire' },
      { id: 'orders_receive', name: 'Réception des commandes' },
      { id: 'medicines_manage', name: 'Gestion des médicaments' },
    ],
    'Gestion Ventes': [
      { id: 'sales_cashier', name: 'Ventes et encaissements' },
      { id: 'prescriptions_validate', name: 'Validation des ordonnances' },
      { id: 'clients_manage', name: 'Gestion des clients' },
      { id: 'promotions_manage', name: 'Gestion des promotions' },
      { id: 'returns_manage', name: 'Gestion des retours' },
    ],
    'Gestion Financière': [
      { id: 'finance_manage', name: 'Gestion financière' },
      { id: 'invoices_manage', name: 'Gestion des factures' },
      { id: 'payments_manage', name: 'Gestion des paiements' },
      { id: 'cash_manage', name: 'Gestion de caisse' },
      { id: 'expenses_manage', name: 'Gestion des dépenses' },
    ],
    'Gestion Partenaires': [
      { id: 'suppliers_manage', name: 'Gestion des fournisseurs' },
      { id: 'partners_manage', name: 'Gestion des partenaires' },
      { id: 'insurance_manage', name: 'Gestion des assurances' },
      { id: 'laboratories_manage', name: 'Gestion des laboratoires' },
    ]
  };

  // Regrouper toutes les permissions pour l'affichage
  const groupedPermissions = allPermissions;

  // Initialiser les permissions par défaut pour chaque rôle
  React.useEffect(() => {
    const defaultPermissions: Record<string, string[]> = {
      'Admin': Object.values(allPermissions).flat().map(p => p.id),
      'Pharmacien': [
        'reports_access', 'stock_view', 'stock_manage', 'inventory_adjust',
        'orders_receive', 'medicines_manage', 'sales_cashier', 'prescriptions_validate',
        'clients_manage', 'suppliers_manage'
      ],
      'Vendeur': [
        'stock_view', 'medicines_manage', 'sales_cashier', 'clients_manage'
      ],
      'Caissier': [
        'stock_view', 'sales_cashier', 'cash_manage', 'payments_manage'
      ],
      'Gestionnaire de stock': [
        'stock_view', 'stock_manage', 'inventory_adjust', 'orders_receive',
        'medicines_manage', 'suppliers_manage'
      ],
      'Comptable': [
        'reports_access', 'reports_accounting', 'finance_manage', 'invoices_manage',
        'payments_manage', 'expenses_manage'
      ],
      'Employé': [
        'stock_view'
      ],
      'Partenaire': [
        'stock_view', 'reports_access'
      ]
    };
    setRolePermissions(defaultPermissions);
  }, []);

  // Vérifier si une permission est activée pour un rôle
  const isPermissionEnabled = (roleId: string, permissionId: string): boolean => {
    return rolePermissions[roleId]?.includes(permissionId) || false;
  };

  // Gérer le changement de permission
  const handlePermissionChange = (roleId: string, permissionId: string, enabled: boolean) => {
    setRolePermissions(prev => {
      const currentPermissions = prev[roleId] || [];
      if (enabled) {
        return {
          ...prev,
          [roleId]: [...currentPermissions, permissionId]
        };
      } else {
        return {
          ...prev,
          [roleId]: currentPermissions.filter(p => p !== permissionId)
        };
      }
    });
  };

  // Sauvegarder les permissions d'un rôle
  const handleSaveRolePermissions = () => {
    const selectedRoleName = availableRoles.find(r => r.id === selectedRole)?.name;
    toast({
      title: "Permissions sauvegardées",
      description: `Les permissions pour ${selectedRoleName} ont été mises à jour.`,
    });
  };

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
                  {availableRoles.map((role) => (
                    <Card 
                      key={role.id}
                      className={`cursor-pointer transition-colors ${
                        selectedRole === role.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{role.name}</span>
                          {selectedRole === role.id && (
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
                  Permissions pour : {availableRoles.find(r => r.id === selectedRole)?.name}
                </h3>
                <Button onClick={handleSaveRolePermissions}>
                  Sauvegarder
                </Button>
              </div>
              
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {permissions.map((permission) => (
                            <div 
                              key={permission.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                            >
                              <span className="text-sm font-medium">
                                {permission.name}
                              </span>
                              <Switch
                                checked={isPermissionEnabled(selectedRole, permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(selectedRole, permission.id, checked)
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};