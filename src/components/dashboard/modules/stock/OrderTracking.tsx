import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  Building
} from 'lucide-react';

interface OrderTracking {
  id: string;
  numero: string;
  fournisseur: string;
  dateCommande: string;
  dateLivraison: string;
  statut: 'preparation' | 'expedie' | 'en-transit' | 'livre' | 'retard';
  progression: number;
  transporteur: string;
  numeroSuivi: string;
  adresseLivraison: string;
  etapes: TrackingStep[];
}

interface TrackingStep {
  id: string;
  libelle: string;
  date: string;
  statut: 'complete' | 'en-cours' | 'en-attente';
  commentaire?: string;
}

const OrderTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');

  // Données mockées du suivi des commandes
  const trackingData: OrderTracking[] = [
    {
      id: '1',
      numero: 'CMD-2024-001',
      fournisseur: 'Laboratoire Alpha',
      dateCommande: '2024-12-01',
      dateLivraison: '2024-12-15',
      statut: 'en-transit',
      progression: 75,
      transporteur: 'Express Pharma',
      numeroSuivi: 'EP2024120001',
      adresseLivraison: '123 Rue de la Pharmacie, Dakar',
      etapes: [
        { id: '1', libelle: 'Commande confirmée', date: '2024-12-01 10:00', statut: 'complete' },
        { id: '2', libelle: 'Préparation en cours', date: '2024-12-02 09:00', statut: 'complete' },
        { id: '3', libelle: 'Expédié', date: '2024-12-03 14:30', statut: 'complete' },
        { id: '4', libelle: 'En transit', date: '2024-12-04 08:00', statut: 'en-cours', commentaire: 'Arrivé à l\'entrepôt de transit Dakar' },
        { id: '5', libelle: 'Livraison prévue', date: '2024-12-15 10:00', statut: 'en-attente' }
      ]
    },
    {
      id: '2',
      numero: 'CMD-2024-002',
      fournisseur: 'Pharma Beta',
      dateCommande: '2024-12-02',
      dateLivraison: '2024-12-16',
      statut: 'expedie',
      progression: 50,
      transporteur: 'Logistique Santé',
      numeroSuivi: 'LS2024120002',
      adresseLivraison: '456 Avenue Pasteur, Thiès',
      etapes: [
        { id: '1', libelle: 'Commande confirmée', date: '2024-12-02 11:30', statut: 'complete' },
        { id: '2', libelle: 'Préparation en cours', date: '2024-12-03 08:00', statut: 'complete' },
        { id: '3', libelle: 'Expédié', date: '2024-12-04 16:00', statut: 'en-cours', commentaire: 'Colis pris en charge par le transporteur' },
        { id: '4', libelle: 'En transit', date: '2024-12-16 10:00', statut: 'en-attente' },
        { id: '5', libelle: 'Livraison prévue', date: '2024-12-16 10:00', statut: 'en-attente' }
      ]
    },
    {
      id: '3',
      numero: 'CMD-2024-003',
      fournisseur: 'Laboratoire Gamma',
      dateCommande: '2024-11-28',
      dateLivraison: '2024-12-12',
      statut: 'retard',
      progression: 60,
      transporteur: 'Transport Médical',
      numeroSuivi: 'TM2024112801',
      adresseLivraison: '789 Boulevard de la République, Saint-Louis',
      etapes: [
        { id: '1', libelle: 'Commande confirmée', date: '2024-11-28 15:00', statut: 'complete' },
        { id: '2', libelle: 'Préparation en cours', date: '2024-11-29 10:00', statut: 'complete' },
        { id: '3', libelle: 'Retard de production', date: '2024-12-01 09:00', statut: 'en-cours', commentaire: 'Retard fournisseur - nouveau délai: 18/12' },
        { id: '4', libelle: 'En transit', date: '2024-12-18 10:00', statut: 'en-attente' },
        { id: '5', libelle: 'Livraison prévue', date: '2024-12-18 10:00', statut: 'en-attente' }
      ]
    }
  ];

  const filteredTracking = trackingData.filter(order => {
    const matchesSearch = order.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.fournisseur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'tous' || order.statut === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'preparation': return 'bg-blue-100 text-blue-800';
      case 'expedie': return 'bg-purple-100 text-purple-800';
      case 'en-transit': return 'bg-orange-100 text-orange-800';
      case 'livre': return 'bg-green-100 text-green-800';
      case 'retard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'preparation': return <Package className="h-4 w-4" />;
      case 'expedie': return <Truck className="h-4 w-4" />;
      case 'en-transit': return <RefreshCw className="h-4 w-4" />;
      case 'livre': return <CheckCircle className="h-4 w-4" />;
      case 'retard': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStepStatusColor = (statut: string) => {
    switch (statut) {
      case 'complete': return 'text-green-600';
      case 'en-cours': return 'text-blue-600';
      case 'en-attente': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStepIcon = (statut: string) => {
    switch (statut) {
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'en-cours': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'en-attente': return <Clock className="h-5 w-5 text-gray-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">En Préparation</p>
                <p className="text-2xl font-bold">{trackingData.filter(o => o.statut === 'preparation').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">En Transit</p>
                <p className="text-2xl font-bold">{trackingData.filter(o => ['expedie', 'en-transit'].includes(o.statut)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">En Retard</p>
                <p className="text-2xl font-bold">{trackingData.filter(o => o.statut === 'retard').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Livrées</p>
                <p className="text-2xl font-bold">{trackingData.filter(o => o.statut === 'livre').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi des Commandes en Temps Réel</CardTitle>
          <CardDescription>Suivez l'état d'avancement de toutes vos commandes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro de commande ou fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="preparation">Préparation</SelectItem>
                <SelectItem value="expedie">Expédié</SelectItem>
                <SelectItem value="en-transit">En Transit</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
                <SelectItem value="retard">Retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des commandes en suivi */}
          <div className="space-y-6">
            {filteredTracking.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations générales */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{order.numero}</h3>
                        <Badge className={`${getStatusColor(order.statut)} flex items-center gap-1`}>
                          {getStatusIcon(order.statut)}
                          {order.statut}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{order.fournisseur}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Commandé le {new Date(order.dateCommande).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{order.transporteur}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>N° Suivi: {order.numeroSuivi}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{order.adresseLivraison}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progression:</span>
                          <span className="font-medium">{order.progression}%</span>
                        </div>
                        <Progress value={order.progression} className="h-2" />
                      </div>
                    </div>

                    {/* Étapes de suivi */}
                    <div className="lg:col-span-2">
                      <h4 className="font-medium mb-4">Historique du suivi</h4>
                      <div className="space-y-3">
                        {order.etapes.map((etape, index) => (
                          <div key={etape.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getStepIcon(etape.statut)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium ${getStepStatusColor(etape.statut)}`}>
                                  {etape.libelle}
                                </p>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(etape.date).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              {etape.commentaire && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {etape.commentaire}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Phone className="mr-2 h-4 w-4" />
                      Contacter Transporteur
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Voir Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;