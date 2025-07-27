import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Trash2, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import type { Database } from '@/integrations/supabase/types';

type Conventionne = Database['public']['Tables']['conventionnes']['Row'];
type ConventionneInsert = Database['public']['Tables']['conventionnes']['Insert'];

const ConventionedManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConventionne, setEditingConventionne] = useState<Conventionne | null>(null);
  const { toast } = useToast();

  const { useTenantQueryWithCache } = useTenantQuery();
  const { data: conventionnes = [], isLoading } = useTenantQueryWithCache(
    ['conventionnes'],
    'conventionnes',
    '*',
    undefined,
    { orderBy: { column: 'noms', ascending: true } }
  );

  const form = useForm<ConventionneInsert>({
    defaultValues: {
      noms: '',
      adresse: '',
      ville: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      limite_dette: 0,
      niu: '',
      taux_ticket_moderateur: 0,
      caution: 0,
      taux_remise_automatique: 0
    }
  });

  const filteredConventionnes = conventionnes.filter(conv =>
    conv.noms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: ConventionneInsert) => {
    // Pour le moment, utiliser des données mockées
    toast({ title: editingConventionne ? "Conventionné modifié avec succès" : "Conventionné ajouté avec succès" });
    setIsDialogOpen(false);
    form.reset();
    setEditingConventionne(null);
  };

  const handleEdit = (conventionne: Conventionne) => {
    setEditingConventionne(conventionne);
    form.reset({
      noms: conventionne.noms,
      adresse: conventionne.adresse,
      ville: conventionne.ville,
      telephone_appel: conventionne.telephone_appel,
      telephone_whatsapp: conventionne.telephone_whatsapp,
      email: conventionne.email,
      limite_dette: conventionne.limite_dette,
      niu: conventionne.niu,
      taux_ticket_moderateur: conventionne.taux_ticket_moderateur,
      caution: conventionne.caution,
      taux_remise_automatique: conventionne.taux_remise_automatique
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Pour le moment, utiliser des données mockées
    toast({ title: "Conventionné supprimé" });
  };

  const ConventionneForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="noms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'établissement *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Hôpital Général de Brazzaville" {...field} />
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
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@etablissement.cg" {...field} />
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
            name="limite_dette"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de dette (XAF)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="caution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caution (XAF)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taux_ticket_moderateur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taux ticket modérateur (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    max="100"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taux_remise_automatique"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taux remise automatique (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    max="100"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingConventionne ? 'Modifier' : 'Ajouter'}
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
              <UserCheck className="h-5 w-5" />
              Gestion des Conventionnés
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingConventionne(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Conventionné
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConventionne ? 'Modifier le conventionné' : 'Nouveau conventionné'}
                  </DialogTitle>
                </DialogHeader>
                <ConventionneForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un conventionné..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Établissement</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Taux (%)</TableHead>
                <TableHead>Caution</TableHead>
                <TableHead>Limite dette</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Chargement...
              </TableCell>
            </TableRow>
          ) : (
            filteredConventionnes.map((conv) => (
              <TableRow key={conv.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{conv.noms}</div>
                    <div className="text-sm text-muted-foreground">
                      {conv.ville} {conv.niu && `• NIU: ${conv.niu}`}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {conv.telephone_appel && <div>{conv.telephone_appel}</div>}
                    {conv.email && <div>{conv.email}</div>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>TM: {conv.taux_ticket_moderateur || 0}%</div>
                    <div>Remise: {conv.taux_remise_automatique || 0}%</div>
                  </div>
                </TableCell>
                <TableCell>
                  {(conv.caution || 0).toLocaleString()} XAF
                </TableCell>
                <TableCell>
                  {(conv.limite_dette || 0).toLocaleString()} XAF
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(conv)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(conv.id)}
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

          {filteredConventionnes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun conventionné trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConventionedManager;