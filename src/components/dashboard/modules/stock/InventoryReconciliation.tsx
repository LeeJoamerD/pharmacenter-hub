import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Eye,
  Edit,
  Check,
  X
} from 'lucide-react';

interface ReconciliationItem {
  id: string;
  produit: string;
  lot: string;
  emplacement: string;
  quantiteTheorique: number;
  quantiteComptee: number;
  ecart: number;
  ecartValeur: number;
  unite: string;
  statut: 'en_attente' | 'valide' | 'rejete' | 'corrige';
  motifEcart?: string;
  actionCorrective?: string;
  validePar?: string;
  dateValidation?: Date;
}

interface ReconciliationSummary {
  totalProduits: number;
  produitsEcart: number;
  ecartPositif: number;
  ecartNegatif: number;
  valeurEcartTotal: number;
  tauxPrecision: number;
}

const InventoryReconciliation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('tous');
  const [selectedSession, setSelectedSession] = useState<string>('session1');
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Données mockées pour la réconciliation
  const reconciliationItems: ReconciliationItem[] = [
    {
      id: '1',
      produit: 'Paracétamol 500mg',
      lot: 'LOT001',
      emplacement: 'A1-B2',
      quantiteTheorique: 50,
      quantiteComptee: 48,
      ecart: -2,
      ecartValeur: -24.50,
      unite: 'boîtes',
      statut: 'en_attente',
      motifEcart: 'Casse non déclarée'
    },
    {
      id: '2',
      produit: 'Ibuprofène 200mg',
      lot: 'LOT002',
      emplacement: 'B2-C1',
      quantiteTheorique: 30,
      quantiteComptee: 32,
      ecart: 2,
      ecartValeur: 18.60,
      unite: 'boîtes',
      statut: 'valide',
      validePar: 'Marie Dubois',
      dateValidation: new Date(),
      actionCorrective: 'Mise à jour stock suite réception non saisie'
    },
    {
      id: '3',
      produit: 'Aspirine 100mg',
      lot: 'LOT003',
      emplacement: 'C1-D3',
      quantiteTheorique: 25,
      quantiteComptee: 20,
      ecart: -5,
      ecartValeur: -37.50,
      unite: 'boîtes',
      statut: 'corrige',
      motifEcart: 'Erreur de rangement',
      actionCorrective: 'Produits retrouvés - emplacement corrigé'
    },
    {
      id: '4',
      produit: 'Doliprane 1000mg',
      lot: 'LOT004',
      emplacement: 'D3-E1',
      quantiteTheorique: 40,
      quantiteComptee: 45,
      ecart: 5,
      ecartValeur: 62.50,
      unite: 'boîtes',
      statut: 'rejete',
      motifEcart: 'Erreur de comptage suspecte'
    }
  ];

  const summary: ReconciliationSummary = {
    totalProduits: reconciliationItems.length,
    produitsEcart: reconciliationItems.filter(item => item.ecart !== 0).length,
    ecartPositif: reconciliationItems.filter(item => item.ecart > 0).length,
    ecartNegatif: reconciliationItems.filter(item => item.ecart < 0).length,
    valeurEcartTotal: reconciliationItems.reduce((acc, item) => acc + item.ecartValeur, 0),
    tauxPrecision: ((reconciliationItems.length - reconciliationItems.filter(item => item.ecart !== 0).length) / reconciliationItems.length) * 100
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'valide':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejete':
        return <X className="h-4 w-4 text-red-600" />;
      case 'corrige':
        return <Check className="h-4 w-4 text-blue-600" />;
      case 'en_attente':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors = {
      valide: 'bg-green-100 text-green-800 border-green-200',
      rejete: 'bg-red-100 text-red-800 border-red-200',
      corrige: 'bg-blue-100 text-blue-800 border-blue-200',
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const labels = {
      valide: 'Validé',
      rejete: 'Rejeté',
      corrige: 'Corrigé',
      en_attente: 'En attente'
    };

    return (
      <Badge className={colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[statut as keyof typeof labels] || statut}
      </Badge>
    );
  };

  const filteredItems = reconciliationItems.filter(item => {
    const matchesSearch = item.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.lot.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'tous' || item.statut === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleValidateItem = (itemId: string, action: 'valide' | 'rejete') => {
    // Logique de validation
    console.log(`${action} pour l'élément ${itemId}`);
  };

  const openDetailsDialog = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Résumé de la réconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits avec Écart</p>
              <p className="text-2xl font-bold text-orange-600">{summary.produitsEcart}</p>
              <p className="text-xs text-muted-foreground">sur {summary.totalProduits} produits</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taux de Précision</p>
              <p className="text-2xl font-bold text-green-600">{summary.tauxPrecision.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Produits conformes</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Écart Total</p>
              <p className={`text-2xl font-bold ${summary.valeurEcartTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.valeurEcartTotal.toFixed(2)} F CFA
              </p>
              <p className="text-xs text-muted-foreground">Impact financier</p>
            </div>
            {summary.valeurEcartTotal >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onglets de réconciliation */}
      <Tabs defaultValue="ecarts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ecarts">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Écarts Détectés</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="conformes">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Produits Conformes</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="synthese">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Synthèse</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ecarts">
          <Card>
            <CardHeader>
              <CardTitle>Écarts d'Inventaire</CardTitle>
              <CardDescription>Produits nécessitant une validation ou correction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher produits..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                    <SelectItem value="corrige">Corrigé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Qté Théorique</TableHead>
                      <TableHead>Qté Comptée</TableHead>
                      <TableHead>Écart</TableHead>
                      <TableHead>Valeur Écart</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.filter(item => item.ecart !== 0).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.produit}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.lot}</Badge>
                        </TableCell>
                        <TableCell>{item.quantiteTheorique} {item.unite}</TableCell>
                        <TableCell>{item.quantiteComptee} {item.unite}</TableCell>
                        <TableCell>
                          <span className={item.ecart > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.ecart > 0 ? '+' : ''}{item.ecart} {item.unite}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={item.ecartValeur > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.ecartValeur > 0 ? '+' : ''}{item.ecartValeur.toFixed(2)} F CFA
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.statut)}
                            {getStatusBadge(item.statut)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDetailsDialog(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.statut === 'en_attente' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleValidateItem(item.id, 'valide')}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleValidateItem(item.id, 'rejete')}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conformes">
          <Card>
            <CardHeader>
              <CardTitle>Produits Conformes</CardTitle>
              <CardDescription>Produits sans écart détecté</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationItems.filter(item => item.ecart === 0).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.produit}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.lot}</Badge>
                        </TableCell>
                        <TableCell>{item.emplacement}</TableCell>
                        <TableCell>{item.quantiteComptee} {item.unite}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Conforme
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synthese">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Écarts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span>Écarts Positifs</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{summary.ecartPositif}</div>
                      <div className="text-sm text-muted-foreground">produits</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span>Écarts Négatifs</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">{summary.ecartNegatif}</div>
                      <div className="text-sm text-muted-foreground">produits</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Requises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Écarts en attente de validation</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {reconciliationItems.filter(item => item.statut === 'en_attente').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Écarts nécessitant correction</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {reconciliationItems.filter(item => item.statut === 'rejete').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Écarts validés</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {reconciliationItems.filter(item => item.statut === 'valide').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog détails */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'Écart</DialogTitle>
            <DialogDescription>
              Informations détaillées sur l'écart d'inventaire
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Produit</Label>
                  <p className="font-medium">{selectedItem.produit}</p>
                </div>
                <div>
                  <Label>Lot</Label>
                  <p>{selectedItem.lot}</p>
                </div>
                <div>
                  <Label>Quantité Théorique</Label>
                  <p>{selectedItem.quantiteTheorique} {selectedItem.unite}</p>
                </div>
                <div>
                  <Label>Quantité Comptée</Label>
                  <p>{selectedItem.quantiteComptee} {selectedItem.unite}</p>
                </div>
              </div>
              {selectedItem.motifEcart && (
                <div>
                  <Label>Motif de l'Écart</Label>
                  <p className="text-sm text-muted-foreground">{selectedItem.motifEcart}</p>
                </div>
              )}
              {selectedItem.actionCorrective && (
                <div>
                  <Label>Action Corrective</Label>
                  <p className="text-sm text-muted-foreground">{selectedItem.actionCorrective}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryReconciliation;