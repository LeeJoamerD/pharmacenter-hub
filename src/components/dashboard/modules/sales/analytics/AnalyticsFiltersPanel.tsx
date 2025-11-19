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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

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
  const { tenantId } = useTenant();

  const { data: agents } = useQuery({
    queryKey: ['analytics-agents', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('personnel')
        .select('id, noms, prenoms')
        .eq('tenant_id', tenantId!)
        .eq('is_active', true)
        .order('noms');
      return data || [];
    },
    enabled: !!tenantId,
  });

  const { data: categories } = useQuery({
    queryKey: ['analytics-categories', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('categorie_tarification')
        .select('id, libelle_categorie')
        .eq('tenant_id', tenantId!)
        .eq('is_active', true)
        .order('libelle_categorie');
      return data || [];
    },
    enabled: !!tenantId,
  });

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
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8">
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {isOpen ? <><ChevronUp className="h-4 w-4 mr-1" />Masquer</> : <><ChevronDown className="h-4 w-4 mr-1" />Afficher</>}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie de produits</label>
                <Select value={filters.categories?.[0] || 'all'} onValueChange={(value) => onFiltersChange({...filters, categories: value === 'all' ? undefined : [value]})}>
                  <SelectTrigger><SelectValue placeholder="Toutes les catégories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories?.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.libelle_categorie}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mode de paiement</label>
                <Select value={filters.paymentMethods?.[0] || 'all'} onValueChange={(value) => onFiltersChange({...filters, paymentMethods: value === 'all' ? undefined : [value]})}>
                  <SelectTrigger><SelectValue placeholder="Tous les modes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modes</SelectItem>
                    <SelectItem value="Espèces">Espèces</SelectItem>
                    <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                    <SelectItem value="Mobile money">Mobile money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type de vente</label>
                <Select value={filters.saleTypes?.[0] || 'all'} onValueChange={(value) => onFiltersChange({...filters, saleTypes: value === 'all' ? undefined : [value]})}>
                  <SelectTrigger><SelectValue placeholder="Tous les types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Comptant">Comptant</SelectItem>
                    <SelectItem value="Crédit">Crédit</SelectItem>
                    <SelectItem value="Assurance">Assurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Agent</label>
                <Select value={filters.agents?.[0] || 'all'} onValueChange={(value) => onFiltersChange({...filters, agents: value === 'all' ? undefined : [value]})}>
                  <SelectTrigger><SelectValue placeholder="Tous les agents" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les agents</SelectItem>
                    {agents?.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.noms} {agent.prenoms}</SelectItem>))}
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
