import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Search, Edit, Trash2, FlaskConical, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

interface Laboratoire {
  id: number;
  libelle: string;
  pays_siege?: string;
  email_siege?: string;
  email_delegation_local?: string;
  telephone_appel_delegation_local?: string;
  telephone_whatsapp_delegation_local?: string;
  date_creation?: string;
  date_modification?: string;
}

const LaboratoryManager = () => {
  const [laboratoires, setLaboratoires] = useState<Laboratoire[]>([
    {
      id: 1,
      libelle: "Laboratoires Roche",
      pays_siege: "Suisse",
      email_siege: "contact@roche.com",
      email_delegation_local: "congo@roche.com",
      telephone_appel_delegation_local: "+242 06 345 67 89",
      telephone_whatsapp_delegation_local: "+242 06 345 67 89",
      date_creation: "2024-01-15"
    },
    {
      id: 2,
      libelle: "Sanofi Congo",
      pays_siege: "France",
      email_siege: "info@sanofi.com",
      email_delegation_local: "congo@sanofi.com",
      telephone_appel_delegation_local: "+242 05 456 78 90",
      telephone_whatsapp_delegation_local: "+242 05 456 78 90",
      date_creation: "2024-02-10"
    },
    {
      id: 3,
      libelle: "Pfizer Central Africa",
      pays_siege: "États-Unis",
      email_siege: "contact@pfizer.com",
      email_delegation_local: "centralafrica@pfizer.com",
      telephone_appel_delegation_local: "+242 06 567 89 01",
      date_creation: "2024-03-05"
    },
    {
      id: 4,
      libelle: "Novartis",
      pays_siege: "Suisse",
      email_siege: "info@novartis.com",
      email_delegation_local: "congo@novartis.com",
      telephone_appel_delegation_local: "+242 05 678 90 12",
      telephone_whatsapp_delegation_local: "+242 05 678 90 12",
      date_creation: "2024-01-20"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLaboratoire, setEditingLaboratoire] = useState<Laboratoire | null>(null);
  const { toast } = useToast();

  const form = useForm<Laboratoire>({
    defaultValues: {
      libelle: '',
      pays_siege: '',
      email_siege: '',
      email_delegation_local: '',
      telephone_appel_delegation_local: '',
      telephone_whatsapp_delegation_local: ''
    }
  });

  const filteredLaboratoires = laboratoires.filter(labo =>
    labo.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labo.pays_siege?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    labo.email_delegation_local?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: Laboratoire) => {
    if (editingLaboratoire) {
      setLaboratoires(prev => prev.map(l => 
        l.id === editingLaboratoire.id ? { 
          ...data, 
          id: editingLaboratoire.id,
          date_creation: editingLaboratoire.date_creation,
          date_modification: new Date().toISOString().split('T')[0]
        } : l
      ));
      toast({ title: "Laboratoire modifié avec succès" });
    } else {
      const newLaboratoire = { 
        ...data, 
        id: Date.now(),
        date_creation: new Date().toISOString().split('T')[0]
      };
      setLaboratoires(prev => [...prev, newLaboratoire]);
      toast({ title: "Laboratoire ajouté avec succès" });
    }
    setIsDialogOpen(false);
    form.reset();
    setEditingLaboratoire(null);
  };

  const handleEdit = (laboratoire: Laboratoire) => {
    setEditingLaboratoire(laboratoire);
    form.reset(laboratoire);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setLaboratoires(prev => prev.filter(l => l.id !== id));
    toast({ title: "Laboratoire supprimé" });
  };

  const LaboratoireForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="libelle"
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
            name="pays_siege"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pays du siège</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Suisse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email_siege"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email siège</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@laboratoire.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email_delegation_local"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email délégation locale</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="congo@laboratoire.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone_appel_delegation_local"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone délégation locale</FormLabel>
                <FormControl>
                  <Input placeholder="+242 06 123 45 67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone_whatsapp_delegation_local"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp délégation locale</FormLabel>
                <FormControl>
                  <Input placeholder="+242 06 123 45 67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            {editingLaboratoire ? 'Modifier' : 'Ajouter'}
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
                <TableHead>Contact Siège</TableHead>
                <TableHead>Contact Local</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLaboratoires.map((labo) => (
                <TableRow key={labo.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-blue-500" />
                        {labo.libelle}
                      </div>
                      {labo.pays_siege && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {labo.pays_siege}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {labo.email_siege && <div>✉️ {labo.email_siege}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {labo.telephone_appel_delegation_local && (
                        <div>📞 {labo.telephone_appel_delegation_local}</div>
                      )}
                      {labo.telephone_whatsapp_delegation_local && (
                        <div className="text-green-600">💬 {labo.telephone_whatsapp_delegation_local}</div>
                      )}
                      {labo.email_delegation_local && (
                        <div>✉️ {labo.email_delegation_local}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {labo.date_creation ? new Date(labo.date_creation).toLocaleDateString('fr-FR') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(labo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(labo.id)}
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