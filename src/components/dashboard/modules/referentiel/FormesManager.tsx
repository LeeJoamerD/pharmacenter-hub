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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Pill, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { VOIES_ADMINISTRATION } from '@/constants/voiesAdministration';
import { supabase } from '@/integrations/supabase/client';

interface FormeGalenique {
  id: string;
  tenant_id: string;
  libelle_forme: string;
  description?: string;
  voie_administration?: string;
  vidal_form_id?: number;
  created_at: string;
  updated_at: string;
}

interface VidalForm {
  id: number;
  name: string;
  selected: boolean;
  existsLocally: boolean;
}

const FormesManager = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const { data: formes = [], isLoading, error } = useTenantQueryWithCache(
    ['formes'],
    'formes_galeniques',
    '*',
    {},
    { orderBy: { column: 'libelle_forme', ascending: true } }
  );

  const createForme = useTenantMutation('formes_galeniques', 'insert', {
    invalidateQueries: ['formes'],
    onSuccess: () => { toast({ title: "Forme ajoutée", description: "La forme galénique a été ajoutée avec succès." }); setIsDialogOpen(false); form.reset({ libelle_forme: '', description: '', voie_administration: '' }); },
    onError: (error: any) => { toast({ title: "Erreur", description: `Erreur: ${error.message}`, variant: "destructive" }); }
  });

  const updateForme = useTenantMutation('formes_galeniques', 'update', {
    invalidateQueries: ['formes'],
    onSuccess: () => { toast({ title: "Forme modifiée", description: "La forme galénique a été modifiée avec succès." }); setIsDialogOpen(false); setEditingForme(null); form.reset({ libelle_forme: '', description: '', voie_administration: '' }); },
    onError: (error: any) => { toast({ title: "Erreur", description: `Erreur: ${error.message}`, variant: "destructive" }); }
  });

  const deleteForme = useTenantMutation('formes_galeniques', 'delete', {
    invalidateQueries: ['formes'],
    onSuccess: () => { toast({ title: "Forme supprimée", description: "La forme galénique a été supprimée avec succès." }); },
    onError: (error: any) => { toast({ title: "Erreur", description: `Erreur: ${error.message}`, variant: "destructive" }); }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingForme, setEditingForme] = useState<FormeGalenique | null>(null);
  const { toast } = useToast();

  // VIDAL sync state
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [vidalFormSearch, setVidalFormSearch] = useState('');
  const [vidalForms, setVidalForms] = useState<VidalForm[]>([]);
  const [vidalSearching, setVidalSearching] = useState(false);
  const [vidalImporting, setVidalImporting] = useState(false);

  const form = useForm<Partial<FormeGalenique>>({
    defaultValues: { libelle_forme: '', description: '', voie_administration: '' }
  });

  const filteredFormes = formes.filter((f: FormeGalenique) =>
    f.libelle_forme.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.voie_administration && f.voie_administration.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddForme = () => { setEditingForme(null); form.reset({ libelle_forme: '', description: '', voie_administration: '' }); setIsDialogOpen(true); };
  const handleEditForme = (forme: FormeGalenique) => { setEditingForme(forme); form.reset(forme); setIsDialogOpen(true); };
  const handleDeleteForme = (formeId: string) => { deleteForme.mutate({ id: formeId }); };

  const onSubmit = (data: Partial<FormeGalenique>) => {
    if (editingForme) {
      updateForme.mutate({ id: editingForme.id, libelle_forme: data.libelle_forme!, description: data.description || null, voie_administration: data.voie_administration || null });
    } else {
      createForme.mutate({ libelle_forme: data.libelle_forme!, description: data.description || null, voie_administration: data.voie_administration || null });
    }
  };

  // VIDAL sync handlers
  const handleVidalFormSearch = async () => {
    setVidalSearching(true);
    setVidalForms([]);
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'search-galenic-forms', query: vidalFormSearch || undefined }
      });
      if (error) throw error;
      const localNames = formes.map((f: FormeGalenique) => f.libelle_forme.toLowerCase());
      const localVidalIds = formes.filter((f: FormeGalenique) => f.vidal_form_id).map((f: FormeGalenique) => f.vidal_form_id);
      const mapped: VidalForm[] = (data.forms || []).map((vf: { id: number; name: string }) => ({
        ...vf,
        selected: false,
        existsLocally: localNames.includes(vf.name.toLowerCase()) || localVidalIds.includes(vf.id),
      }));
      setVidalForms(mapped);
      if (mapped.length === 0) {
        toast({ title: "Aucun résultat", description: "Aucune forme galénique VIDAL trouvée." });
      }
    } catch (e: any) {
      toast({ title: "Erreur VIDAL", description: e.message, variant: "destructive" });
    } finally {
      setVidalSearching(false);
    }
  };

  const toggleVidalForm = (id: number) => {
    setVidalForms(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const handleImportSelected = async () => {
    const toImport = vidalForms.filter(f => f.selected && !f.existsLocally);
    if (toImport.length === 0) {
      toast({ title: "Rien à importer", description: "Sélectionnez des formes non existantes." });
      return;
    }
    setVidalImporting(true);
    try {
      for (const vf of toImport) {
        await createForme.mutateAsync({ libelle_forme: vf.name, vidal_form_id: vf.id });
      }
      toast({ title: "Import terminé", description: `${toImport.length} forme(s) importée(s).` });
      setIsSyncDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Erreur import", description: e.message, variant: "destructive" });
    } finally {
      setVidalImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Gestion des Formes Galéniques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher une forme..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsSyncDialogOpen(true); setVidalForms([]); setVidalFormSearch(''); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Synchroniser depuis VIDAL
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddForme}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Forme
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingForme ? 'Modifier la forme galénique' : 'Ajouter une nouvelle forme galénique'}</DialogTitle>
                    <DialogDescription>Saisissez les informations de la forme galénique.</DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="libelle_forme" render={({ field }) => (
                        <FormItem><FormLabel>Libellé de la forme *</FormLabel><FormControl><Input {...field} placeholder="Ex: Comprimé, Gélule, Sirop..." /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Description (optionnel)" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="voie_administration" render={({ field }) => (
                        <FormItem><FormLabel>Voie d'administration</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une voie" /></SelectTrigger></FormControl>
                            <SelectContent>{VOIES_ADMINISTRATION.map((voie) => (<SelectItem key={voie} value={voie}>{voie}</SelectItem>))}</SelectContent>
                          </Select>
                        <FormMessage /></FormItem>
                      )} />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                        <Button type="submit">{editingForme ? 'Modifier' : 'Ajouter'}</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Erreur: {error.message}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé de la forme</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Voie d'administration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFormes.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">Aucune forme galénique trouvée</TableCell></TableRow>
                ) : (
                  filteredFormes.map((forme: FormeGalenique) => (
                    <TableRow key={forme.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span>{forme.libelle_forme}</span>
                          {forme.vidal_form_id && <Badge variant="outline" className="text-xs">VIDAL</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{forme.description || 'Aucune description'}</TableCell>
                      <TableCell className="text-muted-foreground">{forme.voie_administration || 'Non spécifiée'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditForme(forme)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteForme(forme.id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* VIDAL Sync Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Synchroniser depuis VIDAL</DialogTitle>
            <DialogDescription>Recherchez et importez des formes galéniques depuis VIDAL</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Filtrer les formes (optionnel)..."
                value={vidalFormSearch}
                onChange={(e) => setVidalFormSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVidalFormSearch())}
                className="flex-1"
              />
              <Button onClick={handleVidalFormSearch} disabled={vidalSearching}>
                {vidalSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {vidalForms.length > 0 && (
              <>
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Forme VIDAL</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vidalForms.map((vf) => (
                        <TableRow key={vf.id} className={vf.existsLocally ? 'opacity-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={vf.selected}
                              onCheckedChange={() => toggleVidalForm(vf.id)}
                              disabled={vf.existsLocally}
                            />
                          </TableCell>
                          <TableCell>{vf.name}</TableCell>
                          <TableCell>
                            {vf.existsLocally ? (
                              <Badge variant="secondary" className="text-xs">Existe déjà</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Nouvelle</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={handleImportSelected} disabled={vidalImporting || vidalForms.filter(f => f.selected && !f.existsLocally).length === 0} className="w-full">
                  {vidalImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Importer les sélectionnées ({vidalForms.filter(f => f.selected && !f.existsLocally).length})
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormesManager;
