import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Users, Plus, Edit, Trash2, Shield, Key, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { usePersonnelQuery, useTenantQuery } from '@/hooks/useTenantQuery';
import { useHasPermission } from '@/hooks/usePermissions';
import { PERMISSIONS, ROLES } from '@/types/permissions';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

interface PersonnelFormData {
  noms: string;
  prenoms: string;
  email: string;
  password?: string;
  role: string;
  telephone_appel?: string;
  is_active: boolean;
}

const UserSettings = () => {
  const { toast } = useToast();
  const { useTenantMutation, tenantId } = useTenantQuery();
  
  const canCreateUsers = useHasPermission(PERMISSIONS.USERS_CREATE);
  const canEditUsers = useHasPermission(PERMISSIONS.USERS_EDIT);
  const canDeleteUsers = useHasPermission(PERMISSIONS.USERS_DELETE);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [userSettings, setUserSettings] = useState({
    maxUsers: 10,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    twoFactorAuth: false,
    autoLogout: true,
    loginAttempts: 3
  });

  // Charger la liste du personnel depuis la base de données
  const { data: personnelList, isLoading, error } = usePersonnelQuery();

  // Mutations
  const createPersonnelMutation = useTenantMutation('personnel', 'insert', {
    invalidateQueries: ['personnel'],
    onSuccess: () => {
      toast({ title: 'Utilisateur créé avec succès' });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      console.error('Erreur lors de la création:', error);
      toast({
        title: 'Erreur lors de la création',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updatePersonnelMutation = useTenantMutation('personnel', 'update', {
    invalidateQueries: ['personnel'],
    onSuccess: () => {
      toast({ title: 'Utilisateur modifié avec succès' });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: 'Erreur lors de la modification',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deletePersonnelMutation = useTenantMutation('personnel', 'delete', {
    invalidateQueries: ['personnel'],
    onSuccess: () => {
      toast({ title: 'Utilisateur supprimé avec succès' });
    },
    onError: (error) => {
      toast({
        title: 'Erreur lors de la suppression',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Formulaires
  const createForm = useForm<PersonnelFormData>({
    defaultValues: {
      noms: '',
      prenoms: '',
      email: '',
      password: '',
      role: 'Employé',
      is_active: true
    }
  });

  const editForm = useForm<PersonnelFormData>();

  const onCreateSubmit = async (data: PersonnelFormData) => {
    if (!tenantId) {
      toast({
        title: 'Erreur de configuration',
        description: 'Tenant ID non disponible. Veuillez vous reconnecter.',
        variant: 'destructive'
      });
      return;
    }
    
    // Générer la référence agent automatiquement
    const firstPrenom = data.prenoms.split(' ')[0];
    const firstThreeLettersNom = data.noms.substring(0, 3).toLowerCase();
    const reference_agent = `${firstPrenom}_${firstThreeLettersNom}`;
    
    const finalData = {
      ...data,
      reference_agent
    };
    
    createPersonnelMutation.mutate(finalData);
  };

  const onEditSubmit = async (data: PersonnelFormData) => {
    if (!selectedUser) return;
    updatePersonnelMutation.mutate({
      id: selectedUser.id,
      ...data
    });
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      noms: user.noms,
      prenoms: user.prenoms,
      email: user.email,
      role: user.role,
      telephone_appel: user.telephone_appel,
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (user: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.prenoms} ${user.noms} ?`)) {
      deletePersonnelMutation.mutate({ id: user.id });
    }
  };

  const handleSaveSettings = () => {
    toast({
      title: "Paramètres utilisateurs sauvegardés",
      description: "La configuration des utilisateurs a été mise à jour.",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrateur': return 'bg-red-100 text-red-800';
      case 'Pharmacien': return 'bg-blue-100 text-blue-800';
      case 'Vendeur': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Politique de Sécurité
            </CardTitle>
            <CardDescription>
              Configuration de la sécurité des comptes utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Nombre max d'utilisateurs</Label>
              <Input
                id="maxUsers"
                type="number"
                value={userSettings.maxUsers}
                onChange={(e) => setUserSettings(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout session (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={userSettings.sessionTimeout}
                onChange={(e) => setUserSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">Politique mot de passe</Label>
              <Select 
                value={userSettings.passwordPolicy} 
                onValueChange={(value) => setUserSettings(prev => ({ ...prev, passwordPolicy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible (6 caractères min)</SelectItem>
                  <SelectItem value="medium">Moyenne (8 caractères + chiffres)</SelectItem>
                  <SelectItem value="high">Forte (12 caractères + symboles)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loginAttempts">Tentatives de connexion max</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={userSettings.loginAttempts}
                onChange={(e) => setUserSettings(prev => ({ ...prev, loginAttempts: Number(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Options de Sécurité
            </CardTitle>
            <CardDescription>
              Configuration avancée de la sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactor">Authentification à 2 facteurs</Label>
              <Switch
                id="twoFactor"
                checked={userSettings.twoFactorAuth}
                onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoLogout">Déconnexion automatique</Label>
              <Switch
                id="autoLogout"
                checked={userSettings.autoLogout}
                onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, autoLogout: checked }))}
              />
            </div>
            
            <div className="pt-4">
              <Button onClick={handleSaveSettings} className="w-full">
                Sauvegarder la configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestion des Utilisateurs
                </CardTitle>
                <CardDescription>
                  Liste et gestion des comptes utilisateurs
                </CardDescription>
              </div>
              {canCreateUsers && tenantId && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvel utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Créer un Utilisateur</DialogTitle>
                      <DialogDescription>
                        Ajouter un nouveau membre à votre équipe
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="noms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom(s)</FormLabel>
                                <FormControl>
                                  <Input {...field} required />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="prenoms"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom(s)</FormLabel>
                                <FormControl>
                                  <Input {...field} required />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />


                        <FormField
                          control={createForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mot de passe</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" placeholder="Mot de passe temporaire" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rôle</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.values(ROLES).map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center space-x-2">
                          <FormField
                            control={createForm.control}
                            name="is_active"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>Utilisateur actif</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={!tenantId}
                          >
                            Créer
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
              {canCreateUsers && !tenantId && (
                <div className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  ⚠️ Chargement des données en cours... Le bouton "Nouvel utilisateur" sera disponible dans un moment.
                </div>
              )}
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Chargement des utilisateurs...
                  </TableCell>
                </TableRow>
              ) : personnelList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                personnelList?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.prenoms} {user.noms}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.is_active ? 'active' : 'inactive')}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.updated_at ? new Date(user.updated_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEditUsers && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteUsers && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section Gestion des Rôles et Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuration des Rôles et Permissions
          </CardTitle>
          <CardDescription>
            Configurez les permissions pour chaque rôle utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          
        </CardContent>
      </Card>

      {/* Dialog de modification d'utilisateur */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'Utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de {selectedUser?.prenoms} {selectedUser?.noms}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="noms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom(s)</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="prenoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom(s)</FormLabel>
                      <FormControl>
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ROLES).map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={editForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Utilisateur actif</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updatePersonnelMutation.isPending}
                >
                  {updatePersonnelMutation.isPending ? 'Modification...' : 'Modifier'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSettings;