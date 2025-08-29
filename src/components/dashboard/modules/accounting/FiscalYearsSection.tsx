import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountingConfiguration } from '@/hooks/useAccountingConfiguration';

const FiscalYearsSection = () => {
  const { toast } = useToast();
  const { fiscalYears = [], saveFiscalYear, deleteFiscalYear } = useAccountingConfiguration();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: '',
    status: 'Ouvert'
  });

  const resetForm = () => {
    setFormData({
      year: '',
      start_date: '',
      end_date: '',
      status: 'Ouvert'
    });
    setEditingYear(null);
  };

  const handleOpenDialog = (year?: any) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        year: year.year || '',
        start_date: year.start_date || '',
        end_date: year.end_date || '',
        status: year.status || 'Ouvert'
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingYear) {
        await saveFiscalYear({ ...formData, id: editingYear.id });
        toast({
          title: "Exercice modifié",
          description: "L'exercice comptable a été mis à jour avec succès."
        });
      } else {
        await saveFiscalYear(formData);
        toast({
          title: "Exercice créé",
          description: "L'exercice comptable a été créé avec succès."
        });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      try {
        await deleteFiscalYear(id);
        toast({
          title: "Exercice supprimé",
          description: "L'exercice comptable a été supprimé avec succès."
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression.",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ouvert':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Ouvert</Badge>;
      case 'ferme':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Fermé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestion des Exercices Comptables
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Exercice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingYear ? 'Modifier l\'exercice' : 'Nouvel exercice comptable'}
                </DialogTitle>
                <DialogDescription>
                  Définissez les paramètres de l'exercice comptable
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Libellé</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    placeholder="Ex: Exercice 2024"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  {editingYear ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fiscalYears.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun exercice comptable configuré</p>
            <p className="text-sm">Créez votre premier exercice pour commencer</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fiscalYears.map((year: any) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>
                    {new Date(year.start_date).toLocaleDateString('fr-FR')} - {new Date(year.end_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(year.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDialog(year)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(year.id)}
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
  );
};

export default FiscalYearsSection;