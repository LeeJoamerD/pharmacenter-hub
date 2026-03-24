import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  ShoppingBag, 
  Calendar, 
  User, 
  Package,
  Loader2,
  Check,
  AlertCircle,
  CalendarRange
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useSmartOrderSuggestions, SmartOrderSuggestion } from '@/hooks/useSmartOrderSuggestions';

interface SaleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportProducts: (products: SmartOrderSuggestion[]) => void;
  existingProductIds: string[];
}

const SaleSelectionDialog: React.FC<SaleSelectionDialogProps> = ({
  open,
  onOpenChange,
  onImportProducts,
  existingProductIds
}) => {
  const { formatAmount } = useCurrencyFormatting();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionProducts, setSessionProducts] = useState<SmartOrderSuggestion[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [step, setStep] = useState<'select-source' | 'select-products'>('select-source');
  const [mode, setMode] = useState<'session' | 'period'>('session');
  
  // Period mode state
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [periodInfo, setPeriodInfo] = useState<{ sessionCount: number; lineCount: number } | null>(null);

  const { 
    recentSessions, 
    searchSessions, 
    getProductsFromSession,
    getProductsFromPeriod,
    sessionsLoading 
  } = useSmartOrderSuggestions(existingProductIds);

  const [filteredSessions, setFilteredSessions] = useState(recentSessions);

  // Recherche des sessions
  useEffect(() => {
    const search = async () => {
      if (searchTerm.length >= 2) {
        const results = await searchSessions(searchTerm);
        setFilteredSessions(results);
      } else {
        setFilteredSessions(recentSessions);
      }
    };
    search();
  }, [searchTerm, recentSessions, searchSessions]);

  // Charger les produits d'une session sélectionnée
  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setLoadingProducts(true);
    
    try {
      const products = await getProductsFromSession(sessionId);
      setSessionProducts(products);
      setSelectedProducts(new Set(products.map(p => p.produit_id)));
      setStep('select-products');
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Charger les produits d'une période
  const handleLoadPeriod = async () => {
    if (!dateStart || !dateEnd) return;
    setLoadingProducts(true);
    setPeriodInfo(null);
    
    try {
      const result = await getProductsFromPeriod(dateStart, dateEnd);
      setSessionProducts(result.products);
      setSelectedProducts(new Set(result.products.map(p => p.produit_id)));
      setPeriodInfo({ sessionCount: result.sessionCount, lineCount: result.lineCount });
      setStep('select-products');
    } catch (error) {
      console.error('Erreur chargement période:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Toggle sélection d'un produit
  const toggleProductSelection = (productId: string) => {
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

  // Sélectionner/Désélectionner tous
  const toggleSelectAll = () => {
    if (selectedProducts.size === sessionProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(sessionProducts.map(p => p.produit_id)));
    }
  };

  // Importer les produits sélectionnés
  const handleImport = () => {
    const productsToImport = sessionProducts.filter(p => selectedProducts.has(p.produit_id));
    onImportProducts(productsToImport);
    handleClose();
  };

  // Réinitialiser et fermer
  const handleClose = () => {
    setSearchTerm('');
    setSelectedSessionId(null);
    setSessionProducts([]);
    setSelectedProducts(new Set());
    setStep('select-source');
    setMode('session');
    setDateStart('');
    setDateEnd('');
    setPeriodInfo(null);
    onOpenChange(false);
  };

  // Retour à la liste des sessions
  const handleBack = () => {
    setSelectedSessionId(null);
    setSessionProducts([]);
    setSelectedProducts(new Set());
    setPeriodInfo(null);
    setStep('select-source');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {step === 'select-source' ? 'Importer depuis une session de caisse' : 'Sélectionner les produits'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-source' 
              ? 'Sélectionnez une session ou une période pour importer les produits vendus'
              : `Choisissez les produits à ajouter à votre commande${periodInfo ? ` (${periodInfo.sessionCount} session(s), ${periodInfo.lineCount} article(s))` : ''}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-source' ? (
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'session' | 'period')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="session" className="gap-1">
                <ShoppingBag className="h-4 w-4" />
                Par session
              </TabsTrigger>
              <TabsTrigger value="period" className="gap-1">
                <CalendarRange className="h-4 w-4" />
                Par période
              </TabsTrigger>
            </TabsList>

            <TabsContent value="session" className="mt-4">
              {/* Recherche */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro de session..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Liste des sessions */}
              <ScrollArea className="h-[350px] pr-4">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mb-2 opacity-50" />
                    <p>Aucune session de caisse trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSessions.map(session => (
                      <Card 
                        key={session.id} 
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedSessionId === session.id ? 'border-primary' : ''
                        }`}
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{session.numero_session}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(session.date_ouverture), 'dd MMM yyyy HH:mm', { locale: fr })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {session.agent_name}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold">{formatAmount(session.montant_total_ventes)}</span>
                              <p className="text-xs text-muted-foreground">Total ventes</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="period" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateStart">Date début</Label>
                    <Input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateEnd">Date fin</Label>
                    <Input
                      id="dateEnd"
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleLoadPeriod}
                  disabled={!dateStart || !dateEnd || loadingProducts}
                >
                  {loadingProducts ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement des sessions...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher les produits vendus
                    </>
                  )}
                </Button>
                
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CalendarRange className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Sélectionnez une période pour récupérer automatiquement</p>
                  <p className="text-sm">les produits vendus dans toutes les sessions de cette période</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {/* Entête avec sélection globale */}
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProducts.size === sessionProducts.length && sessionProducts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} sur {sessionProducts.length} sélectionné{selectedProducts.size > 1 ? 's' : ''}
                </span>
              </div>
              {periodInfo && (
                <Badge variant="secondary" className="gap-1">
                  <CalendarRange className="h-3 w-3" />
                  {periodInfo.sessionCount} session(s) • {periodInfo.lineCount} article(s)
                </Badge>
              )}
              {sessionProducts.length === 0 && !loadingProducts && (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Aucun produit de niveau 1 disponible
                </Badge>
              )}
            </div>

            {/* Liste des produits */}
            <ScrollArea className="h-[350px] pr-4">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessionProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p>Aucun produit disponible pour l'import</p>
                  <p className="text-sm">Les produits de niveau 2 et 3 ne peuvent pas être commandés</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessionProducts.map(product => (
                    <div 
                      key={product.produit_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedProducts.has(product.produit_id) 
                          ? 'bg-primary/5 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleProductSelection(product.produit_id)}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.produit_id)}
                        onCheckedChange={() => toggleProductSelection(product.produit_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.libelle_produit}</p>
                        <p className="text-sm text-muted-foreground">{product.code_cip}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Qté: {product.quantite_suggeree}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{formatAmount(product.prix_achat)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        <DialogFooter className="gap-2">
          {step === 'select-products' && (
            <Button variant="outline" onClick={handleBack}>
              Retour
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {step === 'select-products' && (
            <Button 
              onClick={handleImport}
              disabled={selectedProducts.size === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Importer {selectedProducts.size > 0 ? `(${selectedProducts.size})` : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleSelectionDialog;
