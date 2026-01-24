import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Printer, RefreshCw, Search, Wand2, CheckSquare, Square, Tag } from 'lucide-react';
import { useLabelPrinting } from '@/hooks/useLabelPrinting';
import { LABEL_SIZES, LabelConfig } from '@/utils/labelPrinterEnhanced';
import { useLanguage } from '@/contexts/LanguageContext';

const LabelPrintingTab = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    products,
    loading,
    generating,
    selectedProducts,
    config,
    setConfig,
    fetchProducts,
    generateCodesForSelected,
    printLabels,
    toggleProduct,
    selectAll,
    deselectAll
  } = useLabelPrinting();

  // Charger les produits au montage
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  const handleConfigChange = (key: keyof LabelConfig, value: number | boolean | string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSizeChange = (sizeLabel: string) => {
    const size = LABEL_SIZES.find(s => s.label === sizeLabel);
    if (size) {
      setConfig(prev => ({ ...prev, width: size.width, height: size.height }));
    }
  };

  const getCurrentSizeLabel = () => {
    return LABEL_SIZES.find(s => s.width === config.width && s.height === config.height)?.label || '50 × 30 mm';
  };

  const productsWithoutCode = products.filter(
    p => selectedProducts.has(p.id) && !p.code_cip && !p.code_barre_externe
  ).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Impression d'étiquettes</h3>
        </div>
        <Badge variant="secondary">
          {selectedProducts.size} produit(s) sélectionné(s)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Taille d'étiquette */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Taille d'étiquette</label>
              <Select value={getCurrentSizeLabel()} onValueChange={handleSizeChange}>
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
                value={config.barcodeType} 
                onValueChange={(v) => handleConfigChange('barcodeType', v)}
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
                value={config.quantity}
                onChange={(e) => handleConfigChange('quantity', parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Options d'affichage */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Options d'affichage</label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDci"
                  checked={config.includeDci}
                  onCheckedChange={(v) => handleConfigChange('includeDci', !!v)}
                />
                <label htmlFor="includeDci" className="text-sm cursor-pointer">
                  Inclure le DCI
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeLot"
                  checked={config.includeLot}
                  onCheckedChange={(v) => handleConfigChange('includeLot', !!v)}
                />
                <label htmlFor="includeLot" className="text-sm cursor-pointer">
                  Inclure le numéro de lot
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeExpiry"
                  checked={config.includeExpiry}
                  onCheckedChange={(v) => handleConfigChange('includeExpiry', !!v)}
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
                onClick={printLabels}
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
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Tout
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
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
                  {loading ? (
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
                    products.map((product) => {
                      const hasCode = product.code_cip || product.code_barre_externe;
                      return (
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
                            {product.prix_vente_ttc?.toFixed(2) || '0.00'} DH
                          </TableCell>
                        </TableRow>
                      );
                    })
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
    </div>
  );
};

export default LabelPrintingTab;
