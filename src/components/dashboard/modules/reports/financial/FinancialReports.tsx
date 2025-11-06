import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import FinancialCharts from './FinancialCharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calculator,
  Banknote,
  FileText,
  Receipt,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Globe,
  Building,
  RefreshCw
} from 'lucide-react';

const FinancialReports = () => {
  const [selectedExerciceId, setSelectedExerciceId] = useState<string | undefined>();

  const {
    regionalParams,
    exercices,
    currentExercice,
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    financialAnnexes,
    financialRatios,
    isLoading,
    formatAmount,
    exportBalanceSheetPDF,
    exportIncomeStatementExcel,
  } = useFinancialReports(selectedExerciceId);

  const activeExercice = selectedExerciceId 
    ? exercices?.find(e => e.id === selectedExerciceId) 
    : currentExercice;

  const getRatioStatus = (value: number, threshold: number, inverse: boolean = false): string => {
    const ratio = inverse ? threshold / value : value / threshold;
    if (ratio >= 1.2) return 'excellent';
    if (ratio >= 1) return 'good';
    if (ratio >= 0.8) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Rapports Financiers
            {regionalParams && (
              <Badge variant="outline" className="ml-2">
                <Globe className="h-3 w-3 mr-1" />
                {regionalParams.pays}
              </Badge>
            )}
            {regionalParams && (
              <Badge variant="outline">
                <Building className="h-3 w-3 mr-1" />
                {regionalParams.systeme_comptable}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            {regionalParams?.mention_legale_footer || 'Analyses financières et comptables détaillées'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {exercices && exercices.length > 0 && (
            <Select 
              value={selectedExerciceId || currentExercice?.id} 
              onValueChange={setSelectedExerciceId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sélectionner un exercice" />
              </SelectTrigger>
              <SelectContent>
                {exercices.map(exercice => (
                  <SelectItem key={exercice.id} value={exercice.id}>
                    {exercice.libelle} ({exercice.statut})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Métriques principales */}
      {incomeStatement && balanceSheet && financialRatios && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actif</CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(balanceSheet.actif.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bilan actif</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Résultat Net</CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(incomeStatement.resultatNet)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Résultat de l'exercice</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marge Nette</CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialRatios.margeNette.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rentabilité</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ratio Liquidité</CardTitle>
              <div className="p-2 rounded-lg bg-orange-50">
                <Banknote className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialRatios.ratioLiquidite.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Solvabilité</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="bilan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="resultat">Compte de Résultat</TabsTrigger>
          <TabsTrigger value="flux">Flux de Trésorerie</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
          <TabsTrigger value="annexes">États Annexes</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
        </TabsList>

        <TabsContent value="bilan" className="space-y-6">
          {balanceSheet && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        ACTIF
                      </CardTitle>
                      <CardDescription>Patrimoine de l'entreprise</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportBalanceSheetPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Immobilisations</h4>
                      {balanceSheet.actif.immobilise.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Actif Circulant</h4>
                      {balanceSheet.actif.circulant.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Trésorerie</h4>
                      {balanceSheet.actif.tresorerie.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL ACTIF</span>
                        <span className="text-blue-600">{formatAmount(balanceSheet.actif.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    PASSIF
                  </CardTitle>
                  <CardDescription>Sources de financement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Capitaux Propres</h4>
                      {balanceSheet.passif.capitauxPropres.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Dettes</h4>
                      {balanceSheet.passif.dettes.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>TOTAL PASSIF</span>
                        <span className="text-green-600">{formatAmount(balanceSheet.passif.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resultat" className="space-y-6">
          {incomeStatement && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Compte de Résultat
                    </CardTitle>
                    <CardDescription>Analyse des produits et charges</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportIncomeStatementExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600">PRODUITS</h3>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Produits d'Exploitation</h4>
                      {incomeStatement.produits.exploitation.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Produits Financiers</h4>
                      {incomeStatement.produits.financiers.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-green-600">
                        <span>TOTAL PRODUITS</span>
                        <span>{formatAmount(incomeStatement.produits.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-600">CHARGES</h3>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Charges d'Exploitation</h4>
                      {incomeStatement.charges.exploitation.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Charges Financières</h4>
                      {incomeStatement.charges.financiers.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1 text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className="font-medium">{formatAmount(item.montant_n)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-red-600">
                        <span>TOTAL CHARGES</span>
                        <span>{formatAmount(incomeStatement.charges.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Résultat d'Exploitation</span>
                    <span className={incomeStatement.resultatExploitation >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {formatAmount(incomeStatement.resultatExploitation)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Résultat Financier</span>
                    <span className={incomeStatement.resultatFinancier >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {formatAmount(incomeStatement.resultatFinancier)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">RÉSULTAT NET</span>
                    <span className={incomeStatement.resultatNet >= 0 ? 'text-green-600 font-bold text-xl' : 'text-red-600 font-bold text-xl'}>
                      {formatAmount(incomeStatement.resultatNet)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flux" className="space-y-6">
          {cashFlowStatement ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="h-5 w-5" />
                      Tableau des Flux de Trésorerie
                    </CardTitle>
                    <CardDescription>Méthode indirecte OHADA</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Flux d'Exploitation */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Flux de Trésorerie d'Exploitation
                    </h3>
                    <div className="space-y-2">
                      {cashFlowStatement.fluxExploitation.details.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className={item.montant >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {formatAmount(item.montant)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total Flux d'Exploitation</span>
                          <span className={cashFlowStatement.fluxExploitation.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(cashFlowStatement.fluxExploitation.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flux d'Investissement */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      Flux de Trésorerie d'Investissement
                    </h3>
                    <div className="space-y-2">
                      {cashFlowStatement.fluxInvestissement.details.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className={item.montant >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {formatAmount(item.montant)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total Flux d'Investissement</span>
                          <span className={cashFlowStatement.fluxInvestissement.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(cashFlowStatement.fluxInvestissement.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flux de Financement */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-purple-600" />
                      Flux de Trésorerie de Financement
                    </h3>
                    <div className="space-y-2">
                      {cashFlowStatement.fluxFinancement.details.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.libelle}</span>
                          <span className={item.montant >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {formatAmount(item.montant)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total Flux de Financement</span>
                          <span className={cashFlowStatement.fluxFinancement.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(cashFlowStatement.fluxFinancement.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variation de Trésorerie */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Variation de Trésorerie</span>
                        <span className={cashFlowStatement.variationTresorerie >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatAmount(cashFlowStatement.variationTresorerie)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trésorerie en début d'exercice</span>
                        <span className="font-medium">{formatAmount(cashFlowStatement.tresorerieDebut)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Trésorerie en fin d'exercice</span>
                        <span className="text-primary">{formatAmount(cashFlowStatement.tresorerieFin)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">Chargement des données de flux de trésorerie...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ratios" className="space-y-6">
          {financialRatios && regionalParams && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Ratios Financiers
                </CardTitle>
                <CardDescription>Indicateurs clés de performance financière</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { 
                      name: 'Liquidité Générale', 
                      value: financialRatios.ratioLiquidite, 
                      target: regionalParams.seuil_ratio_liquidite,
                      format: (v: number) => v.toFixed(2),
                      inverse: false
                    },
                    { 
                      name: 'Taux d\'Endettement', 
                      value: financialRatios.ratioEndettement, 
                      target: regionalParams.seuil_ratio_endettement,
                      format: (v: number) => v.toFixed(1) + '%',
                      inverse: true
                    },
                    { 
                      name: 'Autonomie Financière', 
                      value: financialRatios.ratioAutonomie, 
                      target: regionalParams.seuil_ratio_autonomie,
                      format: (v: number) => v.toFixed(1) + '%',
                      inverse: false
                    },
                    { 
                      name: 'Marge d\'Exploitation', 
                      value: financialRatios.margeExploitation, 
                      target: regionalParams.seuil_marge_exploitation,
                      format: (v: number) => v.toFixed(1) + '%',
                      inverse: false
                    },
                    { 
                      name: 'Marge Nette', 
                      value: financialRatios.margeNette, 
                      target: regionalParams.seuil_marge_nette,
                      format: (v: number) => v.toFixed(1) + '%',
                      inverse: false
                    },
                    { 
                      name: 'Rentabilité des Capitaux', 
                      value: financialRatios.rentabiliteCapitaux, 
                      target: regionalParams.seuil_rentabilite_capitaux,
                      format: (v: number) => v.toFixed(1) + '%',
                      inverse: false
                    },
                  ].map((ratio, index) => {
                    const status = getRatioStatus(ratio.value, ratio.target, ratio.inverse);
                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{ratio.name}</span>
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{ratio.format(ratio.value)}</span>
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Objectif: {ratio.format(ratio.target)}
                        </div>
                        <Progress 
                          value={ratio.inverse ? (ratio.target / ratio.value) * 100 : (ratio.value / ratio.target) * 100} 
                          className="h-2 mt-2" 
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="annexes" className="space-y-6">
          {financialAnnexes ? (
            <>
              {/* Tableau des Amortissements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Tableau des Amortissements
                  </CardTitle>
                  <CardDescription>Détail des immobilisations et amortissements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Immobilisation</TableHead>
                          <TableHead className="text-right">Valeur Brute</TableHead>
                          <TableHead className="text-right">Amort. Cumulés</TableHead>
                          <TableHead className="text-right">Valeur Nette</TableHead>
                          <TableHead className="text-right">Dotation N</TableHead>
                          <TableHead className="text-right">Taux</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialAnnexes.amortissements.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.immobilisation}</TableCell>
                            <TableCell className="text-right">{formatAmount(item.valeurBrute)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatAmount(item.amortissementsCumules)}</TableCell>
                            <TableCell className="text-right font-medium">{formatAmount(item.valeurNette)}</TableCell>
                            <TableCell className="text-right">{formatAmount(item.dotationExercice)}</TableCell>
                            <TableCell className="text-right">{item.tauxAmortissement}%</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">{formatAmount(financialAnnexes.amortissements.totalValeurBrute)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatAmount(financialAnnexes.amortissements.totalAmortissements)}</TableCell>
                          <TableCell className="text-right">{formatAmount(financialAnnexes.amortissements.totalValeurNette)}</TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* État des Créances Clients */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        État des Créances Clients
                      </CardTitle>
                      <CardDescription>Suivi des factures clients impayées</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Taux de recouvrement</div>
                      <div className="text-2xl font-bold text-green-600">
                        {financialAnnexes.creancesClients.tauxRecouvrement.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Créances</div>
                        <div className="text-xl font-bold">{formatAmount(financialAnnexes.creancesClients.totalCreances)}</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Montant Échu</div>
                        <div className="text-xl font-bold text-red-600">{formatAmount(financialAnnexes.creancesClients.totalEchu)}</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Montant Non Échu</div>
                        <div className="text-xl font-bold text-green-600">{formatAmount(financialAnnexes.creancesClients.totalNonEchu)}</div>
                      </div>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Montant Total</TableHead>
                            <TableHead className="text-right">Échu</TableHead>
                            <TableHead className="text-right">Non Échu</TableHead>
                            <TableHead className="text-right">Jours Retard</TableHead>
                            <TableHead>Date Échéance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialAnnexes.creancesClients.items.slice(0, 10).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.client}</TableCell>
                              <TableCell className="text-right">{formatAmount(item.montantTotal)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatAmount(item.montantEchu)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatAmount(item.montantNonEchu)}</TableCell>
                              <TableCell className="text-right">
                                {item.joursRetard > 0 && (
                                  <Badge variant="destructive">{item.joursRetard}j</Badge>
                                )}
                              </TableCell>
                              <TableCell>{new Date(item.dateEcheance).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* État des Dettes Fournisseurs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        État des Dettes Fournisseurs
                      </CardTitle>
                      <CardDescription>Suivi des factures fournisseurs impayées</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Délai moyen de paiement</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {financialAnnexes.dettesFournisseurs.delaiMoyenPaiement.toFixed(0)}j
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Dettes</div>
                        <div className="text-xl font-bold">{formatAmount(financialAnnexes.dettesFournisseurs.totalDettes)}</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Montant Échu</div>
                        <div className="text-xl font-bold text-red-600">{formatAmount(financialAnnexes.dettesFournisseurs.totalEchu)}</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Montant Non Échu</div>
                        <div className="text-xl font-bold text-green-600">{formatAmount(financialAnnexes.dettesFournisseurs.totalNonEchu)}</div>
                      </div>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead className="text-right">Montant Total</TableHead>
                            <TableHead className="text-right">Échu</TableHead>
                            <TableHead className="text-right">Non Échu</TableHead>
                            <TableHead className="text-right">Jours Retard</TableHead>
                            <TableHead>Date Échéance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {financialAnnexes.dettesFournisseurs.items.slice(0, 10).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.fournisseur}</TableCell>
                              <TableCell className="text-right">{formatAmount(item.montantTotal)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatAmount(item.montantEchu)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatAmount(item.montantNonEchu)}</TableCell>
                              <TableCell className="text-right">
                                {item.joursRetard > 0 && (
                                  <Badge variant="destructive">{item.joursRetard}j</Badge>
                                )}
                              </TableCell>
                              <TableCell>{new Date(item.dateEcheance).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">Chargement des états annexes...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="graphiques" className="space-y-6">
          <FinancialCharts
            balanceSheet={balanceSheet}
            incomeStatement={incomeStatement}
            cashFlowStatement={cashFlowStatement}
            formatAmount={formatAmount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;