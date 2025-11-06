import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Filter, X, CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReturnFilters } from '@/hooks/useReturnsExchanges';

interface ReturnFiltersPanelProps {
  filters: ReturnFilters;
  onFilterChange: (filters: ReturnFilters) => void;
}

const ReturnFiltersPanel: React.FC<ReturnFiltersPanelProps> = ({ filters, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  const statuts = ['En attente', 'Approuvé', 'Rejeté', 'Terminé'];
  const typesOperation = ['Retour', 'Échange', 'Avoir'];

  const handleStatutToggle = (statut: string) => {
    const current = filters.statut || [];
    const updated = current.includes(statut)
      ? current.filter(s => s !== statut)
      : [...current, statut];
    onFilterChange({ ...filters, statut: updated });
  };

  const handleTypeToggle = (type: string) => {
    const current = filters.typeOperation || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFilterChange({ ...filters, typeOperation: updated });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onFilterChange({ 
      ...filters, 
      startDate: date ? date.toISOString().split('T')[0] : undefined 
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onFilterChange({ 
      ...filters, 
      endDate: date ? date.toISOString().split('T')[0] : undefined 
    });
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    (filters.statut?.length || 0) +
    (filters.typeOperation?.length || 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.minAmount ? 1 : 0) +
    (filters.maxAmount ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Effacer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-6">
          {/* Recherche */}
          <div className="space-y-2">
            <Label htmlFor="search">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="N° retour, transaction, motif..."
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Statuts */}
          <div className="space-y-2">
            <Label>Statuts</Label>
            <div className="space-y-2">
              {statuts.map((statut) => (
                <div key={statut} className="flex items-center space-x-2">
                  <Checkbox
                    id={`statut-${statut}`}
                    checked={filters.statut?.includes(statut) || false}
                    onCheckedChange={() => handleStatutToggle(statut)}
                  />
                  <label
                    htmlFor={`statut-${statut}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {statut}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Types opération */}
          <div className="space-y-2">
            <Label>Type d'opération</Label>
            <div className="space-y-2">
              {typesOperation.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.typeOperation?.includes(type) || false}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Montant min (FCFA)</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => onFilterChange({ 
                  ...filters, 
                  minAmount: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Montant max (FCFA)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="1000000"
                value={filters.maxAmount || ''}
                onChange={(e) => onFilterChange({ 
                  ...filters, 
                  maxAmount: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ReturnFiltersPanel;
