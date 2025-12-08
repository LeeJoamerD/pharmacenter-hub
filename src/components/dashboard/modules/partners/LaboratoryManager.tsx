import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, FlaskConical, Globe, Phone, MessageCircle, AtSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

const laboratoireSchema = z.object({
  libelle: z.string().min(1, "Le nom est requis"),
  pays_siege: z.string().optional(),
  email_siege: z.string().email("Email invalide").optional().or(z.literal("")),
  email_delegation_local: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone_appel_delegation_local: z.string().optional(),
  telephone_whatsapp_delegation_local: z.string().optional(),
});

type Laboratoire = z.infer<typeof laboratoireSchema> & { id?: string };

const LaboratoryManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLaboratoire, setEditingLaboratoire] = useState<Laboratoire | null>(null);
  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les laboratoires
  const { data: laboratoires = [], isLoading, refetch } = useTenantQueryWithCache(
    ['laboratoires-v2'],
    'laboratoires',
    '*',
    undefined,
    { orderBy: { column: 'libelle', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('laboratoires', 'insert', {
    invalidateQueries: ['laboratoires-v2'],
    onSuccess: () => {
      toast({ title: "Laboratoire ajouté avec succès" });
      handleDialogClose();
    }
  });

  const updateMutation = useTenantMutation('laboratoires', 'update', {
    invalidateQueries: ['laboratoires-v2'],
    onSuccess: () => {
      toast({ title: "Laboratoire modifié avec succès" });
      handleDialogClose();
    }
  });

  const deleteMutation = useTenantMutation('laboratoires', 'delete', {
    invalidateQueries: ['laboratoires-v2'],
    onSuccess: () => {
      toast({ title: "Laboratoire supprimé" });
    }
  });

  const defaultValues = useMemo(() => ({
    libelle: '',
    pays_siege: '',
    email_siege: '',
    email_delegation_local: '',
    telephone_appel_delegation_local: '',
    telephone_whatsapp_delegation_local: ''
  }), []);

  const form = useForm<Laboratoire>({
    resolver: zodResolver(laboratoireSchema),
    defaultValues,
    mode: 'onChange'
  });

  const filteredLaboratoires = laboratoires.filter((labo: any) =>
    labo.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labo.pays_siege?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labo.email_siege?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = useCallback((data: any) => {
    if (editingLaboratoire) {
      updateMutation.mutate({ ...data, id: editingLaboratoire.id });
    } else {
      createMutation.mutate(data);
    }
  }, [editingLaboratoire, updateMutation, createMutation]);

  const handleEdit = useCallback((laboratoire: Laboratoire) => {
    setEditingLaboratoire(laboratoire);
    form.reset(laboratoire);
    setIsDialogOpen(true);
  }, [form]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingLaboratoire(null);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Gestion des Laboratoires Pharmaceutiques
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingLaboratoire(null);
                  form.reset(defaultValues);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Laboratoire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLaboratoire ? 'Modifier le laboratoire' : 'Nouveau laboratoire'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLaboratoire ? 'Modifiez les informations du laboratoire ci-dessous.' : 'Remplissez les informations pour créer un nouveau laboratoire.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="libelle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du laboratoire *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Laboratoires Roche" 
                                {...field} 
                                autoFocus
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pays_siege"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays du siège</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="France" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email_siege"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email du siège</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="contact@laboratoire.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email_delegation_local"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email délégation locale</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="delegation@laboratoire.cg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telephone_appel_delegation_local"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Téléphone délégation</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+242 06 123 45 67" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telephone_whatsapp_delegation_local"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp délégation</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+242 06 123 45 67" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleDialogClose}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingLaboratoire ? 'Modifier' : 'Ajouter')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un laboratoire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratoire</TableHead>
                <TableHead>Contacts siège social</TableHead>
                <TableHead>Contacts délégation locale</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredLaboratoires.map((labo: any) => (
                <TableRow key={labo.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-blue-500" />
                        {labo.libelle}
                      </div>
                      {labo.pays_siege && (
                        <div className="text-sm text-muted-foreground">Siège: {labo.pays_siege}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {labo.email_siege && (
                        <div className="flex items-center gap-1">
                          <AtSign className="h-3 w-3" />
                          {labo.email_siege}
                        </div>
                      )}
                      {labo.pays_siege && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {labo.pays_siege}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {labo.telephone_appel_delegation_local && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {labo.telephone_appel_delegation_local}
                        </div>
                      )}
                      {labo.telephone_whatsapp_delegation_local && (
                        <div className="flex items-center gap-1 text-green-600">
                          <MessageCircle className="h-3 w-3" />
                          {labo.telephone_whatsapp_delegation_local}
                        </div>
                      )}
                      {labo.email_delegation_local && (
                        <div className="flex items-center gap-1">
                          <AtSign className="h-3 w-3" />
                          {labo.email_delegation_local}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {labo.created_at ? new Date(labo.created_at).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(labo)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(labo.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLaboratoires.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun laboratoire trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LaboratoryManager;