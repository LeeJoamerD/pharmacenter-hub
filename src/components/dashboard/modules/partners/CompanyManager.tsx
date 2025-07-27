import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';

interface Societe {
  id?: string;
  libelle_societe: string;
  adresse?: string;
  telephone_appel?: string;
  telephone_whatsapp?: string;
  email?: string;
  limite_dette: number;
  niu?: string;
  assureur_id?: string;
  taux_couverture_agent: number;
  taux_couverture_ayant_droit: number;
}

const CompanyManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSociete, setEditingSociete] = useState<Societe | null>(null);
  const { toast } = useToast();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer les assureurs pour le select
  const { data: assureurs = [] } = useTenantQueryWithCache(
    ['assureurs'],
    'assureurs',
    'id, nom',
    undefined,
    { orderBy: { column: 'nom', ascending: true } }
  );

  // Récupérer les sociétés
  const { data: societes = [], isLoading } = useTenantQueryWithCache(
    ['societes'],
    'societes',
    '*',
    undefined,
    { orderBy: { column: 'libelle_societe', ascending: true } }
  );

  // Mutations
  const createMutation = useTenantMutation('societes', 'insert', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
      toast({ 
        title: "Société ajoutée avec succès",
        description: "Un compte client a été créé automatiquement pour cette société."
      });
      setIsDialogOpen(false);
      form.reset();
    }
  });

  const updateMutation = useTenantMutation('societes', 'update', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
      toast({ 
        title: "Société modifiée avec succès",
        description: "Le compte client associé a été mis à jour automatiquement."
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingSociete(null);
    }
  });

  const deleteMutation = useTenantMutation('societes', 'delete', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
      toast({ 
        title: "Société supprimée",
        description: "Le compte client associé a été supprimé automatiquement."
      });
    }
  });

  const form = useForm<Societe>({
    defaultValues: {
      libelle_societe: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      limite_dette: 0,
      niu: '',
      assureur_id: undefined,
      taux_couverture_agent: 0,
      taux_couverture_ayant_droit: 0
    }
  });

  const filteredSocietes = societes.filter((societe: any) =>
    societe.libelle_societe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    societe.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: Societe) => {
    if (editingSociete) {
      updateMutation.mutate({ ...data, id: editingSociete.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (societe: Societe) => {
    setEditingSociete(societe);
    form.reset(societe);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const SocieteForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="libelle_societe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de la société *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Total E&P Congo" {...field} />
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
                  <Input type="email" placeholder="contact@societe.cg" {...field} />
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
            name="assureur_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assureur partenaire</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un assureur" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assureurs.map((assureur: any) => (
                      <SelectItem key={assureur.id} value={assureur.id}>
                        {assureur.nom}
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
            name="taux_couverture_agent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taux couverture agent (%)</FormLabel>
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
            name="taux_couverture_ayant_droit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taux couverture ayant droit (%)</FormLabel>
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
          <Button 
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'En cours...' : (editingSociete ? 'Modifier' : 'Ajouter')}
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
              <Building2 className="h-5 w-5" />
              Gestion des Sociétés
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingSociete(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Société
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSociete ? 'Modifier la société' : 'Nouvelle société'}
                  </DialogTitle>
                </DialogHeader>
                <SocieteForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une société..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Société</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Limite dette</TableHead>
                <TableHead>Couverture</TableHead>
                <TableHead>Assureur</TableHead>
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
              ) : filteredSocietes.map((societe: any) => (
                <TableRow key={societe.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{societe.libelle_societe}</div>
                      {societe.niu && (
                        <div className="text-sm text-muted-foreground">NIU: {societe.niu}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {societe.telephone_appel && <div>📞 {societe.telephone_appel}</div>}
                      {societe.telephone_whatsapp && <div className="text-green-600">💬 {societe.telephone_whatsapp}</div>}
                      {societe.email && <div>✉️ {societe.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {societe.limite_dette?.toLocaleString()} XAF
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Agent: {societe.taux_couverture_agent}%</div>
                      <div>Ayant droit: {societe.taux_couverture_ayant_droit}%</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {societe.assureur_id ? (
                        assureurs.find((a: any) => a.id === societe.assureur_id)?.nom || 'Assureur inconnu'
                      ) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(societe)}
                        disabled={updateMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(societe.id)}
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

          {filteredSocietes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune société trouvée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManager;