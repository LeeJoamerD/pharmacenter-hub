import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Store, Plus, Edit, Trash2, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useCaisses, type CreateCaisseInput } from '@/hooks/useCaisses';
import { toast } from 'sonner';

const CashRegisterManagement = () => {
  const { caisses, loading, createCaisse, updateCaisse, deactivateCaisse } = useCaisses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCaisse, setEditingCaisse] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCaisseInput>({
    nom_caisse: '',
    code_caisse: '',
    emplacement: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({
      nom_caisse: '',
      code_caisse: '',
      emplacement: '',
      description: ''
    });
    setEditingCaisse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom_caisse || !formData.code_caisse) {
      toast.error('Le nom et le code de la caisse sont obligatoires');
      return;
    }

    try {
      if (editingCaisse) {
        await updateCaisse(editingCaisse, formData);
      } else {
        await createCaisse(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      // Error already handled in hook
    }
  };

  const handleEdit = (caisse: any) => {
    setEditingCaisse(caisse.id);
    setFormData({
      nom_caisse: caisse.nom_caisse,
      code_caisse: caisse.code_caisse,
      emplacement: caisse.emplacement || '',
      description: caisse.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver la caisse "${nom}" ?`)) {
      return;
    }

    try {
      await deactivateCaisse(id);
    } catch (err) {
      // Error already handled in hook
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Gestion des Caisses
              </CardTitle>
              <CardDescription>
                Gérez les différents points de vente et d'encaissement
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Caisse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCaisse ? 'Modifier la Caisse' : 'Nouvelle Caisse'}
                    </DialogTitle>
                    <DialogDescription>
                      Renseignez les informations du point de vente
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom_caisse">Nom de la Caisse *</Label>
                      <Input
                        id="nom_caisse"
                        value={formData.nom_caisse}
                        onChange={(e) => setFormData(prev => ({ ...prev, nom_caisse: e.target.value }))}
                        placeholder="Ex: Caisse Principale"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code_caisse">Code Caisse *</Label>
                      <Input
                        id="code_caisse"
                        value={formData.code_caisse}
                        onChange={(e) => setFormData(prev => ({ ...prev, code_caisse: e.target.value.toUpperCase() }))}
                        placeholder="Ex: C01"
                        required
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emplacement">Emplacement</Label>
                      <Input
                        id="emplacement"
                        value={formData.emplacement}
                        onChange={(e) => setFormData(prev => ({ ...prev, emplacement: e.target.value }))}
                        placeholder="Ex: Entrée Principale"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description facultative"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {editingCaisse ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des caisses...
            </div>
          ) : caisses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune caisse enregistrée. Créez votre première caisse.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caisses.map((caisse) => (
                  <TableRow key={caisse.id}>
                    <TableCell className="font-mono font-medium">
                      {caisse.code_caisse}
                    </TableCell>
                    <TableCell>{caisse.nom_caisse}</TableCell>
                    <TableCell>
                      {caisse.emplacement ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {caisse.emplacement}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {caisse.type_caisse || 'standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {caisse.is_active ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(caisse)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(caisse.id, caisse.nom_caisse)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashRegisterManagement;