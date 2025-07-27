import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, FlaskConical, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface Laboratoire {
  id?: string;
  nom: string;
  adresse?: string;
  ville?: string;
  telephone_appel?: string;
  telephone_whatsapp?: string;
  email?: string;
  niu?: string;
  specialites?: string[];
  contact_principal?: string;
}

const LaboratoryManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLaboratoire, setEditingLaboratoire] = useState<Laboratoire | null>(null);
  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les laboratoires
  const { data: laboratoires = [], isLoading, refetch } = useTenantQueryWithCache(
    ['laboratoires'],
    'laboratoires',
    '*',
    undefined,
    { orderBy: { column: 'nom', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('laboratoires', 'insert', {
    invalidateQueries: ['laboratoires'],
    onSuccess: () => {
      toast({ title: "Laboratoire ajouté avec succès" });
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const updateMutation = useTenantMutation('laboratoires', 'update', {
    invalidateQueries: ['laboratoires'],
    onSuccess: () => {
      toast({ title: "Laboratoire modifié avec succès" });
      setIsDialogOpen(false);
      form.reset();
      setEditingLaboratoire(null);
    }
  });

  const deleteMutation = useTenantMutation('laboratoires', 'delete', {
    invalidateQueries: ['laboratoires'],
    onSuccess: () => {
      toast({ title: "Laboratoire supprimé" });
    }
  });

  const form = useForm<Laboratoire>({
    defaultValues: {
      nom: '',
      adresse: '',
      ville: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      niu: '',
      specialites: [],
      contact_principal: ''
    }
  });

  const filteredLaboratoires = laboratoires.filter((labo: any) =>
    labo.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labo.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labo.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: any) => {
    if (editingLaboratoire) {
      updateMutation.mutate({ ...data, id: editingLaboratoire.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (laboratoire: Laboratoire) => {
    setEditingLaboratoire(laboratoire);
    form.reset(laboratoire);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const LaboratoireForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du laboratoire *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Laboratoires Roche" {...field} />
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
                  <Input placeholder="Brazzaville" {...field} />
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
                  <Input type="email" placeholder="contact@laboratoire.com" {...field} />
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
                  <Input placeholder="Numéro d'identification unique" {...field} />
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
                  <Input placeholder="+242 06 123 45 67" {...field} />
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
                  <Input placeholder="+242 06 123 45 67" {...field} />
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
                <Textarea placeholder="Adresse complète" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_principal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact principal</FormLabel>
              <FormControl>
                <Input placeholder="Nom du contact principal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingLaboratoire ? 'Modifier' : 'Ajouter')}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Gestion des Laboratoires Pharmaceutiques
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingLaboratoire(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Laboratoire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLaboratoire ? 'Modifier le laboratoire' : 'Nouveau laboratoire'}
                  </DialogTitle>
                </DialogHeader>
                <LaboratoireForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un laboratoire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratoire</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Communication</TableHead>
                <TableHead>Date création</TableHead>
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
              ) : filteredLaboratoires.map((labo: any) => (
                <TableRow key={labo.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-blue-500" />
                        {labo.nom}
                      </div>
                      {labo.niu && (
                        <div className="text-sm text-muted-foreground">NIU: {labo.niu}</div>
                      )}
                      {labo.contact_principal && (
                        <div className="text-sm text-muted-foreground">Contact: {labo.contact_principal}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {labo.email && <div>✉️ {labo.email}</div>}
                      {labo.ville && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {labo.ville}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {labo.telephone_appel && (
                        <div>📞 {labo.telephone_appel}</div>
                      )}
                      {labo.telephone_whatsapp && (
                        <div className="text-green-600">💬 {labo.telephone_whatsapp}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {labo.created_at ? new Date(labo.created_at).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(labo)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(labo.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLaboratoires.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun laboratoire trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LaboratoryManager;