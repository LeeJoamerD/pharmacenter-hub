import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RayonProduct {
  id: number;
  libelle_rayon: string;
}

const RayonManager = () => {
  const [rayons, setRayons] = useState<RayonProduct[]>([
    { id: 1, libelle_rayon: "Prescription médicale" },
    { id: 2, libelle_rayon: "Vente libre" },
    { id: 3, libelle_rayon: "Parapharmacie" },
    { id: 4, libelle_rayon: "Orthopédie" }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRayon, setEditingRayon] = useState<RayonProduct | null>(null);
  const { toast } = useToast();

  const form = useForm<RayonProduct>({
    defaultValues: {
      libelle_rayon: ''
    }
  });

  const filteredRayons = rayons.filter(rayon =>
    rayon.libelle_rayon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRayon = () => {
    setEditingRayon(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditRayon = (rayon: RayonProduct) => {
    setEditingRayon(rayon);
    form.reset(rayon);
    setIsDialogOpen(true);
  };

  const handleDeleteRayon = (rayonId: number) => {
    setRayons(rayons.filter(r => r.id !== rayonId));
    toast({
      title: "Rayon supprimé",
      description: "Le rayon de produits a été supprimé avec succès.",
    });
  };

  const onSubmit = (data: RayonProduct) => {
    if (editingRayon) {
      setRayons(rayons.map(r => r.id === editingRayon.id ? { ...data, id: editingRayon.id } : r));
      toast({
        title: "Rayon modifié",
        description: "Le rayon de produits a été modifié avec succès.",
      });
    } else {
      const newRayon = { ...data, id: Date.now() };
      setRayons([...rayons, newRayon]);
      toast({
        title: "Rayon ajouté",
        description: "Le rayon de produits a été ajouté avec succès.",
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Gestion des Rayons de Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rayon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddRayon}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Rayon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRayon ? 'Modifier le rayon' : 'Ajouter un nouveau rayon'}
                  </DialogTitle>
                  <DialogDescription>
                    Saisissez le libellé du rayon de produits.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="libelle_rayon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Libellé du rayon *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Prescription médicale" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingRayon ? 'Modifier' : 'Ajouter'}
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
                <TableHead>ID</TableHead>
                <TableHead>Libellé du rayon</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRayons.map((rayon) => (
                <TableRow key={rayon.id}>
                  <TableCell>{rayon.id}</TableCell>
                  <TableCell className="font-medium">{rayon.libelle_rayon}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRayon(rayon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRayon(rayon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RayonManager;