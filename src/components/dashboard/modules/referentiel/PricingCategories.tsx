import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, FileText, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useUnifiedPricingParams } from '@/hooks/useUnifiedPricingParams';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface PricingCategory {
  id: string;
  tenant_id: string;
  libelle_categorie: string;
  taux_tva: number;
  taux_centime_additionnel: number;
  coefficient_prix_vente: number;
  created_at: string;
  updated_at: string;
}

const PricingCategories = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const queryClient = useQueryClient();
  const { formatNumber, getCurrencySymbol, getInputStep, isNoDecimalCurrency, formatPercentage } = useCurrencyFormatting();
  const { params: pricingParams } = useUnifiedPricingParams();

  // Fetch categories from database
  const { data: categories = [], isLoading, error } = useTenantQueryWithCache(
    ['pricing-categories'],
    'categorie_tarification',
    '*',
    {},
    { orderBy: { column: 'libelle_categorie', ascending: true } }
  );

  // Mutations
  const createCategory = useTenantMutation('categorie_tarification', 'insert', {
    invalidateQueries: ['pricing-categories'],
    onSuccess: () => {
      toast({
        title: "Catégorie ajoutée",
        description: "La catégorie de tarification a été ajoutée avec succès.",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset({
        libelle_categorie: '',
        taux_tva: 0,
        taux_centime_additionnel: 0,
        coefficient_prix_vente: 0
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateCategory = useTenantMutation('categorie_tarification', 'update', {
    invalidateQueries: ['pricing-categories'],
    onSuccess: () => {
      toast({
        title: "Catégorie modifiée",
        description: "La catégorie de tarification a été modifiée avec succès.",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset({
        libelle_categorie: '',
        taux_tva: 0,
        taux_centime_additionnel: 0,
        coefficient_prix_vente: 0
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la modification: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const deleteCategory = useTenantMutation('categorie_tarification', 'delete', {
    invalidateQueries: ['pricing-categories'],
    onSuccess: () => {
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie de tarification a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PricingCategory | null>(null);
  const { toast } = useToast();

  // --- ÉTATS POUR LE SIMULATEUR ---
  const [simulationPurchasePrice, setSimulationPurchasePrice] = useState<number | string>('');
  const [selectedSimulationCategoryId, setSelectedSimulationCategoryId] = useState<string | null>(null);
  const [simulatedSalePriceHT, setSimulatedSalePriceHT] = useState(0);
  const [simulatedTVA, setSimulatedTVA] = useState(0);
  const [simulatedCentimeAdditionnel, setSimulatedCentimeAdditionnel] = useState(0);
  const [simulatedSalePriceTTC, setSimulatedSalePriceTTC] = useState(0);
  const [simulatedArrondissement, setSimulatedArrondissement] = useState(0);


  const form = useForm<Partial<PricingCategory>>({
    defaultValues: {
      libelle_categorie: '',
      taux_tva: 0,
      taux_centime_additionnel: 0,
      coefficient_prix_vente: 0
    }
  });

  const filteredCategories = categories.filter(category =>
    category.libelle_categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGIQUE DE CALCUL POUR LE SIMULATEUR (UTILISE LE SERVICE UNIFIÉ) ---
  useEffect(() => {
    if (simulationPurchasePrice && selectedSimulationCategoryId) {
      const category = categories.find(cat => cat.id === selectedSimulationCategoryId);
      const purchasePrice = typeof simulationPurchasePrice === 'string' ? parseFloat(simulationPurchasePrice) : simulationPurchasePrice;

      if (category && !isNaN(purchasePrice) && purchasePrice > 0) {
        // Utiliser le service de prix unifié avec tous les paramètres
        const result = unifiedPricingService.calculateSalePrice({
          prixAchat: purchasePrice,
          coefficientPrixVente: category.coefficient_prix_vente,
          tauxTVA: category.taux_tva,
          tauxCentimeAdditionnel: category.taux_centime_additionnel,
          roundingPrecision: pricingParams.roundingPrecision,
          roundingMethod: pricingParams.taxRoundingMethod,
          currencyCode: pricingParams.currencyCode
        });

        setSimulatedSalePriceHT(result.prixVenteHT);
        setSimulatedTVA(result.montantTVA);
        setSimulatedCentimeAdditionnel(result.montantCentimeAdditionnel);
        setSimulatedSalePriceTTC(result.prixVenteTTC);
        setSimulatedArrondissement(result.arrondissementApplique);
      }
    } else {
        // Reset values if inputs are cleared
        setSimulatedSalePriceHT(0);
        setSimulatedTVA(0);
        setSimulatedCentimeAdditionnel(0);
        setSimulatedSalePriceTTC(0);
        setSimulatedArrondissement(0);
    }
  }, [simulationPurchasePrice, selectedSimulationCategoryId, categories, pricingParams]);


  const handleAddCategory = () => {
    setEditingCategory(null);
    form.reset({
      libelle_categorie: '',
      taux_tva: 0,
      taux_centime_additionnel: 0,
      coefficient_prix_vente: 0
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: PricingCategory) => {
    setEditingCategory(category);
    form.reset(category);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory.mutate({
      id: categoryId
    });
  };

  const onSubmit = (data: Partial<PricingCategory>) => {
    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        libelle_categorie: data.libelle_categorie!,
        taux_tva: data.taux_tva!,
        taux_centime_additionnel: data.taux_centime_additionnel!,
        coefficient_prix_vente: data.coefficient_prix_vente!
      });
    } else {
      createCategory.mutate({
        libelle_categorie: data.libelle_categorie!,
        taux_tva: data.taux_tva!,
        taux_centime_additionnel: data.taux_centime_additionnel!,
        coefficient_prix_vente: data.coefficient_prix_vente!
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestion des Catégories de Tarification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Catégorie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les paramètres de tarification pour cette catégorie.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="libelle_categorie"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Libellé de la catégorie *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Médicaments essentiels" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taux_tva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux TVA (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taux_centime_additionnel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux centime additionnel (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coefficient_prix_vente"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Coefficient prix de vente</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Annuler
                    </Button>
                    <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                      {editingCategory ? 'Modifier' : 'Ajouter'}
                    </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">Erreur: {error.message}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Taux TVA (%)</TableHead>
                  <TableHead>Taux centime add. (%)</TableHead>
                  <TableHead>Coefficient prix vente</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Aucune catégorie trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.libelle_categorie}</TableCell>
                      <TableCell>{category.taux_tva?.toFixed(2)}%</TableCell>
                      <TableCell>{category.taux_centime_additionnel?.toFixed(2)}%</TableCell>
                      <TableCell>{category.coefficient_prix_vente?.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* --- BLOC SIMULATEUR AVEC ARRONDI DE PRÉCISION --- */}
          <div className="mt-8">
            <Separator />
            <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">Calcul du Prix de Vente (Simulation)</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-xs">
                          <strong>Paramètres appliqués:</strong><br/>
                          • Précision d'arrondi: {pricingParams.roundingPrecision}<br/>
                          • Méthode: {pricingParams.taxRoundingMethod === 'ceil' ? 'Supérieur' : pricingParams.taxRoundingMethod === 'floor' ? 'Inférieur' : 'Au plus proche'}<br/>
                          • Devise: {pricingParams.currencyCode}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                    Entrez un prix d'achat et sélectionnez une catégorie pour simuler le calcul du prix de vente.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="simulation_purchase_price">Prix d'achat ({getCurrencySymbol()})</Label>
                        <Input
                            id="simulation_purchase_price"
                            type="number"
                            step={getInputStep()}
                            placeholder={isNoDecimalCurrency() ? "0" : "0.00"}
                            value={simulationPurchasePrice}
                            onChange={(e) => setSimulationPurchasePrice(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="simulation_category">Catégorie</Label>
                        <Select
                            value={selectedSimulationCategoryId || ''}
                            onValueChange={(value) => setSelectedSimulationCategoryId(value)}
                        >
                            <SelectTrigger id="simulation_category" className="w-full">
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.libelle_categorie}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="simulated_sale_price_ht">Prix HT ({getCurrencySymbol()})</Label>
                        <Input id="simulated_sale_price_ht" value={formatNumber(simulatedSalePriceHT)} readOnly className="w-full bg-muted" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="simulated_tva">TVA ({getCurrencySymbol()})</Label>
                        <Input id="simulated_tva" value={formatNumber(simulatedTVA)} readOnly className="w-full bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="simulated_centime_additionnel">Centime ({getCurrencySymbol()})</Label>
                        <Input id="simulated_centime_additionnel" value={formatNumber(simulatedCentimeAdditionnel)} readOnly className="w-full bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="simulated_arrondissement">Arrondi ({getCurrencySymbol()})</Label>
                        <Input 
                          id="simulated_arrondissement" 
                          value={simulatedArrondissement >= 0 ? `+${formatNumber(simulatedArrondissement)}` : formatNumber(simulatedArrondissement)} 
                          readOnly 
                          className={`w-full bg-muted ${simulatedArrondissement !== 0 ? 'text-amber-600 font-medium' : ''}`} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="simulated_sale_price_ttc" className="font-bold">Prix TTC ({getCurrencySymbol()})</Label>
                        <Input id="simulated_sale_price_ttc" value={formatNumber(simulatedSalePriceTTC)} readOnly className="w-full bg-muted font-bold text-base border-primary" />
                    </div>
                </div>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCategories;
