import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Percent, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useMarginRules } from '@/hooks/useMarginRules';
import { usePriceCategories } from '@/hooks/usePriceCategories';
import { useTenant } from '@/contexts/TenantContext';

const PricingConfig = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { settings, loading: settingsLoading, saveSettings, isUpdating: settingsUpdating } = usePricingSettings();
  const { rules, loading: rulesLoading, createRule, updateRule, deleteRule, isUpdating: rulesUpdating } = useMarginRules();
  const { categories, loading: categoriesLoading, createCategory, updateCategory, deleteCategory, isUpdating: categoriesUpdating } = usePriceCategories();
  
  const [pricingConfig, setPricingConfig] = useState({
    defaultMargin: 20,
    minimumMargin: 5,
    maximumMargin: 100,
    priceRoundingMethod: 'Nearest',
    priceRoundingValue: 0.01,
    autoUpdatePrices: false,
    includeTaxInPrice: true,
    defaultTaxRate: 19.25,
    defaultCentimeAdditionnelRate: 0.175,
    allowDiscounts: true,
    maxDiscountPercent: 10,
    requireDiscountApproval: false,
    showCostToCustomers: false
  });

  // Load settings from database when available
  useEffect(() => {
    if (settings) {
      setPricingConfig({
        defaultMargin: settings.default_margin || 20,
        minimumMargin: settings.minimum_margin || 5,
        maximumMargin: settings.maximum_margin || 100,
        priceRoundingMethod: settings.price_rounding_method || 'Nearest',
        priceRoundingValue: settings.price_rounding_value || 0.01,
        autoUpdatePrices: settings.auto_update_prices || false,
        includeTaxInPrice: settings.include_tax_in_price || true,
        defaultTaxRate: settings.default_tax_rate || 19.25,
        defaultCentimeAdditionnelRate: settings.default_centime_additionnel_rate || 0.175,
        allowDiscounts: settings.allow_discounts || true,
        maxDiscountPercent: settings.max_discount_percent || 10,
        requireDiscountApproval: settings.require_discount_approval || false,
        showCostToCustomers: settings.show_cost_to_customers || false
      });
    }
  }, [settings]);

  const handleConfigChange = (key: string, value: any) => {
    setPricingConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleMarginRuleChange = async (id: string, field: string, value: any) => {
    try {
      await updateRule({ id, [field]: value });
    } catch (error) {
      console.error('Error updating margin rule:', error);
    }
  };

  const handleCategoryChange = async (id: string, field: string, value: any) => {
    try {
      await updateCategory({ id, [field]: value });
    } catch (error) {
      console.error('Error updating price category:', error);
    }
  };

  const handleCreateMarginRule = async () => {
    if (!tenantId) return;
    
    try {
      await createRule({
        tenant_id: tenantId,
        category: 'Nouvelle catégorie',
        margin: 20,
        min_price: 0,
        active: true
      });
    } catch (error) {
      console.error('Error creating margin rule:', error);
    }
  };

  const handleCreatePriceCategory = async () => {
    if (!tenantId) return;
    
    try {
      await createCategory({
        tenant_id: tenantId,
        libelle_categorie: 'Nouvelle catégorie',
        coefficient_prix_vente: 1.0,
        taux_tva: 19.25,
        taux_centime_additionnel: 0.175,
        description: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error creating price category:', error);
    }
  };

  const handleDeleteMarginRule = async (id: string) => {
    try {
      await deleteRule(id);
    } catch (error) {
      console.error('Error deleting margin rule:', error);
    }
  };

  const handleDeletePriceCategory = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (error) {
      console.error('Error deleting price category:', error);
    }
  };

  const handleSave = async () => {
    if (!tenantId) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder sans tenant ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveSettings({
        tenant_id: tenantId,
        default_margin: pricingConfig.defaultMargin,
        minimum_margin: pricingConfig.minimumMargin,
        maximum_margin: pricingConfig.maximumMargin,
        price_rounding_method: pricingConfig.priceRoundingMethod,
        price_rounding_value: pricingConfig.priceRoundingValue,
        auto_update_prices: pricingConfig.autoUpdatePrices,
        include_tax_in_price: pricingConfig.includeTaxInPrice,
        default_tax_rate: pricingConfig.defaultTaxRate,
        default_centime_additionnel_rate: pricingConfig.defaultCentimeAdditionnelRate,
        allow_discounts: pricingConfig.allowDiscounts,
        max_discount_percent: pricingConfig.maxDiscountPercent,
        require_discount_approval: pricingConfig.requireDiscountApproval,
        show_cost_to_customers: pricingConfig.showCostToCustomers,
      });
    } catch (error) {
      console.error('Error saving pricing settings:', error);
    }
  };

  if (settingsLoading || rulesLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

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
                step="0.01"
                value={pricingConfig.defaultTaxRate}
                onChange={(e) => handleConfigChange('defaultTaxRate', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultCentimeAdditionnelRate">Taux de Centime Additionnel par défaut (%)</Label>
              <Input
                id="defaultCentimeAdditionnelRate"
                type="number"
                min="0"
                max="5"
                step="0.001"
                value={pricingConfig.defaultCentimeAdditionnelRate}
                onChange={(e) => handleConfigChange('defaultCentimeAdditionnelRate', Number(e.target.value))}
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
            <Button onClick={handleCreateMarginRule} disabled={rulesUpdating}>
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
              {rules && rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <Input
                      type="text"
                      value={rule.category}
                      onChange={(e) => handleMarginRuleChange(rule.id, 'category', e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
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
                      value={rule.min_price}
                      onChange={(e) => handleMarginRuleChange(rule.id, 'min_price', Number(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.max_price || ''}
                      onChange={(e) => handleMarginRuleChange(rule.id, 'max_price', e.target.value ? Number(e.target.value) : null)}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMarginRuleChange(rule.id, 'active', !rule.active)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteMarginRule(rule.id)}
                        disabled={rulesUpdating}
                      >
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
            <Button onClick={handleCreatePriceCategory} disabled={categoriesUpdating}>
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
              {categories && categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <Input
                      type="text"
                      value={category.libelle_categorie}
                      onChange={(e) => handleCategoryChange(category.id, 'libelle_categorie', e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="2.0"
                      value={category.coefficient_prix_vente}
                      onChange={(e) => handleCategoryChange(category.id, 'coefficient_prix_vente', Number(e.target.value))}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={category.description || ''}
                      onChange={(e) => handleCategoryChange(category.id, 'description', e.target.value)}
                      className="w-40"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCategoryChange(category.id, 'is_active', !category.is_active)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePriceCategory(category.id)}
                        disabled={categoriesUpdating}
                      >
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
        <Button onClick={handleSave} disabled={settingsUpdating}>
          {settingsUpdating ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
};

export default PricingConfig;