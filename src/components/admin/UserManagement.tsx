import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { usePermissions, useHasPermission } from '@/hooks/usePermissions';
import { usePersonnelQuery, useTenantQuery } from '@/hooks/useTenantQuery';
import { useTenant } from '@/contexts/TenantContext';
import { ROLES, PERMISSIONS } from '@/types/permissions';
import { UserPlus, Edit, Trash2, Key, Shield, Users } from 'lucide-react';

interface PersonnelFormData {
  noms: string;
  prenoms: string;
  email: string;
  reference_agent: string;
  fonction?: string;
  role: string;
  telephone_appel?: string;
  telephone_whatsapp?: string;
  adresse?: string;
  is_active: boolean;
}

const UserManagement = () => {
  const { toast } = useToast();
  const { canManage } = usePermissions();
  const { currentTenant } = useTenant();
  const { useTenantMutation } = useTenantQuery();
  
  const canCreateUsers = useHasPermission(PERMISSIONS.USERS_CREATE);
  const canEditUsers = useHasPermission(PERMISSIONS.USERS_EDIT);
  const canDeleteUsers = useHasPermission(PERMISSIONS.USERS_DELETE);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Charger la liste du personnel
  const { data: personnel, isLoading, error } = usePersonnelQuery();

  // Mutations
  const createPersonnelMutation = useTenantMutation('personnel', 'insert', {
    invalidateQueries: ['personnel'],
    onSuccess: () => {
      toast({ title: 'Utilisateur créé avec succès' });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
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
      reference_agent: '',
      role: 'Employé',
      is_active: true
    }
  });

  const editForm = useForm<PersonnelFormData>();

  const onCreateSubmit = async (data: PersonnelFormData) => {
    if (!canManage(data.role)) {
      toast({
        title: 'Accès refusé',
        description: 'Vous ne pouvez pas créer un utilisateur avec ce rôle',
        variant: 'destructive'
      });
      return;
    }

    createPersonnelMutation.mutate(data);
  };

  const onEditSubmit = async (data: PersonnelFormData) => {
    if (!selectedUser) return;

    if (!canManage(data.role)) {
      toast({
        title: 'Accès refusé',
        description: 'Vous ne pouvez pas assigner ce rôle',
        variant: 'destructive'
      });
      return;
    }

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
      reference_agent: user.reference_agent,
      fonction: user.fonction,
      role: user.role,
      telephone_appel: user.telephone_appel,
      telephone_whatsapp: user.telephone_whatsapp,
      adresse: user.adresse,
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (user: any) => {
    if (!canManage(user.role)) {
      toast({
        title: 'Accès refusé',
        description: 'Vous ne pouvez pas supprimer cet utilisateur',
        variant: 'destructive'
      });
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.prenoms} ${user.noms} ?`)) {
      deletePersonnelMutation.mutate({ id: user.id });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin': return 'destructive';
      case 'Pharmacien': return 'default';
      case 'Préparateur': return 'secondary';
      default: return 'outline';
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des utilisateurs: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs de {currentTenant?.name}
          </p>
        </div>
        {canCreateUsers && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Nouvel Utilisateur
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
                    name="reference_agent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référence Agent</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="REF001" required />
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
                            {Object.values(ROLES)
                              .filter(role => canManage(role.id))
                              .map((role) => (
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

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createPersonnelMutation.isPending}
                    >
                      {createPersonnelMutation.isPending ? 'Création...' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            Rôles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Liste des Utilisateurs</CardTitle>
              <CardDescription>
                {personnel?.length || 0} utilisateur(s) dans votre pharmacie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : personnel?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    personnel?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.prenoms} {user.noms}
                            </div>
                            {user.fonction && (
                              <div className="text-sm text-muted-foreground">
                                {user.fonction}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.reference_agent}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {canEditUsers && canManage(user.role) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteUsers && canManage(user.role) && (
                              <Button
                                variant="ghost"
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
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4">
            {Object.values(ROLES).map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Niveau {role.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Permissions :</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {role.permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
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
                name="reference_agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence Agent</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="REF001" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="fonction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonction</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="telephone_appel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (Appel)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="telephone_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (WhatsApp)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ROLES)
                          .filter(role => canManage(role.id))
                          .map((role) => (
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

              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Actif</FormLabel>
                      <FormDescription>
                        Définir si l'utilisateur est actif ou non
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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

export default UserManagement;
