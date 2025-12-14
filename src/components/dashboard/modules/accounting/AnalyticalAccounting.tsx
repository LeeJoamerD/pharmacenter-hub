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
import { Plus, Building2, Target, TrendingUp, Calculator, FileBarChart, AlertTriangle, DollarSign, Loader2, Edit, Trash2, Check, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAnalyticalAccounting, CostCenter, Budget, ChargeAllocation, AllocationLine } from '@/hooks/useAnalyticalAccounting';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateCostCenterDialog from './dialogs/CreateCostCenterDialog';
import CreateBudgetDialog from './dialogs/CreateBudgetDialog';
import CreateAllocationDialog from './dialogs/CreateAllocationDialog';
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
      margin: item.marge_brute,
    }));
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.type === 'center') {
        await deleteCostCenter(deleteConfirm.id);
      } else if (deleteConfirm.type === 'budget') {
        await deleteBudget(deleteConfirm.id);
      } else if (deleteConfirm.type === 'allocation') {
        await deleteChargeAllocation(deleteConfirm.id);
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de Rentabilité par Produit</CardTitle>
                <CardDescription>Marges et contribution par ligne de produits</CardDescription>
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
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatAmount(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="CA" />
                      <Bar dataKey="costs" fill="hsl(var(--muted))" name="Coûts" />
                      <Bar dataKey="margin" fill="hsl(var(--chart-2))" name="Marge" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Marges</CardTitle>
                <CardDescription>Contribution par catégorie de produits</CardDescription>
              </CardHeader>
              <CardContent>
                {profitabilityChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={profitabilityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="margin"
                        nameKey="product"
                      >
                        {profitabilityChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détail Rentabilité</CardTitle>
              <CardDescription>Analyse détaillée par ligne de produits ({profitabilityData.length} produits)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Famille</TableHead>
                    <TableHead className="text-right">Chiffre d'Affaires</TableHead>
                    <TableHead className="text-right">Coûts Directs</TableHead>
                    <TableHead className="text-right">Marge Brute</TableHead>
                    <TableHead className="text-right">Taux de Marge</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitabilityData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Aucune donnée de rentabilité. Les données sont calculées à partir des ventes.
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitabilityData.slice(0, 20).map((item) => (
                      <TableRow key={item.produit_id}>
                        <TableCell className="font-medium">{item.produit_nom}</TableCell>
                        <TableCell>{item.famille}</TableCell>
                        <TableCell className="text-right">{formatAmount(item.chiffre_affaires)}</TableCell>
                        <TableCell className="text-right">{formatAmount(item.cout_achat)}</TableCell>
                        <TableCell className="text-right">{formatAmount(item.marge_brute)}</TableCell>
                        <TableCell className="text-right">{item.taux_marge.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.min(item.taux_marge, 100)} className="w-16" />
                            <Badge variant={item.taux_marge > 40 ? 'default' : item.taux_marge > 25 ? 'secondary' : 'destructive'}>
                              {item.taux_marge > 40 ? 'Excellent' : item.taux_marge > 25 ? 'Bon' : 'Faible'}
                            </Badge>
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
