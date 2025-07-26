import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';

interface EmployeeFiltersProps {
  filters: {
    fonction: string;
    statut_contractuel: string;
    situation_familiale: string;
    salaire_min: string;
    salaire_max: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const EmployeeFilters = ({ filters, onFiltersChange, onClearFilters }: EmployeeFiltersProps) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtres des employés</SheetTitle>
          <SheetDescription>
            Filtrez la liste des employés selon vos critères
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Fonction</label>
            <Select value={filters.fonction} onValueChange={(value) => updateFilter('fonction', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les fonctions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les fonctions</SelectItem>
                <SelectItem value="Pharmacien titulaire">Pharmacien titulaire</SelectItem>
                <SelectItem value="Pharmacien adjoint">Pharmacien adjoint</SelectItem>
                <SelectItem value="Préparateur">Préparateur</SelectItem>
                <SelectItem value="Étudiant en pharmacie">Étudiant en pharmacie</SelectItem>
                <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                <SelectItem value="Comptable">Comptable</SelectItem>
                <SelectItem value="Vendeur">Vendeur</SelectItem>
                <SelectItem value="Caissier">Caissier</SelectItem>
                <SelectItem value="Agent d'entretien">Agent d'entretien</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Statut contractuel</label>
            <Select value={filters.statut_contractuel} onValueChange={(value) => updateFilter('statut_contractuel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="CDI">CDI</SelectItem>
                <SelectItem value="CDD">CDD</SelectItem>
                <SelectItem value="Stage">Stage</SelectItem>
                <SelectItem value="Freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Situation familiale</label>
            <Select value={filters.situation_familiale} onValueChange={(value) => updateFilter('situation_familiale', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les situations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les situations</SelectItem>
                <SelectItem value="Célibataire">Célibataire</SelectItem>
                <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                <SelectItem value="Veuf(ve)">Veuf(ve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Salaire minimum</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.salaire_min}
              onChange={(e) => updateFilter('salaire_min', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Salaire maximum</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.salaire_max}
              onChange={(e) => updateFilter('salaire_max', e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Effacer les filtres
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};