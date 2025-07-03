import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Package, ShoppingCart, Search, Filter, Download } from 'lucide-react';

interface LowStockItem {
  id: string;
  codeProduit: string;
  nomProduit: string;
  dci: string;
  quantiteActuelle: number;
  seuilMinimum: number;
  seuilOptimal: number;
  unite: string;
  categorie: string;
  fournisseurPrincipal: string;
  prixUnitaire: number;
  valeurStock: number;
  dernierMouvement: Date;
  statut: 'critique' | 'faible' | 'attention';
}

const LowStockAlerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Données mockées
  const lowStockItems: LowStockItem[] = [
    {
      id: '1',
      codeProduit: 'PAR500',
      nomProduit: 'Paracétamol 500mg',
      dci: 'Paracétamol',
      quantiteActuelle: 5,
      seuilMinimum: 10,
      seuilOptimal: 50,
      unite: 'boîtes',
      categorie: 'Antalgiques',
      fournisseurPrincipal: 'PharmaDist',
      prixUnitaire: 850,
      valeurStock: 4250,
      dernierMouvement: new Date('2024-01-14'),
      statut: 'critique'
    },
    {
      id: '2',
      codeProduit: 'IBU200',
      nomProduit: 'Ibuprofène 200mg',
      dci: 'Ibuprofène',
      quantiteActuelle: 8,
      seuilMinimum: 15,
      seuilOptimal: 40,
      unite: 'boîtes',
      categorie: 'Anti-inflammatoires',
      fournisseurPrincipal: 'MediSupply',
      prixUnitaire: 1200,
      valeurStock: 9600,
      dernierMouvement: new Date('2024-01-13'),
      statut: 'critique'
    },
    {
      id: '3',
      codeProduit: 'ASP100',
      nomProduit: 'Aspirine 100mg',
      dci: 'Acide acétylsalicylique',
      quantiteActuelle: 12,
      seuilMinimum: 20,
      seuilOptimal: 60,
      unite: 'boîtes',
      categorie: 'Antiagrégants',
      fournisseurPrincipal: 'PharmaDist',
      prixUnitaire: 750,
      valeurStock: 9000,
      dernierMouvement: new Date('2024-01-12'),
      statut: 'faible'
    },
    {
      id: '4',
      codeProduit: 'AMX500',
      nomProduit: 'Amoxicilline 500mg',
      dci: 'Amoxicilline',
      quantiteActuelle: 18,
      seuilMinimum: 25,
      seuilOptimal: 80,
      unite: 'boîtes',
      categorie: 'Antibiotiques',
      fournisseurPrincipal: 'BioMed',
      prixUnitaire: 2500,
      valeurStock: 45000,
      dernierMouvement: new Date('2024-01-11'),
      statut: 'attention'
    }
  ];

  const getStatusBadge = (statut: string) => {
    const configs = {
      critique: { variant: 'destructive', label: 'Critique' },
      faible: { variant: 'default', label: 'Faible' },
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
    const className = statut === 'critique' ? 'text-red-500' : 
                     statut === 'faible' ? 'text-orange-500' : 'text-yellow-500';
    return <AlertTriangle className={`h-4 w-4 ${className}`} />;
  };

  const filteredItems = lowStockItems.filter(item => {
    const matchesSearch = item.nomProduit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codeProduit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.dci.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.categorie === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.statut === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValeurRisque = filteredItems.reduce((sum, item) => sum + item.valeurStock, 0);

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Alerte</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredItems.filter(i => i.statut === 'critique').length} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur à Risque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValeurRisque.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Stock sous seuil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Requises</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredItems.filter(i => i.statut === 'critique').length + filteredItems.filter(i => i.statut === 'faible').length}
            </div>
            <p className="text-xs text-muted-foreground">Commandes nécessaires</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Surveillance Stock Faible</CardTitle>
          <CardDescription>Produits nécessitant un réapprovisionnement urgent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, code ou DCI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="Antalgiques">Antalgiques</SelectItem>
                  <SelectItem value="Anti-inflammatoires">Anti-inflammatoires</SelectItem>
                  <SelectItem value="Antibiotiques">Antibiotiques</SelectItem>
                  <SelectItem value="Antiagrégants">Antiagrégants</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="attention">Attention</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Table des alertes */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock Actuel</TableHead>
                  <TableHead>Seuils</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Dernier Mvt</TableHead>
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
                        <div className="text-sm text-muted-foreground">
                          {item.codeProduit} - {item.dci}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{item.quantiteActuelle}</div>
                        <div className="text-xs text-muted-foreground">{item.unite}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Min: {item.seuilMinimum}</div>
                        <div className="text-muted-foreground">Opt: {item.seuilOptimal}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.fournisseurPrincipal}</TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div>{item.valeurStock.toLocaleString()} F</div>
                        <div className="text-xs text-muted-foreground">
                          {item.prixUnitaire.toLocaleString()} F/u
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.dernierMouvement.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <ShoppingCart className="h-4 w-4" />
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

export default LowStockAlerts;