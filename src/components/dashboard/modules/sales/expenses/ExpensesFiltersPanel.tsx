import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, X, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import type { CashExpenseSearchFilters } from '@/hooks/useCashExpenseSearch';

interface ExpensesFiltersPanelProps {
  filters: CashExpenseSearchFilters;
  onFiltersChange: (filters: Partial<CashExpenseSearchFilters>) => void;
  onReset: () => void;
  currentUserRole: string | null;
  onExportExcel: () => void;
  onExportPDF: () => void;
  exportLoading: boolean;
}

const EXPENSE_MOTIFS = [
  { value: 'fournitures', label: 'Fournitures de bureau' },
  { value: 'entretien', label: 'Entretien et réparations' },
  { value: 'transport', label: 'Transport et déplacement' },
  { value: 'charges', label: 'Charges diverses' },
  { value: 'salaires', label: 'Avances sur salaires' },
  { value: 'impots', label: 'Impôts et taxes' },
  { value: 'divers', label: 'Dépenses diverses' }
];

const ExpensesFiltersPanel: React.FC<ExpensesFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  onReset,
  currentUserRole,
  onExportExcel,
  onExportPDF,
  exportLoading
}) => {
  const { currentTenant } = useTenant();
  const [agents, setAgents] = useState<{ id: string; noms: string; prenoms: string }[]>([]);
  const [sessions, setSessions] = useState<{ id: string; numero_session: string; statut: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const isAdminOrManager = ['Admin', 'Pharmacien Titulaire', 'Secrétaire'].includes(currentUserRole || '');

  useEffect(() => {
    if (!currentTenant) return;
    
    const fetchData = async () => {
      const [agentsRes, sessionsRes] = await Promise.all([
        supabase
          .from('personnel')
          .select('id, noms, prenoms')
          .eq('tenant_id', currentTenant.id)
          .order('noms'),
        supabase
          .from('sessions_caisse')
          .select('id, numero_session, statut')
          .eq('tenant_id', currentTenant.id)
          .order('date_ouverture', { ascending: false })
          .limit(100)
      ]);
      
      if (agentsRes.data) setAgents(agentsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
    };

    fetchData();
  }, [currentTenant]);

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.motif || 
    filters.agentId || filters.search || filters.sessionStatus !== 'all' || 
    filters.includesCancelled || filters.montantMin || filters.montantMax || filters.sessionId;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Barre de recherche principale */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Description, référence..."
                  value={filters.search || ''}
                  onChange={(e) => onFiltersChange({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres {hasActiveFilters && '•'}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              disabled={exportLoading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={exportLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="dateFrom">Date début</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Date fin</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="montantMin">Montant min</Label>
                <Input
                  id="montantMin"
                  type="number"
                  placeholder="0"
                  value={filters.montantMin || ''}
                  onChange={(e) => onFiltersChange({ montantMin: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="montantMax">Montant max</Label>
                <Input
                  id="montantMax"
                  type="number"
                  placeholder="∞"
                  value={filters.montantMax || ''}
                  onChange={(e) => onFiltersChange({ montantMax: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="motif">Motif</Label>
                <Select
                  value={filters.motif || 'all'}
                  onValueChange={(value) => onFiltersChange({ motif: value === 'all' ? '' : value })}
                >
                  <SelectTrigger id="motif">
                    <SelectValue placeholder="Tous les motifs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les motifs</SelectItem>
                    {EXPENSE_MOTIFS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdminOrManager && (
                <div>
                  <Label htmlFor="agent">Agent</Label>
                  <Select
                    value={filters.agentId || 'all'}
                    onValueChange={(value) => onFiltersChange({ agentId: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Tous les agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les agents</SelectItem>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.prenoms} {agent.noms}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="sessionId">Session</Label>
                <Select
                  value={filters.sessionId || 'all'}
                  onValueChange={(value) => onFiltersChange({ sessionId: value === 'all' ? '' : value })}
                >
                  <SelectTrigger id="sessionId">
                    <SelectValue placeholder="Toutes les sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sessions</SelectItem>
                    {sessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.numero_session} ({s.statut})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdminOrManager && (
                <div>
                  <Label htmlFor="sessionStatus">Statut session</Label>
                  <Select
                    value={filters.sessionStatus || 'all'}
                    onValueChange={(value) => onFiltersChange({ sessionStatus: value })}
                  >
                    <SelectTrigger id="sessionStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les sessions</SelectItem>
                      <SelectItem value="open">Sessions ouvertes</SelectItem>
                      <SelectItem value="closed">Sessions fermées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="includesCancelled"
                  checked={filters.includesCancelled || false}
                  onCheckedChange={(checked) => onFiltersChange({ includesCancelled: checked })}
                />
                <Label htmlFor="includesCancelled" className="text-sm">
                  Afficher les annulées
                </Label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpensesFiltersPanel;
