import React, { useState } from 'react';
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
import { UserPermissionSummary } from '@/hooks/useNetworkAdministration';

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

  if (!pharmacy) return null;

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

  // Mock data for demonstration - in real app this would come from API
  const users = [
    { id: '1', name: 'Jean Dupont', role: 'Admin', status: 'active', lastLogin: '2024-01-27 14:30' },
    { id: '2', name: 'Marie Martin', role: 'Pharmacien', status: 'active', lastLogin: '2024-01-27 12:15' },
    { id: '3', name: 'Paul Durand', role: 'Employé', status: 'inactive', lastLogin: '2024-01-25 09:45' }
  ];

  const permissions = {
    'read': 'Lecture des données',
    'write': 'Modification des données',
    'delete': 'Suppression des données',
    'admin': 'Administration système',
    'backup': 'Gestion des sauvegardes',
    'reports': 'Génération de rapports'
  };

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
                  <Button variant="outline" onClick={handleCancel} disabled={loading}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)} disabled={loading}>
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
                      <p className="text-2xl font-bold">{pharmacy.user_count}</p>
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
                      <p className="text-2xl font-bold">{pharmacy.admin_count}</p>
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
                        {new Date(pharmacy.last_access).toLocaleString('fr-FR')}
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
                  {pharmacy.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline">
                      {permissions[permission as keyof typeof permissions] || permission}
                    </Badge>
                  ))}
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
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
                            {user.lastLogin}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Gérer
                        </Button>
                      </div>
                    </div>
                  ))}
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(permissions).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="font-medium">{label}</Label>
                        <p className="text-sm text-muted-foreground">
                          Autoriser l'accès à {label.toLowerCase()}
                        </p>
                      </div>
                      <Switch 
                        checked={pharmacy.permissions.includes(key)}
                        disabled={!editMode}
                      />
                    </div>
                  ))}
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
                    <Switch disabled={!editMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Verrouillage auto</Label>
                    <Switch disabled={!editMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Logs détaillés</Label>
                    <Switch disabled={!editMode} />
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
                      disabled={!editMode}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Restriction géographique</Label>
                    <Switch disabled={!editMode} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};