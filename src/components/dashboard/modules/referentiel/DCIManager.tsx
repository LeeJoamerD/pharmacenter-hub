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
import { Plus, Search, Edit, Trash2, Pill, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { supabase } from '@/integrations/supabase/client';

interface DCI {
  id: string;
  nom_dci: string;
  description?: string;
  classe_therapeutique_id?: string;
  contre_indications?: string;
  effets_secondaires?: string;
  posologie?: string;
  produits_associes: number;
  vidal_substance_id?: number;
  vidal_name?: string;
  classes_therapeutiques?: {
    id: string;
    libelle_classe: string;
  };
}

interface VidalSubstance {
  id: number;
  name: string;
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

  // VIDAL search state
  const [vidalSearch, setVidalSearch] = useState('');
  const [vidalResults, setVidalResults] = useState<VidalSubstance[]>([]);
  const [vidalSearching, setVidalSearching] = useState(false);
  const [vidalEnriching, setVidalEnriching] = useState(false);
  const [selectedSubstanceId, setSelectedSubstanceId] = useState<number | null>(null);

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

  const handleVidalSearch = async () => {
    if (!vidalSearch.trim()) return;
    setVidalSearching(true);
    setVidalResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'search-substances', query: vidalSearch }
      });
      if (error) throw error;
      setVidalResults(data.substances || []);
      if ((data.substances || []).length === 0) {
        toast({ title: "Aucun résultat", description: "Aucune substance VIDAL trouvée." });
      }
    } catch (e: any) {
      toast({ title: "Erreur VIDAL", description: e.message, variant: "destructive" });
    } finally {
      setVidalSearching(false);
    }
  };

  const handleSelectSubstance = (substance: VidalSubstance) => {
    form.setValue('nom_dci', substance.name);
    setSelectedSubstanceId(substance.id);
    setVidalResults([]);
    setVidalSearch('');
    toast({ title: "Substance sélectionnée", description: `${substance.name} pré-rempli.` });
  };

  const handleEnrichFromVidal = async () => {
    if (!selectedSubstanceId) return;
    setVidalEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'get-substance-details', substanceId: selectedSubstanceId }
      });
      if (error) throw error;
      if (data.contraindications?.length) {
        form.setValue('contre_indications', data.contraindications.join('\n'));
      }
      if (data.sideEffects?.length) {
        form.setValue('effets_secondaires', data.sideEffects.join('\n'));
      }
      toast({ title: "Enrichissement VIDAL", description: "Contre-indications et effets secondaires importés." });
    } catch (e: any) {
      toast({ title: "Erreur enrichissement", description: e.message, variant: "destructive" });
    } finally {
      setVidalEnriching(false);
    }
  };

  const handleAddDCI = () => {
    setEditingDCI(null);
    setSelectedSubstanceId(null);
    setVidalResults([]);
    setVidalSearch('');
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditDCI = (dci: DCI) => {
    setEditingDCI(dci);
    setSelectedSubstanceId(dci.vidal_substance_id || null);
    setVidalResults([]);
    setVidalSearch('');
    form.reset({
      nom_dci: dci.nom_dci,
      description: dci.description || '',
      classe_therapeutique_id: dci.classe_therapeutique_id || '',
      contre_indications: dci.contre_indications || '',
      effets_secondaires: dci.effets_secondaires || '',
      posologie: dci.posologie || '',
      produits_associes: dci.produits_associes || 0
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingDCI(null);
    setSelectedSubstanceId(null);
    form.reset();
  };

  const handleDeleteDCI = async (dciId: string) => {
    try {
      await deleteDCI.mutateAsync({ id: dciId });
      toast({ title: "DCI supprimée", description: "La DCI a été supprimée avec succès." });
      refetch();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la DCI.", variant: "destructive" });
    }
  };

  const onSubmit = async (data: DCI) => {
    try {
      const { classes_therapeutiques, id, ...dciData } = data;
      const payload: any = {
        ...dciData,
        vidal_substance_id: selectedSubstanceId || null,
        vidal_name: selectedSubstanceId ? data.nom_dci : null,
      };
      
      if (editingDCI) {
        await updateDCI.mutateAsync({ id: editingDCI.id, ...payload });
        toast({ title: "DCI modifiée", description: "La DCI a été modifiée avec succès." });
      } else {
        await createDCI.mutateAsync(payload);
        toast({ title: "DCI ajoutée", description: "La DCI a été ajoutée avec succès." });
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur s'est produite lors de l'opération.", variant: "destructive" });
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

                {/* VIDAL Search Section */}
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Download className="h-4 w-4" />
                    Recherche VIDAL
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Rechercher une substance VIDAL..."
                      value={vidalSearch}
                      onChange={(e) => setVidalSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVidalSearch())}
                      className="flex-1"
                    />
                    <Button type="button" variant="secondary" onClick={handleVidalSearch} disabled={vidalSearching}>
                      {vidalSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span className="ml-1">Rechercher</span>
                    </Button>
                  </div>
                  {vidalResults.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {vidalResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                          onClick={() => handleSelectSubstance(s)}
                        >
                          {s.name} <span className="text-muted-foreground text-xs">(ID: {s.id})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedSubstanceId && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">VIDAL ID: {selectedSubstanceId}</Badge>
                      <Button type="button" size="sm" variant="outline" onClick={handleEnrichFromVidal} disabled={vidalEnriching}>
                        {vidalEnriching ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                        Enrichir depuis VIDAL
                      </Button>
                    </div>
                  )}
                </div>

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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span>{dci.nom_dci}</span>
                        {dci.vidal_substance_id && <Badge variant="outline" className="text-xs">VIDAL</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{dci.classes_therapeutiques?.libelle_classe || '-'}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{dci.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dci.produits_associes} produits</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditDCI(dci)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteDCI(dci.id)} className="text-red-500 hover:text-red-600">
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
