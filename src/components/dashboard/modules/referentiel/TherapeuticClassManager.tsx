import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Stethoscope, Download, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTenantQuery } from "@/hooks/useTenantQuery";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ATC_SYSTEM_MAP: Record<string, string> = {
  'A': 'Voies digestives et métabolisme',
  'B': 'Sang et organes hématopoïétiques',
  'C': 'Système cardiovasculaire',
  'D': 'Médicaments dermatologiques',
  'G': 'Système génito-urinaire et hormones sexuelles',
  'H': 'Hormones systémiques (hors sexuelles)',
  'J': 'Anti-infectieux généraux à usage systémique',
  'L': 'Antinéoplasiques et immunomodulateurs',
  'M': 'Système musculo-squelettique',
  'N': 'Système nerveux',
  'P': 'Antiparasitaires, insecticides et répulsifs',
  'R': 'Système respiratoire',
  'S': 'Organes sensoriels',
  'V': 'Divers',
};

interface TherapeuticClass {
  id: string;
  tenant_id: string;
  libelle_classe: string;
  systeme_anatomique: string;
  description?: string;
  code_atc?: string;
  created_at: string;
  updated_at: string;
}

interface TherapeuticClassFormData {
  libelle_classe: string;
  systeme_anatomique: string;
  description?: string;
  code_atc?: string;
}

interface ATCResult {
  id: number;
  code: string;
  label: string;
}

