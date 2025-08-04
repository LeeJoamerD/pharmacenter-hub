import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ClientFiltersProps {
  filters: {
    taux_remise_min: string;
    taux_remise_max: string;
    type_client: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const ClientFilters = ({ filters, onFiltersChange, onClearFilters }: ClientFiltersProps) => {
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
              {Object.values(filters).filter(value => value !== '').length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtres</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Type de client</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md h-8"
                value={filters.type_client}
                onChange={(e) => onFiltersChange({...filters, type_client: e.target.value})}
              >
                <option value="">Tous les types</option>
                <option value="Ordinaire">Ordinaire</option>
                <option value="Personnel">Personnel</option>
                <option value="Assuré">Assuré</option>
                <option value="Conventionné">Conventionné</option>
              </select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Taux de remise</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  placeholder="Min %"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.taux_remise_min}
                  onChange={(e) => onFiltersChange({ ...filters, taux_remise_min: e.target.value })}
                  className="h-8"
                />
                <span className="text-muted-foreground">à</span>
                <Input
                  placeholder="Max %"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.taux_remise_max}
                  onChange={(e) => onFiltersChange({ ...filters, taux_remise_max: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};