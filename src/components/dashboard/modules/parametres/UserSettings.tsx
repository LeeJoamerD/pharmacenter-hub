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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const { toast } = useToast();
  const { useTenantMutation, tenantId } = useTenantQuery();
  const queryClient = useQueryClient();
  
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

  // Debug du contexte
  console.log('Debug UserSettings:', {
    tenantId,
    personnelList,
    isLoading,
    error
  });

  // Helper function to parse and translate error messages
  const parseCreateUserError = (error: any): string => {
    const errorMessage = error?.message || error?.error || '';
    
    // Check for known error patterns
    if (errorMessage.includes('already been registered') || 
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate key')) {
      return t('emailAlreadyExists');
    }
    
    if (errorMessage.includes('Missing required fields')) {
      return t('missingRequiredFields');
    }
    
    if (errorMessage.includes('Password must be at least') ||
        errorMessage.includes('password')) {
      return t('passwordMinLength');
    }
    
    if (errorMessage.includes('validate email') ||
        errorMessage.includes('invalid email')) {
      return t('invalidEmailFormat');
    }
    
    if (errorMessage.includes('Failed to create personnel')) {
      return t('personnelCreationError');
    }
    
    // Fallback to generic error
    return t('genericCreationError');
  };

  // Mutations
  const createPersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelFormData) => {
      const { data: result, error } = await supabase.functions.invoke('create-user-with-personnel', {
        body: {
          email: data.email,
          password: data.password,
          noms: data.noms,
          prenoms: data.prenoms,
          role: data.role,
          telephone_appel: data.telephone_appel,
          tenant_id: tenantId
        }
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
      toast({ title: t('userCreatedSuccess') });
      setIsCreateDialogOpen(false);
      createForm.reset();
      await queryClient.refetchQueries({ queryKey: ['auth-user'] });
    },
    onError: (error: any) => {
      console.error('Erreur lors de la création:', error);
      const translatedMessage = parseCreateUserError(error);
      toast({
        title: t('createUserError'),
        description: translatedMessage,
        variant: 'destructive'
      });
    }
  });

  const updatePersonnelMutation = useTenantMutation('personnel', 'update', {
    invalidateQueries: ['personnel'],
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: [tenantId, 'personnel'] });
      toast({ title: t('userUpdatedSuccess') });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Update personnel error:', error);
      toast({
        title: t('updateUserError'),
        description: error.message || t('unableToSaveSettings'),
        variant: 'destructive'
      });
    }
  });

  const deletePersonnelMutation = useTenantMutation('personnel', 'delete', {
    invalidateQueries: ['personnel'],
    onSuccess: () => {
      toast({ title: t('userDeletedSuccess') });
    },
    onError: (error) => {
      toast({
        title: t('deleteUserError'),
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
      role: 'Vendeur',
      is_active: true
    }
  });

  const editForm = useForm<PersonnelFormData>();

  const onCreateSubmit = async (data: PersonnelFormData) => {
    if (!tenantId) {
      toast({
        title: t('configError'),
        description: t('tenantIdNotAvailable'),
        variant: 'destructive'
      });
      return;
    }

    if (!data.password || data.password.length < 8) {
      toast({
        title: t('invalidPassword'),
        description: t('passwordMinLength'),
        variant: 'destructive'
      });
      return;
    }
    
    createPersonnelMutation.mutate(data);
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
    if (confirm(`${t('confirmDeleteUser')} ${user.prenoms} ${user.noms} ?`)) {
      deletePersonnelMutation.mutate({ id: user.id });
    }
  };

  const handleSaveSettings = async () => {
    if (!tenantId) return;
    
    try {
      // Sauvegarder les paramètres dans la table parametres_systeme
      const settingsToSave = [
        {
          tenant_id: tenantId,
          cle_parametre: 'max_users',
          valeur_parametre: userSettings.maxUsers.toString(),
          categorie: 'general',
          type_parametre: 'number',
          description: 'Nombre maximum d\'utilisateurs autorisés'
        },
        {
          tenant_id: tenantId,
          cle_parametre: 'session_timeout',
          valeur_parametre: userSettings.sessionTimeout.toString(),
          categorie: 'security',
          type_parametre: 'number',
          description: 'Timeout de session en minutes'
        },
        {
          tenant_id: tenantId,
          cle_parametre: 'password_policy',
          valeur_parametre: userSettings.passwordPolicy,
          categorie: 'security',
          type_parametre: 'string',
          description: 'Politique de mot de passe'
        },
        {
          tenant_id: tenantId,
          cle_parametre: 'two_factor_auth',
          valeur_parametre: userSettings.twoFactorAuth.toString(),
          categorie: 'security',
          type_parametre: 'boolean',
          description: 'Authentification à deux facteurs'
        },
        {
          tenant_id: tenantId,
          cle_parametre: 'auto_logout',
          valeur_parametre: userSettings.autoLogout.toString(),
          categorie: 'security',
          type_parametre: 'boolean',
          description: 'Déconnexion automatique'
        },
        {
          tenant_id: tenantId,
          cle_parametre: 'login_attempts',
          valeur_parametre: userSettings.loginAttempts.toString(),
          categorie: 'security',
          type_parametre: 'number',
          description: 'Tentatives de connexion maximales'
        }
      ];

      // Utiliser upsert pour sauvegarder ou mettre à jour
      const { error } = await supabase
        .from('parametres_systeme')
        .upsert(settingsToSave, { 
          onConflict: 'tenant_id,cle_parametre',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: t('settingsSavedSuccess'),
        description: t('userConfigUpdated'),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: t('error'),
        description: t('unableToSaveSettings'),
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Pharmacien Titulaire': return 'bg-blue-100 text-blue-800';
      case 'Pharmacien Adjoint': return 'bg-indigo-100 text-indigo-800';
      case 'Préparateur':
      case 'Technicien': return 'bg-purple-100 text-purple-800';
      case 'Caissier':
      case 'Vendeur': return 'bg-green-100 text-green-800';
      case 'Gestionnaire de stock': return 'bg-orange-100 text-orange-800';
      case 'Comptable': return 'bg-cyan-100 text-cyan-800';
      case 'Secrétaire': return 'bg-pink-100 text-pink-800';
      case 'Stagiaire':
      case 'Invité': return 'bg-gray-100 text-gray-800';
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
              {t('securityPolicy')}
            </CardTitle>
            <CardDescription>
              {t('userSecurityConfig')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsers">{t('maxUsersLabel')}</Label>
              <Input
                id="maxUsers"
                type="number"
                value={userSettings.maxUsers}
                onChange={(e) => setUserSettings(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">{t('sessionTimeoutLabel')}</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={userSettings.sessionTimeout}
                onChange={(e) => setUserSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">{t('passwordPolicyLabel')}</Label>
              <Select 
                value={userSettings.passwordPolicy} 
                onValueChange={(value) => setUserSettings(prev => ({ ...prev, passwordPolicy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('passwordWeak')}</SelectItem>
                  <SelectItem value="medium">{t('passwordMedium')}</SelectItem>
                  <SelectItem value="high">{t('passwordStrong')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loginAttempts">{t('maxLoginAttemptsLabel')}</Label>
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
              {t('securityOptions')}
            </CardTitle>
            <CardDescription>
              {t('advancedSecurityConfig')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactor">{t('twoFactorAuth')}</Label>
              <Switch
                id="twoFactor"
                checked={userSettings.twoFactorAuth}
                onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoLogout">{t('autoLogout')}</Label>
              <Switch
                id="autoLogout"
                checked={userSettings.autoLogout}
                onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, autoLogout: checked }))}
              />
            </div>
            
            <div className="pt-4">
              <Button onClick={handleSaveSettings} className="w-full">
                {t('saveConfiguration')}
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
                  {t('userManagement')}
                </CardTitle>
                <CardDescription>
                  {t('userAccountsList')}
                </CardDescription>
              </div>
                {canCreateUsers && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('addUser')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('createUser')}</DialogTitle>
                      <DialogDescription>
                        {t('addTeamMember')}
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
                                <FormLabel>{t('namesLabel')}</FormLabel>
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
                                <FormLabel>{t('firstNamesLabel')}</FormLabel>
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
                              <FormLabel>{t('emailLabel')}</FormLabel>
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
                              <FormLabel>{t('passwordLabel')}</FormLabel>
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
                              <FormLabel>{t('role')}</FormLabel>
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
                                <FormLabel>{t('activeStatus')}</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={!tenantId}
                          >
                            {t('create')}
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
                <TableHead>{t('namesLabel')}</TableHead>
                <TableHead>{t('emailLabel')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('lastConnection')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {t('loadingUsers')}
                  </TableCell>
                </TableRow>
              ) : personnelList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {t('noUsersRegistered')}
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
                        {user.is_active ? t('activeStatus') : t('inactiveStatus')}
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


      {/* Dialog de modification d'utilisateur */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
            <DialogDescription>
              {t('updateTeamMember')} {selectedUser?.prenoms} {selectedUser?.noms}
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
                      <FormLabel>{t('namesLabel')}</FormLabel>
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
                      <FormLabel>{t('firstNamesLabel')}</FormLabel>
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
                    <FormLabel>{t('emailLabel')}</FormLabel>
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
                    <FormLabel>{t('role')}</FormLabel>
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
                    <FormLabel>{t('activeStatus')}</FormLabel>
                  </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updatePersonnelMutation.isPending}
                >
                  {updatePersonnelMutation.isPending ? t('savingInProgress') : t('modify')}
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