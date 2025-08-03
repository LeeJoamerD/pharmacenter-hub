import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interface pour la structure des données d'une société
interface Societe {
  id: string;
  raison_sociale: string;
  nif: string;
  rccm: string;
  adresse: string;
  telephone: string;
  email: string;
  type_societe: 'Assureur' | 'Conventionné';
  created_at: string;
}

// Composant principal pour la gestion des sociétés
const Societes = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSociete, setEditingSociete] = useState<Societe | null>(null);

  // Hook de formulaire pour la validation et la gestion des champs
  const form = useForm<Partial<Societe>>({
    defaultValues: {
      raison_sociale: '',
      nif: '',
      rccm: '',
      adresse: '',
      telephone: '',
      email: '',
      type_societe: 'Assureur',
    },
  });

  // Récupération des données des sociétés depuis la base de données
  const { data: societes = [], isLoading, error } = useTenantQueryWithCache(
    ['societes'],
    'societes',
    '*',
    {},
    { orderBy: { column: 'raison_sociale', ascending: true } }
  );

  // Mutation pour créer une société
    const createSociete = useTenantMutation('societes', 'insert', {
        invalidateQueries: ['societes'],
    });

    // Mutation pour créer le client associé à la société
    const createClientForSociete = useTenantMutation('clients', 'insert', {
        invalidateQueries: ['clients'], // Invalider aussi les clients
    });


  // Mutation pour mettre à jour une société
  const updateSociete = useTenantMutation('societes', 'update', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
      toast({ title: "Succès", description: "Société modifiée avec succès." });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
        toast({ title: "Erreur", description: `Erreur: ${error.message}`, variant: "destructive" });
    }
  });

  // Mutation pour supprimer une société
  const deleteSociete = useTenantMutation('societes', 'delete', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
        toast({ title: "Succès", description: "Société supprimée avec succès." });
    },
    onError: (error: any) => {
        toast({ title: "Erreur", description: `Erreur: ${error.message}`, variant: "destructive" });
    }
  });

  // Filtrage des sociétés en fonction de la recherche
  const filteredSocietes = societes.filter(s =>
    s.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestion de la soumission du formulaire
  const onSubmit = (data: Partial<Societe>) => {
    const finalData = {
        raison_sociale: data.raison_sociale,
        nif: data.nif,
        rccm: data.rccm,
        adresse: data.adresse,
        telephone: data.telephone,
        email: data.email,
        type_societe: data.type_societe,
    };

    if (editingSociete) {
        // Mise à jour
        updateSociete.mutate({ id: editingSociete.id, ...finalData });
    } else {
        // Création
        createSociete.mutate(finalData, {
            onSuccess: async (createdSocieteData) => {
                if (createdSocieteData && createdSocieteData.length > 0) {
                    const newSociete = createdSocieteData[0];
                    const clientType = newSociete.type_societe === 'Assureur' ? 'Assuré' : 'Conventionné';

                    // Créer l'entrée correspondante dans la table 'clients'
                    await createClientForSociete.mutateAsync({
                        nom_complet: newSociete.raison_sociale,
                        telephone: newSociete.telephone,
                        type_client: clientType, // CORRECTION APPLIQUÉE ICI
                        societe_id: newSociete.id,
                        is_societe_client: true, // Marqueur pour identifier ce type de client
                    });
                }
                toast({ title: "Succès", description: "Société ajoutée avec succès." });
                setIsDialogOpen(false);
                form.reset();
            },
            onError: (error: any) => {
                toast({ title: "Erreur", description: `Erreur lors de la création: ${error.message}`, variant: "destructive" });
            },
        });
    }
  };


  // Fonctions pour gérer l'ouverture et la fermeture du dialogue
  const handleAddNew = () => {
    setEditingSociete(null);
    form.reset({
        raison_sociale: '',
        nif: '',
        rccm: '',
        adresse: '',
        telephone: '',
        email: '',
        type_societe: 'Assureur',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (societe: Societe) => {
    setEditingSociete(societe);
    form.reset(societe);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Gestion des Sociétés Partenaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par raison sociale..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une Société
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingSociete ? 'Modifier la Société' : 'Ajouter une nouvelle Société'}</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la société partenaire.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-4">
                    <FormField control={form.control} name="raison_sociale" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Raison Sociale *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="type_societe" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type de Société *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Assureur">Assureur</SelectItem>
                                    <SelectItem value="Conventionné">Conventionné</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="nif" render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIF</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rccm" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>RCCM</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="telephone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl><Input {...field} type="tel" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input {...field} type="email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="adresse" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Adresse</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <DialogFooter className="col-span-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                        <Button type="submit">{editingSociete ? 'Modifier' : 'Ajouter'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

            {isLoading ? (
                <div className="text-center">Chargement...</div>
            ) : error ? (
                <div className="text-center text-red-500">Erreur: {error.message}</div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Raison Sociale</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredSocietes.map(societe => (
                        <TableRow key={societe.id}>
                        <TableCell className="font-medium">{societe.raison_sociale}</TableCell>
                        <TableCell>{societe.type_societe}</TableCell>
                        <TableCell>{societe.telephone}</TableCell>
                        <TableCell>{societe.email}</TableCell>
                        <TableCell>
                            <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(societe)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => deleteSociete.mutate({ id: societe.id })}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            )}
            {filteredSocietes.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground mt-4">Aucune société trouvée.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Societes;