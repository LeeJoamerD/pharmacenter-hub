import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import type { Database } from '@/integrations/supabase/types';

type Fournisseur = Database['public']['Tables']['fournisseurs']['Row'];
type FournisseurInsert = Database['public']['Tables']['fournisseurs']['Insert'];

const SupplierManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const { toast } = useToast();

  const { useTenantQueryWithCache } = useTenantQuery();
  const { data: fournisseurs = [], isLoading } = useTenantQueryWithCache(
    ['fournisseurs'],
    'fournisseurs',
    '*',
    undefined,
    { orderBy: { column: 'nom', ascending: true } }
  );

  const form = useForm<FournisseurInsert>({
    defaultValues: {
      nom: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      niu: ''
    }
  });

  const filteredFournisseurs = fournisseurs.filter(fournisseur =>
    fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fournisseur.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: FournisseurInsert) => {
    // Pour le moment, utiliser des données mockées
    toast({ title: editingFournisseur ? "Fournisseur modifié avec succès" : "Fournisseur ajouté avec succès" });
    setIsDialogOpen(false);
    form.reset();
    setEditingFournisseur(null);
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    form.reset({
      nom: fournisseur.nom,
      adresse: fournisseur.adresse,
      telephone_appel: fournisseur.telephone_appel,
      telephone_whatsapp: fournisseur.telephone_whatsapp,
      email: fournisseur.email,
      niu: fournisseur.niu
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Pour le moment, utiliser des données mockées
    toast({ title: "Fournisseur supprimé" });
  };

  const FournisseurForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du fournisseur *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: COPHAL - Comptoir Pharmaceutique" {...field} />
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

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@fournisseur.cg" {...field} />
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
                <Textarea placeholder="Adresse complète du fournisseur" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingFournisseur ? 'Modifier' : 'Ajouter'}
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
              <Truck className="h-5 w-5" />
              Gestion des Fournisseurs
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingFournisseur(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingFournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                  </DialogTitle>
                </DialogHeader>
                <FournisseurForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : (
                filteredFournisseurs.map((fournisseur) => (
                  <TableRow key={fournisseur.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{fournisseur.nom}</div>
                        {fournisseur.niu && (
                          <div className="text-sm text-muted-foreground">NIU: {fournisseur.niu}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {fournisseur.telephone_appel && <div>📞 {fournisseur.telephone_appel}</div>}
                        {fournisseur.telephone_whatsapp && (
                          <div className="text-green-600">💬 {fournisseur.telephone_whatsapp}</div>
                        )}
                        {fournisseur.email && <div>✉️ {fournisseur.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {fournisseur.adresse || 'Non renseignée'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fournisseur)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(fournisseur.id)}
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

          {filteredFournisseurs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun fournisseur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierManager;