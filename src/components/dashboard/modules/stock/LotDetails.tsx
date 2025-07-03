import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  History, 
  FileText, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Movement {
  id: string;
  date: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'transfert';
  quantite: number;
  motif: string;
  utilisateur: string;
  document?: string;
}

interface LotDetail {
  id: string;
  numero: string;
  produit: {
    nom: string;
    dci: string;
    forme: string;
    dosage: string;
  };
  fournisseur: {
    nom: string;
    contact: string;
    adresse: string;
  };
  dates: {
    fabrication: string;
    reception: string;
    expiration: string;
  };
  quantites: {
    initiale: number;
    actuelle: number;
    reservee: number;
    disponible: number;
  };
  emplacement: {
    rayon: string;
    etagere: string;
    position: string;
  };
  prix: {
    unitaire: number;
    total: number;
  };
  statut: 'actif' | 'perime' | 'critique' | 'epuise';
  controleQualite: {
    conforme: boolean;
    datControle: string;
    observations: string;
  };
  certifications: string[];
  movements: Movement[];
}

const LotDetails = () => {
  const [selectedLot, setSelectedLot] = useState<string>('LOT001-2024');
  const [searchTerm, setSearchTerm] = useState('');

  // Données mockées détaillées d'un lot
  const lotDetail: LotDetail = {
    id: '1',
    numero: 'LOT001-2024',
    produit: {
      nom: 'Paracétamol 500mg',
      dci: 'Paracétamol',
      forme: 'Comprimé',
      dosage: '500mg'
    },
    fournisseur: {
      nom: 'Laboratoire Alpha',
      contact: '+225 01 02 03 04',
      adresse: 'Abidjan, Côte d\'Ivoire'
    },
    dates: {
      fabrication: '2024-01-10',
      reception: '2024-01-15',
      expiration: '2025-01-15'
    },
    quantites: {
      initiale: 1000,
      actuelle: 750,
      reservee: 50,
      disponible: 700
    },
    emplacement: {
      rayon: 'A',
      etagere: '01',
      position: 'B'
    },
    prix: {
      unitaire: 25,
      total: 25000
    },
    statut: 'actif',
    controleQualite: {
      conforme: true,
      datControle: '2024-01-15',
      observations: 'Contrôle conforme aux standards'
    },
    certifications: ['ISO 9001', 'BPF', 'CE'],
    movements: [
      {
        id: '1',
        date: '2024-01-15',
        type: 'entree',
        quantite: 1000,
        motif: 'Réception commande',
        utilisateur: 'Admin',
        document: 'BON-001'
      },
      {
        id: '2',
        date: '2024-02-01',
        type: 'sortie',
        quantite: -150,
        motif: 'Vente pharmacie',
        utilisateur: 'Pharmacien',
        document: 'VENTE-045'
      },
      {
        id: '3',
        date: '2024-02-15',
        type: 'sortie',
        quantite: -100,
        motif: 'Vente comptoir',
        utilisateur: 'Vendeur1',
        document: 'VENTE-067'
      },
      {
        id: '4',
        date: '2024-03-01',
        type: 'ajustement',
        quantite: 0,
        motif: 'Inventaire mensuel',
        utilisateur: 'Admin',
        document: 'INV-003'
      }
    ]
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entree': return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'sortie': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'ajustement': return <History className="h-4 w-4 text-blue-600" />;
      case 'transfert': return <Truck className="h-4 w-4 text-purple-600" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entree': return 'bg-green-100 text-green-800';
      case 'sortie': return 'bg-red-100 text-red-800';
      case 'ajustement': return 'bg-blue-100 text-blue-800';
      case 'transfert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'critique': return 'bg-orange-100 text-orange-800';
      case 'perime': return 'bg-red-100 text-red-800';
      case 'epuise': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur de lot */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection du Lot</CardTitle>
          <CardDescription>Choisissez le lot à consulter en détail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher un lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedLot} onValueChange={setSelectedLot}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOT001-2024">LOT001-2024 - Paracétamol</SelectItem>
                <SelectItem value="LOT002-2024">LOT002-2024 - Ibuprofène</SelectItem>
                <SelectItem value="LOT003-2024">LOT003-2024 - Amoxicilline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="informations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="informations">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Informations</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="mouvements">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Mouvements</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="traçabilite">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Traçabilité</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="qualite">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Qualité</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Numéro de Lot</label>
                    <p className="font-semibold">{lotDetail.numero}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Statut</label>
                    <Badge className={`${getStatusColor(lotDetail.statut)} w-fit`}>
                      {lotDetail.statut}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Produit</label>
                  <div className="space-y-1">
                    <p className="font-semibold">{lotDetail.produit.nom}</p>
                    <div className="text-sm text-muted-foreground">
                      <p>DCI: {lotDetail.produit.dci}</p>
                      <p>Forme: {lotDetail.produit.forme}</p>
                      <p>Dosage: {lotDetail.produit.dosage}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fournisseur</label>
                  <div className="space-y-1">
                    <p className="font-semibold">{lotDetail.fournisseur.nom}</p>
                    <div className="text-sm text-muted-foreground">
                      <p>{lotDetail.fournisseur.contact}</p>
                      <p>{lotDetail.fournisseur.adresse}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dates Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de Fabrication</label>
                  <p className="font-semibold">{new Date(lotDetail.dates.fabrication).toLocaleDateString('fr-FR')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de Réception</label>
                  <p className="font-semibold">{new Date(lotDetail.dates.reception).toLocaleDateString('fr-FR')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date d'Expiration</label>
                  <p className="font-semibold text-orange-600">{new Date(lotDetail.dates.expiration).toLocaleDateString('fr-FR')}</p>
                </div>

                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Jours restants</label>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.ceil((new Date(lotDetail.dates.expiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quantités et stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Gestion des Quantités
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantité Initiale</label>
                    <p className="text-xl font-semibold">{lotDetail.quantites.initiale.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantité Actuelle</label>
                    <p className="text-xl font-semibold">{lotDetail.quantites.actuelle.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Réservée</label>
                    <p className="font-semibold text-orange-600">{lotDetail.quantites.reservee.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Disponible</label>
                    <p className="font-semibold text-green-600">{lotDetail.quantites.disponible.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Taux de Consommation</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${((lotDetail.quantites.initiale - lotDetail.quantites.actuelle) / lotDetail.quantites.initiale) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(((lotDetail.quantites.initiale - lotDetail.quantites.actuelle) / lotDetail.quantites.initiale) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emplacement et prix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Emplacement & Valorisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emplacement</label>
                  <p className="font-semibold text-lg">
                    {lotDetail.emplacement.rayon}-{lotDetail.emplacement.etagere}-{lotDetail.emplacement.position}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Prix Unitaire</label>
                    <p className="font-semibold">{lotDetail.prix.unitaire} F CFA</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valeur Actuelle</label>
                    <p className="font-semibold text-green-600">
                      {(lotDetail.quantites.actuelle * lotDetail.prix.unitaire).toLocaleString()} F CFA
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Valeur Initiale</label>
                  <p className="text-xl font-bold">{lotDetail.prix.total.toLocaleString()} F CFA</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mouvements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
              <CardDescription>Tous les mouvements de stock pour ce lot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Document</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotDetail.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <Badge className={`${getMovementColor(movement.type)} flex items-center gap-1 w-fit`}>
                            {getMovementIcon(movement.type)}
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={movement.quantite > 0 ? 'text-green-600' : 'text-red-600'}>
                          {movement.quantite > 0 ? '+' : ''}{movement.quantite}
                        </TableCell>
                        <TableCell>{movement.motif}</TableCell>
                        <TableCell>{movement.utilisateur}</TableCell>
                        <TableCell>
                          {movement.document && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              {movement.document}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traçabilite">
          <Card>
            <CardHeader>
              <CardTitle>Informations de Traçabilité</CardTitle>
              <CardDescription>Suivi complet de la chaîne d'approvisionnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {lotDetail.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Transport</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Transporteur:</span> LogiPharma SARL</p>
                      <p><span className="font-medium">Température:</span> 2-8°C</p>
                      <p><span className="font-medium">Conditions:</span> Chaîne froide respectée</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Documents Associés</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Bon de Commande
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Bon de Livraison
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Certificat d'Analyse
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Facture
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Contrôle Qualité
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualite">
          <Card>
            <CardHeader>
              <CardTitle>Contrôle Qualité</CardTitle>
              <CardDescription>Informations sur la conformité et les contrôles effectués</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  {lotDetail.controleQualite.conforme ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-semibold">
                      {lotDetail.controleQualite.conforme ? 'Lot Conforme' : 'Non Conforme'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Contrôle effectué le {new Date(lotDetail.controleQualite.datControle).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Observations</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {lotDetail.controleQualite.observations}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Tests Effectués</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Aspect visuel</span>
                      <Badge className="bg-green-100 text-green-800">Conforme</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Dosage</span>
                      <Badge className="bg-green-100 text-green-800">Conforme</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Pureté</span>
                      <Badge className="bg-green-100 text-green-800">Conforme</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Microbiologie</span>
                      <Badge className="bg-green-100 text-green-800">Conforme</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LotDetails;