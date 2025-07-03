import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Package, 
  TrendingDown,
  Search,
  Bell,
  Mail,
  Printer,
  Eye,
  Filter,
  Download
} from 'lucide-react';

interface ExpiringLot {
  id: string;
  numero: string;
  produit: string;
  quantite: number;
  dateExpiration: string;
  joursRestants: number;
  priorite: 'critique' | 'importante' | 'normale';
  fournisseur: string;
  emplacement: string;
  valeur: number;
  statut: 'actif' | 'action_requise' | 'traite';
}

const ExpirationAlert = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedPriority, setSelectedPriority] = useState('toutes');

  // Données mockées des lots proches de l'expiration
  const expiringLots: ExpiringLot[] = [
    {
      id: '1',
      numero: 'LOT003-2024',
      produit: 'Amoxicilline 250mg',
      quantite: 180,
      dateExpiration: '2024-12-31',
      joursRestants: 15,
      priorite: 'critique',
      fournisseur: 'Laboratoire Gamma',
      emplacement: 'C-01-C',
      valeur: 63000,
      statut: 'action_requise'
    },
    {
      id: '2',
      numero: 'LOT006-2024',
      produit: 'Vitamines B Complex',
      quantite: 50,
      dateExpiration: '2025-01-20',
      joursRestants: 35,
      priorite: 'importante',
      fournisseur: 'NutriPharma',
      emplacement: 'D-02-A',
      valeur: 15000,
      statut: 'actif'
    },
    {
      id: '3',
      numero: 'LOT007-2024',
      produit: 'Sirop Toux Enfant',
      quantite: 25,
      dateExpiration: '2025-02-10',
      joursRestants: 55,
      priorite: 'normale',
      fournisseur: 'Pharma Kids',
      emplacement: 'B-03-B',
      valeur: 12500,
      statut: 'actif'
    },
    {
      id: '4',
      numero: 'LOT008-2024',
      produit: 'Insuline Rapide',
      quantite: 10,
      dateExpiration: '2024-12-25',
      joursRestants: 9,
      priorite: 'critique',
      fournisseur: 'DiabetCare',
      emplacement: 'F-01-A',
      valeur: 45000,
      statut: 'action_requise'
    },
    {
      id: '5',
      numero: 'LOT009-2024',
      produit: 'Crème Hydratante',
      quantite: 75,
      dateExpiration: '2025-01-15',
      joursRestants: 30,
      priorite: 'normale',
      fournisseur: 'DermaPharma',
      emplacement: 'E-02-C',
      valeur: 18750,
      statut: 'actif'
    }
  ];

  const filteredLots = expiringLots.filter(lot => {
    const matchesSearch = lot.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.produit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = lot.joursRestants <= parseInt(selectedPeriod);
    const matchesPriority = selectedPriority === 'toutes' || lot.priorite === selectedPriority;
    
    return matchesSearch && matchesPeriod && matchesPriority;
  });

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'importante': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normale': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-blue-100 text-blue-800';
      case 'action_requise': return 'bg-red-100 text-red-800';
      case 'traite': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemainingColor = (jours: number) => {
    if (jours <= 7) return 'text-red-600 font-bold';
    if (jours <= 30) return 'text-orange-600 font-semibold';
    return 'text-yellow-600';
  };

  const getProgressColor = (jours: number) => {
    if (jours <= 7) return 'bg-red-500';
    if (jours <= 30) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const calculateProgress = (jours: number) => {
    const maxJours = 90; // Considérons 90 jours comme la période maximale
    return Math.max(0, Math.min(100, ((maxJours - jours) / maxJours) * 100));
  };

  const statsData = {
    totalLots: filteredLots.length,
    critique: filteredLots.filter(l => l.priorite === 'critique').length,
    importante: filteredLots.filter(l => l.priorite === 'importante').length,
    valeurTotale: filteredLots.reduce((sum, lot) => sum + lot.valeur, 0),
    quantiteTotale: filteredLots.reduce((sum, lot) => sum + lot.quantite, 0)
  };

  return (
    <div className="space-y-6">
      {/* Statistiques des alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Alertes</p>
                <p className="text-2xl font-bold">{statsData.totalLots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{statsData.critique}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Quantité Totale</p>
                <p className="text-2xl font-bold">{statsData.quantiteTotale.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valeur Risque</p>
                <p className="text-2xl font-bold">{statsData.valeurTotale.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertes de Péremption
          </CardTitle>
          <CardDescription>
            Surveillance des produits proches de leur date d'expiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par lot ou produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="15">15 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="60">60 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes priorités</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="importante">Importante</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Notifier
              </Button>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/50 rounded-lg">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Configurer Alertes
            </Button>
            <Button variant="outline" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Créer Commande Urgente
            </Button>
            <Button variant="outline" size="sm">
              <TrendingDown className="h-4 w-4 mr-2" />
              Promotion Flash
            </Button>
          </div>

          {/* Tableau des alertes */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot / Produit</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Urgence</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => (
                  <TableRow key={lot.id} className={lot.priorite === 'critique' ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lot.numero}</p>
                        <p className="text-sm text-muted-foreground">{lot.produit}</p>
                        <p className="text-xs text-muted-foreground">{lot.emplacement}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">
                            {new Date(lot.dateExpiration).toLocaleDateString('fr-FR')}
                          </p>
                          <p className={`text-xs ${getDaysRemainingColor(lot.joursRestants)}`}>
                            {lot.joursRestants} jours restants
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-semibold">{lot.quantite}</p>
                        <p className="text-xs text-muted-foreground">unités</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(lot.priorite)} border`}>
                        {lot.priorite}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Urgence</span>
                          <span>{Math.round(calculateProgress(lot.joursRestants))}%</span>
                        </div>
                        <Progress 
                          value={calculateProgress(lot.joursRestants)} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{lot.valeur.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">F CFA</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lot.statut)}>
                        {lot.statut.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={lot.priorite === 'critique' ? 'destructive' : 'default'} 
                          size="sm"
                        >
                          {lot.priorite === 'critique' ? 'Action Immédiate' : 'Planifier'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLots.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune alerte trouvée</h3>
              <p className="text-muted-foreground">
                Aucun lot ne correspond aux critères de recherche sélectionnés.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommandations d'actions */}
      {statsData.critique > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Actions Recommandées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded border">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Promotion immédiate des lots critiques</p>
                  <p className="text-sm text-muted-foreground">
                    {statsData.critique} lots expirent dans moins de 15 jours
                  </p>
                </div>
                <Button variant="outline" size="sm">Créer Promotion</Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded border">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Contact fournisseurs pour retours</p>
                  <p className="text-sm text-muted-foreground">
                    Vérifier les conditions de retour des produits non vendus
                  </p>
                </div>
                <Button variant="outline" size="sm">Contacter</Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded border">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">Réajuster les commandes futures</p>
                  <p className="text-sm text-muted-foreground">
                    Adapter les quantités commandées pour éviter les péremptions
                  </p>
                </div>
                <Button variant="outline" size="sm">Analyser</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpirationAlert;