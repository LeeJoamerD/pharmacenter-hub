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
  libelle_societe: string;
  adresse: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  email: string;
  limite_dette: number;
  niu: string;
  assureur_id: string;
  taux_couverture_agent: number;
  taux_couverture_ayant_droit: number;
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
      libelle_societe: '',
      niu: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      limite_dette: 0,
      taux_couverture_agent: 0,
      taux_couverture_ayant_droit: 0,
    },
  });

  // Récupération des données des sociétés depuis la base de données
  const { data: societes = [], isLoading, error } = useTenantQueryWithCache(
    ['societes'],
    'societes',
    '*',
    {},
    { orderBy: { column: 'libelle_societe', ascending: true } }
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
    s.libelle_societe?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestion de la soumission du formulaire
  const onSubmit = (data: Partial<Societe>) => {
    const finalData = {
        libelle_societe: data.libelle_societe,
        niu: data.niu,
        adresse: data.adresse,
        telephone_appel: data.telephone_appel,
        telephone_whatsapp: data.telephone_whatsapp,
        email: data.email,
        limite_dette: data.limite_dette || 0,
        taux_couverture_agent: data.taux_couverture_agent || 0,
        taux_couverture_ayant_droit: data.taux_couverture_ayant_droit || 0,
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

                    // Créer l'entrée correspondante dans la table 'clients'
                    await createClientForSociete.mutateAsync({
                        nom_complet: newSociete.libelle_societe,
                        telephone: newSociete.telephone_appel,
                        adresse: newSociete.adresse,
                        type_client: 'Société',
                        societe_id: newSociete.id,
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
        libelle_societe: '',
        niu: '',
        adresse: '',
        telephone_appel: '',
        telephone_whatsapp: '',
        email: '',
        limite_dette: 0,
        taux_couverture_agent: 0,
        taux_couverture_ayant_droit: 0,
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
                placeholder="Rechercher par nom de société..."
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
                    <FormField control={form.control} name="libelle_societe" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nom de la société *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="niu" render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIU</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="telephone_appel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone principal *</FormLabel>
                        <FormControl><Input {...field} type="tel" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="telephone_whatsapp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone WhatsApp</FormLabel>
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
                    <FormField control={form.control} name="limite_dette" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de dette</FormLabel>
                        <FormControl><Input {...field} type="number" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="taux_couverture_agent" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux couverture agent (%)</FormLabel>
                        <FormControl><Input {...field} type="number" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="taux_couverture_ayant_droit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux couverture ayant droit (%)</FormLabel>
                        <FormControl><Input {...field} type="number" onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
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
                        <TableHead>Nom de la société</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Limite dette</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredSocietes.map(societe => (
                        <TableRow key={societe.id}>
                        <TableCell className="font-medium">{societe.libelle_societe}</TableCell>
                        <TableCell>{societe.telephone_appel}</TableCell>
                        <TableCell>{societe.email}</TableCell>
                        <TableCell>{societe.limite_dette}</TableCell>
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