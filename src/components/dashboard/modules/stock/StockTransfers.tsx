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
  ArrowRightLeft, 
  Package, 
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface StockTransfer {
  id: string;
  date: Date;
  numero: string;
  produit: string;
  lot: string;
  quantite: number;
  unite: string;
  origine: string;
  destination: string;
  statut: 'en_cours' | 'en_transit' | 'recu' | 'annule';
  utilisateurCreation: string;
  utilisateurReception?: string;
  motif: string;
  commentaire?: string;
}

const StockTransfers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('tous');
  const { toast } = useToast();

  // Formulaire pour nouveau transfert
  const [formData, setFormData] = useState({
    produit: '',
    lot: '',
    quantite: '',
    origine: '',
    destination: '',
    motif: '',
    commentaire: ''
  });

  // Données mockées pour les transferts
  const transferts: StockTransfer[] = [
    {
      id: '1',
      date: new Date('2024-01-16T09:20:00'),
      numero: 'TRF001',
      produit: 'Doliprane 1000mg',
      lot: 'LOT004',
      quantite: 50,
      unite: 'boîtes',
      origine: 'Pharmacie Centrale',
      destination: 'Succursale B',
      statut: 'recu',
      utilisateurCreation: 'Pierre Durand',
      utilisateurReception: 'Sophie Martin',
      motif: 'Réapprovisionnement succursale',
      commentaire: 'Transfert urgent pour rupture de stock'
    },
    {
      id: '2',
      date: new Date('2024-01-16T14:30:00'),
      numero: 'TRF002',
      produit: 'Paracétamol 500mg',
      lot: 'LOT001',
      quantite: 25,
      unite: 'boîtes',
      origine: 'Pharmacie Centrale',
      destination: 'Succursale A',
      statut: 'en_transit',
      utilisateurCreation: 'Marie Dubois',
      motif: 'Équilibrage des stocks'
    },
    {
      id: '3',
      date: new Date('2024-01-17T08:15:00'),
      numero: 'TRF003',
      produit: 'Ibuprofène 200mg',
      lot: 'LOT002',
      quantite: 30,
      unite: 'boîtes',
      origine: 'Succursale A',
      destination: 'Pharmacie Centrale',
      statut: 'en_cours',
      utilisateurCreation: 'Jean Martin',
      motif: 'Retour de surplus'
    }
  ];

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'recu':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'annule':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'en_transit':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'en_cours':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    const colors = {
      recu: 'bg-green-100 text-green-800 border-green-200',
      annule: 'bg-red-100 text-red-800 border-red-200',
      en_transit: 'bg-blue-100 text-blue-800 border-blue-200',
      en_cours: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      recu: 'Reçu',
      annule: 'Annulé',
      en_transit: 'En transit',
      en_cours: 'En cours'
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
    if (!formData.produit || !formData.lot || !formData.quantite || !formData.origine || !formData.destination || !formData.motif) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (formData.origine === formData.destination) {
      toast({
        title: "Erreur",
        description: "L'origine et la destination doivent être différentes",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Transfert créé",
      description: "Le transfert de stock a été créé avec succès",
    });

    setIsDialogOpen(false);
    setFormData({
      produit: '',
      lot: '',
      quantite: '',
      origine: '',
      destination: '',
      motif: '',
      commentaire: ''
    });
  };

  const filteredTransferts = transferts.filter(transfert => {
    const matchesSearch = transfert.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfert.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfert.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfert.origine.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfert.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = selectedStatut === 'tous' || transfert.statut === selectedStatut;
    
    return matchesSearch && matchesStatut;
  });

  return (
    <div className="space-y-6">
      {/* Métriques des transferts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transferts</p>
              <p className="text-2xl font-bold">{transferts.length}</p>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Transit</p>
              <p className="text-2xl font-bold text-blue-600">
                {transferts.filter(t => t.statut === 'en_transit').length}
              </p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Cours</p>
              <p className="text-2xl font-bold text-yellow-600">
                {transferts.filter(t => t.statut === 'en_cours').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Terminés</p>
              <p className="text-2xl font-bold text-green-600">
                {transferts.filter(t => t.statut === 'recu').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Liste des transferts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transferts de Stock</CardTitle>
              <CardDescription>Gestion des mouvements entre sites et succursales</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Transfert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un Transfert de Stock</DialogTitle>
                  <DialogDescription>
                    Transférez des produits entre différents sites ou succursales
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
                          <SelectItem value="doliprane">Doliprane 1000mg</SelectItem>
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
                          <SelectItem value="LOT004">LOT004</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantite">Quantité à transférer *</Label>
                    <Input
                      id="quantite"
                      type="number"
                      placeholder="Quantité"
                      value={formData.quantite}
                      onChange={(e) => setFormData({...formData, quantite: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="origine">Site d'origine *</Label>
                      <Select value={formData.origine} onValueChange={(value) => setFormData({...formData, origine: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Site d'origine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacie_centrale">Pharmacie Centrale</SelectItem>
                          <SelectItem value="succursale_a">Succursale A</SelectItem>
                          <SelectItem value="succursale_b">Succursale B</SelectItem>
                          <SelectItem value="entrepot">Entrepôt Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination">Site de destination *</Label>
                      <Select value={formData.destination} onValueChange={(value) => setFormData({...formData, destination: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Site de destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacie_centrale">Pharmacie Centrale</SelectItem>
                          <SelectItem value="succursale_a">Succursale A</SelectItem>
                          <SelectItem value="succursale_b">Succursale B</SelectItem>
                          <SelectItem value="entrepot">Entrepôt Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motif">Motif du transfert *</Label>
                    <Select value={formData.motif} onValueChange={(value) => setFormData({...formData, motif: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un motif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reapprovisionnement">Réapprovisionnement</SelectItem>
                        <SelectItem value="equilibrage">Équilibrage des stocks</SelectItem>
                        <SelectItem value="retour_surplus">Retour de surplus</SelectItem>
                        <SelectItem value="urgence">Besoin urgent</SelectItem>
                        <SelectItem value="reorganisation">Réorganisation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commentaire">Commentaire</Label>
                    <Textarea
                      id="commentaire"
                      placeholder="Informations complémentaires sur le transfert..."
                      value={formData.commentaire}
                      onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Créer le Transfert</Button>
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
                  placeholder="Rechercher transfert, produit, site..."
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
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="en_transit">En transit</SelectItem>
                <SelectItem value="recu">Reçu</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Transfert</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransferts.map((transfert) => (
                  <TableRow key={transfert.id}>
                    <TableCell className="font-medium">{transfert.numero}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(transfert.date, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>{transfert.produit}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transfert.lot}</Badge>
                    </TableCell>
                    <TableCell>{transfert.quantite} {transfert.unite}</TableCell>
                    <TableCell>{transfert.origine}</TableCell>
                    <TableCell>{transfert.destination}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatutIcon(transfert.statut)}
                        {getStatutBadge(transfert.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransferts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun transfert trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockTransfers;