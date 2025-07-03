import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';

interface Lot {
  id: string;
  numero: string;
  produit: string;
  fournisseur: string;
  dateReception: string;
  dateExpiration: string;
  quantiteInitiale: number;
  quantiteActuelle: number;
  statut: 'actif' | 'perime' | 'critique' | 'epuise';
  emplacement: string;
  prix: number;
}

const LotTracker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  const [selectedSupplier, setSelectedSupplier] = useState('tous');

  // Données mockées des lots
  const lots: Lot[] = [
    {
      id: '1',
      numero: 'LOT001-2024',
      produit: 'Paracétamol 500mg',
      fournisseur: 'Laboratoire Alpha',
      dateReception: '2024-01-15',
      dateExpiration: '2025-01-15',
      quantiteInitiale: 1000,
      quantiteActuelle: 750,
      statut: 'actif',
      emplacement: 'A-01-B',
      prix: 25000
    },
    {
      id: '2',
      numero: 'LOT002-2024',
      produit: 'Ibuprofène 200mg',
      fournisseur: 'Pharma Beta',
      dateReception: '2024-02-10',
      dateExpiration: '2025-08-15',
      quantiteInitiale: 500,
      quantiteActuelle: 50,
      statut: 'critique',
      emplacement: 'B-02-A',
      prix: 15000
    },
    {
      id: '3',
      numero: 'LOT003-2024',
      produit: 'Amoxicilline 250mg',
      fournisseur: 'Laboratoire Gamma',
      dateReception: '2024-03-05',
      dateExpiration: '2024-12-31',
      quantiteInitiale: 200,
      quantiteActuelle: 180,
      statut: 'perime',
      emplacement: 'C-01-C',
      prix: 35000
    },
    {
      id: '4',
      numero: 'LOT004-2024',
      produit: 'Vitamine C 500mg',
      fournisseur: 'NutriPharma',
      dateReception: '2024-04-20',
      dateExpiration: '2026-04-20',
      quantiteInitiale: 800,
      quantiteActuelle: 800,
      statut: 'actif',
      emplacement: 'D-03-A',
      prix: 12000
    },
    {
      id: '5',
      numero: 'LOT005-2024',
      produit: 'Aspirine 100mg',
      fournisseur: 'Laboratoire Alpha',
      dateReception: '2024-05-12',
      dateExpiration: '2025-05-12',
      quantiteInitiale: 300,
      quantiteActuelle: 0,
      statut: 'epuise',
      emplacement: 'A-02-B',
      prix: 18000
    }
  ];

  const fournisseurs = [...new Set(lots.map(lot => lot.fournisseur))];

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lot.produit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'tous' || lot.statut === selectedStatus;
    const matchesSupplier = selectedSupplier === 'tous' || lot.fournisseur === selectedSupplier;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'critique': return 'bg-orange-100 text-orange-800';
      case 'perime': return 'bg-red-100 text-red-800';
      case 'epuise': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'actif': return <CheckCircle className="h-4 w-4" />;
      case 'critique': return <AlertTriangle className="h-4 w-4" />;
      case 'perime': return <AlertTriangle className="h-4 w-4" />;
      case 'epuise': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getProgressPercentage = (actuelle: number, initiale: number) => {
    return Math.round((actuelle / initiale) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Lots Actifs</p>
                <p className="text-2xl font-bold">{lots.filter(l => l.statut === 'actif').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Stock Critique</p>
                <p className="text-2xl font-bold">{lots.filter(l => l.statut === 'critique').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Périmés</p>
                <p className="text-2xl font-bold">{lots.filter(l => l.statut === 'perime').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Lots</p>
                <p className="text-2xl font-bold">{lots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi des Lots</CardTitle>
          <CardDescription>Vue d'ensemble de tous les lots en stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro de lot ou produit..."
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
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="perime">Périmé</SelectItem>
                <SelectItem value="epuise">Épuisé</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les fournisseurs</SelectItem>
                {fournisseurs.map(fournisseur => (
                  <SelectItem key={fournisseur} value={fournisseur}>
                    {fournisseur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des lots */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de Lot</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => {
                  const percentage = getProgressPercentage(lot.quantiteActuelle, lot.quantiteInitiale);
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.numero}</TableCell>
                      <TableCell>{lot.produit}</TableCell>
                      <TableCell>{lot.fournisseur}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(lot.dateExpiration).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lot.quantiteActuelle} / {lot.quantiteInitiale}</div>
                          <div className="text-muted-foreground">unités</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(percentage)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(lot.statut)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(lot.statut)}
                          {lot.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LotTracker;