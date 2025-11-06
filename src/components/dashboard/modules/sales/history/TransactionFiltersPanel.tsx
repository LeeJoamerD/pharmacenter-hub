import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, DollarSign } from 'lucide-react';

interface TransactionFiltersPanelProps {
  filters: {
    search: string;
    dateFrom: string;
    dateTo: string;
    paymentMethod: string;
    status: string;
    cashier: string;
    register: string;
    minAmount: string;
    maxAmount: string;
  };
  onFilterChange: (filters: any) => void;
  cashiers?: Array<{ id: string; noms: string; prenoms: string }>;
  registers?: Array<{ id: string; nom_caisse: string }>;
}

const TransactionFiltersPanel = ({ filters, onFilterChange, cashiers = [], registers = [] }: TransactionFiltersPanelProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Recherche
            </Label>
            <Input
              id="search"
              placeholder="Numéro, client..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date début
            </Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date fin
            </Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <Select value={filters.paymentMethod} onValueChange={(value) => 
              onFilterChange({ ...filters, paymentMethod: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Espèces">Espèces</SelectItem>
                <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                <SelectItem value="Chèque">Chèque</SelectItem>
                <SelectItem value="Virement">Virement</SelectItem>
                <SelectItem value="Assurance">Assurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={filters.status} onValueChange={(value) => 
              onFilterChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Validée">Validée</SelectItem>
                <SelectItem value="Finalisée">Finalisée</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Annulée">Annulée</SelectItem>
                <SelectItem value="Remboursée">Remboursée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Caissier</Label>
            <Select value={filters.cashier} onValueChange={(value) => 
              onFilterChange({ ...filters, cashier: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {cashiers.map((cashier) => (
                  <SelectItem key={cashier.id} value={cashier.id}>
                    {`${cashier.noms} ${cashier.prenoms}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Caisse</Label>
            <Select value={filters.register} onValueChange={(value) => 
              onFilterChange({ ...filters, register: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {registers.map((register) => (
                  <SelectItem key={register.id} value={register.id}>
                    {register.nom_caisse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Montant min
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => onFilterChange({ ...filters, minAmount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Montant max
            </Label>
            <Input
              type="number"
              placeholder="Illimité"
              value={filters.maxAmount}
              onChange={(e) => onFilterChange({ ...filters, maxAmount: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFiltersPanel;
