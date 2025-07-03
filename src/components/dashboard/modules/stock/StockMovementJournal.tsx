import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowRightLeft,
  Calendar as CalendarIcon,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StockMovement {
  id: string;
  date: Date;
  type: 'entrée' | 'sortie' | 'transfert' | 'ajustement';
  produit: string;
  lot: string;
  quantite: number;
  unite: string;
  raison: string;
  utilisateur: string;
  reference?: string;
}

const StockMovementJournal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('tous');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Données mockées pour le journal des mouvements
  const mouvements: StockMovement[] = [
    {
      id: '1',
      date: new Date('2024-01-15T10:30:00'),
      type: 'entrée',
      produit: 'Paracétamol 500mg',
      lot: 'LOT001',
      quantite: 100,
      unite: 'boîtes',
      raison: 'Réception commande CMD001',
      utilisateur: 'Marie Dubois',
      reference: 'CMD001'
    },
    {
      id: '2',
      date: new Date('2024-01-15T14:15:00'),
      type: 'sortie',
      produit: 'Ibuprofène 200mg',
      lot: 'LOT002',
      quantite: 25,
      unite: 'boîtes',
      raison: 'Vente ordinaire',
      utilisateur: 'Jean Martin'
    },
    {
      id: '3',
      date: new Date('2024-01-15T16:45:00'),
      type: 'ajustement',
      produit: 'Aspirine 100mg',
      lot: 'LOT003',
      quantite: -5,
      unite: 'boîtes',
      raison: 'Casse constatée',
      utilisateur: 'Marie Dubois'
    },
    {
      id: '4',
      date: new Date('2024-01-16T09:20:00'),
      type: 'transfert',
      produit: 'Doliprane 1000mg',
      lot: 'LOT004',
      quantite: 50,
      unite: 'boîtes',
      raison: 'Transfert vers succursale B',
      utilisateur: 'Pierre Durand'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entrée':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sortie':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transfert':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      case 'ajustement':
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      entrée: 'bg-green-100 text-green-800 border-green-200',
      sortie: 'bg-red-100 text-red-800 border-red-200',
      transfert: 'bg-blue-100 text-blue-800 border-blue-200',
      ajustement: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredMovements = mouvements.filter(mouvement => {
    const matchesSearch = mouvement.produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mouvement.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mouvement.raison.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'tous' || mouvement.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Mouvements</p>
              <p className="text-2xl font-bold">{mouvements.length}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entrées Aujourd'hui</p>
              <p className="text-2xl font-bold text-green-600">1</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sorties Aujourd'hui</p>
              <p className="text-2xl font-bold text-red-600">1</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ajustements</p>
              <p className="text-2xl font-bold text-orange-600">1</p>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Journal des Mouvements</CardTitle>
          <CardDescription>Historique complet de tous les mouvements de stock</CardDescription>
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

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type mouvement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="entrée">Entrée</SelectItem>
                <SelectItem value="sortie">Sortie</SelectItem>
                <SelectItem value="transfert">Transfert</SelectItem>
                <SelectItem value="ajustement">Ajustement</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Période
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Tableau des mouvements */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((mouvement) => (
                  <TableRow key={mouvement.id}>
                    <TableCell className="font-mono text-sm">
                      {format(mouvement.date, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(mouvement.type)}
                        {getTypeBadge(mouvement.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{mouvement.produit}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{mouvement.lot}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={mouvement.quantite > 0 ? 'text-green-600' : 'text-red-600'}>
                        {mouvement.quantite > 0 ? '+' : ''}{mouvement.quantite} {mouvement.unite}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{mouvement.raison}</TableCell>
                    <TableCell>{mouvement.utilisateur}</TableCell>
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

          {filteredMovements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun mouvement trouvé pour les critères sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovementJournal;