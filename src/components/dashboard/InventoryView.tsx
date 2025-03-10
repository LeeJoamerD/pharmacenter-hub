
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, PackagePlus, PackageCheck, AlertTriangle, Clock, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

// Types pour les produits en stock
interface StockItem {
  id: string;
  name: string;
  category: string;
  supplier: string;
  price: number; // Prix d'achat
  sellingPrice: number; // Prix de vente
  stock: number;
  minStock: number; // Seuil d'alerte stock bas
  expiryDate?: string; // Date d'expiration si applicable
}

// Catégories de produits
const categories = [
  "Analgésique",
  "Anti-inflammatoire",
  "Antibiotique",
  "Antiseptique",
  "Antitussif",
  "Dermatologique",
  "Gastro-entérologique",
  "Homéopathie",
  "Supplément",
  "Tous"
];

const InventoryView = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiryDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Données de stock fictives pour la démo
  const stockItems: StockItem[] = [
    { id: 's1', name: 'Aspirine 500mg', category: 'Analgésique', supplier: 'Bayer', price: 3.50, sellingPrice: 6.99, stock: 42, minStock: 20, expiryDate: '2025-06-30' },
    { id: 's2', name: 'Ibuprofène 400mg', category: 'Anti-inflammatoire', supplier: 'Pfizer', price: 2.80, sellingPrice: 5.50, stock: 28, minStock: 15, expiryDate: '2025-04-15' },
    { id: 's3', name: 'Paracétamol 1g', category: 'Analgésique', supplier: 'Sanofi', price: 2.10, sellingPrice: 4.25, stock: 56, minStock: 30, expiryDate: '2025-07-22' },
    { id: 's4', name: 'Amoxicilline 500mg', category: 'Antibiotique', supplier: 'Sandoz', price: 6.70, sellingPrice: 12.80, stock: 15, minStock: 20, expiryDate: '2024-11-10' },
    { id: 's5', name: 'Vitamine C 1000mg', category: 'Supplément', supplier: 'Mylan', price: 4.20, sellingPrice: 7.95, stock: 33, minStock: 25, expiryDate: '2025-09-18' },
    { id: 's6', name: 'Doliprane 1000mg', category: 'Analgésique', supplier: 'Sanofi', price: 2.30, sellingPrice: 4.50, stock: 48, minStock: 25, expiryDate: '2025-03-05' },
    { id: 's7', name: 'Bétadine 10%', category: 'Antiseptique', supplier: 'Meda Pharma', price: 5.10, sellingPrice: 8.75, stock: 19, minStock: 20, expiryDate: '2026-01-15' },
    { id: 's8', name: 'Smecta sachet', category: 'Gastro-entérologique', supplier: 'Ipsen', price: 4.90, sellingPrice: 9.30, stock: 27, minStock: 15, expiryDate: '2025-05-20' },
    { id: 's9', name: 'Arnica Montana 9CH', category: 'Homéopathie', supplier: 'Boiron', price: 3.80, sellingPrice: 6.45, stock: 22, minStock: 15, expiryDate: '2025-12-01' },
    { id: 's10', name: 'Crème hydratante', category: 'Dermatologique', supplier: 'La Roche-Posay', price: 8.40, sellingPrice: 15.90, stock: 12, minStock: 10, expiryDate: '2025-08-12' },
  ];
  
  // Filtrer les produits selon les critères
  const filteredItems = stockItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Trier les produits
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'stock') {
      return sortDirection === 'asc' 
        ? a.stock - b.stock
        : b.stock - a.stock;
    } else if (sortBy === 'expiryDate') {
      return sortDirection === 'asc'
        ? (a.expiryDate || '').localeCompare(b.expiryDate || '')
        : (b.expiryDate || '').localeCompare(a.expiryDate || '');
    }
    return 0;
  });
  
  // Changer le critère de tri
  const handleSort = (criteria: 'name' | 'stock' | 'expiryDate') => {
    if (sortBy === criteria) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortDirection('asc');
    }
  };

  // Vérifier si un produit a un stock bas
  const hasLowStock = (item: StockItem) => item.stock < item.minStock;
  
  // Vérifier si un produit est proche de la date d'expiration (moins de 3 mois)
  const isNearExpiry = (item: StockItem) => {
    if (!item.expiryDate) return false;
    
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    
    return expiry <= threeMonthsFromNow && expiry > today;
  };
  
  // Simuler l'ajout de stock
  const handleAddStock = (itemId: string) => {
    toast({
      title: "Stock mis à jour",
      description: "La quantité a été augmentée.",
    });
  };
  
  // Ouvrir le formulaire pour commander un produit
  const handleOrderItem = (item: StockItem) => {
    toast({
      title: "Commande en cours",
      description: `Produit: ${item.name} - Fournisseur: ${item.supplier}`,
    });
  };
  
  // Statistiques sur le stock
  const stockStats = {
    totalItems: stockItems.length,
    lowStock: stockItems.filter(item => hasLowStock(item)).length,
    nearExpiry: stockItems.filter(item => isNearExpiry(item)).length
  };
  
  return (
    <div className="space-y-6">
      {/* Statistiques du stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Produits en inventaire</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Produits sous le seuil minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proche expiration</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.nearExpiry}</div>
            <p className="text-xs text-muted-foreground">Expirent dans les 3 mois</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des produits</CardTitle>
          <CardDescription>Gérez votre stock de médicaments et produits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit ou fournisseur..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Button>
              <PackagePlus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Button>
          </div>
          
          {/* Tableau des produits */}
          <div className="rounded-md border">
            <div className="overflow-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-transparent font-medium"
                        onClick={() => handleSort('name')}
                      >
                        Produit
                        {sortBy === 'name' && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-2 font-medium">Catégorie</th>
                    <th className="text-left p-2 font-medium">Fournisseur</th>
                    <th className="text-left p-2 font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-transparent font-medium"
                        onClick={() => handleSort('stock')}
                      >
                        Stock
                        {sortBy === 'stock' && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-2 font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-transparent font-medium"
                        onClick={() => handleSort('expiryDate')}
                      >
                        Expiration
                        {sortBy === 'expiryDate' && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                    </th>
                    <th className="text-left p-2 font-medium">Prix d'achat</th>
                    <th className="text-left p-2 font-medium">Prix de vente</th>
                    <th className="text-center p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedItems.map(item => (
                    <tr key={item.id} className={`${hasLowStock(item) ? 'bg-amber-50' : ''} ${isNearExpiry(item) ? 'bg-red-50' : ''}`}>
                      <td className="p-2">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="p-2 text-sm">{item.category}</td>
                      <td className="p-2 text-sm">{item.supplier}</td>
                      <td className="p-2">
                        <div className={`${hasLowStock(item) ? 'text-amber-600 font-semibold' : ''}`}>
                          {item.stock}
                          {hasLowStock(item) && <span className="ml-1 text-xs">({item.minStock} min)</span>}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className={`${isNearExpiry(item) ? 'text-red-600 font-semibold' : ''}`}>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="p-2">{formatPrice(item.price)}</td>
                      <td className="p-2">{formatPrice(item.sellingPrice)}</td>
                      <td className="p-2">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAddStock(item.id)}>
                            <PackagePlus className="h-4 w-4" />
                          </Button>
                          {hasLowStock(item) && (
                            <Button variant="outline" size="sm" onClick={() => handleOrderItem(item)}>
                              <PackageCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-muted-foreground">
                        Aucun produit ne correspond aux critères de recherche
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            {sortedItems.length} produit{sortedItems.length !== 1 ? 's' : ''} affiché{sortedItems.length !== 1 ? 's' : ''}
          </div>
          <Button variant="outline" size="sm">
            Exporter
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InventoryView;
