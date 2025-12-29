import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Plus, Building2, Target, TrendingUp, Calculator, FileBarChart, AlertTriangle, DollarSign, Loader2, Edit, Trash2, Check, FileSpreadsheet, FileText, RefreshCw, Info, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalyticalAccounting, CostCenter, Budget, ChargeAllocation, AllocationLine, AllocationCoefficient } from '@/hooks/useAnalyticalAccounting';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateCostCenterDialog from './dialogs/CreateCostCenterDialog';
import CreateBudgetDialog from './dialogs/CreateBudgetDialog';
import CreateAllocationDialog from './dialogs/CreateAllocationDialog';
import CreateAllocationKeyDialog from './dialogs/CreateAllocationKeyDialog';
import CreateCoefficientDialog from './dialogs/CreateCoefficientDialog';
import { exportAnalyticalReportPDF, exportAnalyticalReportExcel } from '@/utils/analyticalReportExport';

const AnalyticalAccounting = () => {
  const [activeTab, setActiveTab] = useState('centres-couts');
  const { toast } = useToast();
  const { personnel } = useAuth();
  const tenantId = personnel?.tenant_id;
  
  const { formatAmount, getCurrencySymbol, getInputStep } = useCurrencyFormatting();
  
  const {
    costCenters,
    budgets,
    allocationKeys,
    coefficients,
    chargeAllocations,
    profitabilityData,
    isLoading,
    isSaving,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
    createBudget,
    updateBudget,
    deleteBudget,
    validateBudget,
    generateBudgets,
    createChargeAllocation,
    updateChargeAllocation,
    deleteChargeAllocation,
    validateChargeAllocation,
    calculateAutomaticAllocation,
    createAllocationLines,
    createAllocationKey,
    updateAllocationKey,
    deleteAllocationKey,
    createCoefficient,
    updateCoefficient,
    deleteCoefficient,
    getAnalyticsKPIs,
    getBudgetAlerts,
    refreshAll,
  } = useAnalyticalAccounting();

  // États locaux
  const [responsables, setResponsables] = useState<{ id: string; nom_complet: string }[]>([]);
  const [exercices, setExercices] = useState<{ id: string; libelle: string }[]>([]);
  const [showCenterDialog, setShowCenterDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [showCoefficientDialog, setShowCoefficientDialog] = useState(false);
  const [editingCoefficient, setEditingCoefficient] = useState<AllocationCoefficient | null>(null);
  
  // Pagination pour le tableau de rentabilité
  const [profitabilityPage, setProfitabilityPage] = useState(1);
  const [profitabilityPageSize, setProfitabilityPageSize] = useState(50);
  
  // Données paginées pour la rentabilité
  const paginatedProfitability = useMemo(() => {
    const start = (profitabilityPage - 1) * profitabilityPageSize;
    return profitabilityData.slice(start, start + profitabilityPageSize);
  }, [profitabilityData, profitabilityPage, profitabilityPageSize]);
  
  const totalProfitabilityPages = Math.ceil(profitabilityData.length / profitabilityPageSize);

  // Charger les responsables et exercices
  useEffect(() => {
    if (!tenantId) return;
    
    const loadData = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const baseUrl = 'https://pzsoeapzuijhgemjzydo.supabase.co/rest/v1';
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6c29lYXB6dWlqaGdlbWp6eWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4Mzk4MzUsImV4cCI6MjA2NzQxNTgzNX0.GeDciO1Zxu4Q225D2nTisfd9O9SrPIvPuOtkWaQA8I0';
        
        const headers = {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        // Charger personnel
        const personnelResp = await fetch(
          `${baseUrl}/personnel?tenant_id=eq.${tenantId}&is_active=eq.true&select=id,noms,prenoms`,
          { headers }
        );
        const personnelData = await personnelResp.json();
        if (Array.isArray(personnelData)) {
          setResponsables(personnelData.map((p: { id: string; noms: string; prenoms: string }) => ({
            id: p.id,
            nom_complet: `${p.prenoms} ${p.noms}`
          })));
        }
        
        // Charger exercices
        const exercicesResp = await fetch(
          `${baseUrl}/exercices_comptables?tenant_id=eq.${tenantId}&select=id,libelle_exercice&order=date_debut.desc`,
          { headers }
        );
        const exercicesData = await exercicesResp.json();
        if (Array.isArray(exercicesData)) {
          setExercices(exercicesData.map((e: { id: string; libelle_exercice: string }) => ({
            id: e.id,
            libelle: e.libelle_exercice
          })));
        }
      } catch (error) {
        console.error('Erreur chargement données référence:', error);
      }
    };
    
    loadData();
  }, [tenantId]);

  // Données graphiques
  const profitabilityChartData = useMemo(() => {
    return profitabilityData.slice(0, 8).map(item => ({
      product: item.produit_nom.length > 12 ? item.produit_nom.substring(0, 12) + '...' : item.produit_nom,
      revenue: item.chiffre_affaires,
      costs: item.cout_achat,
      marque: item.marge_brute, // Marge brute = base du taux de marque
      tauxMarge: item.taux_marge,
      tauxMarque: item.taux_marque || 0,
    }));
  }, [profitabilityData]);

  // Calcul du total marge brute pour affichage
  const totalMargeBrute = useMemo(() => {
    return profitabilityData.reduce((sum, p) => sum + p.marge_brute, 0);
  }, [profitabilityData]);

  const budgetChartData = useMemo(() => {
    const monthlyBudgets = budgets.filter(b => b.type_periode === 'mensuel' && b.mois);
    const grouped: Record<number, { budget: number; actual: number }> = {};
    
    monthlyBudgets.forEach(b => {
      if (b.mois) {
        if (!grouped[b.mois]) grouped[b.mois] = { budget: 0, actual: 0 };
        grouped[b.mois].budget += b.montant_prevu;
        grouped[b.mois].actual += b.montant_realise;
      }
    });
    
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return Object.entries(grouped).map(([mois, data]) => ({
      month: months[parseInt(mois) - 1] || mois,
      budget: data.budget,
      actual: data.actual,
      variance: data.budget > 0 ? ((data.actual - data.budget) / data.budget) * 100 : 0,
    })).sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  }, [budgets]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Calculs dérivés
  const centerPerformance = useMemo(() => {
    return costCenters.map(center => {
      const centerBudgets = budgets.filter(b => b.centre_cout_id === center.id);
      const totalBudget = centerBudgets.reduce((sum, b) => sum + b.montant_prevu, 0);
      const totalRealise = centerBudgets.reduce((sum, b) => sum + b.montant_realise, 0);
      const variance = totalBudget > 0 ? ((totalRealise - totalBudget) / totalBudget) * 100 : 0;
      
      return {
        ...center,
        budget: totalBudget,
        actual: totalRealise,
        variance,
      };
    });
  }, [costCenters, budgets]);

  const topPerformers = useMemo(() => {
    return centerPerformance.filter(c => c.variance < 0 && c.budget > 0).sort((a, b) => a.variance - b.variance).slice(0, 5);
  }, [centerPerformance]);

  const attentionPoints = useMemo(() => {
    return centerPerformance.filter(c => c.variance > 5 && c.budget > 0).sort((a, b) => b.variance - a.variance).slice(0, 5);
  }, [centerPerformance]);

  // Handlers
  const handleSaveCenter = async (center: Partial<CostCenter>) => {
    if (editingCenter) {
      await updateCostCenter(editingCenter.id, center);
    } else {
      await createCostCenter(center);
    }
    setEditingCenter(null);
  };

  const handleSaveBudget = async (budget: Partial<Budget>) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, budget);
    } else {
      await createBudget(budget);
    }
    setEditingBudget(null);
  };

  const handleSaveAllocation = async (allocation: Partial<ChargeAllocation>, lines: Partial<AllocationLine>[]) => {
    const created = await createChargeAllocation(allocation);
    if (created && lines.length > 0) {
      await createAllocationLines(created.id, lines);
    }
  };

  const handleSaveKey = async (key: any) => {
    if (editingKey) {
      await updateAllocationKey(editingKey.id, key);
    } else {
      await createAllocationKey(key);
    }
    setEditingKey(null);
  };

  const handleSaveCoefficient = async (coef: Partial<AllocationCoefficient>) => {
    if (editingCoefficient) {
      await updateCoefficient(editingCoefficient.id, coef);
    } else {
      await createCoefficient(coef);
    }
    setEditingCoefficient(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.type === 'center') {
        await deleteCostCenter(deleteConfirm.id);
      } else if (deleteConfirm.type === 'budget') {
        await deleteBudget(deleteConfirm.id);
      } else if (deleteConfirm.type === 'allocation') {
        await deleteChargeAllocation(deleteConfirm.id);
      } else if (deleteConfirm.type === 'key') {
        await deleteAllocationKey(deleteConfirm.id);
      } else if (deleteConfirm.type === 'coefficient') {
        await deleteCoefficient(deleteConfirm.id);
      }
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const exportData = {
        costCenters,
        budgets,
        chargeAllocations,
        profitabilityData,
        kpis: getAnalyticsKPIs,
        formatAmount,
      };
      
      if (format === 'pdf') {
        await exportAnalyticalReportPDF(exportData);
      } else {
        await exportAnalyticalReportExcel(exportData);
      }
      toast({ title: 'Export réussi', description: `Rapport exporté en ${format.toUpperCase()}` });
    } catch (error) {
      toast({ title: 'Erreur', description: "Échec de l'export", variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && costCenters.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Chargement des données analytiques...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Comptabilité Analytique</h3>
          <p className="text-muted-foreground">
            Centres de coûts, analyse de rentabilité et pilotage budgétaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('excel')} variant="outline" disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Excel
          </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline" disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            PDF
          </Button>
          <Button onClick={refreshAll} variant="outline" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { setEditingCenter(null); setShowCenterDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Centre
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="centres-couts">Centres de Coûts</TabsTrigger>
          <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="tableaux-bord">Tableaux de Bord</TabsTrigger>
        </TabsList>

        {/* ONGLET CENTRES DE COÛTS */}
        <TabsContent value="centres-couts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centres Actifs</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getAnalyticsKPIs.nombreCentresActifs}</div>
                <p className="text-xs text-muted-foreground">sur {costCenters.length} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(getAnalyticsKPIs.budgetTotal)}</div>
                <p className="text-xs text-muted-foreground">Budget alloué</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réalisé</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(getAnalyticsKPIs.realiseTotal)}</div>
                <p className={`text-xs ${getAnalyticsKPIs.ecartMoyen < 0 ? 'text-success' : 'text-destructive'}`}>
                  {getAnalyticsKPIs.ecartMoyen > 0 ? '+' : ''}{getAnalyticsKPIs.ecartMoyen.toFixed(1)}% vs budget
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Écart Moyen</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.abs(getAnalyticsKPIs.ecartMoyen).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Variance globale</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des Centres de Coûts</CardTitle>
              <CardDescription>Configuration et suivi des centres de responsabilité</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Centre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Réalisé</TableHead>
                    <TableHead>Écart</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centerPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Aucun centre de coûts. Cliquez sur "Nouveau Centre" pour en créer un.
                      </TableCell>
                    </TableRow>
                  ) : (
                    centerPerformance.map((center) => (
                      <TableRow key={center.id} className={!center.est_actif ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{center.code}</TableCell>
                        <TableCell>{center.nom}</TableCell>
                        <TableCell>
                          <Badge variant={center.type_centre === 'operationnel' ? 'default' : 'secondary'}>
                            {center.type_centre}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {center.responsable ? `${center.responsable.prenoms} ${center.responsable.noms}` : '-'}
                        </TableCell>
                        <TableCell>{formatAmount(center.budget)}</TableCell>
                        <TableCell>{formatAmount(center.actual)}</TableCell>
                        <TableCell>
                          <span className={center.variance < 0 ? 'text-success' : center.variance > 5 ? 'text-destructive' : ''}>
                            {center.variance > 0 ? '+' : ''}{center.variance.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingCenter(center); setShowCenterDialog(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ type: 'center', id: center.id })}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET RENTABILITÉ */}
        <TabsContent value="rentabilite" className="space-y-4">
          {/* KPIs Rentabilité avec TVA et Centime Additionnel */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(profitabilityData.reduce((sum, p) => sum + p.chiffre_affaires, 0))}
                </div>
                <p className="text-xs text-muted-foreground">{profitabilityData.length} produits vendus</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(profitabilityData.reduce((sum, p) => sum + (p.montant_tva || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total TVA sur ventes</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                  Taux de Marge Moyen
                  <span className="cursor-help" title="Taux de Marge = (CA - Coût) / Coût × 100. Gain relatif au coût d'achat.">
                    <Info className="h-3 w-3" />
                  </span>
                </CardTitle>
                <Percent className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {profitabilityData.length > 0 
                    ? (() => {
                        const totalCA = profitabilityData.reduce((sum, p) => sum + p.chiffre_affaires, 0);
                        const weightedMarge = profitabilityData.reduce((sum, p) => sum + (p.taux_marge * p.chiffre_affaires), 0);
                        return totalCA > 0 ? (weightedMarge / totalCA).toFixed(1) : '0.0';
                      })()
                    : '0.0'}%
                </div>
                <p className="text-xs text-green-600/70">Pondéré par CA</p>
                <p className="text-sm font-semibold text-green-700 mt-1">{formatAmount(totalMargeBrute)}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  Taux de Marque Moyen
                  <span className="cursor-help" title="Taux de Marque = (CA - Coût) / CA × 100. Part de marge dans le prix de vente.">
                    <Info className="h-3 w-3" />
                  </span>
                </CardTitle>
                <Percent className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {profitabilityData.length > 0 
                    ? (() => {
                        const totalCA = profitabilityData.reduce((sum, p) => sum + p.chiffre_affaires, 0);
                        const weightedMarque = profitabilityData.reduce((sum, p) => sum + ((p.taux_marque || 0) * p.chiffre_affaires), 0);
                        return totalCA > 0 ? (weightedMarque / totalCA).toFixed(1) : '0.0';
                      })()
                    : '0.0'}%
                </div>
                <p className="text-xs text-blue-600/70">Pondéré par CA</p>
                <p className="text-sm font-semibold text-blue-700 mt-1">{formatAmount(totalMargeBrute)}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Centime Add. Collecté</CardTitle>
                <Calculator className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {formatAmount(profitabilityData.reduce((sum, p) => sum + (p.montant_centime_additionnel || 0), 0))}
                </div>
                <p className="text-xs text-amber-600/70">5% sur TVA</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de Rentabilité par Produit</CardTitle>
                <CardDescription>CA, Coûts, Marque (valeur) et Taux (Marge vert, Marque bleu)</CardDescription>
              </CardHeader>
              <CardContent>
                {profitabilityChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucune donnée de vente disponible
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitabilityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" fontSize={10} />
                      <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name.includes('%')) return `${value.toFixed(1)}%`;
                          return formatAmount(value);
                        }} 
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" name="CA" />
                      <Bar yAxisId="left" dataKey="costs" fill="#FDA4AF" name="Coûts" />
                      <Bar yAxisId="left" dataKey="marque" fill="hsl(var(--chart-2))" name="Marque (valeur)" />
                      <Bar yAxisId="right" dataKey="tauxMarge" fill="#22C55E" name="Tx Marge %" />
                      <Bar yAxisId="right" dataKey="tauxMarque" fill="#3B82F6" name="Tx Marque %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Marques et Taux</CardTitle>
                <CardDescription>Contribution par produit</CardDescription>
              </CardHeader>
              <CardContent>
                {profitabilityChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-center font-medium mb-2 text-blue-600">Répartition Marques</p>
                      <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                          <Pie
                            data={profitabilityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={50}
                            dataKey="marque"
                            nameKey="product"
                          >
                            {profitabilityChartData.map((_, index) => (
                              <Cell key={`cell-marque-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatAmount(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-xs text-center font-medium mb-2 text-green-600">Répartition Tx Marge</p>
                      <ResponsiveContainer width="100%" height={130}>
                        <PieChart>
                          <Pie
                            data={profitabilityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={50}
                            dataKey="tauxMarge"
                            nameKey="product"
                          >
                            {profitabilityChartData.map((_, index) => (
                              <Cell key={`cell-marge-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Détail Rentabilité</CardTitle>
                <CardDescription>
                  Analyse détaillée par ligne de produits ({profitabilityData.length} produits) - 
                  Page {profitabilityPage} sur {totalProfitabilityPages || 1}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={profitabilityPageSize.toString()}
                  onValueChange={(value) => {
                    setProfitabilityPageSize(parseInt(value));
                    setProfitabilityPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                    <SelectItem value="200">200 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Famille</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                    <TableHead className="text-right">Coûts</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-right text-green-600" title="Taux de Marge = (CA - Coût) / Coût × 100">
                      <span className="flex items-center justify-end gap-1">
                        Tx Marge <Info className="h-3 w-3" />
                      </span>
                    </TableHead>
                    <TableHead className="text-right text-blue-600" title="Taux de Marque = (CA - Coût) / CA × 100">
                      <span className="flex items-center justify-end gap-1">
                        Tx Marque <Info className="h-3 w-3" />
                      </span>
                    </TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfitability.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Aucune donnée de rentabilité. Les données sont calculées à partir des ventes.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProfitability.map((item) => {
                      // Couleurs pour Taux de Marge (vert)
                      const getTauxMargeClass = (taux: number) => {
                        if (taux >= 50) return 'text-green-700 bg-green-100 dark:bg-green-900/30 font-semibold';
                        if (taux >= 30) return 'text-green-600';
                        if (taux >= 15) return 'text-amber-600';
                        return 'text-red-600';
                      };
                      // Couleurs pour Taux de Marque (bleu)
                      const getTauxMarqueClass = (taux: number) => {
                        if (taux >= 35) return 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 font-semibold';
                        if (taux >= 25) return 'text-blue-600';
                        if (taux >= 15) return 'text-blue-400';
                        return 'text-gray-500';
                      };
                      const tauxMarque = item.taux_marque || 0;
                      
                      return (
                        <TableRow key={item.produit_id}>
                          <TableCell className="font-medium max-w-[200px] truncate" title={item.produit_nom}>
                            {item.produit_nom}
                          </TableCell>
                          <TableCell>{item.famille}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.chiffre_affaires)}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.cout_achat)}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.marge_brute)}</TableCell>
                          <TableCell className={`text-right rounded px-2 ${getTauxMargeClass(item.taux_marge)}`}>
                            {item.taux_marge.toFixed(1)}%
                          </TableCell>
                          <TableCell className={`text-right rounded px-2 ${getTauxMarqueClass(tauxMarque)}`}>
                            {tauxMarque.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant={tauxMarque >= 35 ? 'default' : tauxMarque >= 20 ? 'secondary' : 'destructive'}>
                              {tauxMarque >= 35 ? 'Excellent' : tauxMarque >= 20 ? 'Bon' : 'Faible'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              
              {/* Contrôles de pagination */}
              {totalProfitabilityPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage {((profitabilityPage - 1) * profitabilityPageSize) + 1} - {Math.min(profitabilityPage * profitabilityPageSize, profitabilityData.length)} sur {profitabilityData.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfitabilityPage(1)}
                      disabled={profitabilityPage === 1}
                    >
                      ««
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfitabilityPage(p => Math.max(1, p - 1))}
                      disabled={profitabilityPage === 1}
                    >
                      ‹ Précédent
                    </Button>
                    <span className="text-sm px-2">
                      Page {profitabilityPage} / {totalProfitabilityPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfitabilityPage(p => Math.min(totalProfitabilityPages, p + 1))}
                      disabled={profitabilityPage === totalProfitabilityPages}
                    >
                      Suivant ›
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfitabilityPage(totalProfitabilityPages)}
                      disabled={profitabilityPage === totalProfitabilityPages}
                    >
                      »»
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET RÉPARTITION */}
        <TabsContent value="repartition" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Répartition des Charges Indirectes</CardTitle>
                <CardDescription>Allocation automatique et manuelle des coûts</CardDescription>
              </div>
              <Button onClick={() => setShowAllocationDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Répartition
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  La répartition automatique utilise les clés de répartition configurées ({allocationKeys.filter(k => k.est_active).length} clés actives).
                </AlertDescription>
              </Alert>

              <Separator />

              <div>
                <h4 className="text-lg font-semibold mb-3">Historique des Répartitions</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Type de Charge</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Clé Utilisée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chargeAllocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Aucune répartition enregistrée
                        </TableCell>
                      </TableRow>
                    ) : (
                      chargeAllocations.map((allocation) => (
                        <TableRow key={allocation.id}>
                          <TableCell>{format(new Date(allocation.date_repartition), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-mono text-sm">{allocation.numero_repartition}</TableCell>
                          <TableCell>{allocation.libelle}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{allocation.type_charge}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatAmount(allocation.montant_total)}</TableCell>
                          <TableCell>{allocation.cle?.libelle || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={allocation.statut === 'valide' ? 'default' : allocation.statut === 'comptabilise' ? 'secondary' : 'outline'}>
                              {allocation.statut === 'valide' ? 'Validé' : allocation.statut === 'comptabilise' ? 'Comptabilisé' : 'En cours'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {allocation.statut === 'en_cours' && (
                                <Button variant="ghost" size="sm" onClick={() => validateChargeAllocation(allocation.id)}>
                                  <Check className="h-4 w-4 text-success" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ type: 'allocation', id: allocation.id })}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Section Clés de Répartition */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold">Clés de Répartition</h4>
                  <Button variant="outline" size="sm" onClick={() => { setEditingKey(null); setShowKeyDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Clé
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocationKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucune clé de répartition configurée. Créez-en pour pouvoir effectuer des répartitions.
                        </TableCell>
                      </TableRow>
                    ) : (
                      allocationKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-mono font-bold">{key.code}</TableCell>
                          <TableCell>{key.libelle}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{key.type_cle.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                            {key.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.est_active ? 'default' : 'secondary'}>
                              {key.est_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setEditingKey(key); setShowKeyDialog(true); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDeleteConfirm({ type: 'key', id: key.id })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-6" />

              {/* Section Coefficients de Répartition */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold">Coefficients de Répartition</h4>
                  <Button variant="outline" size="sm" onClick={() => { setEditingCoefficient(null); setShowCoefficientDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Coefficient
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Définissez les poids/valeurs de base pour chaque combinaison clé + centre de coûts.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clé de Répartition</TableHead>
                      <TableHead>Centre de Coûts</TableHead>
                      <TableHead className="text-right">Valeur Base</TableHead>
                      <TableHead>Date Début</TableHead>
                      <TableHead>Date Fin</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coefficients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucun coefficient configuré. Créez-en pour pouvoir calculer des répartitions automatiques.
                        </TableCell>
                      </TableRow>
                    ) : (
                      coefficients.map((coef) => (
                        <TableRow key={coef.id}>
                          <TableCell className="font-medium">
                            {coef.cle?.code || '-'} - {coef.cle?.libelle || '-'}
                          </TableCell>
                          <TableCell>
                            {coef.centre?.code || '-'} - {coef.centre?.nom || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {coef.valeur_base?.toFixed(2) || coef.coefficient?.toFixed(2) || '-'}
                          </TableCell>
                          <TableCell>{coef.date_debut ? format(new Date(coef.date_debut), 'dd/MM/yyyy') : '-'}</TableCell>
                          <TableCell>{coef.date_fin ? format(new Date(coef.date_fin), 'dd/MM/yyyy') : '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm">
                            {coef.notes || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setEditingCoefficient(coef); setShowCoefficientDialog(true); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDeleteConfirm({ type: 'coefficient', id: coef.id })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET BUDGETS */}
        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi Budgétaire</CardTitle>
              <CardDescription>Analyse des écarts budget vs réalisé</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetChartData.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  Aucun budget mensuel configuré. Créez des budgets pour voir l'évolution.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={budgetChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="budget" stroke="hsl(var(--primary))" name="Budget" strokeWidth={2} />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-2))" name="Réalisé" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budgets Prévisionnels</CardTitle>
                  <CardDescription>Liste des budgets par centre ({budgets.length} budgets)</CardDescription>
                </div>
                <Button onClick={() => { setEditingBudget(null); setShowBudgetDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {budgets.slice(0, 10).map(budget => (
                    <div key={budget.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{budget.libelle}</p>
                        <p className="text-xs text-muted-foreground">{budget.centre?.nom || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatAmount(budget.montant_prevu)}</p>
                          <p className={`text-xs ${budget.ecart_pourcentage < 0 ? 'text-success' : budget.ecart_pourcentage > 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {budget.ecart_pourcentage > 0 ? '+' : ''}{budget.ecart_pourcentage.toFixed(1)}%
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingBudget(budget); setShowBudgetDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ type: 'budget', id: budget.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {budgets.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucun budget configuré</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes Budgétaires</CardTitle>
                <CardDescription>Dépassements et écarts significatifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {getBudgetAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucune alerte budgétaire</p>
                  ) : (
                    getBudgetAlerts.map((alert, idx) => (
                      <Alert key={idx} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{alert.centre}:</strong> {alert.message}
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                  <div className="text-sm text-muted-foreground pt-2">
                    {getAnalyticsKPIs.centresSousBudget} centres sous budget, {getAnalyticsKPIs.centresDepassement} centres en dépassement
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ONGLET TABLEAUX DE BORD */}
        <TabsContent value="tableaux-bord" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Globale</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(0, 100 - Math.abs(getAnalyticsKPIs.ecartMoyen)).toFixed(0)}%
                </div>
                <Progress value={Math.max(0, 100 - Math.abs(getAnalyticsKPIs.ecartMoyen))} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">Objectifs atteints</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getAnalyticsKPIs.margeGlobale.toFixed(1)}%</div>
                <p className="text-xs text-success">Marge globale sur ventes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Écart Budget</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getAnalyticsKPIs.ecartMoyen > 0 ? '+' : ''}{getAnalyticsKPIs.ecartMoyen.toFixed(1)}%
                </div>
                <p className={`text-xs ${getAnalyticsKPIs.ecartMoyen <= 0 ? 'text-success' : 'text-destructive'}`}>
                  {getAnalyticsKPIs.ecartMoyen <= 0 ? 'Sous budget global' : 'Dépassement global'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Centres les plus performants (sous budget)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucun centre sous budget</p>
                  ) : (
                    topPerformers.map((center) => (
                      <div key={center.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{center.nom}</p>
                          <p className="text-sm text-muted-foreground">{center.code}</p>
                        </div>
                        <Badge variant="default">{center.variance.toFixed(1)}%</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points d'Attention</CardTitle>
                <CardDescription>Centres nécessitant un suivi (dépassement &gt;5%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attentionPoints.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucun centre en dépassement significatif</p>
                  ) : (
                    attentionPoints.map((center) => (
                      <div key={center.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{center.nom}</p>
                          <p className="text-sm text-muted-foreground">{center.code}</p>
                        </div>
                        <Badge variant="destructive">+{center.variance.toFixed(1)}%</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <CreateCostCenterDialog
        open={showCenterDialog}
        onOpenChange={setShowCenterDialog}
        onSave={handleSaveCenter}
        editingCenter={editingCenter}
        responsables={responsables}
        costCenters={costCenters}
        isSaving={isSaving}
      />

      <CreateBudgetDialog
        open={showBudgetDialog}
        onOpenChange={setShowBudgetDialog}
        onSave={handleSaveBudget}
        onGenerate={generateBudgets}
        editingBudget={editingBudget}
        costCenters={costCenters}
        exercices={exercices}
        isSaving={isSaving}
      />

      <CreateAllocationDialog
        open={showAllocationDialog}
        onOpenChange={setShowAllocationDialog}
        onSave={handleSaveAllocation}
        onCalculate={calculateAutomaticAllocation}
        allocationKeys={allocationKeys}
        costCenters={costCenters}
        isSaving={isSaving}
      />

      <CreateAllocationKeyDialog
        open={showKeyDialog}
        onOpenChange={setShowKeyDialog}
        onSave={handleSaveKey}
        editingKey={editingKey}
        isSaving={isSaving}
      />

      <CreateCoefficientDialog
        open={showCoefficientDialog}
        onOpenChange={setShowCoefficientDialog}
        onSave={handleSaveCoefficient}
        editingCoefficient={editingCoefficient}
        allocationKeys={allocationKeys}
        costCenters={costCenters}
        isSaving={isSaving}
      />

      {/* CONFIRMATION SUPPRESSION */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet élément ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalyticalAccounting;
