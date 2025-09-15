import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface DCI {
  id: string;
  nom_dci: string;
  description?: string;
  classe_therapeutique_id?: string;
  contre_indications?: string;
  effets_secondaires?: string;
  posologie?: string;
  produits_associes: number;
  classes_therapeutiques?: {
    id: string;
    libelle_classe: string;
  };
}

const DCIManager = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const { data: dcis = [], isLoading, refetch } = useTenantQueryWithCache(
    ['dci'],
    'dci',
    '*, classes_therapeutiques(id, libelle_classe)'
  );

  const { data: classesTherapeutiques = [] } = useTenantQueryWithCache(
    ['classes_therapeutiques'],
    'classes_therapeutiques',
    'id, libelle_classe'
  );

  const createDCI = useTenantMutation('dci', 'insert');
  const updateDCI = useTenantMutation('dci', 'update');
  const deleteDCI = useTenantMutation('dci', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDCI, setEditingDCI] = useState<DCI | null>(null);
  const { toast } = useToast();

  const form = useForm<DCI>({
    defaultValues: {
      nom_dci: '',
      description: '',
      classe_therapeutique_id: '',
      contre_indications: '',
      effets_secondaires: '',
      posologie: '',
      produits_associes: 0
    }
  });

  const filteredDCIs = dcis.filter((dci: DCI) =>
    dci.nom_dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dci.classes_therapeutiques?.libelle_classe?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDCI = () => {
    setEditingDCI(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditDCI = (dci: DCI) => {
    setEditingDCI(dci);
    form.reset(dci);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDCI(null);
    form.reset();
  };

  const handleDeleteDCI = async (dciId: string) => {
    try {
      await deleteDCI.mutateAsync({ id: dciId });
      toast({
        title: "DCI supprimée",
        description: "La DCI a été supprimée avec succès.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la DCI.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: DCI) => {
    try {
      if (editingDCI) {
        await updateDCI.mutateAsync({ 
          id: editingDCI.id, 
          ...data 
        });
        toast({
          title: "DCI modifiée",
          description: "La DCI a été modifiée avec succès.",
        });
      } else {
        await createDCI.mutateAsync(data);
        toast({
          title: "DCI ajoutée",
          description: "La DCI a été ajoutée avec succès.",
        });
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'opération.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Gestion des DCI (Dénominations Communes Internationales)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une DCI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddDCI}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter DCI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDCI ? 'Modifier la DCI' : 'Ajouter une nouvelle DCI'}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations détaillées de la DCI.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nom_dci"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la DCI *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Paracétamol" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="classe_therapeutique_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classe thérapeutique</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une classe thérapeutique" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classesTherapeutiques.map((classe: any) => (
                                <SelectItem key={classe.id} value={classe.id}>
                                  {classe.libelle_classe}
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Description de la DCI" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contre_indications"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Contre-indications</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Liste des contre-indications" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effets_secondaires"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Effets secondaires</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Liste des effets secondaires" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="posologie"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Posologie</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Informations sur la posologie" rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="col-span-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingDCI ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom DCI</TableHead>
                <TableHead>Classe thérapeutique</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Produits associés</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Chargement...</TableCell>
                </TableRow>
              ) : filteredDCIs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Aucune DCI trouvée</TableCell>
                </TableRow>
              ) : (
                filteredDCIs.map((dci: DCI) => (
                  <TableRow key={dci.id}>
                    <TableCell className="font-medium">{dci.nom_dci}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{dci.classes_therapeutiques?.libelle_classe || '-'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{dci.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dci.produits_associes} produits</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDCI(dci)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDCI(dci.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default DCIManager;