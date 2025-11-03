import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Users, 
  Building,
  Clock,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantSecurityConfig {
  id: string;
  tenant_id: string;
  allow_cross_tenant_read: boolean;
  allowed_source_tenants: string[];
  security_level: 'strict' | 'moderate' | 'permissive';
  auto_block_violations: boolean;
  max_violations_per_hour: number;
  notification_webhook: string | null;
}

interface CrossTenantPermission {
  id: string;
  source_tenant_id: string;
  target_tenant_id: string;
  permission_type: 'read' | 'write' | 'admin';
  table_name: string;
  expires_at: string | null;
  is_active: boolean;
  granted_by: string;
  granted_to: string | null;
  created_at: string;
}

interface Pharmacy {
  id: string;
  name: string;
  code: string;
}

export const CrossTenantSecurityManager: React.FC = () => {
  const { pharmacy, personnel } = useAuth();
  const [config, setConfig] = useState<TenantSecurityConfig | null>(null);
  const [permissions, setPermissions] = useState<CrossTenantPermission[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPermission, setShowAddPermission] = useState(false);

  const [newPermission, setNewPermission] = useState({
    target_tenant_id: '',
    permission_type: 'read' as const,
    table_name: '',
    expires_at: '',
    granted_to: ''
  });

  useEffect(() => {
    if (pharmacy?.id) {
      loadSecurityData();
    }
  }, [pharmacy?.id]);

  const loadSecurityData = async () => {
    if (!pharmacy?.id) return;

    try {
      setLoading(true);

      // Charger la configuration de sécurité
      const { data: configData } = await supabase
        .from('tenant_security_config')
        .select('*')
        .eq('tenant_id', pharmacy.id)
        .single();

      if (configData) {
        setConfig(configData as TenantSecurityConfig);
      }

      // Charger les permissions cross-tenant
      const { data: permissionsData } = await supabase
        .from('cross_tenant_permissions')
        .select('*')
        .or(`source_tenant_id.eq.${pharmacy.id},target_tenant_id.eq.${pharmacy.id}`)
        .order('created_at', { ascending: false });

      if (permissionsData) {
        setPermissions(permissionsData.map(p => ({
          ...p,
          table_name: (p as any).resource_type || '',
          granted_to: (p as any).granted_by || null
        })) as CrossTenantPermission[]);
      }

      // Charger la liste des pharmacies
      const { data: pharmaciesData } = await supabase
        .from('pharmacies')
        .select('id, name, code')
        .neq('id', pharmacy.id)
        .eq('status', 'active')
        .order('name');

      if (pharmaciesData) {
        setPharmacies(pharmaciesData);
      }

    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  const updateSecurityConfig = async (updates: Partial<TenantSecurityConfig>) => {
    if (!config || !pharmacy?.id) return;

    try {
      const { error } = await supabase
        .from('tenant_security_config')
        .update(updates)
        .eq('tenant_id', pharmacy.id);

      if (error) throw error;

      setConfig({ ...config, ...updates });
      toast.success('Configuration de sécurité mise à jour');
    } catch (error) {
      console.error('Error updating security config:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const addCrossTenantPermission = async () => {
    if (!pharmacy?.id || !personnel?.id) return;

    try {
      const permissionData = {
        source_tenant_id: pharmacy.id,
        target_tenant_id: newPermission.target_tenant_id,
        permission_type: newPermission.permission_type,
        resource_type: newPermission.table_name,
        resource_id: newPermission.target_tenant_id,
        granted_by: personnel.id,
        expires_at: newPermission.expires_at || null,
        tenant_id: pharmacy.id
      };

      const { error } = await supabase
        .from('cross_tenant_permissions')
        .insert(permissionData);

      if (error) throw error;

      toast.success('Permission cross-tenant ajoutée');
      setShowAddPermission(false);
      setNewPermission({
        target_tenant_id: '',
        permission_type: 'read',
        table_name: '',
        expires_at: '',
        granted_to: ''
      });
      loadSecurityData();
    } catch (error) {
      console.error('Error adding permission:', error);
      toast.error('Erreur lors de l\'ajout de la permission');
    }
  };

  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('cross_tenant_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) throw error;

      toast.success('Permission révoquée');
      loadSecurityData();
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast.error('Erreur lors de la révocation');
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'strict': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'permissive': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityLevelDescription = (level: string) => {
    switch (level) {
      case 'strict': return 'Aucun accès cross-tenant autorisé sauf permissions explicites';
      case 'moderate': return 'Accès cross-tenant limité avec validation renforcée';
      case 'permissive': return 'Accès cross-tenant autorisé avec audit complet';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <Card>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration de sécurité du tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuration de sécurité - {pharmacy?.name}
          </CardTitle>
          <CardDescription>
            Configurez les paramètres de sécurité cross-tenant pour votre pharmacie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {config && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Niveau de sécurité</Label>
                  <Select
                    value={config.security_level}
                    onValueChange={(value: any) => updateSecurityConfig({ security_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="moderate">Modéré</SelectItem>
                      <SelectItem value="permissive">Permissif</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getSecurityLevelDescription(config.security_level)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Violations max par heure</Label>
                  <Input
                    type="number"
                    value={config.max_violations_per_hour}
                    onChange={(e) => updateSecurityConfig({ 
                      max_violations_per_hour: parseInt(e.target.value) 
                    })}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autoriser la lecture cross-tenant</Label>
                    <p className="text-sm text-muted-foreground">
                      Permet aux autres pharmacies de lire certaines données
                    </p>
                  </div>
                  <Switch
                    checked={config.allow_cross_tenant_read}
                    onCheckedChange={(checked) => updateSecurityConfig({ 
                      allow_cross_tenant_read: checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Blocage automatique des violations</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloque automatiquement les utilisateurs suspects
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_block_violations}
                    onCheckedChange={(checked) => updateSecurityConfig({ 
                      auto_block_violations: checked 
                    })}
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Niveau de sécurité actuel :</span>
                    <Badge className={getSecurityLevelColor(config.security_level)}>
                      {config.security_level.toUpperCase()}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gestion des permissions cross-tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Permissions cross-tenant
          </CardTitle>
          <CardDescription>
            Gérez les accès entre pharmacies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {permissions.length} permission(s) configurée(s)
            </p>
            <Button onClick={() => setShowAddPermission(!showAddPermission)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une permission
            </Button>
          </div>

          {showAddPermission && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pharmacie cible</Label>
                    <Select
                      value={newPermission.target_tenant_id}
                      onValueChange={(value) => setNewPermission(prev => ({ 
                        ...prev, target_tenant_id: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une pharmacie" />
                      </SelectTrigger>
                      <SelectContent>
                        {pharmacies.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de permission</Label>
                    <Select
                      value={newPermission.permission_type}
                      onValueChange={(value: any) => setNewPermission(prev => ({ 
                        ...prev, permission_type: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Lecture</SelectItem>
                        <SelectItem value="write">Écriture</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Table/Ressource</Label>
                    <Input
                      placeholder="produits, ventes, etc."
                      value={newPermission.table_name}
                      onChange={(e) => setNewPermission(prev => ({ 
                        ...prev, table_name: e.target.value 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration (optionnel)</Label>
                    <Input
                      type="datetime-local"
                      value={newPermission.expires_at}
                      onChange={(e) => setNewPermission(prev => ({ 
                        ...prev, expires_at: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addCrossTenantPermission}>
                    Ajouter
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddPermission(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {permissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune permission cross-tenant configurée
              </p>
            ) : (
              permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">
                        {permission.source_tenant_id === pharmacy?.id ? 'Vers' : 'De'} une autre pharmacie
                      </span>
                      <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                        {permission.permission_type}
                      </Badge>
                      {!permission.is_active && (
                        <Badge variant="destructive">Révoquée</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Table: {permission.table_name}
                      {permission.expires_at && (
                        <>
                          {' • '}
                          <Clock className="h-3 w-3 inline mr-1" />
                          Expire: {new Date(permission.expires_at).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                  {permission.is_active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokePermission(permission.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};