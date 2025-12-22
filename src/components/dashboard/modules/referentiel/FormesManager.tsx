import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { VOIES_ADMINISTRATION } from '@/constants/voiesAdministration';

interface FormeGalenique {
  id: string;
  tenant_id: string;
  libelle_forme: string;
  description?: string;
  voie_administration?: string;
  created_at: string;
  updated_at: string;
}

const FormesManager = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  
  // Fetch formes from database
  const { data: formes = [], isLoading, error } = useTenantQueryWithCache(
    ['formes'],
    'formes_galeniques',
    '*',
    {},
    { orderBy: { column: 'libelle_forme', ascending: true } }
  );

  // Mutations
  const createForme = useTenantMutation('formes_galeniques', 'insert', {
    invalidateQueries: ['formes'],
    onSuccess: () => {
      toast({
        title: "Forme ajoutée",
        description: "La forme galénique a été ajoutée avec succès.",
      });
      setIsDialogOpen(false);
      form.reset({ libelle_forme: '', description: '', voie_administration: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateForme = useTenantMutation('formes_galeniques', 'update', {
    invalidateQueries: ['formes'],
    onSuccess: () => {
      toast({
        title: "Forme modifiée",
        description: "La forme galénique a été modifiée avec succès.",
      });
      setIsDialogOpen(false);
      setEditingForme(null);
      form.reset({ libelle_forme: '', description: '', voie_administration: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la modification: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteForme = useTenantMutation('formes_galeniques', 'delete', {
    invalidateQueries: ['formes'],
    onSuccess: () => {
      toast({
        title: "Forme supprimée",
        description: "La forme galénique a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingForme, setEditingForme] = useState<FormeGalenique | null>(null);
  const { toast } = useToast();

  const form = useForm<Partial<FormeGalenique>>({
    defaultValues: {
      libelle_forme: '',
      description: '',
      voie_administration: ''
    }
  });

  const filteredFormes = formes.filter(forme =>
    forme.libelle_forme.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (forme.description && forme.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (forme.voie_administration && forme.voie_administration.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddForme = () => {
    setEditingForme(null);
    form.reset({ libelle_forme: '', description: '', voie_administration: '' });
    setIsDialogOpen(true);
  };

  const handleEditForme = (forme: FormeGalenique) => {
    setEditingForme(forme);
    form.reset(forme);
    setIsDialogOpen(true);
  };

  const handleDeleteForme = (formeId: string) => {
    deleteForme.mutate({ 
      id: formeId
    });
  };

  const onSubmit = (data: Partial<FormeGalenique>) => {
    if (editingForme) {
      updateForme.mutate({
        id: editingForme.id,
        libelle_forme: data.libelle_forme!,
        description: data.description || null,
        voie_administration: data.voie_administration || null
      });
    } else {
      createForme.mutate({
        libelle_forme: data.libelle_forme!,
        description: data.description || null,
        voie_administration: data.voie_administration || null
      });
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une forme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddForme}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Forme
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingForme ? 'Modifier la forme galénique' : 'Ajouter une nouvelle forme galénique'}
                  </DialogTitle>
                  <DialogDescription>
                    Saisissez les informations de la forme galénique.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="libelle_forme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Libellé de la forme *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Comprimé, Gélule, Sirop..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                     <FormField
                       control={form.control}
                       name="description"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Description</FormLabel>
                           <FormControl>
                             <Textarea {...field} placeholder="Description de la forme galénique (optionnel)" />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     <FormField
                       control={form.control}
                       name="voie_administration"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Voie d'administration</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value || ''}>
                             <FormControl>
                               <SelectTrigger>
                                 <SelectValue placeholder="Sélectionner une voie d'administration" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               {VOIES_ADMINISTRATION.map((voie) => (
                                 <SelectItem key={voie} value={voie}>
                                   {voie}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingForme ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
                   <TableRow>
                     <TableCell colSpan={4} className="text-center py-4">
                       Aucune forme galénique trouvée
                     </TableCell>
                   </TableRow>
                ) : (
                  filteredFormes.map((forme) => (
                     <TableRow key={forme.id}>
                       <TableCell className="font-medium">
                         <div className="flex items-center gap-2">
                           <Pill className="h-4 w-4 text-blue-500 flex-shrink-0" />
                           <span>{forme.libelle_forme}</span>
                         </div>
                       </TableCell>
                       <TableCell className="text-muted-foreground">
                         {forme.description || 'Aucune description'}
                       </TableCell>
                       <TableCell className="text-muted-foreground">
                         {forme.voie_administration || 'Non spécifiée'}
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditForme(forme)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteForme(forme.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormesManager;