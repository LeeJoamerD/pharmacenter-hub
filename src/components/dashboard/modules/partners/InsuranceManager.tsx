import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

const assureurSchema = z.object({
  libelle_assureur: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional(),
  telephone_appel: z.string().optional(),
  telephone_whatsapp: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  niu: z.string().optional(),
});

type Assureur = z.infer<typeof assureurSchema> & { id?: string };

const InsuranceManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssureur, setEditingAssureur] = useState<Assureur | null>(null);
  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les assureurs
  const { data: assureurs = [], isLoading, refetch } = useTenantQueryWithCache(
    ['assureurs-v2'],
    'assureurs',
    '*',
    undefined,
    { orderBy: { column: 'libelle_assureur', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('assureurs', 'insert', {
    invalidateQueries: ['assureurs-v2'],
    onSuccess: () => {
      toast({ title: "Assureur ajouté avec succès" });
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const updateMutation = useTenantMutation('assureurs', 'update', {
    invalidateQueries: ['assureurs-v2'],
    onSuccess: () => {
      toast({ title: "Assureur modifié avec succès" });
      setIsDialogOpen(false);
      form.reset();
      setEditingAssureur(null);
    }
  });

  const deleteMutation = useTenantMutation('assureurs', 'delete', {
    invalidateQueries: ['assureurs-v2'],
    onSuccess: () => {
      toast({ title: "Assureur supprimé" });
    }
  });

  const defaultValues = useMemo(() => ({
    libelle_assureur: '',
    adresse: '',
    telephone_appel: '',
    telephone_whatsapp: '',
    email: '',
    niu: ''
  }), []);

  const form = useForm<Assureur>({
    resolver: zodResolver(assureurSchema),
    defaultValues,
    mode: 'onChange'
  });

  const filteredAssureurs = assureurs.filter((assureur: any) =>
    assureur.libelle_assureur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assureur.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = useCallback((data: Assureur) => {
    if (editingAssureur) {
      updateMutation.mutate({ ...data, id: editingAssureur.id });
    } else {
      createMutation.mutate(data);
    }
  }, [editingAssureur, updateMutation, createMutation]);

  const handleEdit = useCallback((assureur: Assureur) => {
    setEditingAssureur(assureur);
    form.reset(assureur);
    setIsDialogOpen(true);
  }, [form]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingAssureur(null);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const AssureurForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="libelle_assureur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'assureur *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: NSIA Assurances" 
                    {...field} 
                    autoFocus
                    tabIndex={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="niu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIU</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Numéro d'identification unique" 
                    {...field} 
                    tabIndex={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone_appel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="+242 06 123 45 67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone_whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="+242 06 123 45 67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@assureur.cg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <FormField
          control={form.control}
          name="adresse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Textarea placeholder="Adresse complète" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleDialogClose}
            tabIndex={10}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            tabIndex={11}
          >
            {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingAssureur ? 'Modifier' : 'Ajouter')}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion des Assureurs
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingAssureur(null);
                  form.reset(defaultValues);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Assureur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssureur ? 'Modifier l\'assureur' : 'Nouvel assureur'}
                  </DialogTitle>
                </DialogHeader>
                <AssureurForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un assureur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assureur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredAssureurs.map((assureur: any) => (
                <TableRow key={assureur.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assureur.libelle_assureur}</div>
                      {assureur.niu && (
                        <div className="text-sm text-muted-foreground">NIU: {assureur.niu}</div>
                      )}
                      {assureur.contact_principal && (
                        <div className="text-sm text-muted-foreground">Contact: {assureur.contact_principal}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {assureur.telephone_appel && <div>📞 {assureur.telephone_appel}</div>}
                      {assureur.telephone_whatsapp && <div className="text-green-600">💬 {assureur.telephone_whatsapp}</div>}
                      {assureur.email && <div>✉️ {assureur.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {assureur.ville || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assureur)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(assureur.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAssureurs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun assureur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceManager;