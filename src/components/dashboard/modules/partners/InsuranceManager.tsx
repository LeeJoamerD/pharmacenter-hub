import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

interface Assureur {
  id: number;
  libelle_assureur: string;
  adresse?: string;
  telephone_appel?: string;
  telephone_whatsapp?: string;
  email?: string;
  limite_dette: number;
  niu?: string;
  notes?: string;
  is_active: boolean;
}

const InsuranceManager = () => {
  const [assureurs, setAssureurs] = useState<Assureur[]>([
    {
      id: 1,
      libelle_assureur: "NSIA Assurances",
      adresse: "Avenue Amylcar Cabral, Brazzaville",
      telephone_appel: "+242 06 123 45 67",
      telephone_whatsapp: "+242 06 123 45 67",
      email: "contact@nsia.cg",
      limite_dette: 5000000,
      niu: "NIU001234567",
      notes: "Partenaire principal pour les assurances santé",
      is_active: true
    },
    {
      id: 2,
      libelle_assureur: "Loyco Assurances",
      adresse: "Centre-ville, Pointe-Noire",
      telephone_appel: "+242 05 987 65 43",
      email: "info@loyco.cg",
      limite_dette: 3000000,
      niu: "NIU987654321",
      is_active: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssureur, setEditingAssureur] = useState<Assureur | null>(null);
  const { toast } = useToast();

  const form = useForm<Assureur>({
    defaultValues: {
      libelle_assureur: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      limite_dette: 0,
      niu: '',
      notes: '',
      is_active: true
    }
  });

  const filteredAssureurs = assureurs.filter(assureur =>
    assureur.libelle_assureur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assureur.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: Assureur) => {
    if (editingAssureur) {
      setAssureurs(prev => prev.map(a => 
        a.id === editingAssureur.id ? { ...data, id: editingAssureur.id } : a
      ));
      toast({ title: "Assureur modifié avec succès" });
    } else {
      const newAssureur = { ...data, id: Date.now() };
      setAssureurs(prev => [...prev, newAssureur]);
      toast({ title: "Assureur ajouté avec succès" });
    }
    setIsDialogOpen(false);
    form.reset();
    setEditingAssureur(null);
  };

  const handleEdit = (assureur: Assureur) => {
    setEditingAssureur(assureur);
    form.reset(assureur);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setAssureurs(prev => prev.filter(a => a.id !== id));
    toast({ title: "Assureur supprimé" });
  };

  const AssureurForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="libelle_assureur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'assureur *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: NSIA Assurances" {...field} />
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
                  <Input type="email" placeholder="contact@assureur.cg" {...field} />
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Notes et commentaires" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Assureur actif</FormLabel>
                <div className="text-sm text-muted-foreground">
                  L'assureur peut être utilisé dans le système
                </div>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingAssureur ? 'Modifier' : 'Ajouter'}
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
              <Shield className="h-5 w-5" />
              Gestion des Assureurs
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingAssureur(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Assureur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssureur ? 'Modifier l\'assureur' : 'Nouvel assureur'}
                  </DialogTitle>
                </DialogHeader>
                <AssureurForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un assureur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assureur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Limite dette</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssureurs.map((assureur) => (
                <TableRow key={assureur.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assureur.libelle_assureur}</div>
                      {assureur.niu && (
                        <div className="text-sm text-muted-foreground">NIU: {assureur.niu}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {assureur.telephone_appel && <div>{assureur.telephone_appel}</div>}
                      {assureur.email && <div>{assureur.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assureur.limite_dette.toLocaleString()} XAF
                  </TableCell>
                  <TableCell>
                    <Badge variant={assureur.is_active ? "default" : "secondary"}>
                      {assureur.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assureur)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(assureur.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAssureurs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun assureur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceManager;