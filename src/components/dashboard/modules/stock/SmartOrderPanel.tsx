import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ClipboardList,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Plus,
  CheckCircle,
  Package,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { SmartOrderSuggestion, SuggestionSource } from '@/hooks/useSmartOrderSuggestions';

interface SmartOrderPanelProps {
  clientDemandSuggestions: SmartOrderSuggestion[];
  stockAlertSuggestions: SmartOrderSuggestion[];
  suggestionCounts: {
    demandes: number;
    ruptures: number;
    critiques: number;
    faibles: number;
    total: number;
  };
  isLoading: boolean;
  onAddProducts: (products: SmartOrderSuggestion[]) => void;
  onDeleteDemand?: (demandProductId: string) => void;
}

const SmartOrderPanel: React.FC<SmartOrderPanelProps> = ({
  clientDemandSuggestions,
  stockAlertSuggestions,
  suggestionCounts,
  isLoading,
  onAddProducts,
  onDeleteDemand
}) => {
  const { formatAmount } = useCurrencyFormatting();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('demandes');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Produits filtrés par tab
  const currentProducts = useMemo(() => {
    switch (activeTab) {
      case 'demandes':
        return clientDemandSuggestions;
      case 'ruptures':
        return stockAlertSuggestions.filter(s => s.source === 'rupture');
      case 'critiques':
        return stockAlertSuggestions.filter(s => s.source === 'critique');
      case 'faibles':
        return stockAlertSuggestions.filter(s => s.source === 'faible');
      default:
        return [];
    }
  }, [activeTab, clientDemandSuggestions, stockAlertSuggestions]);

  // Toggle sélection
  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Sélectionner/désélectionner tous
  const toggleSelectAll = () => {
    if (selectedProducts.size === currentProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(currentProducts.map(p => p.produit_id)));
    }
  };

  // Modifier quantité
  const updateQuantity = (productId: string, qty: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, qty)
    }));
  };

  // Ajouter les produits sélectionnés
  const handleAddSelected = () => {
    const productsToAdd = currentProducts
      .filter(p => selectedProducts.has(p.produit_id))
      .map(p => ({
        ...p,
        quantite_suggeree: quantities[p.produit_id] || p.quantite_suggeree
      }));
    
    onAddProducts(productsToAdd);
    setSelectedProducts(new Set());
    
    // Si c'est des demandes clients, proposer de les supprimer
    if (activeTab === 'demandes' && onDeleteDemand) {
      productsToAdd.forEach(p => {
        // Le composant parent peut décider de supprimer les demandes
      });
    }
  };

  // Ajouter tous les produits du tab
  const handleAddAll = () => {
    const productsToAdd = currentProducts.map(p => ({
      ...p,
      quantite_suggeree: quantities[p.produit_id] || p.quantite_suggeree
    }));
    onAddProducts(productsToAdd);
    setSelectedProducts(new Set());
  };

  // Couleur du badge selon l'urgence
  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'haute':
        return 'destructive';
      case 'moyenne':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Icône selon la source
  const getSourceIcon = (source: SuggestionSource) => {
    switch (source) {
      case 'demande_client':
        return <ClipboardList className="h-4 w-4" />;
      case 'rupture':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'critique':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'faible':
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const hasAnySuggestions = suggestionCounts.total > 0;

  // Fonction pour naviguer vers un onglet spécifique depuis les badges du header
  const handleBadgeClick = (tabName: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    setActiveTab(tabName);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`${hasAnySuggestions ? 'border-primary/50' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Suggestions Intelligentes</span>
              </div>
            </CollapsibleTrigger>
            
            {hasAnySuggestions && (
              <TooltipProvider delayDuration={0}>
                <div className="flex items-center gap-2">
                  {suggestionCounts.demandes > 0 && (
                    <button 
                      type="button" 
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={handleBadgeClick('demandes')}
                    >
                      <Badge variant="secondary" className="gap-1">
                        <ClipboardList className="h-3 w-3" />
                        {suggestionCounts.demandes}
                      </Badge>
                    </button>
                  )}
                  {suggestionCounts.ruptures > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={handleBadgeClick('ruptures')}
                        >
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {suggestionCounts.ruptures}
                          </Badge>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs bg-slate-900 text-white border-slate-700 whitespace-normal">
                        <p className="font-medium">{suggestionCounts.ruptures} produit(s) en rupture de stock</p>
                        <p className="text-xs text-slate-300">Cliquez pour voir les produits</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {suggestionCounts.critiques > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={handleBadgeClick('critiques')}
                        >
                          <Badge className="gap-1 bg-orange-500">
                            <AlertTriangle className="h-3 w-3" />
                            {suggestionCounts.critiques}
                          </Badge>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs bg-slate-900 text-white border-slate-700 whitespace-normal">
                        <p className="font-medium">{suggestionCounts.critiques} produit(s) en stock critique</p>
                        <p className="text-xs text-slate-300">Cliquez pour voir les produits</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {suggestionCounts.faibles > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={handleBadgeClick('faibles')}
                        >
                          <Badge className="gap-1 bg-yellow-500">
                            <TrendingDown className="h-3 w-3" />
                            {suggestionCounts.faibles}
                          </Badge>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs bg-slate-900 text-white border-slate-700 whitespace-normal">
                        <p className="font-medium">{suggestionCounts.faibles} produit(s) en stock faible</p>
                        <p className="text-xs text-slate-300">Cliquez pour voir les produits</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            )}
          </CardTitle>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !hasAnySuggestions ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
                <p className="font-medium">Tout est en ordre !</p>
                <p className="text-sm">Aucune suggestion d'approvisionnement pour le moment</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="demandes" className="gap-1">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Demandes</span>
                    {suggestionCounts.demandes > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {suggestionCounts.demandes}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ruptures" className="gap-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="hidden sm:inline">Ruptures</span>
                    {suggestionCounts.ruptures > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                        {suggestionCounts.ruptures}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="critiques" className="gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Critiques</span>
                    {suggestionCounts.critiques > 0 && (
                      <Badge className="ml-1 h-5 px-1.5 bg-orange-500">
                        {suggestionCounts.critiques}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="faibles" className="gap-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Faibles</span>
                    {suggestionCounts.faibles > 0 && (
                      <Badge className="ml-1 h-5 px-1.5 bg-yellow-500">
                        {suggestionCounts.faibles}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Contenu des tabs */}
                {['demandes', 'ruptures', 'critiques', 'faibles'].map(tab => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    {currentProducts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun produit dans cette catégorie</p>
                      </div>
                    ) : (
                      <>
                        {/* Actions globales */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedProducts.size === currentProducts.length && currentProducts.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                            <span className="text-sm text-muted-foreground">
                              {selectedProducts.size > 0 
                                ? `${selectedProducts.size} sélectionné${selectedProducts.size > 1 ? 's' : ''}`
                                : 'Tout sélectionner'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {selectedProducts.size > 0 && (
                              <Button size="sm" onClick={handleAddSelected}>
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter ({selectedProducts.size})
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleAddAll}
                            >
                              Tout ajouter ({currentProducts.length})
                            </Button>
                          </div>
                        </div>

                        {/* Liste des produits */}
                        <ScrollArea className="h-[250px]">
                          <div className="space-y-2">
                            {currentProducts.map(product => (
                              <div
                                key={product.produit_id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  selectedProducts.has(product.produit_id)
                                    ? 'bg-primary/5 border-primary'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox
                                  checked={selectedProducts.has(product.produit_id)}
                                  onCheckedChange={() => toggleProduct(product.produit_id)}
                                />
                                
                                {getSourceIcon(product.source)}
                                
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{product.libelle_produit}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{product.code_cip}</span>
                                    {product.stock_actuel !== undefined && (
                                      <span>• Stock: {product.stock_actuel}</span>
                                    )}
                                    {product.nombre_demandes && (
                                      <span>• {product.nombre_demandes} demande{product.nombre_demandes > 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge variant={getUrgencyColor(product.urgence) as any}>
                                    {product.urgence}
                                  </Badge>
                                  <Input
                                    type="number"
                                    value={quantities[product.produit_id] || product.quantite_suggeree}
                                    onChange={(e) => updateQuantity(product.produit_id, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 text-center"
                                    min={1}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default SmartOrderPanel;
