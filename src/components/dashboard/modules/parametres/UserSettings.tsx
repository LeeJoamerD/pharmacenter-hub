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
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminAPI, SettingsAPI } from '@/lib/api';
import { Personnel, CreatePersonnelRequest, RolePermission } from '@/types/api';

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Personnel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false); // Nouvel état pour la modale d'édition
  const [currentUser, setCurrentUser] = useState<Personnel | null>(null); // Utilisateur en cours d'édition
  const [newUser, setNewUser] = useState({
    noms: '',
    prenoms: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [editUser, setEditUser] = useState({ // Nouvel état pour les données de l'utilisateur à éditer
    id: 0,
    noms: '',
    prenoms: '',
    email: '',
    role: '',
    is_active: true,
    date_recrutement: '',
  });
  const [rolesPermissions, setRolesPermissions] = useState<RolePermission[]>([
    {
      id: 1,
      role_name: 'Administrateur',
      permissions: {
        full_access: true,
        manage_users: true,
        configure_system: true
      }
    },
    {
      id: 2,
      role_name: 'Pharmacien',
      permissions: {
        manage_meds: true,
        validate_prescriptions: true,
        access_reports: true
      }
    },
    {
      id: 3,
      role_name: 'Vendeur',
      permissions: {
        sales_cash: true,
        manage_clients: true,
        view_stock: true
      }
    },
    {
      id: 4,
      role_name: 'Comptable',
      permissions: {
        manage_finance: true,
        accounting_reports: true,
        manage_invoices: true
      }
    },
    {
      id: 5,
      role_name: 'Gestionnaire de stock',
      permissions: {
        manage_stock: true,
        receive_orders: true,
        inventory_adjustments: true
      }
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
    loadRolesPermissions();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminAPI.getPersonnel();
      if (response.success) {
        setUsers(response.data);
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Impossible de charger les utilisateurs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRolesPermissions = async () => {
    try {
      const response = await SettingsAPI.getRolesPermissions();
      if (response.success) {
        setRolesPermissions(response.data);
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Impossible de charger les permissions des rôles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des permissions des rôles:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les permissions des rôles",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.noms.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: Personnel) => {
    setCurrentUser(user);
    setEditUser({
      id: user.id,
      noms: user.noms,
      prenoms: user.prenoms,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      date_recrutement: user.date_recrutement || '',
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser.noms || !editUser.prenoms || !editUser.email || !editUser.role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await AdminAPI.updatePersonnel(editUser.id, {
        noms: editUser.noms,
        prenoms: editUser.prenoms,
        email: editUser.email,
        role: editUser.role,
        is_active: editUser.is_active,
        // Ne pas envoyer le mot de passe ici, car il est géré séparément
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès.",
        });
        setIsEditUserOpen(false);
        loadUsers(); // Recharger la liste des utilisateurs
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Échec de la mise à jour de l'utilisateur.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    if (!newUser.noms || !newUser.prenoms || !newUser.email || !newUser.role || !newUser.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await AdminAPI.createPersonnel({
        noms: newUser.noms,
        prenoms: newUser.prenoms,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur ajouté avec succès.",
        });
        setIsAddUserOpen(false);
        setNewUser({
          noms: '',
          prenoms: '',
          email: '',
          role: '',
          password: '',
          confirmPassword: ''
        });
        loadUsers(); // Recharger la liste des utilisateurs
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Échec de l'ajout de l'utilisateur.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'utilisateur.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user: Personnel) => {
    try {
      setSaving(true);
      const response = await AdminAPI.updatePersonnel(user.id, {
        is_active: !user.is_active,
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: `Statut de l'utilisateur ${user.noms} ${user.prenoms} mis à jour.`,
        });
        loadUsers();
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Échec de la mise à jour du statut.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }
    try {
      setSaving(true);
      const response = await AdminAPI.deletePersonnel(id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès.",
        });
        loadUsers(); // Recharger la liste des utilisateurs
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Échec de la suppression de l'utilisateur.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'utilisateur.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = (roleId: number, permissionKey: string, checked: boolean) => {
    setRolesPermissions(prevPermissions => 
      prevPermissions.map(role => 
        role.id === roleId 
          ? { ...role, permissions: { ...role.permissions, [permissionKey]: checked } }
          : role
      )
    );
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      for (const role of rolesPermissions) {
        await SettingsAPI.updateRolePermissions(role.id, {
          permissions: role.permissions,
          user_id: 1 // TODO: Récupérer l'ID de l'utilisateur connecté
        });
      }
      toast({
        title: "Succès",
        description: "Permissions des rôles mises à jour avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des permissions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions des rôles.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper function to format permission names for display
  const formatPermissionName = (name: string) => {
    switch (name) {
      case 'full_access': return 'Accès complet au système';
      case 'manage_users': return 'Gestion des utilisateurs';
      case 'configure_system': return 'Configuration système';
      case 'manage_meds': return 'Gestion des médicaments';
      case 'validate_prescriptions': return 'Validation des ordonnances';
      case 'access_reports': return 'Accès aux rapports';
      case 'sales_cash': return 'Ventes et encaissements';
      case 'manage_clients': return 'Gestion des clients';
      case 'view_stock': return 'Consultation du stock';
      case 'manage_finance': return 'Gestion financière';
      case 'accounting_reports': return 'Rapports comptables';
      case 'manage_invoices': return 'Gestion des factures';
      case 'manage_stock': return 'Gestion du stock';
      case 'receive_orders': return 'Réception des commandes';
      case 'inventory_adjustments': return 'Ajustements d\'inventaire';
      default: return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Créez un compte pour un nouvel utilisateur du système.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="noms" className="text-right">
                  Nom(s)
                </Label>
                <Input
                  id="noms"
                  value={newUser.noms}
                  onChange={(e) => setNewUser({...newUser, noms: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prenoms" className="text-right">
                  Prénom(s)
                </Label>
                <Input
                  id="prenoms"
                  value={newUser.prenoms}
                  onChange={(e) => setNewUser({...newUser, prenoms: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rôle
                </Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger id="role" className="col-span-3">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrateur">Administrateur</SelectItem>
                    <SelectItem value="Pharmacien">Pharmacien</SelectItem>
                    <SelectItem value="Vendeur">Vendeur</SelectItem>
                    <SelectItem value="Comptable">Comptable</SelectItem>
                    <SelectItem value="Gestionnaire de stock">Gestionnaire de stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  Confirmer
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleAddUser} disabled={saving}>
                {saving ? 'Ajout en cours...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom complet</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de recrutement</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Chargement des utilisateurs...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Aucun utilisateur trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.noms} {user.prenoms}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="mr-1 h-3 w-3" /> Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <X className="mr-1 h-3 w-3" /> Inactif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.date_recrutement ? new Date(user.date_recrutement).toLocaleDateString('fr-FR') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleUserStatus(user)} 
                      disabled={saving}
                      title={user.is_active ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
                    >
                      {user.is_active ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditUser(user)} // Ajout du gestionnaire d'événements
                      disabled={saving}
                      title="Modifier l'utilisateur"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteUser(user.id)} 
                      disabled={saving}
                      title="Supprimer l'utilisateur"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Gestion des rôles et permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rolesPermissions.map(role => (
            <div key={role.id} className="border rounded-md p-4">
              <h4 className="font-medium mb-2">{role.role_name}</h4>
              <div className="space-y-2">
                {Object.entries(role.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{formatPermissionName(key)}</span>
                    <Switch 
                      checked={value as boolean} 
                      onCheckedChange={(checked) => handlePermissionChange(role.id, key, checked)} 
                      disabled={role.role_name === 'Administrateur' && ['full_access', 'manage_users', 'configure_system'].includes(key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          className="mr-2" 
          variant="outline"
          onClick={loadRolesPermissions}
          disabled={saving}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSavePermissions}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>

      {/* Modale d'édition d'utilisateur */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-noms" className="text-right">
                Nom(s)
              </Label>
              <Input
                id="edit-noms"
                value={editUser.noms}
                onChange={(e) => setEditUser({...editUser, noms: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prenoms" className="text-right">
                Prénom(s)
              </Label>
              <Input
                id="edit-prenoms"
                value={editUser.prenoms}
                onChange={(e) => setEditUser({...editUser, prenoms: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Rôle
              </Label>
              <Select 
                value={editUser.role} 
                onValueChange={(value) => setEditUser({...editUser, role: value})}
              >
                <SelectTrigger id="edit-role" className="col-span-3">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrateur">Administrateur</SelectItem>
                  <SelectItem value="Pharmacien">Pharmacien</SelectItem>
                  <SelectItem value="Vendeur">Vendeur</SelectItem>
                  <SelectItem value="Comptable">Comptable</SelectItem>
                  <SelectItem value="Gestionnaire de stock">Gestionnaire de stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Statut Actif
              </Label>
              <Switch
                id="edit-status"
                checked={editUser.is_active}
                onCheckedChange={(checked) => setEditUser({...editUser, is_active: checked})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
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