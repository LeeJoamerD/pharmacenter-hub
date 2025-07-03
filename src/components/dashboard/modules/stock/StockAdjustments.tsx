import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Settings, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface StockAdjustment {
  id: string;
  date: Date;
  produit: string;
  lot: string;
  stockTheorique: number;
  stockReel: number;
  ecart: number;
  raison: string;
  utilisateur: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  commentaire?: string;
}

const StockAdjustments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const { toast } = useToast();

  // Formulaire pour nouvel ajustement
  const [formData, setFormData] = useState({
    produit: '',
    lot: '',
    stockTheorique: '',
    stockReel: '',
    raison: '',
    commentaire: ''
  });

  // Données mockées pour les ajustements
  const ajustements: StockAdjustment[] = [
    {
      id: '1',
      date: new Date('2024-01-15T16:45:00'),
      produit: 'Paracétamol 500mg',
      lot: 'LOT001',
      stockTheorique: 100,
      stockReel: 95,
      ecart: -5,
      raison: 'Casse constatée',
      utilisateur: 'Marie Dubois',
      statut: 'valide',
      commentaire: 'Casse de 5 boîtes due au transport'
    },
    {
      id: '2',
      date: new Date('2024-01-16T10:30:00'),
      produit: 'Ibuprofène 200mg',
      lot: 'LOT002',
      stockTheorique: 50,
      stockReel: 53,
      ecart: 3,
      raison: 'Erreur de saisie précédente',
      utilisateur: 'Jean Martin',
      statut: 'en_attente'
    },
    {
      id: '3',
      date: new Date('2024-01-16T14:20:00'),
      produit: 'Aspirine 100mg',
      lot: 'LOT003',
      stockTheorique: 75,
      stockReel: 70,
      ecart: -5,
      raison: 'Vol présumé',
      utilisateur: 'Pierre Durand',
      statut: 'rejete',
      commentaire: 'Nécessite investigation supplémentaire'
    }
  ];

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejete':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_attente':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    const colors = {
      valide: 'bg-green-100 text-green-800 border-green-200',
      rejete: 'bg-red-100 text-red-800 border-red-200',
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      valide: 'Validé',
      rejete: 'Rejeté',
      en_attente: 'En attente'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.produit || !formData.lot || !formData.stockTheorique || !formData.stockReel || !formData.raison) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Ajustement créé",
      description: "L'ajustement de stock a été enregistré avec succès",
    });

    setIsDialogOpen(false);
    setFormData({
      produit: '',
      lot: '',
      stockTheorique: '',
      stockReel: '',
      raison: '',
      commentaire: ''
    });
  };

  const filteredAjustements = ajustements.filter(ajustement => {
    const matchesSearch = ajustement.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ajustement.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ajustement.raison.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = selectedStatut === 'tous' || ajustement.statut === selectedStatut;
    
    return matchesSearch && matchesStatut;
  });

  return (
    <div className="space-y-6">
      {/* Métriques des ajustements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Ajustements</p>
              <p className="text-2xl font-bold">{ajustements.length}</p>
            </div>
            <Settings className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {ajustements.filter(a => a.statut === 'en_attente').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validés</p>
              <p className="text-2xl font-bold text-green-600">
                {ajustements.filter(a => a.statut === 'valide').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">
                {ajustements.filter(a => a.statut === 'rejete').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Liste des ajustements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ajustements de Stock</CardTitle>
              <CardDescription>Gestion des écarts et corrections de stock</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel Ajustement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un Ajustement de Stock</DialogTitle>
                  <DialogDescription>
                    Enregistrez un écart entre le stock théorique et réel
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="produit">Produit *</Label>
                      <Select value={formData.produit} onValueChange={(value) => setFormData({...formData, produit: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paracetamol">Paracétamol 500mg</SelectItem>
                          <SelectItem value="ibuprofene">Ibuprofène 200mg</SelectItem>
                          <SelectItem value="aspirine">Aspirine 100mg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lot">Lot *</Label>
                      <Select value={formData.lot} onValueChange={(value) => setFormData({...formData, lot: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un lot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOT001">LOT001</SelectItem>
                          <SelectItem value="LOT002">LOT002</SelectItem>
                          <SelectItem value="LOT003">LOT003</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockTheorique">Stock Théorique *</Label>
                      <Input
                        id="stockTheorique"
                        type="number"
                        placeholder="Quantité théorique"
                        value={formData.stockTheorique}
                        onChange={(e) => setFormData({...formData, stockTheorique: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stockReel">Stock Réel *</Label>
                      <Input
                        id="stockReel"
                        type="number"
                        placeholder="Quantité réelle comptée"
                        value={formData.stockReel}
                        onChange={(e) => setFormData({...formData, stockReel: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raison">Raison de l'écart *</Label>
                    <Select value={formData.raison} onValueChange={(value) => setFormData({...formData, raison: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une raison" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casse">Casse/Détérioration</SelectItem>
                        <SelectItem value="vol">Vol/Perte</SelectItem>
                        <SelectItem value="erreur_saisie">Erreur de saisie</SelectItem>
                        <SelectItem value="peremption">Péremption</SelectItem>
                        <SelectItem value="inventaire">Écart d'inventaire</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commentaire">Commentaire</Label>
                    <Textarea
                      id="commentaire"
                      placeholder="Détails supplémentaires sur l'ajustement..."
                      value={formData.commentaire}
                      onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Créer l'Ajustement</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher produit, lot, raison..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Stock Théorique</TableHead>
                  <TableHead>Stock Réel</TableHead>
                  <TableHead>Écart</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Utilisateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAjustements.map((ajustement) => (
                  <TableRow key={ajustement.id}>
                    <TableCell className="font-mono text-sm">
                      {format(ajustement.date, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">{ajustement.produit}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ajustement.lot}</Badge>
                    </TableCell>
                    <TableCell>{ajustement.stockTheorique}</TableCell>
                    <TableCell>{ajustement.stockReel}</TableCell>
                    <TableCell>
                      <span className={ajustement.ecart > 0 ? 'text-green-600' : 'text-red-600'}>
                        {ajustement.ecart > 0 ? '+' : ''}{ajustement.ecart}
                      </span>
                    </TableCell>
                    <TableCell>{ajustement.raison}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatutIcon(ajustement.statut)}
                        {getStatutBadge(ajustement.statut)}
                      </div>
                    </TableCell>
                    <TableCell>{ajustement.utilisateur}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAjustements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun ajustement trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAdjustments;