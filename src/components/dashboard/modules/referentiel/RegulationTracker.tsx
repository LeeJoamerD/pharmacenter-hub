import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface Regulation {
  id: string;
  nom_reglementation: string;
  type_reglementation: string;
  statut: string;
  description?: string;
  date_application: string;
  date_expiration?: string;
  autorite_competente: string;
  reference_legale: string;
  niveau_restriction: string;
  produits_concernes: number;
}

const RegulationTracker = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  const { data: regulations = [], isLoading, refetch } = useTenantQueryWithCache(
    ['reglementations'],
    'reglementations',
    '*'
  );

  const createRegulation = useTenantMutation('reglementations', 'insert');
  const updateRegulation = useTenantMutation('reglementations', 'update');
  const deleteRegulation = useTenantMutation('reglementations', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);
  const { toast } = useToast();

  const form = useForm<Regulation>({
    defaultValues: {
      nom_reglementation: '',
      type_reglementation: '',
      statut: '',
      description: '',
      date_application: '',
      date_expiration: '',
      autorite_competente: '',
      reference_legale: '',
      niveau_restriction: '',
      produits_concernes: 0
    }
  });

  const filteredRegulations = regulations.filter((regulation: Regulation) =>
    regulation.nom_reglementation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    regulation.type_reglementation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRegulation = () => {
    setEditingRegulation(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditRegulation = (regulation: Regulation) => {
    setEditingRegulation(regulation);
    form.reset(regulation);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRegulation(null);
    form.reset();
  };

  const handleDeleteRegulation = async (regulationId: string) => {
    try {
      await deleteRegulation.mutateAsync({ id: regulationId });
      toast({
        title: "Réglementation supprimée",
        description: "La réglementation a été supprimée avec succès.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réglementation.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: Regulation) => {
    try {
      if (editingRegulation) {
        await updateRegulation.mutateAsync({ 
          id: editingRegulation.id, 
          ...data 
        });
        toast({
          title: "Réglementation modifiée",
          description: "La réglementation a été modifiée avec succès.",
        });
      } else {
        await createRegulation.mutateAsync(data);
        toast({
          title: "Réglementation ajoutée",
          description: "La réglementation a été ajoutée avec succès.",
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

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Actif':
        return <Badge variant="default">Actif</Badge>;
      case 'Expiré':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'Suspendu':
        return <Badge variant="secondary">Suspendu</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getRestrictionBadge = (niveau: string) => {
    switch (niveau) {
      case 'Très élevé':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Très élevé
        </Badge>;
      case 'Élevé':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Élevé
        </Badge>;
      case 'Modéré':
        return <Badge variant="outline">Modéré</Badge>;
      default:
        return <Badge variant="outline">{niveau}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Suivi des Réglementations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une réglementation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddRegulation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Réglementation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRegulation ? 'Modifier la réglementation' : 'Ajouter une nouvelle réglementation'}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la réglementation.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nom_reglementation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la réglementation *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Liste I - Substances vénéneuses" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type_reglementation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de réglementation</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Classification pharmaceutique">Classification pharmaceutique</SelectItem>
                              <SelectItem value="Substances contrôlées">Substances contrôlées</SelectItem>
                              <SelectItem value="Dispositifs médicaux">Dispositifs médicaux</SelectItem>
                              <SelectItem value="Réglementation douanière">Réglementation douanière</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="statut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Actif">Actif</SelectItem>
                              <SelectItem value="Expiré">Expiré</SelectItem>
                              <SelectItem value="Suspendu">Suspendu</SelectItem>
                              <SelectItem value="En attente">En attente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="niveau_restriction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau de restriction</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le niveau" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Très élevé">Très élevé</SelectItem>
                              <SelectItem value="Élevé">Élevé</SelectItem>
                              <SelectItem value="Modéré">Modéré</SelectItem>
                              <SelectItem value="Faible">Faible</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_application"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'application</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date_expiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'expiration</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autorite_competente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autorité compétente</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Ministère de la Santé" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reference_legale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Référence légale</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Arrêté n°2020-001" />
                          </FormControl>
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
                            <Textarea {...field} placeholder="Description de la réglementation" rows={3} />
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
                        {editingRegulation ? 'Modifier' : 'Ajouter'}
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
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Niveau restriction</TableHead>
                <TableHead>Date application</TableHead>
                <TableHead>Produits concernés</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Chargement...</TableCell>
                </TableRow>
              ) : filteredRegulations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Aucune réglementation trouvée</TableCell>
                </TableRow>
              ) : (
                filteredRegulations.map((regulation: Regulation) => (
                  <TableRow key={regulation.id}>
                    <TableCell className="font-medium">{regulation.nom_reglementation}</TableCell>
                    <TableCell>{regulation.type_reglementation}</TableCell>
                    <TableCell>{getStatusBadge(regulation.statut)}</TableCell>
                    <TableCell>{getRestrictionBadge(regulation.niveau_restriction)}</TableCell>
                    <TableCell>{new Date(regulation.date_application).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{regulation.produits_concernes} produits</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRegulation(regulation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRegulation(regulation.id)}
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

export default RegulationTracker;