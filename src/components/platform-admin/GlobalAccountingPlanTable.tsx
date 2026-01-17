import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Download, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalAccountingPlanTableProps {
  selectedPlanId: string | null;
}

interface CompteGlobal {
  id: string;
  plan_comptable_id: string;
  numero_compte: string;
  libelle_compte: string;
  classe: number;
  niveau: number;
  compte_parent_numero: string | null;
  type_compte: string | null;
  est_nouveau_syscohada: boolean;
  est_modifie_syscohada: boolean;
  est_compte_flux_tresorerie: boolean;
  description: string | null;
  notes: string | null;
  is_active: boolean;
}

interface ClasseComptable {
  id: string;
  plan_comptable_id: string;
  numero: number;
  nom: string;
  description: string | null;
  type_bilan: string | null;
  color: string | null;
}

const CLASS_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  4: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  5: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  6: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  7: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  8: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  9: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
};

const GlobalAccountingPlanTable: React.FC<GlobalAccountingPlanTableProps> = ({ selectedPlanId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));

  // Get the plan or default to SYSCOHADA
  const { data: defaultPlan } = useQuery({
    queryKey: ['default-plan-comptable'],
    queryFn: async () => {
      const { data } = await supabase
        .from('plans_comptables_globaux')
        .select('id')
        .eq('code', 'SYSCOHADA_REVISE')
        .single();
      return data;
    },
    enabled: !selectedPlanId,
  });

  const planId = selectedPlanId || defaultPlan?.id;

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-comptables-globales', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('classes_comptables_globales')
        .select('*')
        .eq('plan_comptable_id', planId)
        .order('numero');

      if (error) throw error;
      return data as ClasseComptable[];
    },
    enabled: !!planId,
  });

  const { data: comptes, isLoading: comptesLoading } = useQuery({
    queryKey: ['comptes-globaux', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('comptes_globaux')
        .select('*')
        .eq('plan_comptable_id', planId)
        .order('numero_compte');

      if (error) throw error;
      return data as CompteGlobal[];
    },
    enabled: !!planId,
  });

  const filteredComptes = useMemo(() => {
    if (!comptes) return [];
    
    return comptes.filter(compte => {
      const matchesSearch = !searchQuery || 
        compte.numero_compte.toLowerCase().includes(searchQuery.toLowerCase()) ||
        compte.libelle_compte.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClasse = selectedClasse === 'all' || compte.classe === parseInt(selectedClasse);
      
      return matchesSearch && matchesClasse;
    });
  }, [comptes, searchQuery, selectedClasse]);

  const groupedByClasse = useMemo(() => {
    const groups: Record<number, CompteGlobal[]> = {};
    filteredComptes.forEach(compte => {
      if (!groups[compte.classe]) {
        groups[compte.classe] = [];
      }
      groups[compte.classe].push(compte);
    });
    return groups;
  }, [filteredComptes]);

  const toggleClasse = (classe: number) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(classe)) {
        next.delete(classe);
      } else {
        next.add(classe);
      }
      return next;
    });
  };

  const handleExport = () => {
    if (!comptes || comptes.length === 0) return;

    const csvContent = [
      ['Numéro', 'Libellé', 'Classe', 'Niveau', 'Compte Parent', 'Type', 'Nouveau', 'Modifié', 'Flux Trésorerie'].join(';'),
      ...comptes.map(c => [
        c.numero_compte,
        `"${c.libelle_compte.replace(/"/g, '""')}"`,
        c.classe,
        c.niveau,
        c.compte_parent_numero || '',
        c.type_compte || '',
        c.est_nouveau_syscohada ? 'Oui' : 'Non',
        c.est_modifie_syscohada ? 'Oui' : 'Non',
        c.est_compte_flux_tresorerie ? 'Oui' : 'Non',
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan_comptable_global.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!planId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Sélectionnez un plan comptable pour voir ses comptes
          </p>
        </CardContent>
      </Card>
    );
  }

  if (classesLoading || comptesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Chargement des comptes...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            Plan Comptable
            <Badge variant="secondary">{comptes?.length || 0} comptes</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou libellé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedClasse} onValueChange={setSelectedClasse}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes?.map(c => (
                <SelectItem key={c.numero} value={c.numero.toString()}>
                  Classe {c.numero}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t">
          {Object.entries(groupedByClasse)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([classeNum, comptesClasse]) => {
              const classe = classes?.find(c => c.numero === parseInt(classeNum));
              const isExpanded = expandedClasses.has(parseInt(classeNum));

              return (
                <div key={classeNum} className="border-b last:border-b-0">
                  <button
                    onClick={() => toggleClasse(parseInt(classeNum))}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Badge className={cn('font-bold', CLASS_COLORS[parseInt(classeNum)])}>
                        Classe {classeNum}
                      </Badge>
                      <span className="font-medium text-sm">
                        {classe?.nom || `Classe ${classeNum}`}
                      </span>
                    </div>
                    <Badge variant="outline">{comptesClasse.length} comptes</Badge>
                  </button>

                  {isExpanded && (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[120px]">N° Compte</TableHead>
                          <TableHead>Libellé</TableHead>
                          <TableHead className="w-[80px] text-center">Niveau</TableHead>
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead className="w-[100px] text-center">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comptesClasse.map((compte) => (
                          <TableRow 
                            key={compte.id}
                            className={cn(
                              compte.niveau === 1 && 'font-semibold bg-muted/20',
                              compte.niveau === 2 && 'font-medium',
                              compte.niveau >= 3 && 'text-sm'
                            )}
                          >
                            <TableCell 
                              className="font-mono"
                              style={{ paddingLeft: `${(compte.niveau - 1) * 16 + 16}px` }}
                            >
                              {compte.numero_compte}
                            </TableCell>
                            <TableCell>{compte.libelle_compte}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                N{compte.niveau}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {compte.type_compte && (
                                <Badge variant="secondary" className="text-xs">
                                  {compte.type_compte}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {compte.est_nouveau_syscohada && (
                                  <Badge className="bg-green-500 text-white text-xs">Nouveau</Badge>
                                )}
                                {compte.est_modifie_syscohada && (
                                  <Badge className="bg-amber-500 text-white text-xs">Modifié</Badge>
                                )}
                                {compte.est_compte_flux_tresorerie && (
                                  <Badge className="bg-cyan-500 text-white text-xs">Flux</Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
        </div>

        {filteredComptes.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            {searchQuery || selectedClasse !== 'all' 
              ? 'Aucun compte ne correspond à votre recherche'
              : 'Aucun compte dans ce plan. Importez des comptes depuis Excel.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalAccountingPlanTable;
