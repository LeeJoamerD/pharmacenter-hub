import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Shield, 
  Settings,
  UserCheck,
  UserX,
  Clock,
  Globe,
  Lock,
  Key,
  Mail,
  Phone,
  MapPin,
  Save,
  X
} from 'lucide-react';
import { UserPermissionSummary, useNetworkAdministration } from '@/hooks/useNetworkAdministration';
import { ManageUserDialog } from './ManageUserDialog';
import { useToast } from '@/hooks/use-toast';

interface UserPermissionDialogProps {
  pharmacy: UserPermissionSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (pharmacyId: string, data: Partial<UserPermissionSummary>) => void;
  loading?: boolean;
}

export const UserPermissionDialog: React.FC<UserPermissionDialogProps> = ({
  pharmacy,
  open,
  onOpenChange,
  onUpdate,
  loading = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(pharmacy || {});
  const { toast } = useToast();
  
  // Network administration functions
  const {
    getPharmacyOverview,
    getPharmacyUsers,
    updatePharmacyUser,
    getPharmacyPermissions,
    togglePharmacyPermission,
    getPharmacySecuritySettings,
    updatePharmacySecurity
  } = useNetworkAdministration();

  // State for real data
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState<any>({});
  const [dataLoading, setDataLoading] = useState(false);
  
  // Manage user dialog
  const [manageUserDialog, setManageUserDialog] = useState<{
    open: boolean;
    user: any | null;
  }>({ open: false, user: null });

  // Load data when pharmacy changes
  useEffect(() => {
    if (pharmacy?.id && open) {
      loadPharmacyData();
    }
  }, [pharmacy?.id, open]);

  const loadPharmacyData = async () => {
    if (!pharmacy?.id) return;
    
    try {
      setDataLoading(true);
      
      // Load all data in parallel
      const [overviewData, usersData, permissionsData, securityData] = await Promise.all([
        getPharmacyOverview(pharmacy.id),
        getPharmacyUsers(pharmacy.id),
        getPharmacyPermissions(pharmacy.id),
        getPharmacySecuritySettings(pharmacy.id)
      ]);
      
      setOverview(overviewData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
      
      // Load security settings from database or set defaults
      const defaultSettings = {
        force_2fa: false,
        auto_lock: false,
        detailed_logs: true,
        geo_restriction: false,
        authorized_ips: ''
      };
      
      // Safely parse security data
      const parsedSecurityData = securityData && typeof securityData === 'object' ? securityData as Record<string, any> : {};
      
      // Merge database settings with defaults
      const loadedSettings = {
        ...defaultSettings,
        ...parsedSecurityData,
        // Parse authorized_ips if it's a JSON string
        authorized_ips: parsedSecurityData.authorized_ips ? 
          (typeof parsedSecurityData.authorized_ips === 'string' ? 
            JSON.parse(parsedSecurityData.authorized_ips).join('\n') : 
            parsedSecurityData.authorized_ips) : 
          ''
      };
      
      setSecuritySettings(loadedSettings);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de l'officine.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleManageUser = (user: any) => {
    setManageUserDialog({ open: true, user });
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    if (!pharmacy?.id) return;
    
    try {
      await updatePharmacyUser(pharmacy.id, userId, userData);
      // Reload users
      const updatedUsers = await getPharmacyUsers(pharmacy.id);
      setUsers(Array.isArray(updatedUsers) ? updatedUsers : []);
      // Reload overview to update counts
      const updatedOverview = await getPharmacyOverview(pharmacy.id);
      setOverview(updatedOverview);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    }
  };

  const handleTogglePermission = async (permissionCode: string, enabled: boolean) => {
    if (!pharmacy?.id) return;
    
    try {
      await togglePharmacyPermission(pharmacy.id, permissionCode, enabled);
      // Reload permissions and overview
      const [updatedPermissions, updatedOverview] = await Promise.all([
        getPharmacyPermissions(pharmacy.id),
        getPharmacyOverview(pharmacy.id)
      ]);
      setPermissions(Array.isArray(updatedPermissions) ? updatedPermissions : []);
      setOverview(updatedOverview);
    } catch (error) {
      console.error('Erreur lors du changement de permission:', error);
    }
  };

  const handleSaveSecurity = async () => {
    if (!pharmacy?.id) return;
    
    try {
      // Parse authorized IPs
      const authorizedIps = securitySettings.authorized_ips
        .split('\n')
        .map((ip: string) => ip.trim())
        .filter((ip: string) => ip.length > 0);
      
      const settingsToSave = {
        force_2fa: securitySettings.force_2fa.toString(),
        auto_lock: securitySettings.auto_lock.toString(),
        detailed_logs: securitySettings.detailed_logs.toString(),
        geo_restriction: securitySettings.geo_restriction.toString(),
        authorized_ips: JSON.stringify(authorizedIps)
      };
      
      await updatePharmacySecurity(pharmacy.id, settingsToSave);
      
      // Reload security settings to get the updated values
      const updatedSecurityData = await getPharmacySecuritySettings(pharmacy.id);
      const defaultSettings = {
        force_2fa: false,
        auto_lock: false,
        detailed_logs: true,
        geo_restriction: false,
        authorized_ips: ''
      };
      
      // Safely parse updated security data
      const parsedUpdatedData = updatedSecurityData && typeof updatedSecurityData === 'object' ? updatedSecurityData as Record<string, any> : {};
      
      const refreshedSettings = {
        ...defaultSettings,
        ...parsedUpdatedData,
        authorized_ips: parsedUpdatedData.authorized_ips ? 
          (typeof parsedUpdatedData.authorized_ips === 'string' ? 
            JSON.parse(parsedUpdatedData.authorized_ips).join('\n') : 
            parsedUpdatedData.authorized_ips) : 
          ''
      };
      
      setSecuritySettings(refreshedSettings);
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de sécurité:', error);
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(pharmacy.id, formData);
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setFormData(pharmacy);
    setEditMode(false);
  };

  if (!pharmacy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <DialogTitle className="flex items-center gap-3">
                  {pharmacy.pharmacy_name}
                  <Badge variant={pharmacy.status === 'active' ? 'default' : 'secondary'}>
                    {pharmacy.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Gestion des utilisateurs et permissions de l'officine
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                   <Button variant="outline" onClick={handleCancel} disabled={loading || dataLoading}>
                     <X className="h-4 w-4 mr-2" />
                     Annuler
                   </Button>
                   <Button onClick={handleSave} disabled={loading || dataLoading}>
                     <Save className="h-4 w-4 mr-2" />
                     Sauvegarder
                   </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)} disabled={loading || dataLoading}>
                  <Settings className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{overview?.user_count || pharmacy.user_count}</p>
                      <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{overview?.admin_count || pharmacy.admin_count}</p>
                      <p className="text-sm text-muted-foreground">Administrateurs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Dernier accès</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(overview?.last_access || pharmacy.last_access).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Permissions Accordées</CardTitle>
                <CardDescription>
                  Droits d'accès accordés à cette officine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(overview?.permissions || pharmacy.permissions).map((permission: string, index: number) => {
                    const permissionObj = permissions.find((p: any) => p.code === permission);
                    return (
                      <Badge key={index} variant="outline">
                        {permissionObj?.name || permission}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Utilisateurs */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liste des Utilisateurs</CardTitle>
                <CardDescription>
                  Gestion des comptes utilisateurs de l'officine
                  {dataLoading && " (Chargement...)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{user.role}</Badge>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            {new Date(user.last_login).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageUser(user)}
                          disabled={dataLoading}
                        >
                          Gérer
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && !dataLoading && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun utilisateur trouvé
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des Permissions</CardTitle>
                <CardDescription>
                  Définir les droits d'accès pour cette officine
                  {dataLoading && " (Chargement...)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permissions.map((permission: any) => (
                    <div key={permission.code} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="font-medium">{permission.name}</Label>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                      <Switch 
                        checked={permission.enabled || false}
                        disabled={!editMode || dataLoading}
                        onCheckedChange={(checked) => handleTogglePermission(permission.code, checked)}
                      />
                    </div>
                  ))}
                  {permissions.length === 0 && !dataLoading && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune permission trouvée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="security" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Paramètres de Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>2FA obligatoire</Label>
                    <Switch 
                      checked={securitySettings.force_2fa || false}
                      disabled={!editMode || dataLoading}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({ ...securitySettings, force_2fa: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Verrouillage auto</Label>
                    <Switch 
                      checked={securitySettings.auto_lock || false}
                      disabled={!editMode || dataLoading}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({ ...securitySettings, auto_lock: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Logs détaillés</Label>
                    <Switch 
                      checked={securitySettings.detailed_logs || false}
                      disabled={!editMode || dataLoading}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({ ...securitySettings, detailed_logs: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Accès Réseau
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>IPs autorisées</Label>
                    <Textarea 
                      placeholder="192.168.1.1&#10;10.0.0.1"
                      className="mt-2"
                      value={securitySettings.authorized_ips || ''}
                      onChange={(e) => 
                        setSecuritySettings({ ...securitySettings, authorized_ips: e.target.value })
                      }
                      disabled={!editMode || dataLoading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Restriction géographique</Label>
                    <Switch 
                      checked={securitySettings.geo_restriction || false}
                      disabled={!editMode || dataLoading}
                      onCheckedChange={(checked) => 
                        setSecuritySettings({ ...securitySettings, geo_restriction: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {editMode && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={dataLoading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveSecurity}
                  disabled={dataLoading}
                >
                  Sauvegarder la sécurité
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Manage User Dialog */}
        <ManageUserDialog
          user={manageUserDialog.user}
          open={manageUserDialog.open}
          onOpenChange={(open) => setManageUserDialog({ open, user: null })}
          onSave={handleUpdateUser}
          loading={dataLoading}
        />
      </DialogContent>
    </Dialog>
  );
};