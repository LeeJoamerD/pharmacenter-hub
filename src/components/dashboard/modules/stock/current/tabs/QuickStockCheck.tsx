import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, CheckCircle, XCircle, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { useQuickStockSearch } from '@/hooks/useQuickStockSearch';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';

const QuickStockCheck = () => {
  const { formatAmount } = useCurrencyFormatting();
  const { t } = useLanguage();
  const [pageSize, setPageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    data: searchResults, 
    isLoading, 
    error,
    refetch,
    validationError
  } = useQuickStockSearch(searchQuery, pageSize);

  const handleSearch = (query = searchQuery) => {
    const searchTerm = query.trim();
    setSearchQuery(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
  };

  const resetSearch = () => {
    setSearchQuery('');
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'faible': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critique': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'rupture': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'surstock': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'normal': return t('quickCheckAvailable');
      case 'faible': return t('quickCheckLowStock');
      case 'critique': return t('quickCheckCriticalStock');
      case 'rupture': return t('quickCheckOutOfStock');
      case 'surstock': return t('quickCheckOverstock');
      default: return t('quickCheckUnknown');
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'faible': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'rupture': return 'bg-red-100 text-red-800 border-red-200';
      case 'surstock': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('quickAvailabilityCheck')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">{t('howToUseFunction')}</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('typeProductNameTip')}</li>
                <li>• {t('getInstantStock')}</li>
                <li>• {t('checkAvailabilityBeforeSale')}</li>
                <li>• {t('viewEssentialInfo')}</li>
              </ul>
            </div>

            {/* Barre de recherche */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchProductPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleQuickSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 text-lg"
                />
              </div>
              <Button 
                onClick={() => handleSearch()}
                disabled={isLoading || !searchQuery.trim()}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('searchInProgressLabel')}
                  </>
                ) : (
                  t('verify')
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raccourcis rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('frequentChecks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => handleQuickSearch('paracétamol')}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Paracétamol</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => handleQuickSearch('amoxicilline')}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Amoxicilline</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => handleQuickSearch('vitamine')}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Vitamines</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 flex flex-col gap-1"
              onClick={() => handleQuickSearch('sirop')}
            >
              <Package className="h-4 w-4" />
              <span className="text-xs">Sirops</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      {(searchResults?.products?.length > 0 || (searchQuery && !isLoading)) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('verificationResults')}
              {searchResults?.totalCount > 0 && (
                <Badge variant="outline">
                  {searchResults.products.length} {t('displayedOf')} {searchResults.totalCount} {t('found')}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('refresh')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetSearch}
              >
                {t('resetLabel')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {searchResults?.products?.length === 0 && searchQuery && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-medium">{t('quickCheckNoProductFound')}</p>
                <p>{t('tryAnotherSearch')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults?.products?.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStockIcon(product.statut_stock)}
                          <h4 className="font-semibold text-lg">{product.libelle_produit}</h4>
                          <Badge className={getStockStatusColor(product.statut_stock)}>
                            {getStockStatusText(product.statut_stock)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('codeLabel')}</span>
                            <div className="font-mono font-medium">{product.code_cip}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('quickCheckCurrentStock')}</span>
                            <div className="font-semibold text-lg">{product.stock_actuel}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('minimumStockLabel')}</span>
                            <div>{product.stock_limite}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('sellingPriceLabel')}</span>
                            <div className="font-medium">{formatAmount(product.prix_vente_ttc)}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                          <span>{t('quickCheckFamilyLabel')} {product.famille_libelle || 'N/A'}</span>
                          <span>{t('departmentLabel')} {product.rayon_libelle || 'N/A'}</span>
                          <span>{t('rotationLabel')} {product.rotation}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {product.stock_actuel > 0 ? (
                            <span className="text-green-600">{product.stock_actuel}</span>
                          ) : (
                            <span className="text-red-600">0</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{t('unitsLabel')}</div>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button size="sm" disabled={product.stock_actuel === 0}>
                        {t('sell')}
                      </Button>
                      {(product.statut_stock === 'faible' || product.statut_stock === 'critique') && (
                        <Button size="sm" variant="outline">
                          {t('orderBtn')}
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        {t('detailsBtn')}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Contrôles de pagination */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('pageSizeLabel')}</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                    </select>
                  </div>
                  
                  {searchResults?.hasMore && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPageSize(prev => prev + 50);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('loadingLabel')}
                        </>
                      ) : (
                        t('seeMore')
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Indicateur de chargement */}
      {isLoading && searchQuery && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>{t('searchInProgressLabel')}</span>
          </CardContent>
        </Card>
      )}

      {/* Affichage des erreurs de validation */}
      {validationError && (
        <Card className="border-orange-200">
          <CardContent className="flex items-center gap-2 py-4 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{validationError}</span>
          </CardContent>
        </Card>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-2 py-4 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>{t('stockLoadingError')}: {error.message}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickStockCheck;
