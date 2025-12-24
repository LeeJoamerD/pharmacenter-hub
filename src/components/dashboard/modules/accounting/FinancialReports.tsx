import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, TrendingUp, TrendingDown, Calculator, BarChart3, PieChart, FileSpreadsheet, Eye, Printer, Loader2, Coins } from 'lucide-react';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import AmortizationTableDialog from '@/components/accounting/AmortizationTableDialog';
import ProvisionsTableDialog from '@/components/accounting/ProvisionsTableDialog';
import CreancesTableDialog from '@/components/accounting/CreancesTableDialog';
import DettesTableDialog from '@/components/accounting/DettesTableDialog';

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState('bilan');
  const [selectedExerciceId, setSelectedExerciceId] = useState<string | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  
  // Dialog states
  const [amortDialogOpen, setAmortDialogOpen] = useState(false);
  const [provisionsDialogOpen, setProvisionsDialogOpen] = useState(false);
  const [creancesDialogOpen, setCreancesDialogOpen] = useState(false);
  const [dettesDialogOpen, setDettesDialogOpen] = useState(false);

  const { formatAmount, getCurrencySymbol } = useCurrencyFormatting();
  const currency = getCurrencySymbol();

  const {
    exercices,
    currentExercice,
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    financialAnnexes,
    financialRatios,
    isLoading,
    exportBalanceSheetPDF,
    exportBalanceSheetExcel,
    exportIncomeStatementPDF,
    exportIncomeStatementExcel,
    exportCashFlowPDF,
    exportCashFlowExcel,
    exportRatiosPDF,
    exportAnnexesPDF,
    exportAnnexesExcel,
  } = useFinancialReports(selectedExerciceId);

  // Calculer les totaux du bilan
  const balanceTotals = balanceSheet ? {
    actifImmobilise: balanceSheet.actif.immobilise.reduce((sum, item) => sum + item.montant_n, 0),
    actifCirculant: balanceSheet.actif.circulant.reduce((sum, item) => sum + item.montant_n, 0),
    tresorerieActif: balanceSheet.actif.tresorerie.reduce((sum, item) => sum + item.montant_n, 0),
    totalActif: balanceSheet.actif.total,
    capitauxPropres: balanceSheet.passif.capitauxPropres.reduce((sum, item) => sum + item.montant_n, 0),
    dettes: balanceSheet.passif.dettes.reduce((sum, item) => sum + item.montant_n, 0),
    totalPassif: balanceSheet.passif.total,
  } : null;

  // Calculer les totaux du compte de résultat
  const incomeResults = incomeStatement ? {
    produitsExploitation: incomeStatement.produits.exploitation.reduce((sum, item) => sum + item.montant_n, 0),
    chargesExploitation: incomeStatement.charges.exploitation.reduce((sum, item) => sum + item.montant_n, 0),
    resultatExploitation: incomeStatement.resultatExploitation,
    produitsFinanciers: incomeStatement.produits.financiers.reduce((sum, item) => sum + item.montant_n, 0),
    chargesFinanciers: incomeStatement.charges.financiers.reduce((sum, item) => sum + item.montant_n, 0),
    resultatFinancier: incomeStatement.resultatFinancier,
    resultatNet: incomeStatement.resultatNet,
    centimeAdditionnel: incomeStatement.centimeAdditionnel,
  } : null;

  // Calculer les totaux des flux de trésorerie
  const cashFlowTotals = cashFlowStatement ? {
    fluxExploitation: cashFlowStatement.fluxExploitation.total,
    fluxInvestissement: cashFlowStatement.fluxInvestissement.total,
    fluxFinancement: cashFlowStatement.fluxFinancement.total,
    variationTresorerie: cashFlowStatement.variationTresorerie,
    tresorerieDebut: cashFlowStatement.tresorerieDebut,
    tresorerieFin: cashFlowStatement.tresorerieFin,
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des états financiers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">États Financiers OHADA</h2>
        <div className="flex space-x-2">
          <Select 
            value={selectedExerciceId || currentExercice?.id || ''} 
            onValueChange={setSelectedExerciceId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un exercice" />
            </SelectTrigger>
            <SelectContent>
              {exercices?.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.libelle} {ex.statut === 'Ouvert' && <Badge variant="secondary" className="ml-1">Actif</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
            <Eye className="mr-2 h-4 w-4" />
            {showDetails ? 'Synthèse' : 'Détails'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="resultat">Compte de Résultat</TabsTrigger>
          <TabsTrigger value="tresorerie">Flux de Trésorerie</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
          <TabsTrigger value="annexes">États Annexes</TabsTrigger>
        </TabsList>

        {/* BILAN */}
        <TabsContent value="bilan" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bilan Comptable OHADA</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportBalanceSheetExcel}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportBalanceSheetPDF}>
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {balanceTotals && balanceSheet ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* ACTIF */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">ACTIF</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Postes</TableHead>
                        <TableHead className="text-right">Montant ({currency})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>ACTIF IMMOBILISE</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.actifImmobilise)}</TableCell>
                      </TableRow>
                      {showDetails && balanceSheet.actif.immobilise.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.montant_n)}</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>ACTIF CIRCULANT</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.actifCirculant)}</TableCell>
                      </TableRow>
                      {showDetails && balanceSheet.actif.circulant.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.montant_n)}</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>TRESORERIE-ACTIF</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.tresorerieActif)}</TableCell>
                      </TableRow>
                      {showDetails && balanceSheet.actif.tresorerie.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.montant_n)}</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-bold border-t-2">
                        <TableCell>TOTAL ACTIF</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.totalActif)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* PASSIF */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">PASSIF</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Postes</TableHead>
                        <TableHead className="text-right">Montant ({currency})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>CAPITAUX PROPRES</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.capitauxPropres)}</TableCell>
                      </TableRow>
                      {showDetails && balanceSheet.passif.capitauxPropres.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.montant_n)}</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>DETTES</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.dettes)}</TableCell>
                      </TableRow>
                      {showDetails && balanceSheet.passif.dettes.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.montant_n)}</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-bold border-t-2">
                        <TableCell>TOTAL PASSIF</TableCell>
                        <TableCell className="text-right">{formatAmount(balanceTotals.totalPassif)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune donnée de bilan disponible pour cet exercice
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* COMPTE DE RESULTAT */}
        <TabsContent value="resultat" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compte de Résultat OHADA</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportIncomeStatementExcel}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportIncomeStatementPDF}>
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {incomeResults && incomeStatement ? (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatAmount(incomeResults.produitsExploitation)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Résultat d'Exploitation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${incomeResults.resultatExploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(incomeResults.resultatExploitation)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Résultat Net</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${incomeResults.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(incomeResults.resultatNet)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1">
                      <Coins className="h-4 w-4 text-amber-600" />
                      Centime Additionnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {formatAmount(incomeResults.centimeAdditionnel)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Postes</TableHead>
                        <TableHead className="text-right">Montant ({currency})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-semibold bg-green-50 dark:bg-green-900/20">
                        <TableCell>PRODUITS D'EXPLOITATION</TableCell>
                        <TableCell className="text-right">{formatAmount(incomeResults.produitsExploitation)}</TableCell>
                      </TableRow>
                      {showDetails && incomeStatement.produits.exploitation.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.montant_n)}</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-semibold bg-red-50 dark:bg-red-900/20">
                        <TableCell>CHARGES D'EXPLOITATION</TableCell>
                        <TableCell className="text-right">({formatAmount(incomeResults.chargesExploitation)})</TableCell>
                      </TableRow>
                      {showDetails && incomeStatement.charges.exploitation.map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.code} - {item.libelle}</TableCell>
                          <TableCell className="text-right">({formatAmount(item.montant_n)})</TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-bold bg-blue-50 dark:bg-blue-900/20">
                        <TableCell>RESULTAT D'EXPLOITATION</TableCell>
                        <TableCell className={`text-right ${incomeResults.resultatExploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(incomeResults.resultatExploitation)}
                        </TableCell>
                      </TableRow>

                      <TableRow className="font-semibold">
                        <TableCell>RESULTAT FINANCIER</TableCell>
                        <TableCell className={`text-right ${incomeResults.resultatFinancier >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(incomeResults.resultatFinancier)}
                        </TableCell>
                      </TableRow>
                      
                      <TableRow className="font-bold border-t-2">
                        <TableCell>RESULTAT NET</TableCell>
                        <TableCell className={`text-right ${incomeResults.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(incomeResults.resultatNet)}
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-amber-50 dark:bg-amber-900/20">
                        <TableCell className="font-medium flex items-center gap-2">
                          <Coins className="h-4 w-4 text-amber-600" />
                          CENTIME ADDITIONNEL COLLECTE
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-600">
                          {formatAmount(incomeResults.centimeAdditionnel)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune donnée de compte de résultat disponible pour cet exercice
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FLUX DE TRESORERIE */}
        <TabsContent value="tresorerie" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tableau des Flux de Trésorerie</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportCashFlowExcel}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportCashFlowPDF}>
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {cashFlowTotals && cashFlowStatement ? (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Flux d'Exploitation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${cashFlowTotals.fluxExploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(cashFlowTotals.fluxExploitation)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Flux d'Investissement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${cashFlowTotals.fluxInvestissement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(cashFlowTotals.fluxInvestissement)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Flux de Financement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${cashFlowTotals.fluxFinancement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(cashFlowTotals.fluxFinancement)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Variation Trésorerie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${cashFlowTotals.variationTresorerie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(cashFlowTotals.variationTresorerie)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flux de Trésorerie</TableHead>
                        <TableHead className="text-right">Montant ({currency})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="font-semibold bg-green-50 dark:bg-green-900/20">
                        <TableCell>FLUX DE TRESORERIE D'EXPLOITATION</TableCell>
                        <TableCell className="text-right font-bold">{formatAmount(cashFlowTotals.fluxExploitation)}</TableCell>
                      </TableRow>
                      {cashFlowStatement.fluxExploitation.details.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className={`text-right ${item.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(item.montant)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-semibold bg-blue-50 dark:bg-blue-900/20">
                        <TableCell>FLUX DE TRESORERIE D'INVESTISSEMENT</TableCell>
                        <TableCell className="text-right font-bold">{formatAmount(cashFlowTotals.fluxInvestissement)}</TableCell>
                      </TableRow>
                      {cashFlowStatement.fluxInvestissement.details.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className={`text-right ${item.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(item.montant)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-semibold bg-orange-50 dark:bg-orange-900/20">
                        <TableCell>FLUX DE TRESORERIE DE FINANCEMENT</TableCell>
                        <TableCell className="text-right font-bold">{formatAmount(cashFlowTotals.fluxFinancement)}</TableCell>
                      </TableRow>
                      {cashFlowStatement.fluxFinancement.details.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className={`text-right ${item.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(item.montant)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-bold border-t-2">
                        <TableCell>VARIATION DE TRESORERIE</TableCell>
                        <TableCell className={`text-right ${cashFlowTotals.variationTresorerie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(cashFlowTotals.variationTresorerie)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Trésorerie début d'exercice</TableCell>
                        <TableCell className="text-right">{formatAmount(cashFlowTotals.tresorerieDebut)}</TableCell>
                      </TableRow>
                      <TableRow className="font-semibold">
                        <TableCell>Trésorerie fin d'exercice</TableCell>
                        <TableCell className="text-right">{formatAmount(cashFlowTotals.tresorerieFin)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune donnée de flux de trésorerie disponible pour cet exercice
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RATIOS */}
        <TabsContent value="ratios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Analyse par Ratios Financiers</h3>
            <Button variant="outline" size="sm" onClick={exportRatiosPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>

          {financialRatios ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <span>Liquidité Générale</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{financialRatios.ratioLiquidite.toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Actif Circulant / Dettes CT (Seuil: {financialRatios.seuilLiquidite})
                    </p>
                    <Badge variant={financialRatios.ratioLiquidite >= financialRatios.seuilLiquidite ? "default" : "destructive"}>
                      {financialRatios.ratioLiquidite >= financialRatios.seuilLiquidite ? "Bon" : "Attention"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                      <span>Endettement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{financialRatios.ratioEndettement.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Dettes / Total Passif (Seuil: {financialRatios.seuilEndettement}%)
                    </p>
                    <Badge variant={financialRatios.ratioEndettement <= financialRatios.seuilEndettement ? "default" : "destructive"}>
                      {financialRatios.ratioEndettement <= financialRatios.seuilEndettement ? "Normal" : "Élevé"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5 text-green-600" />
                      <span>Autonomie Financière</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{financialRatios.ratioAutonomie.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Capitaux Propres / Total Passif (Seuil: {financialRatios.seuilAutonomie}%)
                    </p>
                    <Badge variant={financialRatios.ratioAutonomie >= financialRatios.seuilAutonomie ? "default" : "secondary"}>
                      {financialRatios.ratioAutonomie >= financialRatios.seuilAutonomie ? "Bon" : "Moyen"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <span>Marge d'Exploitation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{financialRatios.margeExploitation.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Résultat Expl. / CA (Seuil: {financialRatios.seuilMargeExploitation}%)
                    </p>
                    <Badge variant={financialRatios.margeExploitation >= financialRatios.seuilMargeExploitation ? "default" : "secondary"}>
                      {financialRatios.margeExploitation >= financialRatios.seuilMargeExploitation ? "Excellent" : "Normal"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span>Marge Nette</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{financialRatios.margeNette.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Résultat Net / CA (Seuil: {financialRatios.seuilMargeNette}%)
                    </p>
                    <Badge variant={financialRatios.margeNette >= financialRatios.seuilMargeNette ? "default" : "secondary"}>
                      {financialRatios.margeNette >= financialRatios.seuilMargeNette ? "Très Bon" : "Correct"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <span>Rentabilité Capitaux</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{financialRatios.rentabiliteCapitaux.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Résultat Net / Capitaux Propres (Seuil: {financialRatios.seuilRentabilite}%)
                    </p>
                    <Badge variant={financialRatios.rentabiliteCapitaux >= financialRatios.seuilRentabilite ? "default" : "secondary"}>
                      {financialRatios.rentabiliteCapitaux >= financialRatios.seuilRentabilite ? "Excellent" : "Bien"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Analyse et Recommandations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Points Forts</h4>
                      <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        {financialRatios.ratioLiquidite >= financialRatios.seuilLiquidite && (
                          <li>• Ratio de liquidité satisfaisant ({financialRatios.ratioLiquidite.toFixed(2)})</li>
                        )}
                        {financialRatios.margeExploitation >= financialRatios.seuilMargeExploitation && (
                          <li>• Bonne marge d'exploitation ({financialRatios.margeExploitation.toFixed(1)}%)</li>
                        )}
                        {financialRatios.rentabiliteCapitaux >= financialRatios.seuilRentabilite && (
                          <li>• Forte rentabilité des capitaux ({financialRatios.rentabiliteCapitaux.toFixed(1)}%)</li>
                        )}
                        {financialRatios.ratioAutonomie >= financialRatios.seuilAutonomie && (
                          <li>• Bonne autonomie financière ({financialRatios.ratioAutonomie.toFixed(1)}%)</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Points d'Attention</h4>
                      <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                        {financialRatios.ratioLiquidite < financialRatios.seuilLiquidite && (
                          <li>• Améliorer le ratio de liquidité (actuel: {financialRatios.ratioLiquidite.toFixed(2)})</li>
                        )}
                        {financialRatios.ratioEndettement > financialRatios.seuilEndettement && (
                          <li>• Réduire le niveau d'endettement (actuel: {financialRatios.ratioEndettement.toFixed(1)}%)</li>
                        )}
                        {financialRatios.margeNette < financialRatios.seuilMargeNette && (
                          <li>• Améliorer la marge nette (actuel: {financialRatios.margeNette.toFixed(1)}%)</li>
                        )}
                        <li>• Surveiller l'évolution du BFR</li>
                        <li>• Optimiser les délais de paiement clients/fournisseurs</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Données insuffisantes pour calculer les ratios financiers
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ETATS ANNEXES */}
        <TabsContent value="annexes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">États Annexes OHADA</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportAnnexesExcel}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportAnnexesPDF}>
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>États Annexes OHADA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Tableau des Amortissements</div>
                      <div className="text-sm text-muted-foreground">
                        {financialAnnexes?.amortissements.items.length || 0} immobilisations
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setAmortDialogOpen(true)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Tableau des Provisions</div>
                      <div className="text-sm text-muted-foreground">
                        {financialAnnexes?.provisions.items.length || 0} provisions
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setProvisionsDialogOpen(true)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">État des Créances</div>
                      <div className="text-sm text-muted-foreground">
                        {financialAnnexes?.creancesClients.items.length || 0} créances - {formatAmount(financialAnnexes?.creancesClients.totalCreances || 0)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCreancesDialogOpen(true)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">État des Dettes</div>
                      <div className="text-sm text-muted-foreground">
                        {financialAnnexes?.dettesFournisseurs.items.length || 0} dettes - {formatAmount(financialAnnexes?.dettesFournisseurs.totalDettes || 0)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setDettesDialogOpen(true)}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations Complémentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-2">Méthodes Comptables</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Système comptable: OHADA révisé</li>
                      <li>• Amortissement: Méthode linéaire</li>
                      <li>• Évaluation stocks: FIFO/PEPS</li>
                      <li>• Provisions: Règles prudentielles</li>
                      <li>• Créances: Valeur nominale nette</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-2">Événements Postérieurs</div>
                    <p className="text-sm text-muted-foreground">
                      Aucun événement significatif postérieur à la clôture n'est à signaler.
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-2">Engagements Hors Bilan</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Cautions bancaires: À renseigner</li>
                      <li>• Engagements de crédit-bail: À renseigner</li>
                      <li>• Autres engagements: À renseigner</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs pour les annexes */}
      {financialAnnexes && (
        <>
          <AmortizationTableDialog
            open={amortDialogOpen}
            onOpenChange={setAmortDialogOpen}
            items={financialAnnexes.amortissements.items}
            totalValeurBrute={financialAnnexes.amortissements.totalValeurBrute}
            totalAmortissements={financialAnnexes.amortissements.totalAmortissements}
            totalValeurNette={financialAnnexes.amortissements.totalValeurNette}
            totalDotation={financialAnnexes.amortissements.totalDotation}
            onExportPDF={exportAnnexesPDF}
            onExportExcel={exportAnnexesExcel}
          />

          <ProvisionsTableDialog
            open={provisionsDialogOpen}
            onOpenChange={setProvisionsDialogOpen}
            items={financialAnnexes.provisions.items}
            totalDebut={financialAnnexes.provisions.totalDebut}
            totalDotations={financialAnnexes.provisions.totalDotations}
            totalReprises={financialAnnexes.provisions.totalReprises}
            totalFin={financialAnnexes.provisions.totalFin}
          />

          <CreancesTableDialog
            open={creancesDialogOpen}
            onOpenChange={setCreancesDialogOpen}
            items={financialAnnexes.creancesClients.items}
            totalCreances={financialAnnexes.creancesClients.totalCreances}
            totalEchu={financialAnnexes.creancesClients.totalEchu}
            totalNonEchu={financialAnnexes.creancesClients.totalNonEchu}
            tauxRecouvrement={financialAnnexes.creancesClients.tauxRecouvrement}
            parTranche={financialAnnexes.creancesClients.parTranche}
          />

          <DettesTableDialog
            open={dettesDialogOpen}
            onOpenChange={setDettesDialogOpen}
            items={financialAnnexes.dettesFournisseurs.items}
            totalDettes={financialAnnexes.dettesFournisseurs.totalDettes}
            totalEchu={financialAnnexes.dettesFournisseurs.totalEchu}
            totalNonEchu={financialAnnexes.dettesFournisseurs.totalNonEchu}
            delaiMoyenPaiement={financialAnnexes.dettesFournisseurs.delaiMoyenPaiement}
            parTranche={financialAnnexes.dettesFournisseurs.parTranche}
          />
        </>
      )}
    </div>
  );
};

export default FinancialReports;
