import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  ShoppingCart, 
  TrendingUp, 
  X, 
  Search,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSalesSuggestions, SalesSuggestion } from '@/hooks/useSalesSuggestions';
import { useLots } from '@/hooks/useLots';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

export const SalesIntegration = () => {
  const { formatAmount } = useCurrencyFormatting();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hooks pour l'authentification et le tenant
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const { 
    suggestions, 
    isLoading, 
    error, 
    refetch,
    generateSuggestions,
    ignoreSuggestion,
    promoteSuggestion,
    markAsSold,
    isGenerating 
  } = useSalesSuggestions();

  const { useLotsQuery } = useLots();
  const { data: lots } = useLotsQuery();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrage des lots avec recherche sur plusieurs champs
  const filteredLots = lots?.filter(lot => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lot.numero_lot.toLowerCase().includes(searchLower) ||
      lot.produit?.libelle_produit.toLowerCase().includes(searchLower) ||
      lot.produit?.code_cip?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Fonction pour sélectionner un lot depuis le champ de recherche
  const handleLotSelection = (lotId: string) => {
    setSelectedLotId(lotId);
    const selectedLotData = lots?.find(lot => lot.id === lotId);
    if (selectedLotData) {
      setSearchTerm(`${selectedLotData.numero_lot} - ${selectedLotData.produit?.libelle_produit}`);
    }
    setShowDropdown(false);
  };

  // Fonction pour effacer la sélection
  const clearSelection = () => {
    setSelectedLotId("");
    setSearchTerm("");
    setShowDropdown(false);
  };

  // Fonction pour actualiser les suggestions
  const handleRefreshSuggestions = async () => {
    try {
      await generateSuggestions();
    } catch (error) {
      console.error('Erreur lors de la génération des suggestions:', error);
    }
  };

  // Fonction pour créer une vente
  const handleCreateSale = async (suggestion: SalesSuggestion) => {
    try {
      await markAsSold(suggestion.id);
      // Ici, vous pourriez rediriger vers le module de vente ou ouvrir un modal
      console.log('Création de vente pour:', suggestion);
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
    }
  };

  // Fonction pour promouvoir un produit
  const handlePromote = async (suggestion: SalesSuggestion) => {
    try {
      await promoteSuggestion(suggestion.id);
      console.log('Produit promu:', suggestion);
    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
    }
  };

  // Fonction pour ignorer une suggestion
  const handleIgnore = async (suggestion: SalesSuggestion) => {
    try {
      await ignoreSuggestion(suggestion.id);
      console.log('Suggestion ignorée:', suggestion);
    } catch (error) {
      console.error('Erreur lors de l\'ignorance de la suggestion:', error);
    }
  };

  // Filtrer les suggestions par lot sélectionné
  const filteredSuggestions = selectedLotId 
    ? suggestions.filter(suggestion => suggestion.lot_id === selectedLotId)
    : suggestions;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-yellow-100 text-yellow-800';
      case 'faible': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'promue': return 'bg-purple-100 text-purple-800';
      case 'vendue': return 'bg-green-100 text-green-800';
      case 'ignoree': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Intégration Ventes
          </CardTitle>
          <CardDescription>
            Suggestions intelligentes pour optimiser les ventes en fonction des dates d'expiration et des règles FIFO.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Champ de recherche pour sélectionner un lot */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un Lot</CardTitle>
          <CardDescription>
            Recherchez un lot spécifique par numéro, produit ou code CIP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro de lot, produit ou code CIP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(e.target.value.length > 0);
                }}
                onFocus={() => setShowDropdown(searchTerm.length > 0)}
                className="pl-10 pr-10"
              />
              {selectedLotId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  ×
                </Button>
              )}
              
              {/* Dropdown de suggestions */}
              {showDropdown && filteredLots.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredLots.slice(0, 10).map((lot) => (
                    <div
                      key={lot.id}
                      onClick={() => handleLotSelection(lot.id)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{lot.numero_lot}</p>
                          <p className="text-sm text-gray-600">{lot.produit?.libelle_produit}</p>
                          {lot.produit?.code_cip && (
                            <p className="text-xs text-gray-500">CIP: {lot.produit.code_cip}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium">{lot.quantite_restante}/{lot.quantite_initiale}</p>
                          {lot.date_peremption && (
                            <p className="text-xs text-gray-500">
                              Exp: {format(new Date(lot.date_peremption), 'dd/MM/yyyy', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLots.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                      +{filteredLots.length - 10} autres résultats...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section des suggestions avec bouton d'actualisation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Suggestions de Vente par Lot</CardTitle>
              <CardDescription>
                Consultez les suggestions ci-dessous pour optimiser vos ventes.
              </CardDescription>
            </div>
            <Button 
              onClick={handleRefreshSuggestions}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Génération...' : 'Actualiser les suggestions'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Chargement des suggestions...</div>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="text-destructive mb-2">Erreur de chargement</div>
              <p className="text-muted-foreground">Impossible de charger les suggestions</p>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center p-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {selectedLotId ? 'Aucune suggestion pour ce lot' : 'Aucune suggestion de vente pour le moment'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedLotId 
                  ? 'Ce lot n\'a pas de suggestions de vente actives.'
                  : 'Cliquez sur "Actualiser les suggestions" pour générer de nouvelles recommandations.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Prix Suggéré</TableHead>
                    <TableHead>Remise</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell className="font-medium">
                        {suggestion.numero_lot}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{suggestion.libelle_produit}</p>
                          {suggestion.code_cip && (
                            <p className="text-xs text-muted-foreground">CIP: {suggestion.code_cip}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{suggestion.quantite_disponible}</TableCell>
                      <TableCell>
                        {suggestion.date_peremption ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">
                                {format(new Date(suggestion.date_peremption), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                              {suggestion.jours_avant_expiration !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {suggestion.jours_avant_expiration > 0 
                                    ? `${suggestion.jours_avant_expiration} jours`
                                    : 'Expiré'
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non définie</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(suggestion.priorite)}>
                          {suggestion.priorite}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(suggestion.prix_vente_suggere)}
                      </TableCell>
                      <TableCell>
                        {suggestion.remise_suggere ? `${suggestion.remise_suggere}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(suggestion.statut)}>
                          {suggestion.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {suggestion.statut === 'active' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleCreateSale(suggestion)}
                                className="flex items-center gap-1"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                Créer Vente
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromote(suggestion)}
                                className="flex items-center gap-1"
                              >
                                <TrendingUp className="h-3 w-3" />
                                Promouvoir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIgnore(suggestion)}
                                className="flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Ignorer
                              </Button>
                            </>
                          )}
                          {suggestion.statut !== 'active' && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              {suggestion.statut === 'vendue' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {suggestion.statut === 'promue' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                              {suggestion.statut === 'ignoree' && <X className="h-4 w-4 text-gray-600" />}
                              <span className="text-sm capitalize">{suggestion.statut}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};