export const TherapeuticClassManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TherapeuticClass | null>(null);
  const [isATCDialogOpen, setIsATCDialogOpen] = useState(false);
  const [atcSearch, setAtcSearch] = useState("");
  const [atcResults, setAtcResults] = useState<ATCResult[]>([]);
  const [atcSearching, setAtcSearching] = useState(false);
  const [atcImporting, setAtcImporting] = useState<number | null>(null);
  const { toast } = useToast();

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  const { data: therapeuticClasses = [], isLoading, error } = useTenantQueryWithCache(
    ['classes-therapeutiques'],
    'classes_therapeutiques',
    '*',
    undefined,
    { orderBy: { column: 'libelle_classe', ascending: true } }
  );

  const createMutation = useTenantMutation('classes_therapeutiques', 'insert', {
    invalidateQueries: ['classes-therapeutiques'],
    onSuccess: () => {
      toast({ title: "Succès", description: "Classe thérapeutique créée avec succès" });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message?.includes('unique_classe_per_tenant') 
          ? "Une classe avec ce libellé existe déjà"
          : "Erreur lors de la création de la classe thérapeutique",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useTenantMutation('classes_therapeutiques', 'update', {
    invalidateQueries: ['classes-therapeutiques'],
    onSuccess: () => {
      toast({ title: "Succès", description: "Classe thérapeutique modifiée avec succès" });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message?.includes('unique_classe_per_tenant') 
          ? "Une classe avec ce libellé existe déjà"
          : "Erreur lors de la modification",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useTenantMutation('classes_therapeutiques', 'delete', {
    invalidateQueries: ['classes-therapeutiques'],
    onSuccess: () => { toast({ title: "Succès", description: "Classe supprimée avec succès" }); },
    onError: () => { toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" }); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TherapeuticClassFormData>();

  const filteredClasses = therapeuticClasses.filter((tc: TherapeuticClass) =>
    tc.libelle_classe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.systeme_anatomique.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tc.code_atc && tc.code_atc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddClass = () => {
    setEditingClass(null);
    reset({ libelle_classe: "", systeme_anatomique: "", description: "", code_atc: "" });
    setIsDialogOpen(true);
  };

  const handleEditClass = (tc: TherapeuticClass) => {
    setEditingClass(tc);
    reset({ libelle_classe: tc.libelle_classe, systeme_anatomique: tc.systeme_anatomique, description: tc.description || "", code_atc: tc.code_atc || "" });
    setIsDialogOpen(true);
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette classe thérapeutique ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => { setIsDialogOpen(false); setEditingClass(null); reset(); };

  const onSubmit = (data: TherapeuticClassFormData) => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  // ATC Import
  const handleATCSearch = async () => {
    if (!atcSearch.trim()) return;
    setAtcSearching(true);
    setAtcResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('vidal-search', {
        body: { action: 'search-atc', query: atcSearch }
      });
      if (error) throw error;
      setAtcResults(data.classifications || []);
      if ((data.classifications || []).length === 0) {
        toast({ title: "Aucun résultat", description: "Aucune classification ATC trouvée." });
      }
    } catch (e: any) {
      toast({ title: "Erreur VIDAL", description: e.message, variant: "destructive" });
    } finally {
      setAtcSearching(false);
    }
  };

  const handleATCImport = async (atc: ATCResult) => {
    setAtcImporting(atc.id);
    const firstLetter = atc.code?.charAt(0)?.toUpperCase() || '';
    const systeme = ATC_SYSTEM_MAP[firstLetter] || 'Autre';
    try {
      createMutation.mutate({
        libelle_classe: atc.label,
        systeme_anatomique: systeme,
        code_atc: atc.code,
        description: `Classification ATC importée depuis VIDAL (ID: ${atc.id})`,
      });
      toast({ title: "Importé", description: `${atc.label} importée comme classe thérapeutique.` });
    } finally {
      setAtcImporting(null);
    }
  };

  if (error) {
    return (
      <Card><CardContent className="p-6"><div className="text-center text-muted-foreground">Erreur lors du chargement</div></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classes Thérapeutiques</CardTitle>
        <CardDescription>Gérer les classes thérapeutiques et leurs systèmes anatomiques</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une classe..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsATCDialogOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Importer depuis VIDAL (ATC)
            </Button>
            <Button onClick={handleAddClass}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé de la classe</TableHead>
                <TableHead>Code ATC</TableHead>
                <TableHead>Système anatomique</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{searchTerm ? "Aucune classe trouvée" : "Aucune classe thérapeutique"}</TableCell></TableRow>
              ) : (
                filteredClasses.map((tc: TherapeuticClass) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span>{tc.libelle_classe}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tc.code_atc ? <Badge variant="outline" className="text-xs font-mono">{tc.code_atc}</Badge> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{tc.systeme_anatomique}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{tc.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClass(tc)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(tc.id)} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Modifier la classe thérapeutique" : "Ajouter une classe thérapeutique"}</DialogTitle>
              <DialogDescription>{editingClass ? "Modifiez les informations" : "Créez une nouvelle classe"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="libelle_classe">Libellé de la classe *</Label>
                  <Input id="libelle_classe" placeholder="Ex: Anti-inflammatoires non stéroïdiens" {...register("libelle_classe", { required: "Requis", minLength: { value: 2, message: "Min 2 caractères" } })} />
                  {errors.libelle_classe && <p className="text-sm text-destructive">{errors.libelle_classe.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code_atc">Code ATC</Label>
                  <Input id="code_atc" placeholder="Ex: M01A" {...register("code_atc")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="systeme_anatomique">Système anatomique *</Label>
                  <Input id="systeme_anatomique" placeholder="Ex: Système musculo-squelettique" {...register("systeme_anatomique", { required: "Requis", minLength: { value: 2, message: "Min 2 caractères" } })} />
                  {errors.systeme_anatomique && <p className="text-sm text-destructive">{errors.systeme_anatomique.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Description..." rows={3} {...register("description")} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>Annuler</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingClass ? "Modifier" : "Ajouter"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ATC Import Dialog */}
        <Dialog open={isATCDialogOpen} onOpenChange={setIsATCDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importer depuis VIDAL (ATC)</DialogTitle>
              <DialogDescription>Recherchez et importez des classifications ATC</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Code ou libellé ATC..."
                  value={atcSearch}
                  onChange={(e) => setAtcSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleATCSearch())}
                  className="flex-1"
                />
                <Button onClick={handleATCSearch} disabled={atcSearching}>
                  {atcSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {atcResults.length > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code ATC</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atcResults.map((atc) => (
                        <TableRow key={atc.id}>
                          <TableCell><Badge variant="outline" className="font-mono">{atc.code}</Badge></TableCell>
                          <TableCell>{atc.label}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleATCImport(atc)} disabled={atcImporting === atc.id}>
                              {atcImporting === atc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                              <span className="ml-1">Importer</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
