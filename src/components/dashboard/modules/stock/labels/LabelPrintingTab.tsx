import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, RefreshCw, Search, Wand2, CheckSquare, Square, Tag, Package, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLabelPrinting } from '@/hooks/useLabelPrinting';
import { useLotLabelPrinting } from '@/hooks/useLotLabelPrinting';
import { useReceptionLabelPrinting } from '@/hooks/useReceptionLabelPrinting';
import { LABEL_SIZES, LabelConfig } from '@/utils/labelPrinterEnhanced';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

const LabelPrintingTab = () => {
  const { t } = useLanguage();
  const { formatAmount } = useCurrencyFormatting();
  const [searchTerm, setSearchTerm] = useState('');
  const [lotSearchTerm, setLotSearchTerm] = useState('');
  const [receptionSearchTerm, setReceptionSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'lots' | 'receptions'>('products');
  
  // Hook pour les produits
  const {
    products,
    loading: productsLoading,
    generating: productsGenerating,
    selectedProducts,
    config: productsConfig,
    setConfig: setProductsConfig,
    fetchProducts,
    generateCodesForSelected,
    printLabels: printProductLabels,
    toggleProduct,
    selectAll: selectAllProducts,
    deselectAll: deselectAllProducts
  } = useLabelPrinting();

  // Hook pour les lots
  const {
    lots,
    loading: lotsLoading,
    generating: lotsGenerating,
    selectedLots,
    config: lotsConfig,
    setConfig: setLotsConfig,
    fetchLots,
    printLotLabelsAction,
    toggleLot,
    selectAllLots,
    deselectAllLots
  } = useLotLabelPrinting();

  // Hook pour les réceptions
  const {
    receptions,
    selectedReception,
    lotsFromReception,
    loading: receptionsLoading,
    lotsLoading: receptionLotsLoading,
    generating: receptionsGenerating,
    selectedLots: selectedReceptionLots,
    config: receptionsConfig,
    setConfig: setReceptionsConfig,
    fetchReceptions,
    selectReception,
    printReceptionLotLabels,
    toggleLot: toggleReceptionLot,
    selectAllLots: selectAllReceptionLots,
    deselectAllLots: deselectAllReceptionLots,
    clearSelection: clearReceptionSelection
  } = useReceptionLabelPrinting();

  // Charger les produits/lots au montage
  useEffect(() => {
    fetchProducts();
    fetchLots();
  }, [fetchProducts, fetchLots]);

  // Recherche produits avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  // Recherche lots avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLots(lotSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [lotSearchTerm, fetchLots]);

  // Recherche réceptions avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReceptions(receptionSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [receptionSearchTerm, fetchReceptions]);

  const handleProductConfigChange = (key: keyof LabelConfig, value: number | boolean | string) => {
    setProductsConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLotConfigChange = (key: keyof LabelConfig, value: number | boolean | string) => {
    setLotsConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleReceptionConfigChange = (key: keyof LabelConfig, value: number | boolean | string) => {
    setReceptionsConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSizeChange = (sizeLabel: string, tab: 'products' | 'lots' | 'receptions' = 'products') => {
    const size = LABEL_SIZES.find(s => s.label === sizeLabel);
    if (size) {
      if (tab === 'lots') {
        setLotsConfig(prev => ({ ...prev, width: size.width, height: size.height }));
      } else if (tab === 'receptions') {
        setReceptionsConfig(prev => ({ ...prev, width: size.width, height: size.height }));
      } else {
        setProductsConfig(prev => ({ ...prev, width: size.width, height: size.height }));
      }
    }
  };

  const getCurrentSizeLabel = (config: LabelConfig) => {
    return LABEL_SIZES.find(s => s.width === config.width && s.height === config.height)?.label || '50 × 30 mm';
  };

  const productsWithoutCode = products.filter(
    p => selectedProducts.has(p.id) && !p.code_cip && !p.code_barre_externe
  ).length;

  const loading = activeTab === 'products' ? productsLoading : activeTab === 'lots' ? lotsLoading : receptionsLoading;
  const generating = activeTab === 'products' ? productsGenerating : activeTab === 'lots' ? lotsGenerating : receptionsGenerating;

  return (
    <div className="space-y-6">
      {/* En-tête avec onglets */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Impression d'étiquettes</h3>
        </div>
        <Badge variant="secondary">
          {activeTab === 'products' 
            ? `${selectedProducts.size} produit(s) sélectionné(s)`
            : activeTab === 'lots'
              ? `${selectedLots.size} lot(s) sélectionné(s)`
              : `${selectedReceptionLots.size} lot(s) sélectionné(s)`
          }
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'lots' | 'receptions')}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="lots" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lots
          </TabsTrigger>
          <TabsTrigger value="receptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Par Réception
          </TabsTrigger>
        </TabsList>

        {/* Onglet Produits */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section Configuration Produits */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Taille d'étiquette */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taille d'étiquette</label>
                  <Select value={getCurrentSizeLabel(productsConfig)} onValueChange={(v) => handleSizeChange(v, 'products')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LABEL_SIZES.map(size => (
                        <SelectItem key={size.label} value={size.label}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de code-barres */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de code-barres</label>
                  <Select 
                    value={productsConfig.barcodeType} 
                    onValueChange={(v) => handleProductConfigChange('barcodeType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code128">Code 128 (recommandé)</SelectItem>
                      <SelectItem value="ean13">EAN-13</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantité par produit */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantité par produit</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={productsConfig.quantity}
                    onChange={(e) => handleProductConfigChange('quantity', parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Options d'affichage */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Options d'affichage</label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDci"
                      checked={productsConfig.includeDci}
                      onCheckedChange={(v) => handleProductConfigChange('includeDci', !!v)}
                    />
                    <label htmlFor="includeDci" className="text-sm cursor-pointer">
                      Inclure le DCI
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeLot"
                      checked={productsConfig.includeLot}
                      onCheckedChange={(v) => handleProductConfigChange('includeLot', !!v)}
                    />
                    <label htmlFor="includeLot" className="text-sm cursor-pointer">
                      Inclure le numéro de lot
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeExpiry"
                      checked={productsConfig.includeExpiry}
                      onCheckedChange={(v) => handleProductConfigChange('includeExpiry', !!v)}
                    />
                    <label htmlFor="includeExpiry" className="text-sm cursor-pointer">
                      Inclure la date d'expiration
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  {productsWithoutCode > 0 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={generateCodesForSelected}
                      disabled={generating}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Générer codes ({productsWithoutCode})
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    onClick={printProductLabels}
                    disabled={selectedProducts.size === 0 || generating}
                  >
                    {generating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Imprimer les étiquettes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Section Liste des produits */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sélection des produits</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllProducts}>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Tout
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAllProducts}>
                      <Square className="h-4 w-4 mr-1" />
                      Aucun
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Barre de recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tableau des produits */}
                <div className="border rounded-lg max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Code CIP</TableHead>
                        <TableHead>Code Interne</TableHead>
                        <TableHead>Laboratoire</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun produit trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow 
                            key={product.id}
                            className={selectedProducts.has(product.id) ? 'bg-muted/50' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedProducts.has(product.id)}
                                onCheckedChange={() => toggleProduct(product.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                {product.libelle_produit}
                                {product.dci_nom && (
                                  <div className="text-xs text-muted-foreground italic">
                                    {product.dci_nom}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.code_cip || (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {product.code_barre_externe ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {product.code_barre_externe}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {product.laboratoire_libelle ? (
                                <span className="text-sm">
                                  {product.laboratoire_libelle}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatAmount(product.prix_vente_ttc || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Info produits sans code */}
                {productsWithoutCode > 0 && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning-foreground">
                    <strong>{productsWithoutCode}</strong> produit(s) sélectionné(s) n'ont pas de code-barres. 
                    Utilisez le bouton "Générer codes" pour créer des codes internes automatiquement.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Lots */}
        <TabsContent value="lots">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section Configuration Lots */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configuration Lots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Taille d'étiquette */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taille d'étiquette</label>
                  <Select value={getCurrentSizeLabel(lotsConfig)} onValueChange={(v) => handleSizeChange(v, 'lots')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LABEL_SIZES.map(size => (
                        <SelectItem key={size.label} value={size.label}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantité par lot */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantité par lot</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={lotsConfig.quantity}
                    onChange={(e) => handleLotConfigChange('quantity', parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Options d'affichage */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Options d'affichage</label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lotIncludeDci"
                      checked={lotsConfig.includeDci}
                      onCheckedChange={(v) => handleLotConfigChange('includeDci', !!v)}
                    />
                    <label htmlFor="lotIncludeDci" className="text-sm cursor-pointer">
                      Inclure le DCI
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lotIncludeLot"
                      checked={lotsConfig.includeLot}
                      onCheckedChange={(v) => handleLotConfigChange('includeLot', !!v)}
                    />
                    <label htmlFor="lotIncludeLot" className="text-sm cursor-pointer">
                      Inclure le numéro de lot
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lotIncludeExpiry"
                      checked={lotsConfig.includeExpiry}
                      onCheckedChange={(v) => handleLotConfigChange('includeExpiry', !!v)}
                    />
                    <label htmlFor="lotIncludeExpiry" className="text-sm cursor-pointer">
                      Inclure la date d'expiration
                    </label>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  Les étiquettes lots utilisent le <strong>code-barres unique</strong> généré lors de la réception 
                  (format: LOT-XXXX-YYMMDD-NNNNN). Ce code permet de tracer chaque lot individuellement au POS.
                </div>

                {/* Actions */}
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={printLotLabelsAction}
                    disabled={selectedLots.size === 0 || lotsGenerating}
                  >
                    {lotsGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Imprimer étiquettes lots
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Section Liste des lots */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sélection des lots</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllLots}>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Tout
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAllLots}>
                      <Square className="h-4 w-4 mr-1" />
                      Aucun
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Barre de recherche */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par produit, numéro de lot ou code-barres..."
                    value={lotSearchTerm}
                    onChange={(e) => setLotSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tableau des lots */}
                <div className="border rounded-lg max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>DCI</TableHead>
                        <TableHead>N° Lot</TableHead>
                        <TableHead>Code-barres</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : lots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Aucun lot avec code-barres trouvé. 
                            Les codes-barres sont générés automatiquement lors de la validation des réceptions.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lots.map((lot) => (
                          <TableRow 
                            key={lot.id}
                            className={selectedLots.has(lot.id) ? 'bg-muted/50' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedLots.has(lot.id)}
                                onCheckedChange={() => toggleLot(lot.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {lot.produit.libelle_produit}
                            </TableCell>
                            <TableCell>
                              {lot.produit.dci_nom ? (
                                <span className="text-sm italic text-muted-foreground">{lot.produit.dci_nom}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{lot.numero_lot}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {lot.code_barre}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lot.date_peremption ? (
                                <span className="text-sm">
                                  {new Date(lot.date_peremption).toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={lot.quantite_restante > 10 ? 'default' : 'destructive'}>
                                {lot.quantite_restante}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatAmount(lot.prix_vente_ttc || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {lots.length === 0 && !lotsLoading && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <strong>Note :</strong> Les codes-barres de lots sont générés automatiquement lors de la validation d'une réception. 
                    Pour voir des lots ici, créez d'abord une réception dans le module Stock &gt; Approvisionnement.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Par Réception */}
        <TabsContent value="receptions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section Configuration Réceptions */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Taille d'étiquette */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taille d'étiquette</label>
                  <Select value={getCurrentSizeLabel(receptionsConfig)} onValueChange={(v) => handleSizeChange(v, 'receptions')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LABEL_SIZES.map(size => (
                        <SelectItem key={size.label} value={size.label}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de code-barres */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de code-barres</label>
                  <Select 
                    value={receptionsConfig.barcodeType} 
                    onValueChange={(v) => handleReceptionConfigChange('barcodeType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code128">Code 128 (recommandé)</SelectItem>
                      <SelectItem value="ean13">EAN-13</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantité par lot - info */}
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <strong>Quantité par lot :</strong> Par défaut, le nombre d'étiquettes correspond à la quantité restante de chaque lot.
                </div>

                {/* Options d'affichage */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Options d'affichage</label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recIncludeDci"
                      checked={receptionsConfig.includeDci}
                      onCheckedChange={(v) => handleReceptionConfigChange('includeDci', !!v)}
                    />
                    <label htmlFor="recIncludeDci" className="text-sm cursor-pointer">
                      Inclure le DCI
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recIncludeLot"
                      checked={receptionsConfig.includeLot}
                      onCheckedChange={(v) => handleReceptionConfigChange('includeLot', !!v)}
                    />
                    <label htmlFor="recIncludeLot" className="text-sm cursor-pointer">
                      Inclure le numéro de lot
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recIncludeExpiry"
                      checked={receptionsConfig.includeExpiry}
                      onCheckedChange={(v) => handleReceptionConfigChange('includeExpiry', !!v)}
                    />
                    <label htmlFor="recIncludeExpiry" className="text-sm cursor-pointer">
                      Inclure la date d'expiration
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={printReceptionLotLabels}
                    disabled={selectedReceptionLots.size === 0 || receptionsGenerating}
                  >
                    {receptionsGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Imprimer étiquettes
                  </Button>
                </div>

                {/* Réception sélectionnée */}
                {selectedReception && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                    <div className="font-medium text-primary">{selectedReception.numero_reception}</div>
                    {selectedReception.reference_facture && (
                      <div className="text-muted-foreground">BL: {selectedReception.reference_facture}</div>
                    )}
                    <div className="text-muted-foreground">{selectedReception.fournisseur_nom}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Liste des réceptions et lots */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {selectedReception ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={clearReceptionSelection} className="p-0 h-auto">
                          <ArrowLeft className="h-4 w-4 mr-1" />
                        </Button>
                        Lots de la réception {selectedReception.numero_reception}
                      </div>
                    ) : (
                      'Rechercher une réception'
                    )}
                  </CardTitle>
                  {selectedReception && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAllReceptionLots}>
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Tout
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAllReceptionLots}>
                        <Square className="h-4 w-4 mr-1" />
                        Aucun
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedReception ? (
                  <>
                    {/* Barre de recherche réceptions */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par N° réception ou N° bon de livraison..."
                        value={receptionSearchTerm}
                        onChange={(e) => setReceptionSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Liste des réceptions */}
                    <div className="border rounded-lg max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Réception</TableHead>
                            <TableHead>N° BL</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receptionsLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : receptions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Aucune réception validée trouvée
                              </TableCell>
                            </TableRow>
                          ) : (
                            receptions.map((reception) => (
                              <TableRow 
                                key={reception.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => selectReception(reception)}
                              >
                                <TableCell className="font-medium">
                                  {reception.numero_reception}
                                </TableCell>
                                <TableCell>
                                  {reception.reference_facture || (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{reception.fournisseur_nom}</span>
                                </TableCell>
                                <TableCell>
                                  {new Date(reception.date_reception).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      Cliquez sur une réception pour voir ses lots et imprimer les étiquettes.
                    </div>
                  </>
                ) : (
                  <>
                    {/* Tableau des lots de la réception */}
                    <div className="border rounded-lg max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>DCI</TableHead>
                            <TableHead>N° Lot</TableHead>
                            <TableHead>Code-barres</TableHead>
                            <TableHead>N° BL</TableHead>
                            <TableHead>Expiration</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Prix</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receptionLotsLoading ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : lotsFromReception.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                Aucun lot avec code-barres trouvé pour cette réception
                              </TableCell>
                            </TableRow>
                          ) : (
                            lotsFromReception.map((lot) => (
                              <TableRow 
                                key={lot.id}
                                className={selectedReceptionLots.has(lot.id) ? 'bg-muted/50' : ''}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedReceptionLots.has(lot.id)}
                                    onCheckedChange={() => toggleReceptionLot(lot.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {lot.produit.libelle_produit}
                                </TableCell>
                                <TableCell>
                                  {lot.produit.dci_nom ? (
                                    <span className="text-sm italic text-muted-foreground">{lot.produit.dci_nom}</span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{lot.numero_lot}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {lot.code_barre}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {lot.reception.reference_facture || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {lot.date_peremption ? (
                                    <span className="text-sm">
                                      {new Date(lot.date_peremption).toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' })}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={lot.quantite_restante > 10 ? 'default' : 'destructive'}>
                                    {lot.quantite_restante}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatAmount(lot.prix_vente_ttc || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {lotsFromReception.length > 0 && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <strong>{lotsFromReception.length}</strong> lot(s) avec code-barres. 
                        Sélectionnez les lots à imprimer puis cliquez sur "Imprimer étiquettes".
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabelPrintingTab;
