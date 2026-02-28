import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, RotateCcw, Loader2 } from 'lucide-react';
import { type CashSessionSearchFilters } from '@/hooks/useCashSessionSearch';
import { type Personnel } from '@/hooks/usePersonnel';
import { type Caisse } from '@/hooks/useCaisses';

interface CashSessionFiltersProps {
  filters: CashSessionSearchFilters;
  onUpdateFilters: (filters: Partial<CashSessionSearchFilters>) => void;
  onResetFilters: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  exportLoading: boolean;
  personnelList: Personnel[];
  caissesList: Caisse[];
}

const CashSessionFiltersComponent = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  onExportExcel,
  onExportPDF,
  exportLoading,
  personnelList,
  caissesList,
}: CashSessionFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Date début</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onUpdateFilters({ dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Date fin</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onUpdateFilters({ dateTo: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Statut</Label>
            <Select value={filters.statut || 'all'} onValueChange={(v) => onUpdateFilters({ statut: v === 'all' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Ouverte">Ouverte</SelectItem>
                <SelectItem value="Fermée">Fermée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Caissier</Label>
            <Select value={filters.cashierId || 'all'} onValueChange={(v) => onUpdateFilters({ cashierId: v === 'all' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {personnelList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.prenoms} {p.noms}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Caisse</Label>
            <Select value={filters.caisseId || 'all'} onValueChange={(v) => onUpdateFilters({ caisseId: v === 'all' ? '' : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {caissesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom_caisse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Montant min</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => onUpdateFilters({ minAmount: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Montant max</Label>
            <Input
              type="number"
              placeholder="∞"
              value={filters.maxAmount}
              onChange={(e) => onUpdateFilters({ maxAmount: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={exportLoading}
          >
            {exportLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={exportLoading}
          >
            {exportLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashSessionFiltersComponent;
