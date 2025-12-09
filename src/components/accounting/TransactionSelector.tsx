import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Receipt, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface UnbilledSale {
  id: string;
  numero_vente: string;
  date_vente: string;
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
}

export interface UnbilledReception {
  id: string;
  numero_reception: string;
  reference_facture: string | null;
  date_reception: string;
  montant_ht: number;
  montant_tva: number;
  montant_centime_additionnel: number;
  montant_ttc: number;
}

interface TransactionSelectorProps {
  type: 'client' | 'fournisseur';
  clientId?: string;
  fournisseurId?: string;
  onSelectionChange: (selected: UnbilledSale[] | UnbilledReception[], totals: {
    montant_ht: number;
    montant_tva: number;
    montant_centime_additionnel?: number;
    montant_ttc: number;
  }) => void;
  selectedIds?: string[]; // For bidirectional sync with parent
}

export const TransactionSelector: React.FC<TransactionSelectorProps> = ({
  type,
  clientId,
  fournisseurId,
  onSelectionChange,
  selectedIds,
}) => {
  const { pharmacy } = useAuth();
  const { formatPrice } = useCurrency();
  const tenantId = pharmacy?.id;

  const [sales, setSales] = useState<UnbilledSale[]>([]);
  const [receptions, setReceptions] = useState<UnbilledReception[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [selectedReceptions, setSelectedReceptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate reception totals before fetching unbilled ones
  const calculateReceptionTotals = async (fournisseurId: string) => {
    // Fetch all receptions for this supplier with pagination
    let allReceptions: { id: string; montant_ttc: number | null }[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('receptions_fournisseurs')
        .select('id, montant_ttc')
        .eq('tenant_id', tenantId)
        .eq('fournisseur_id', fournisseurId)
        .range(offset, offset + pageSize - 1);

      if (error || !data || data.length === 0) break;
      allReceptions = [...allReceptions, ...data];
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Calculate totals for receptions that don't have them yet
    for (const reception of allReceptions) {
      if (!reception.montant_ttc || reception.montant_ttc === 0) {
        await supabase.rpc('calculate_reception_totals', { p_reception_id: reception.id });
      }
    }
  };

  // Fetch unbilled sales for a client
  const fetchUnbilledSales = async (clientId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_unbilled_sales_by_client', {
        p_tenant_id: tenantId,
        p_client_id: clientId,
      });

      if (error) throw error;
      setSales((data as UnbilledSale[]) || []);
    } catch (err: any) {
      console.error('Error fetching unbilled sales:', err);
      setError(err.message || 'Erreur lors du chargement des ventes');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unbilled receptions for a supplier
  const fetchUnbilledReceptions = async (fournisseurId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // First calculate totals for all receptions
      await calculateReceptionTotals(fournisseurId);

      // Then fetch unbilled receptions
      const { data, error } = await supabase.rpc('get_unbilled_receptions_by_supplier', {
        p_tenant_id: tenantId,
        p_fournisseur_id: fournisseurId,
      });

      if (error) throw error;
      setReceptions((data as UnbilledReception[]) || []);
    } catch (err: any) {
      console.error('Error fetching unbilled receptions:', err);
      setError(err.message || 'Erreur lors du chargement des réceptions');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data when client/fournisseur changes
  useEffect(() => {
    if (type === 'client' && clientId && tenantId) {
      fetchUnbilledSales(clientId);
      setSelectedSales([]);
    } else if (type === 'fournisseur' && fournisseurId && tenantId) {
      fetchUnbilledReceptions(fournisseurId);
      setSelectedReceptions([]);
    }
  }, [type, clientId, fournisseurId, tenantId]);

  // Sync internal state with parent's selectedIds prop (bidirectional sync)
  useEffect(() => {
    if (selectedIds !== undefined) {
      if (type === 'client') {
        setSelectedSales(selectedIds);
      } else {
        setSelectedReceptions(selectedIds);
      }
    }
  }, [selectedIds, type]);

  // Handle sale selection
  const handleSaleSelection = (saleId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedSales, saleId]
      : selectedSales.filter(id => id !== saleId);
    
    setSelectedSales(newSelection);

    // Calculate totals
    const selectedItems = sales.filter(s => newSelection.includes(s.id));
    const totals = {
      montant_ht: selectedItems.reduce((sum, s) => sum + (s.montant_total_ht || 0), 0),
      montant_tva: selectedItems.reduce((sum, s) => sum + (s.montant_tva || 0), 0),
      montant_ttc: selectedItems.reduce((sum, s) => sum + (s.montant_total_ttc || 0), 0),
    };

    onSelectionChange(selectedItems, totals);
  };

  // Handle reception selection (multi-selection like sales)
  const handleReceptionSelection = (receptionId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedReceptions, receptionId]
      : selectedReceptions.filter(id => id !== receptionId);
    
    setSelectedReceptions(newSelection);

    // Calculate totals
    const selectedItems = receptions.filter(r => newSelection.includes(r.id));
    const totals = {
      montant_ht: selectedItems.reduce((sum, r) => sum + (r.montant_ht || 0), 0),
      montant_tva: selectedItems.reduce((sum, r) => sum + (r.montant_tva || 0), 0),
      montant_centime_additionnel: selectedItems.reduce((sum, r) => sum + (r.montant_centime_additionnel || 0), 0),
      montant_ttc: selectedItems.reduce((sum, r) => sum + (r.montant_ttc || 0), 0),
    };

    onSelectionChange(selectedItems, totals);
  };

  // Select all receptions
  const handleSelectAllReceptions = () => {
    const allIds = receptions.map(r => r.id);
    setSelectedReceptions(allIds);

    const totals = {
      montant_ht: receptions.reduce((sum, r) => sum + (r.montant_ht || 0), 0),
      montant_tva: receptions.reduce((sum, r) => sum + (r.montant_tva || 0), 0),
      montant_centime_additionnel: receptions.reduce((sum, r) => sum + (r.montant_centime_additionnel || 0), 0),
      montant_ttc: receptions.reduce((sum, r) => sum + (r.montant_ttc || 0), 0),
    };

    onSelectionChange(receptions, totals);
  };

  // Select all sales
  const handleSelectAllSales = () => {
    const allIds = sales.map(s => s.id);
    setSelectedSales(allIds);

    const totals = {
      montant_ht: sales.reduce((sum, s) => sum + (s.montant_total_ht || 0), 0),
      montant_tva: sales.reduce((sum, s) => sum + (s.montant_tva || 0), 0),
      montant_ttc: sales.reduce((sum, s) => sum + (s.montant_total_ttc || 0), 0),
    };

    onSelectionChange(sales, totals);
  };

  // Clear selection
  const handleClearSelection = () => {
    if (type === 'client') {
      setSelectedSales([]);
    } else {
      setSelectedReceptions([]);
    }
    onSelectionChange([], { montant_ht: 0, montant_tva: 0, montant_ttc: 0 });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Don't render if no client/fournisseur selected
  if ((type === 'client' && !clientId) || (type === 'fournisseur' && !fournisseurId)) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {type === 'client' ? (
            <>
              <Receipt className="h-4 w-4" />
              Ventes non facturées
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              Réceptions non facturées
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive py-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : type === 'client' ? (
          sales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aucune vente non facturée pour ce client
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">
                  {sales.length} vente(s) disponible(s) - {selectedSales.length} sélectionnée(s)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllSales}>
                    Tout sélectionner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                    Effacer
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {sales.map(sale => (
                  <div
                    key={sale.id}
                    className={`flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-muted/50 ${
                      selectedSales.includes(sale.id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedSales.includes(sale.id)}
                        onCheckedChange={(checked) => handleSaleSelection(sale.id, checked === true)}
                      />
                      <div>
                        <p className="text-sm font-medium">{sale.numero_vente}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(sale.date_vente)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(sale.montant_total_ttc)}</p>
                      <p className="text-xs text-muted-foreground">HT: {formatPrice(sale.montant_total_ht)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          receptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aucune réception non facturée pour ce fournisseur
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">
                  {receptions.length} réception(s) disponible(s) - {selectedReceptions.length} sélectionnée(s)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllReceptions}>
                    Tout sélectionner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                    Effacer
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {receptions.map(reception => (
                  <div
                    key={reception.id}
                    className={`flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-muted/50 ${
                      selectedReceptions.includes(reception.id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedReceptions.includes(reception.id)}
                        onCheckedChange={(checked) => handleReceptionSelection(reception.id, checked === true)}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {reception.numero_reception || reception.reference_facture || 'Réception'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(reception.date_reception)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(reception.montant_ttc)}</p>
                      <div className="text-xs text-muted-foreground">
                        <span>HT: {formatPrice(reception.montant_ht)}</span>
                        {reception.montant_centime_additionnel > 0 && (
                          <span className="ml-1">CA: {formatPrice(reception.montant_centime_additionnel)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Totals summary */}
        {((type === 'client' && selectedSales.length > 0) || (type === 'fournisseur' && selectedReceptions.length > 0)) && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <Badge variant="default">
                {type === 'client' ? selectedSales.length : selectedReceptions.length} transaction(s) sélectionnée(s)
              </Badge>
              <div className="text-right">
                <p className="text-sm font-bold">
                  Total TTC: {formatPrice(
                    type === 'client'
                      ? sales.filter(s => selectedSales.includes(s.id)).reduce((sum, s) => sum + (s.montant_total_ttc || 0), 0)
                      : receptions.filter(r => selectedReceptions.includes(r.id)).reduce((sum, r) => sum + (r.montant_ttc || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
