import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AnalyticsFilters } from '@/hooks/useSalesAnalytics';

interface AnalyticsFiltersPanelProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
}

const AnalyticsFiltersPanel: React.FC<AnalyticsFiltersPanelProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.paymentMethods && filters.paymentMethods.length > 0) count++;
    if (filters.agents && filters.agents.length > 0) count++;
    if (filters.saleTypes && filters.saleTypes.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleReset = () => {
    onFiltersChange({});
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Filtres Avancés</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} actif(s)</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Masquer
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Afficher
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre Catégorie */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Catégorie de produits
                </label>
                <Select
                  value={filters.categories?.[0] || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      categories: value === 'all' ? undefined : [value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="Médicaments">Médicaments</SelectItem>
                    <SelectItem value="Parapharmacie">Parapharmacie</SelectItem>
                    <SelectItem value="Matériel Médical">Matériel Médical</SelectItem>
                    <SelectItem value="Cosmétiques">Cosmétiques</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Mode de paiement */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mode de paiement
                </label>
                <Select
                  value={filters.paymentMethods?.[0] || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      paymentMethods: value === 'all' ? undefined : [value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modes</SelectItem>
                    <SelectItem value="Espèces">Espèces</SelectItem>
                    <SelectItem value="Carte">Carte bancaire</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Assurance">Assurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Type de vente */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type de vente
                </label>
                <Select
                  value={filters.saleTypes?.[0] || 'all'}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      saleTypes: value === 'all' ? undefined : [value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="comptoir">Comptoir</SelectItem>
                    <SelectItem value="assurance">Assurance</SelectItem>
                    <SelectItem value="credit">Crédit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};

export default AnalyticsFiltersPanel;
