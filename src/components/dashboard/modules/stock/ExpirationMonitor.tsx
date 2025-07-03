import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, AlertTriangle, Package, Calendar, Search, Download, Tag } from 'lucide-react';

interface ExpirationItem {
  id: string;
  codeProduit: string;
  nomProduit: string;
  lot: string;
  quantite: number;
  unite: string;
  dateExpiration: Date;
  joursRestants: number;
  valeurStock: number;
  fournisseur: string;
  emplacement: string;
  statut: 'expire' | 'critique' | 'proche' | 'attention';
}

const ExpirationMonitor = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Données mockées
  const expirationItems: ExpirationItem[] = [
    {
      id: '1',
      codeProduit: 'IBU200',
      nomProduit: 'Ibuprofène 200mg',
      lot: 'LOT2024-001',
      quantite: 25,
      unite: 'boîtes',
      dateExpiration: new Date('2024-02-15'),
      joursRestants: 31,
      valeurStock: 30000,
      fournisseur: 'MediSupply',
      emplacement: 'A1-B2',
      statut: 'proche'
    },
    {
      id: '2',
      codeProduit: 'PAR500',
      nomProduit: 'Paracétamol 500mg',
      lot: 'LOT2024-002',
      quantite: 15,
      unite: 'boîtes',
      dateExpiration: new Date('2024-01-25'),
      joursRestants: 10,
      valeurStock: 12750,
      fournisseur: 'PharmaDist',
      emplacement: 'B2-C1',
      statut: 'critique'
    },
    {
      id: '3',
      codeProduit: 'AMX500',
      nomProduit: 'Amoxicilline 500mg',
      lot: 'LOT2023-045',
      quantite: 8,
      unite: 'boîtes',
      dateExpiration: new Date('2024-01-18'),
      joursRestants: 3,
      valeurStock: 20000,
      fournisseur: 'BioMed',
      emplacement: 'C1-D3',
      statut: 'critique'
    },
    {
      id: '4',
      codeProduit: 'ASP100',
      nomProduit: 'Aspirine 100mg',
      lot: 'LOT2023-089',
      quantite: 5,
      unite: 'boîtes',
      dateExpiration: new Date('2024-01-16'),
      joursRestants: 1,
      valeurStock: 3750,
      fournisseur: 'PharmaDist',
      emplacement: 'D3-E1',
      statut: 'expire'
    },
    {
      id: '5',
      codeProduit: 'DIC75',
      nomProduit: 'Diclofénac 75mg',
      lot: 'LOT2024-003',
      quantite: 40,
      unite: 'boîtes',
      dateExpiration: new Date('2024-03-20'),
      joursRestants: 65,
      valeurStock: 48000,
      fournisseur: 'MediSupply',
      emplacement: 'E1-F2',
      statut: 'attention'
    }
  ];

  const getStatusBadge = (statut: string) => {
    const configs = {
      expire: { variant: 'destructive', label: 'Expiré' },
      critique: { variant: 'destructive', label: 'Critique' },
      proche: { variant: 'default', label: 'Proche' },
      attention: { variant: 'secondary', label: 'Attention' }
    };
    
    const config = configs[statut as keyof typeof configs];
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (statut: string) => {
    const className = statut === 'expire' || statut === 'critique' ? 'text-red-500' : 
                     statut === 'proche' ? 'text-orange-500' : 'text-yellow-500';
    return <Clock className={`h-4 w-4 ${className}`} />;
  };

  const filteredItems = expirationItems.filter(item => {
    const matchesSearch = item.nomProduit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codeProduit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.lot.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriod = filterPeriod === 'all' || 
                         (filterPeriod === '7' && item.joursRestants <= 7) ||
                         (filterPeriod === '30' && item.joursRestants <= 30) ||
                         (filterPeriod === '90' && item.joursRestants <= 90);
    
    const matchesStatus = filterStatus === 'all' || item.statut === filterStatus;
    
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const summary = {
    expires: filteredItems.filter(i => i.statut === 'expire').length,
    critiques: filteredItems.filter(i => i.statut === 'critique').length,
    proches: filteredItems.filter(i => i.statut === 'proche').length,
    totalValeur: filteredItems.reduce((sum, item) => sum + item.valeurStock, 0)
  };

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirés</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary.expires}</div>
            <p className="text-xs text-muted-foreground">À retirer immédiatement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary.critiques}</div>
            <p className="text-xs text-muted-foreground">Moins de 15 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proches</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{summary.proches}</div>
            <p className="text-xs text-muted-foreground">Dans 30 jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur à Risque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalValeur.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Stock concerné</p>
          </CardContent>
        </Card>
      </div>

      {/* Surveillance des expirations */}
      <Card>
        <CardHeader>
          <CardTitle>Surveillance des Expirations</CardTitle>
          <CardDescription>Suivi des médicaments approchant de leur date d'expiration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code ou lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="expire">Expiré</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="proche">Proche</SelectItem>
                  <SelectItem value="attention">Attention</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Table des expirations */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Jours Restants</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.statut)}
                        {getStatusBadge(item.statut)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.nomProduit}</div>
                        <div className="text-sm text-muted-foreground">{item.codeProduit}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.lot}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{item.quantite}</div>
                        <div className="text-xs text-muted-foreground">{item.unite}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.dateExpiration.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-center font-medium ${
                        item.joursRestants <= 0 ? 'text-red-600' :
                        item.joursRestants <= 7 ? 'text-red-500' :
                        item.joursRestants <= 30 ? 'text-orange-500' : 'text-green-600'
                      }`}>
                        {item.joursRestants <= 0 ? 'Expiré' : `${item.joursRestants}j`}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.valeurStock.toLocaleString()} F
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{item.emplacement}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Package className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpirationMonitor;