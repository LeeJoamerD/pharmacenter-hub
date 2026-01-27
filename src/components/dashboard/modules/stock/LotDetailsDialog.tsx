import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Package,
  Calendar,
  MapPin,
  Thermometer,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Building2,
  Barcode,
  Euro,
  Activity,
  Clock,
  X,
  Edit2,
  Save,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLots } from '@/hooks/useLots';
import { useLotMovements } from '@/hooks/useLotMovements';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { usePricingConfig } from '@/hooks/useUnifiedPricingParams';
import { unifiedPricingService, UnifiedPricingResult } from '@/services/UnifiedPricingService';
import { toast } from 'sonner';

interface LotDetailsDialogProps {
  lotId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LotDetailsDialog: React.FC<LotDetailsDialogProps> = ({
  lotId,
  isOpen,
  onClose,
}) => {
  const { useLotQuery, calculateDaysToExpiration, determineUrgencyLevel, updateLot, isUpdating } = useLots();
  const { useLotMovementsForLot, getMovementTypeLabel, getMovementTypeColor, getMovementIcon } = useLotMovements();
  const { formatAmount } = useCurrencyFormatting();
  const pricingConfig = usePricingConfig();

  const { data: lot, isLoading: loadingLot, refetch: refetchLot } = useLotQuery(lotId || '');
  const { data: movements = [], isLoading: loadingMovements } = useLotMovementsForLot(lotId || '');

  // États pour l'édition du prix d'achat
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrixAchat, setNewPrixAchat] = useState('');
  const [calculatedPrices, setCalculatedPrices] = useState<UnifiedPricingResult | null>(null);

  // Réinitialiser l'état d'édition quand le lot change
  useEffect(() => {
    if (lot?.prix_achat_unitaire) {
      setNewPrixAchat(String(lot.prix_achat_unitaire));
    }
    setIsEditingPrice(false);
    setCalculatedPrices(null);
  }, [lot?.id, lot?.prix_achat_unitaire]);

  // Calculer les prix en temps réel quand le prix d'achat change
  const handlePrixAchatChange = useCallback((value: string) => {
    setNewPrixAchat(value);
    
    const numericValue = parseFloat(value.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      setCalculatedPrices(null);
      return;
    }

    // Récupérer la catégorie de tarification du produit
    const categorie = (lot?.produit as any)?.categorie_tarification;
    if (!categorie) {
      setCalculatedPrices(null);
      return;
    }

    const result = unifiedPricingService.calculateSalePrice({
      prixAchat: numericValue,
      coefficientPrixVente: categorie.coefficient_prix_vente || 1,
      tauxTVA: categorie.taux_tva || 0,
      tauxCentimeAdditionnel: categorie.taux_centime_additionnel || 0,
      roundingPrecision: pricingConfig.roundingPrecision,
      roundingMethod: pricingConfig.taxRoundingMethod,
      currencyCode: pricingConfig.currencyCode,
    });

    setCalculatedPrices(result);
  }, [lot, pricingConfig]);

  // Sauvegarder le nouveau prix d'achat
  const handleSavePrixAchat = useCallback(async () => {
    const numericValue = parseFloat(newPrixAchat.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error('Le prix d\'achat doit être supérieur à 0');
      return;
    }

    if (!lot?.id) return;

    updateLot({ 
      id: lot.id, 
      prix_achat_unitaire: numericValue 
    }, {
      onSuccess: () => {
        setIsEditingPrice(false);
        setCalculatedPrices(null);
        refetchLot();
      }
    });
  }, [lot?.id, newPrixAchat, updateLot, refetchLot]);

  // Annuler l'édition
  const handleCancelEdit = useCallback(() => {
    setIsEditingPrice(false);
    setNewPrixAchat(String(lot?.prix_achat_unitaire || ''));
    setCalculatedPrices(null);
  }, [lot?.prix_achat_unitaire]);

  if (!lotId) return null;

  const daysToExpiration = lot?.date_peremption ? calculateDaysToExpiration(lot.date_peremption) : null;
  const urgencyLevel = daysToExpiration !== null ? determineUrgencyLevel(daysToExpiration) : 'faible';
  const usagePercentage = lot ? ((lot.quantite_initiale - lot.quantite_restante) / lot.quantite_initiale) * 100 : 0;

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critique': return 'destructive';
      case 'eleve': return 'destructive';
      case 'moyen': return 'default';
      default: return 'secondary';
    }
  };

  const getUrgencyLabel = (level: string) => {
    switch (level) {
      case 'critique': return 'Critique';
      case 'eleve': return 'Élevé';
      case 'moyen': return 'Moyen';
      default: return 'Faible';
    }
  };


  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy à HH:mm', { locale: fr });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden sm:max-w-[95vw] md:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Détails du Lot {lot?.numero_lot}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {loadingLot ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : lot ? (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="general" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Informations générales</span>
                  <span className="sm:hidden">Général</span>
                </TabsTrigger>
                <TabsTrigger value="stock" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Stock & Valeurs</span>
                  <span className="sm:hidden">Stock</span>
                </TabsTrigger>
                <TabsTrigger value="movements" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Historique des mouvements</span>
                  <span className="sm:hidden">Historique</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Informations produit */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Package className="h-4 w-4" />
                        Produit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Nom du produit</p>
                        <p className="font-medium text-sm sm:text-base break-words">{lot.produit?.libelle_produit || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Code CIP</p>
                        <p className="font-mono text-xs sm:text-sm">{lot.produit?.code_cip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Numéro de lot</p>
                        <p className="font-mono text-xs sm:text-sm break-all">{lot.numero_lot}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informations fournisseur */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Building2 className="h-4 w-4" />
                        Fournisseur
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Nom du fournisseur</p>
                        <p className="font-medium text-sm sm:text-base break-words">{lot.fournisseur?.nom || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date de réception</p>
                        <p className="text-sm sm:text-base">{formatDate(lot.date_reception)}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date de fabrication</p>
                        <p className="text-sm sm:text-base">{formatDate(lot.date_fabrication)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dates et expiration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Calendar className="h-4 w-4" />
                        Dates importantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date de péremption</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className="text-sm sm:text-base">{formatDate(lot.date_peremption)}</p>
                          {daysToExpiration !== null && (
                            <Badge variant={getUrgencyColor(urgencyLevel) as any} className="text-xs w-fit">
                              {daysToExpiration > 0 ? `${daysToExpiration}j` : 'Expiré'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Niveau d'urgence</p>
                        <Badge variant={getUrgencyColor(urgencyLevel) as any} className="text-xs w-fit">
                          {getUrgencyLabel(urgencyLevel)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stockage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <MapPin className="h-4 w-4" />
                        Stockage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Emplacement</p>
                        <p className="text-sm sm:text-base break-words">{lot.emplacement || 'Non spécifié'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Température de stockage</p>
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-4 w-4" />
                          <p className="text-sm sm:text-base">{lot.temperature_stockage ? `${lot.temperature_stockage}°C` : 'Non spécifiée'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Conditions de stockage</p>
                        <p className="text-xs sm:text-sm break-words">{lot.conditions_stockage || 'Non spécifiées'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {lot.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{lot.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Quantités */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Package className="h-4 w-4" />
                        Quantités
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Quantité initiale</p>
                        <p className="text-base sm:text-lg font-semibold">{lot.quantite_initiale}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Quantité restante</p>
                        <p className="text-base sm:text-lg font-semibold text-primary">{lot.quantite_restante}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Taux d'utilisation</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{usagePercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prix - Section Éditable */}
                  <Card className="sm:col-span-2 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Euro className="h-4 w-4" />
                        Valorisation
                      </CardTitle>
                      {!isEditingPrice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingPrice(true)}
                          className="h-8 px-2"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Modifier</span>
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Prix d'achat */}
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                          Prix d'achat unitaire
                        </p>
                        {isEditingPrice ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={newPrixAchat}
                              onChange={(e) => handlePrixAchatChange(e.target.value)}
                              className="max-w-[150px]"
                              placeholder="0"
                            />
                            <span className="text-sm text-muted-foreground">FCFA</span>
                          </div>
                        ) : (
                          <p className="text-base sm:text-lg font-semibold">
                            {lot.prix_achat_unitaire ? formatAmount(lot.prix_achat_unitaire) : 'N/A'}
                          </p>
                        )}
                      </div>

                      {/* Séparateur et titre section prix calculés */}
                      <Separator className="my-2" />
                      <p className="text-xs font-medium text-muted-foreground text-center">
                        {isEditingPrice && calculatedPrices ? '── Prévisualisation ──' : '── Prix de Vente Calculés ──'}
                      </p>

                      {/* Affichage des prix (valeurs actuelles ou prévisualisation) */}
                      {(() => {
                        const categorie = (lot.produit as any)?.categorie_tarification;
                        const displayPrices = isEditingPrice && calculatedPrices
                          ? {
                              prixHT: calculatedPrices.prixVenteHT,
                              tauxTVA: calculatedPrices.tauxTVA,
                              montantTVA: calculatedPrices.montantTVA,
                              tauxCentime: calculatedPrices.tauxCentimeAdditionnel,
                              montantCentime: calculatedPrices.montantCentimeAdditionnel,
                              prixTTC: calculatedPrices.prixVenteTTC,
                            }
                          : {
                              prixHT: (lot as any).prix_vente_ht || 0,
                              tauxTVA: (lot as any).taux_tva || categorie?.taux_tva || 0,
                              montantTVA: (lot as any).montant_tva || 0,
                              tauxCentime: (lot as any).taux_centime_additionnel || categorie?.taux_centime_additionnel || 0,
                              montantCentime: (lot as any).montant_centime_additionnel || 0,
                              prixTTC: lot.prix_vente_suggere || 0,
                            };

                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Prix HT</p>
                              <p className={`text-sm font-medium ${isEditingPrice && calculatedPrices ? 'text-primary' : ''}`}>
                                {formatAmount(displayPrices.prixHT)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                TVA ({displayPrices.tauxTVA}%)
                              </p>
                              <p className={`text-sm font-medium ${isEditingPrice && calculatedPrices ? 'text-primary' : ''}`}>
                                {formatAmount(displayPrices.montantTVA)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Centime Add. ({displayPrices.tauxCentime}%)
                              </p>
                              <p className={`text-sm font-medium ${isEditingPrice && calculatedPrices ? 'text-primary' : ''}`}>
                                {formatAmount(displayPrices.montantCentime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Prix TTC</p>
                              <p className={`text-base font-bold ${isEditingPrice && calculatedPrices ? 'text-primary' : ''}`}>
                                {formatAmount(displayPrices.prixTTC)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      <Separator className="my-2" />

                      {/* Valeur stock restant */}
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Valeur stock restant</p>
                        <p className="text-base sm:text-lg font-semibold text-primary">
                          {formatAmount((isEditingPrice && calculatedPrices 
                            ? parseFloat(newPrixAchat.replace(/\s/g, '').replace(',', '.')) || 0
                            : lot.prix_achat_unitaire || 0) * lot.quantite_restante)}
                        </p>
                      </div>

                      {/* Boutons d'action en mode édition */}
                      {isEditingPrice && (
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSavePrixAchat}
                            disabled={isUpdating || !calculatedPrices}
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Enregistrement...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Sauvegarder
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Message si catégorie non trouvée */}
                      {isEditingPrice && !((lot.produit as any)?.categorie_tarification) && (
                        <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <p className="text-xs text-destructive">
                            Catégorie de tarification non définie pour ce produit
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Statut */}
                  <Card className="sm:col-span-2 lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Activity className="h-4 w-4" />
                        Statut
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Statut du lot</p>
                        <Badge variant="outline" className="text-xs">{lot.statut || 'Actif'}</Badge>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Code QR</p>
                        <p className="font-mono text-xs sm:text-sm break-all">{lot.qr_code || 'Non généré'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                        <p className="text-xs sm:text-sm">{formatDateTime(lot.updated_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="movements" className="space-y-4 mt-4">
                {loadingMovements ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : movements && movements.length > 0 ? (
                  <div className="space-y-4">
                    {/* Statistiques rapides */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="p-3 sm:p-4">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total mouvements</p>
                          <p className="text-lg sm:text-xl font-bold">{movements.length}</p>
                        </div>
                      </Card>
                      <Card className="p-3 sm:p-4">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Entrées</p>
                          <p className="text-lg sm:text-xl font-bold text-green-600">
                            {movements.filter(m => m.type_mouvement === 'entree').length}
                          </p>
                        </div>
                      </Card>
                      <Card className="p-3 sm:p-4">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sorties</p>
                          <p className="text-lg sm:text-xl font-bold text-red-600">
                            {movements.filter(m => m.type_mouvement === 'sortie').length}
                          </p>
                        </div>
                      </Card>
                      <Card className="p-3 sm:p-4">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ajustements</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-600">
                            {movements.filter(m => m.type_mouvement === 'ajustement').length}
                          </p>
                        </div>
                      </Card>
                    </div>

                    {/* Liste des mouvements */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm sm:text-base">Historique des mouvements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {movements.map((movement) => (
                            <div key={movement.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <Badge 
                                    variant={
                                      movement.type_mouvement === 'entree' ? 'default' :
                                      movement.type_mouvement === 'sortie' ? 'destructive' :
                                      movement.type_mouvement === 'ajustement' ? 'secondary' :
                                      'outline'
                                    }
                                    className="text-xs w-fit"
                                  >
                                    {movement.type_mouvement === 'entree' ? 'Entrée' :
                                     movement.type_mouvement === 'sortie' ? 'Sortie' :
                                     movement.type_mouvement === 'ajustement' ? 'Ajustement' :
                                     movement.type_mouvement === 'transfert' ? 'Transfert' :
                                     movement.type_mouvement === 'retour' ? 'Retour' :
                                     movement.type_mouvement === 'destruction' ? 'Destruction' :
                                     movement.type_mouvement}
                                  </Badge>
                                  <span className="text-xs sm:text-sm text-muted-foreground">
                                    {formatDateTime(movement.date_mouvement)}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm break-words">
                                  <span className="font-medium">Quantité:</span> {movement.quantite_mouvement} | 
                                  <span className="font-medium"> Référence:</span> {movement.reference_document || 'N/A'}
                                </p>
                                {movement.notes && (
                                  <p className="text-xs text-muted-foreground break-words">{movement.notes}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs sm:text-sm font-medium">
                                  {movement.type_mouvement === 'sortie' || movement.type_mouvement === 'destruction' ? '-' : '+'}{movement.quantite_mouvement}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground">Aucun mouvement enregistré pour ce lot</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Lot non trouvé</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};