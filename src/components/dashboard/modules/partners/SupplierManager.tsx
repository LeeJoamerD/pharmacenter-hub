import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Truck, Phone, MessageCircle, AtSign, Globe, User, Lock, Eye, EyeOff, Bot } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import type { Database } from '@/integrations/supabase/types';

const fournisseurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional(),
  telephone_appel: z.string().optional(),
  telephone_whatsapp: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  niu: z.string().optional(),
  url_fournisseur_import: z.string().url("URL invalide").optional().or(z.literal("")),
  id_fournisseur_import: z.string().optional(),
  mp_fournisseur_import: z.string().optional(),
});

type Fournisseur = Database['public']['Tables']['fournisseurs']['Row'];
type FournisseurInsert = z.infer<typeof fournisseurSchema>;

const SupplierManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const { data: fournisseurs = [], isLoading } = useTenantQueryWithCache(
    ['fournisseurs'],
    'fournisseurs',
    '*',
    undefined,
    { orderBy: { column: 'nom', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('fournisseurs', 'insert', {
    invalidateQueries: ['fournisseurs'],
    onSuccess: () => {
      toast({ title: "Fournisseur ajouté avec succès" });
      handleDialogClose();
    }
  });

  const updateMutation = useTenantMutation('fournisseurs', 'update', {
    invalidateQueries: ['fournisseurs'],
    onSuccess: () => {
      toast({ title: "Fournisseur modifié avec succès" });
      handleDialogClose();
    }
  });

  const deleteMutation = useTenantMutation('fournisseurs', 'delete', {
    invalidateQueries: ['fournisseurs'],
    onSuccess: () => {
      toast({ title: "Fournisseur supprimé" });
    }
  });

  const defaultValues = useMemo(() => ({
    nom: '',
    adresse: '',
    telephone_appel: '',
    telephone_whatsapp: '',
    email: '',
    niu: '',
    url_fournisseur_import: '',
    id_fournisseur_import: '',
    mp_fournisseur_import: '',
  }), []);

  const form = useForm<FournisseurInsert>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues,
    mode: 'onChange'
  });

  const filteredFournisseurs = fournisseurs.filter(fournisseur =>
    fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fournisseur.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = useCallback((data: FournisseurInsert) => {
    if (editingFournisseur) {
      updateMutation.mutate({ ...data, id: editingFournisseur.id });
    } else {
      createMutation.mutate(data);
    }
  }, [editingFournisseur, updateMutation, createMutation]);

  const handleEdit = useCallback((fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    form.reset({
      nom: fournisseur.nom,
      adresse: fournisseur.adresse || '',
      telephone_appel: fournisseur.telephone_appel || '',
      telephone_whatsapp: fournisseur.telephone_whatsapp || '',
      email: fournisseur.email || '',
      niu: fournisseur.niu || '',
      url_fournisseur_import: fournisseur.url_fournisseur_import || '',
      id_fournisseur_import: fournisseur.id_fournisseur_import || '',
      mp_fournisseur_import: fournisseur.mp_fournisseur_import || '',
    });
    setIsDialogOpen(true);
  }, [form]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingFournisseur(null);
    setShowPassword(false);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  // Check if supplier has Browse AI credentials configured
  const hasBrowseAIConfig = (fournisseur: Fournisseur) => {
    return Boolean(fournisseur.url_fournisseur_import && fournisseur.id_fournisseur_import);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Gestion des Fournisseurs
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingFournisseur(null);
                  form.reset(defaultValues);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingFournisseur ? 'Modifiez les informations du fournisseur ci-dessous.' : 'Remplissez les informations pour créer un nouveau fournisseur.'}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du fournisseur *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: COPHAL - Comptoir Pharmaceutique" 
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
                        name="niu"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NIU</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Numéro d'identification unique" 
                                {...field} 
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
                        name="telephone_whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp</FormLabel>
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
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="contact@fournisseur.cg" 
                                {...field} 
                              />
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
                            <Textarea 
                              placeholder="Adresse complète du fournisseur" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Section Browse AI Import Configuration */}
                    <div className="pt-4">
                      <Separator className="mb-4" />
                      <div className="flex items-center gap-2 mb-4">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Configuration Import Browse AI</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ces informations permettent au robot Browse AI de se connecter au portail du fournisseur pour récupérer automatiquement les factures.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="url_fournisseur_import"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                URL du portail fournisseur
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="url"
                                  placeholder="https://portail.fournisseur.com/login" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="id_fournisseur_import"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Identifiant de connexion
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Votre identifiant" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="mp_fournisseur_import"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Lock className="h-4 w-4" />
                                  Mot de passe
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Votre mot de passe" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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
                        {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingFournisseur ? 'Modifier' : 'Ajouter')}
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
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Import</TableHead>
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
              ) : (
                filteredFournisseurs.map((fournisseur) => (
                  <TableRow key={fournisseur.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{fournisseur.nom}</div>
                          {fournisseur.niu && (
                            <div className="text-sm text-muted-foreground">NIU: {fournisseur.niu}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {fournisseur.telephone_appel && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {fournisseur.telephone_appel}
                          </div>
                        )}
                        {fournisseur.telephone_whatsapp && (
                          <div className="flex items-center gap-1 text-green-600">
                            <MessageCircle className="h-3 w-3" />
                            {fournisseur.telephone_whatsapp}
                          </div>
                        )}
                        {fournisseur.email && (
                          <div className="flex items-center gap-1">
                            <AtSign className="h-3 w-3" />
                            {fournisseur.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {fournisseur.adresse || 'Non renseignée'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasBrowseAIConfig(fournisseur) ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Bot className="h-3 w-3" />
                          Configuré
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fournisseur)}
                          disabled={updateMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(fournisseur.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredFournisseurs.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun fournisseur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierManager;
