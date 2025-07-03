import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Percent, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PricingConfig = () => {
  const { toast } = useToast();
  
  const [pricingConfig, setPricingConfig] = useState({
    defaultMargin: 30,
    minimumMargin: 10,
    maximumMargin: 100,
    priceRoundingMethod: 'nearest',
    priceRoundingValue: 5,
    autoUpdatePrices: true,
    includeTaxInPrice: true,
    defaultTaxRate: 18,
    allowDiscounts: true,
    maxDiscountPercent: 20,
    requireDiscountApproval: true,
    showCostToCustomers: false
  });

  const [marginRules, setMarginRules] = useState([
    { id: 1, category: 'Médicaments', margin: 25, minPrice: 100, maxPrice: 50000, active: true },
    { id: 2, category: 'Génériques', margin: 35, minPrice: 50, maxPrice: 10000, active: true },
    { id: 3, category: 'Produits de beauté', margin: 50, minPrice: 500, maxPrice: 25000, active: true },
    { id: 4, category: 'Matériel médical', margin: 40, minPrice: 1000, maxPrice: 100000, active: false }
  ]);

  const [priceCategories, setPriceCategories] = useState([
    { id: 1, name: 'Client normal', multiplier: 1.0, description: 'Prix de vente standard', active: true },
    { id: 2, name: 'Grossiste', multiplier: 0.85, description: 'Remise grossiste 15%', active: true },
    { id: 3, name: 'Professionnel santé', multiplier: 0.90, description: 'Remise professionnels 10%', active: true },
    { id: 4, name: 'Employé', multiplier: 0.80, description: 'Remise employé 20%', active: false }
  ]);

  const handleConfigChange = (key: string, value: any) => {
    setPricingConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleMarginRuleChange = (id: number, field: string, value: any) => {
    setMarginRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleCategoryChange = (id: number, field: string, value: any) => {
    setPriceCategories(prev => 
      prev.map(category => 
        category.id === id ? { ...category, [field]: value } : category
      )
    );
  };

  const handleSave = () => {
    toast({
      title: "Configuration tarifaire sauvegardée",
      description: "Les paramètres de tarification ont été mis à jour.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Marges par Défaut
            </CardTitle>
            <CardDescription>
              Configuration des marges commerciales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultMargin">Marge par défaut (%)</Label>
              <Input
                id="defaultMargin"
                type="number"
                min="0"
                max="200"
                value={pricingConfig.defaultMargin}
                onChange={(e) => handleConfigChange('defaultMargin', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumMargin">Marge minimum (%)</Label>
              <Input
                id="minimumMargin"
                type="number"
                min="0"
                max="100"
                value={pricingConfig.minimumMargin}
                onChange={(e) => handleConfigChange('minimumMargin', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maximumMargin">Marge maximum (%)</Label>
              <Input
                id="maximumMargin"
                type="number"
                min="0"
                max="500"
                value={pricingConfig.maximumMargin}
                onChange={(e) => handleConfigChange('maximumMargin', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoUpdatePrices">Mise à jour automatique</Label>
              <Switch
                id="autoUpdatePrices"
                checked={pricingConfig.autoUpdatePrices}
                onCheckedChange={(checked) => handleConfigChange('autoUpdatePrices', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Paramètres Prix
            </CardTitle>
            <CardDescription>
              Arrondis et taxes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priceRoundingMethod">Méthode d'arrondi</Label>
              <Select 
                value={pricingConfig.priceRoundingMethod} 
                onValueChange={(value) => handleConfigChange('priceRoundingMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearest">Au plus proche</SelectItem>
                  <SelectItem value="up">Arrondi supérieur</SelectItem>
                  <SelectItem value="down">Arrondi inférieur</SelectItem>
                  <SelectItem value="none">Aucun arrondi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priceRoundingValue">Valeur d'arrondi (FCFA)</Label>
              <Input
                id="priceRoundingValue"
                type="number"
                min="1"
                max="1000"
                value={pricingConfig.priceRoundingValue}
                onChange={(e) => handleConfigChange('priceRoundingValue', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Taux de TVA par défaut (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="50"
                value={pricingConfig.defaultTaxRate}
                onChange={(e) => handleConfigChange('defaultTaxRate', Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeTaxInPrice">Prix TTC par défaut</Label>
              <Switch
                id="includeTaxInPrice"
                checked={pricingConfig.includeTaxInPrice}
                onCheckedChange={(checked) => handleConfigChange('includeTaxInPrice', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Règles de Marge par Catégorie</CardTitle>
              <CardDescription>
                Configuration des marges spécifiques par catégorie de produits
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>Marge (%)</TableHead>
                <TableHead>Prix min (FCFA)</TableHead>
                <TableHead>Prix max (FCFA)</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marginRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.category}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.margin}
                      onChange={(e) => handleMarginRuleChange(rule.id, 'margin', Number(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.minPrice}
                      onChange={(e) => handleMarginRuleChange(rule.id, 'minPrice', Number(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.maxPrice}
                      onChange={(e) => handleMarginRuleChange(rule.id, 'maxPrice', Number(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.active ? "default" : "secondary"}>
                      {rule.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catégories de Prix</CardTitle>
              <CardDescription>
                Différents niveaux de prix pour les types de clients
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Multiplicateur</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="2.0"
                      value={category.multiplier}
                      onChange={(e) => handleCategoryChange(category.id, 'multiplier', Number(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>
                    <Badge variant={category.active ? "default" : "secondary"}>
                      {category.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
};

export default PricingConfig;