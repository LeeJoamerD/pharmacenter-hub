import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, UserCheck, Phone, MessageCircle, AtSign, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import type { Database } from '@/integrations/supabase/types';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

interface Assureur {
  id: string;
  libelle_assureur: string;
}

const conventionneSchema = z.object({
  noms: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  telephone_appel: z.string().optional(),
  telephone_whatsapp: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  limite_dette: z.number().min(0, "La limite de dette ne peut être négative").optional(),
  niu: z.string().optional(),
  taux_ticket_moderateur: z.number().min(0).max(100, "Le taux doit être entre 0 et 100").optional(),
  caution: z.number().min(0, "La caution ne peut être négative").optional(),
  taux_remise_automatique: z.number().min(0).max(100, "Le taux doit être entre 0 et 100").optional(),
  taux_couverture_agent: z.number().min(0).max(100, "Le taux doit être entre 0 et 100").optional(),
  taux_couverture_ayant_droit: z.number().min(0).max(100, "Le taux doit être entre 0 et 100").optional(),
  assureur_id: z.string().optional().or(z.literal('')),
  peut_prendre_bon: z.boolean().optional(),
});

type Conventionne = Database['public']['Tables']['conventionnes']['Row'];
type ConventionneInsert = z.infer<typeof conventionneSchema>;

const ConventionedManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConventionne, setEditingConventionne] = useState<Conventionne | null>(null);
  const { toast } = useToast();
  const { formatAmount, getCurrencySymbol, getInputStep, isNoDecimalCurrency } = useCurrencyFormatting();

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const { data: conventionnes = [], isLoading } = useTenantQueryWithCache(
    ['conventionnes'],
    'conventionnes',
    '*',
    undefined,
    { orderBy: { column: 'noms', ascending: true } }
  );

  // Récupération des assureurs
  const { data: assureurs = [] } = useTenantQueryWithCache(
    ['assureurs'],
    'assureurs',
    'id, libelle_assureur',
    {},
    { orderBy: { column: 'libelle_assureur', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('conventionnes', 'insert', {
    invalidateQueries: ['conventionnes'],
    onSuccess: () => {
      toast({ 
        title: "Conventionné ajouté avec succès",
        description: "Un compte client a été créé automatiquement pour ce conventionné."
      });
      handleDialogClose();
    }
  });

  const updateMutation = useTenantMutation('conventionnes', 'update', {
    invalidateQueries: ['conventionnes'],
    onSuccess: () => {
      toast({ 
        title: "Conventionné modifié avec succès",
        description: "Le compte client associé a été mis à jour automatiquement."
      });
      handleDialogClose();
    }
  });

  const deleteMutation = useTenantMutation('conventionnes', 'delete', {
    invalidateQueries: ['conventionnes'],
    onSuccess: () => {
      toast({ 
        title: "Conventionné supprimé",
        description: "Le compte client associé a été supprimé automatiquement."
      });
    }
  });

  const defaultValues = useMemo(() => ({
    noms: '',
    adresse: '',
    ville: '',
    telephone_appel: '',
    telephone_whatsapp: '',
    email: '',
    limite_dette: 0,
    niu: '',
    taux_ticket_moderateur: 0,
    caution: 0,
    taux_remise_automatique: 0,
    taux_couverture_agent: 0,
    taux_couverture_ayant_droit: 0,
    assureur_id: '',
    peut_prendre_bon: true
  }), []);

  const form = useForm<ConventionneInsert>({
    resolver: zodResolver(conventionneSchema),
    defaultValues,
    mode: 'onChange'
  });

  const filteredConventionnes = conventionnes.filter(conv =>
    conv.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = useCallback((data: ConventionneInsert) => {
    const submitData = {
      ...data,
      assureur_id: data.assureur_id || null,
      peut_prendre_bon: data.peut_prendre_bon !== false
    };
    if (editingConventionne) {
      updateMutation.mutate({ ...submitData, id: editingConventionne.id });
    } else {
      createMutation.mutate(submitData);
    }
  }, [editingConventionne, updateMutation, createMutation]);

  const handleEdit = useCallback((conventionne: Conventionne) => {
    setEditingConventionne(conventionne);
    form.reset({
      noms: conventionne.noms,
      adresse: conventionne.adresse || '',
      ville: conventionne.ville || '',
      telephone_appel: conventionne.telephone_appel || '',
      telephone_whatsapp: conventionne.telephone_whatsapp || '',
      email: conventionne.email || '',
      limite_dette: conventionne.limite_dette || 0,
      niu: conventionne.niu || '',
      taux_ticket_moderateur: conventionne.taux_ticket_moderateur || 0,
      caution: conventionne.caution || 0,
      taux_remise_automatique: conventionne.taux_remise_automatique || 0,
      taux_couverture_agent: (conventionne as any).taux_couverture_agent || 0,
      taux_couverture_ayant_droit: (conventionne as any).taux_couverture_ayant_droit || 0,
      assureur_id: (conventionne as any).assureur_id || '',
      peut_prendre_bon: (conventionne as any).peut_prendre_bon !== false
    });
    setIsDialogOpen(true);
  }, [form]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate({ id });
  }, [deleteMutation]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingConventionne(null);
    form.reset(defaultValues);
  }, [form, defaultValues]);

  // Form is rendered inline in DialogContent to prevent re-creation on each render

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Gestion des Conventionnés
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingConventionne(null);
                  form.reset(defaultValues);
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Conventionné
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConventionne ? 'Modifier le conventionné' : 'Nouveau conventionné'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingConventionne ? 'Modifiez les informations du conventionné ci-dessous.' : 'Remplissez les informations pour créer un nouveau conventionné.'}
                  </DialogDescription>
                </DialogHeader>
                
                {/* Formulaire inline pour éviter les problèmes de tabulation */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="noms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de l'établissement *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Hôpital Général de Brazzaville" 
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
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="contact@etablissement.cg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ville"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Brazzaville" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="limite_dette"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Limite de dette ({getCurrencySymbol()})</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step={getInputStep()}
                                placeholder={isNoDecimalCurrency() ? "0" : "0.00"} 
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="caution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Caution ({getCurrencySymbol()})</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step={getInputStep()}
                                placeholder={isNoDecimalCurrency() ? "0" : "0.00"} 
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taux_ticket_moderateur"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux ticket modérateur (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                min="0" 
                                max="100"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taux_remise_automatique"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux remise automatique (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                min="0" 
                                max="100"
                                {...field}
                                onChange={e => field.onChange(Number(e.target.value))}
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
                              placeholder="Adresse complète" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Bloc Infos Compte Client */}
                    <Card className="border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Infos Compte Client
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Ligne 1: Assureur + Taux de remise */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="assureur_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assureur (optionnel)</FormLabel>
                                <Select onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)} value={field.value || "__none__"}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Aucun assureur" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="__none__">Aucun assureur</SelectItem>
                                    {assureurs.map((assureur: Assureur) => (
                                      <SelectItem key={assureur.id} value={assureur.id}>
                                        {assureur.libelle_assureur}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="taux_remise_automatique"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taux de remise automatique (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    placeholder="0" 
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                                  />
                                </FormControl>
                                <FormDescription>Remise appliquée automatiquement au point de vente</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Ligne 2: Taux Agent + Taux Ayant Droit */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="taux_couverture_agent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taux Agent (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                                  />
                                </FormControl>
                                <FormDescription>Taux de prise en charge pour l'agent</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="taux_couverture_ayant_droit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taux Ayant Droit (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                                  />
                                </FormControl>
                                <FormDescription>Taux de prise en charge pour les ayants droit</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Ligne 3: Limite dette + Peut prendre bon */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="limite_dette"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Limite de dette ({getCurrencySymbol()})</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    step={getInputStep()} 
                                    placeholder={isNoDecimalCurrency() ? "0" : "0.00"} 
                                    {...field}
                                    value={field.value || 0}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                                  />
                                </FormControl>
                                <FormDescription>Montant maximum de crédit autorisé</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="peut_prendre_bon"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value !== false}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Peut prendre des produits en bon</FormLabel>
                                  <FormDescription>
                                    Autoriser les achats à crédit au point de vente
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

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
                        {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingConventionne ? 'Modifier' : 'Ajouter')}
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
                placeholder="Rechercher un conventionné..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Établissement</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Taux (%)</TableHead>
                <TableHead>Limite dette</TableHead>
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
                filteredConventionnes.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <UserCheck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{conv.noms}</div>
                          <div className="text-sm text-muted-foreground">
                            {conv.ville} {conv.niu && `• NIU: ${conv.niu}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {conv.telephone_appel && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {conv.telephone_appel}
                          </div>
                        )}
                        {conv.telephone_whatsapp && (
                          <div className="flex items-center gap-1 text-green-600">
                            <MessageCircle className="h-3 w-3" />
                            {conv.telephone_whatsapp}
                          </div>
                        )}
                        {conv.email && (
                          <div className="flex items-center gap-1">
                            <AtSign className="h-3 w-3" />
                            {conv.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>TM: {conv.taux_ticket_moderateur || 0}%</div>
                        <div>Remise: {conv.taux_remise_automatique || 0}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatAmount(conv.limite_dette || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(conv)}
                          disabled={updateMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(conv.id)}
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

          {filteredConventionnes.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun conventionné trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionedManager;