
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountingConfiguration } from '@/hooks/useAccountingConfiguration';

const JournalsSection = () => {
  const { toast } = useToast();
  const { journals = [], saveJournal, deleteJournal } = useAccountingConfiguration();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    description: '',
    is_active: true,
    auto_generation: false
  });

  const journalTypes = [
    { value: 'ventes', label: 'Journal des ventes' },
    { value: 'achats', label: 'Journal des achats' },
    { value: 'banque', label: 'Journal de banque' },
    { value: 'caisse', label: 'Journal de caisse' },
    { value: 'operations_diverses', label: 'Opérations diverses' },
    { value: 'nouveaux_biens', label: 'Nouveaux biens' }
  ];

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: '',
      description: '',
      is_active: true,
      auto_generation: false
    });
    setEditingJournal(null);
  };

  const handleOpenDialog = (journal?: any) => {
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        code: journal.code || '',
        name: journal.name || '',
        type: journal.type || '',
        description: journal.description || '',
        is_active: journal.is_active !== false,
        auto_generation: journal.auto_generation || false
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingJournal) {
        await saveJournal({ ...formData, id: editingJournal.id });
        toast({
          title: "Journal modifié",
          description: "Le journal comptable a été mis à jour avec succès."
        });
      } else {
        await saveJournal(formData);
        toast({
          title: "Journal créé",
          description: "Le journal comptable a été créé avec succès."
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce journal ?')) {
      try {
        await deleteJournal(id);
        toast({
          title: "Journal supprimé",
          description: "Le journal comptable a été supprimé avec succès."
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

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge> :
      <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inactif</Badge>;
  };

  const getJournalTypeLabel = (type: string) => {
    const journalType = journalTypes.find(t => t.value === type);
    return journalType ? journalType.label : type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Configuration des Journaux
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingJournal ? 'Modifier le journal' : 'Nouveau journal comptable'}
                </DialogTitle>
                <DialogDescription>
                  Configurez les paramètres du journal comptable
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code journal</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="VT, AC, BQ..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de journal</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {journalTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Libellé</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Journal des Ventes"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description du journal (optionnel)"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  {editingJournal ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {journals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun journal comptable configuré</p>
            <p className="text-sm">Créez votre premier journal pour commencer</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journals.map((journal: any) => (
                <TableRow key={journal.id}>
                  <TableCell className="font-mono">{journal.code}</TableCell>
                  <TableCell className="font-medium">{journal.name}</TableCell>
                  <TableCell>{getJournalTypeLabel(journal.type)}</TableCell>
                  <TableCell>{getStatusBadge(journal.is_active)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDialog(journal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(journal.id)}
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

export default JournalsSection;
