import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, TrendingUp, TrendingDown, Calculator, BarChart3, PieChart, FileSpreadsheet, Calendar, Filter, Eye, Printer } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface BalanceSheetItem {
  code: string;
  libelle: string;
  montant_n: number;
  montant_n1: number;
  type: 'actif' | 'passif';
  section: 'immobilise' | 'circulant' | 'tresorerie' | 'capitaux_propres' | 'provisions' | 'dettes';
}

interface IncomeStatementItem {
  code: string;
  libelle: string;
  montant_n: number;
  montant_n1: number;
  type: 'charge' | 'produit';
  nature: 'exploitation' | 'financier' | 'exceptionnel';
}

interface CashFlowItem {
  libelle: string;
  montant: number;
  type: 'exploitation' | 'investissement' | 'financement';
}

const FinancialReports = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bilan');
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [comparisonPeriod, setComparisonPeriod] = useState('2023');
  const [showDetails, setShowDetails] = useState(false);

  // Données du bilan (exemple conforme OHADA)
  const [balanceSheet] = useState<BalanceSheetItem[]>([
    // ACTIF IMMOBILISE
    {
      code: '21',
      libelle: 'Immobilisations incorporelles',
      montant_n: 2500000,
      montant_n1: 2000000,
      type: 'actif',
      section: 'immobilise'
    },
    {
      code: '22',
      libelle: 'Terrains',
      montant_n: 15000000,
      montant_n1: 15000000,
      type: 'actif',
      section: 'immobilise'
    },
    {
      code: '23',
      libelle: 'Bâtiments',
      montant_n: 25000000,
      montant_n1: 20000000,
      type: 'actif',
      section: 'immobilise'
    },
    {
      code: '24',
      libelle: 'Matériel',
      montant_n: 8500000,
      montant_n1: 7200000,
      type: 'actif',
      section: 'immobilise'
    },
    // ACTIF CIRCULANT
    {
      code: '31',
      libelle: 'Stocks de médicaments',
      montant_n: 12000000,
      montant_n1: 10500000,
      type: 'actif',
      section: 'circulant'
    },
    {
      code: '411',
      libelle: 'Clients',
      montant_n: 4500000,
      montant_n1: 3800000,
      type: 'actif',
      section: 'circulant'
    },
    {
      code: '485',
      libelle: 'Créances diverses',
      montant_n: 1200000,
      montant_n1: 950000,
      type: 'actif',
      section: 'circulant'
    },
    // TRESORERIE ACTIF
    {
      code: '52',
      libelle: 'Banques',
      montant_n: 3200000,
      montant_n1: 2800000,
      type: 'actif',
      section: 'tresorerie'
    },
    {
      code: '53',
      libelle: 'Caisses',
      montant_n: 800000,
      montant_n1: 650000,
      type: 'actif',
      section: 'tresorerie'
    },
    // CAPITAUX PROPRES
    {
      code: '101',
      libelle: 'Capital social',
      montant_n: 20000000,
      montant_n1: 20000000,
      type: 'passif',
      section: 'capitaux_propres'
    },
    {
      code: '106',
      libelle: 'Réserves',
      montant_n: 15000000,
      montant_n1: 12000000,
      type: 'passif',
      section: 'capitaux_propres'
    },
    {
      code: '12',
      libelle: 'Résultat de l\'exercice',
      montant_n: 8500000,
      montant_n1: 6200000,
      type: 'passif',
      section: 'capitaux_propres'
    },
    // DETTES
    {
      code: '16',
      libelle: 'Emprunts',
      montant_n: 18000000,
      montant_n1: 20000000,
      type: 'passif',
      section: 'dettes'
    },
    {
      code: '401',
      libelle: 'Fournisseurs',
      montant_n: 6200000,
      montant_n1: 5800000,
      type: 'passif',
      section: 'dettes'
    },
    {
      code: '43',
      libelle: 'Sécurité sociale',
      montant_n: 1200000,
      montant_n1: 1100000,
      type: 'passif',
      section: 'dettes'
    },
    {
      code: '44',
      libelle: 'État et collectivités',
      montant_n: 2800000,
      montant_n1: 2400000,
      type: 'passif',
      section: 'dettes'
    }
  ]);

  // Données du compte de résultat
  const [incomeStatement] = useState<IncomeStatementItem[]>([
    // PRODUITS D'EXPLOITATION
    {
      code: '701',
      libelle: 'Ventes de médicaments',
      montant_n: 85000000,
      montant_n1: 78000000,
      type: 'produit',
      nature: 'exploitation'
    },
    {
      code: '706',
      libelle: 'Services rendus',
      montant_n: 12000000,
      montant_n1: 10500000,
      type: 'produit',
      nature: 'exploitation'
    },
    // CHARGES D'EXPLOITATION
    {
      code: '601',
      libelle: 'Achats de médicaments',
      montant_n: 45000000,
      montant_n1: 42000000,
      type: 'charge',
      nature: 'exploitation'
    },
    {
      code: '605',
      libelle: 'Autres achats',
      montant_n: 3500000,
      montant_n1: 3200000,
      type: 'charge',
      nature: 'exploitation'
    },
    {
      code: '61',
      libelle: 'Transport',
      montant_n: 2800000,
      montant_n1: 2600000,
      type: 'charge',
      nature: 'exploitation'
    },
    {
      code: '63',
      libelle: 'Services extérieurs',
      montant_n: 8500000,
      montant_n1: 7800000,
      type: 'charge',
      nature: 'exploitation'
    },
    {
      code: '64',
      libelle: 'Impôts et taxes',
      montant_n: 4200000,
      montant_n1: 3900000,
      type: 'charge',
      nature: 'exploitation'
    },
    {
      code: '66',
      libelle: 'Charges de personnel',
      montant_n: 18000000,
      montant_n1: 16500000,
      type: 'charge',
      nature: 'exploitation'
    },
    {
      code: '681',
      libelle: 'Dotations amortissements',
      montant_n: 3200000,
      montant_n1: 2800000,
      type: 'charge',
      nature: 'exploitation'
    },
    // PRODUITS FINANCIERS
    {
      code: '77',
      libelle: 'Revenus financiers',
      montant_n: 450000,
      montant_n1: 380000,
      type: 'produit',
      nature: 'financier'
    },
    // CHARGES FINANCIERES
    {
      code: '67',
      libelle: 'Charges financières',
      montant_n: 1800000,
      montant_n1: 2100000,
      type: 'charge',
      nature: 'financier'
    }
  ]);

  // Flux de trésorerie
  const [cashFlow] = useState<CashFlowItem[]>([
    // EXPLOITATION
    { libelle: 'Résultat net', montant: 8500000, type: 'exploitation' },
    { libelle: 'Amortissements', montant: 3200000, type: 'exploitation' },
    { libelle: 'Variation stocks', montant: -1500000, type: 'exploitation' },
    { libelle: 'Variation clients', montant: -700000, type: 'exploitation' },
    { libelle: 'Variation fournisseurs', montant: 400000, type: 'exploitation' },
    // INVESTISSEMENT
    { libelle: 'Acquisition immobilisations', montant: -6800000, type: 'investissement' },
    { libelle: 'Cession immobilisations', montant: 200000, type: 'investissement' },
    // FINANCEMENT
    { libelle: 'Remboursement emprunts', montant: -2000000, type: 'financement' },
    { libelle: 'Dividendes versés', montant: -3000000, type: 'financement' }
  ]);

  const calculateBalanceSheetTotals = () => {
    const actifImmobilise = balanceSheet
      .filter(item => item.type === 'actif' && item.section === 'immobilise')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const actifCirculant = balanceSheet
      .filter(item => item.type === 'actif' && item.section === 'circulant')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const tresorerieActif = balanceSheet
      .filter(item => item.type === 'actif' && item.section === 'tresorerie')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const capitauxPropres = balanceSheet
      .filter(item => item.type === 'passif' && item.section === 'capitaux_propres')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const dettes = balanceSheet
      .filter(item => item.type === 'passif' && item.section === 'dettes')
      .reduce((sum, item) => sum + item.montant_n, 0);

    const totalActif = actifImmobilise + actifCirculant + tresorerieActif;
    const totalPassif = capitauxPropres + dettes;

    return {
      actifImmobilise,
      actifCirculant,
      tresorerieActif,
      totalActif,
      capitauxPropres,
      dettes,
      totalPassif
    };
  };

  const calculateIncomeStatement = () => {
    const produitsExploitation = incomeStatement
      .filter(item => item.type === 'produit' && item.nature === 'exploitation')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const chargesExploitation = incomeStatement
      .filter(item => item.type === 'charge' && item.nature === 'exploitation')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const produitsFinanciers = incomeStatement
      .filter(item => item.type === 'produit' && item.nature === 'financier')
      .reduce((sum, item) => sum + item.montant_n, 0);
    
    const chargesFinancieres = incomeStatement
      .filter(item => item.type === 'charge' && item.nature === 'financier')
      .reduce((sum, item) => sum + item.montant_n, 0);

    const resultatExploitation = produitsExploitation - chargesExploitation;
    const resultatFinancier = produitsFinanciers - chargesFinancieres;
    const resultatNet = resultatExploitation + resultatFinancier;

    return {
      produitsExploitation,
      chargesExploitation,
      resultatExploitation,
      produitsFinanciers,
      chargesFinancieres,
      resultatFinancier,
      resultatNet
    };
  };

  const calculateCashFlowTotals = () => {
    const fluxExploitation = cashFlow
      .filter(item => item.type === 'exploitation')
      .reduce((sum, item) => sum + item.montant, 0);
    
    const fluxInvestissement = cashFlow
      .filter(item => item.type === 'investissement')
      .reduce((sum, item) => sum + item.montant, 0);
    
    const fluxFinancement = cashFlow
      .filter(item => item.type === 'financement')
      .reduce((sum, item) => sum + item.montant, 0);

    const variationTresorerie = fluxExploitation + fluxInvestissement + fluxFinancement;

    return {
      fluxExploitation,
      fluxInvestissement,
      fluxFinancement,
      variationTresorerie
    };
  };

  const calculateRatios = () => {
    const totals = calculateBalanceSheetTotals();
    const income = calculateIncomeStatement();
    
    const ratioLiquidite = totals.actifCirculant / totals.dettes;
    const ratioEndettement = totals.dettes / totals.totalPassif;
    const ratioAutonomie = totals.capitauxPropres / totals.totalPassif;
    const margeExploitation = (income.resultatExploitation / income.produitsExploitation) * 100;
    const margeNette = (income.resultatNet / income.produitsExploitation) * 100;
    const rentabiliteCapitaux = (income.resultatNet / totals.capitauxPropres) * 100;

    return {
      ratioLiquidite,
      ratioEndettement,
      ratioAutonomie,
      margeExploitation,
      margeNette,
      rentabiliteCapitaux
    };
  };

  const exportToExcel = (reportType: string) => {
    toast({
      title: "Export en cours",
      description: `Export ${reportType} vers Excel initialisé`
    });
  };

  const printReport = (reportType: string) => {
    window.print();
    toast({
      title: "Impression",
      description: `Rapport ${reportType} envoyé vers l'imprimante`
    });
  };

  const balanceTotals = calculateBalanceSheetTotals();
  const incomeResults = calculateIncomeStatement();
  const cashFlowTotals = calculateCashFlowTotals();
  const ratios = calculateRatios();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">États Financiers OHADA</h2>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
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

        <TabsContent value="bilan" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bilan Comptable OHADA</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => exportToExcel('Bilan')}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => printReport('Bilan')}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>

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
                      <TableHead className="text-right">{selectedPeriod}</TableHead>
                      <TableHead className="text-right">{comparisonPeriod}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>ACTIF IMMOBILISE</TableCell>
                      <TableCell className="text-right">{balanceTotals.actifImmobilise.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet
                          .filter(item => item.type === 'actif' && item.section === 'immobilise')
                          .reduce((sum, item) => sum + item.montant_n1, 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {balanceSheet
                      .filter(item => item.type === 'actif' && item.section === 'immobilise')
                      .map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className="text-right">{item.montant_n.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.montant_n1.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>ACTIF CIRCULANT</TableCell>
                      <TableCell className="text-right">{balanceTotals.actifCirculant.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet
                          .filter(item => item.type === 'actif' && item.section === 'circulant')
                          .reduce((sum, item) => sum + item.montant_n1, 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {balanceSheet
                      .filter(item => item.type === 'actif' && item.section === 'circulant')
                      .map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className="text-right">{item.montant_n.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.montant_n1.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>TRESORERIE-ACTIF</TableCell>
                      <TableCell className="text-right">{balanceTotals.tresorerieActif.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet
                          .filter(item => item.type === 'actif' && item.section === 'tresorerie')
                          .reduce((sum, item) => sum + item.montant_n1, 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {balanceSheet
                      .filter(item => item.type === 'actif' && item.section === 'tresorerie')
                      .map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className="text-right">{item.montant_n.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.montant_n1.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    
                    <TableRow className="font-bold border-t-2">
                      <TableCell>TOTAL ACTIF</TableCell>
                      <TableCell className="text-right">{balanceTotals.totalActif.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet.reduce((sum, item) => 
                          item.type === 'actif' ? sum + item.montant_n1 : sum, 0
                        ).toLocaleString()}
                      </TableCell>
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
                      <TableHead className="text-right">{selectedPeriod}</TableHead>
                      <TableHead className="text-right">{comparisonPeriod}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>CAPITAUX PROPRES</TableCell>
                      <TableCell className="text-right">{balanceTotals.capitauxPropres.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet
                          .filter(item => item.type === 'passif' && item.section === 'capitaux_propres')
                          .reduce((sum, item) => sum + item.montant_n1, 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {balanceSheet
                      .filter(item => item.type === 'passif' && item.section === 'capitaux_propres')
                      .map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className="text-right">{item.montant_n.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.montant_n1.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>DETTES</TableCell>
                      <TableCell className="text-right">{balanceTotals.dettes.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet
                          .filter(item => item.type === 'passif' && item.section === 'dettes')
                          .reduce((sum, item) => sum + item.montant_n1, 0)
                          .toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {balanceSheet
                      .filter(item => item.type === 'passif' && item.section === 'dettes')
                      .map(item => (
                        <TableRow key={item.code}>
                          <TableCell className="pl-6">{item.libelle}</TableCell>
                          <TableCell className="text-right">{item.montant_n.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.montant_n1.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    
                    <TableRow className="font-bold border-t-2">
                      <TableCell>TOTAL PASSIF</TableCell>
                      <TableCell className="text-right">{balanceTotals.totalPassif.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {balanceSheet.reduce((sum, item) => 
                          item.type === 'passif' ? sum + item.montant_n1 : sum, 0
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resultat" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compte de Résultat OHADA</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => exportToExcel('Compte de Résultat')}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => printReport('Compte de Résultat')}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {incomeResults.produitsExploitation.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Résultat d'Exploitation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${incomeResults.resultatExploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {incomeResults.resultatExploitation.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Résultat Net</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${incomeResults.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {incomeResults.resultatNet.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Postes</TableHead>
                    <TableHead className="text-right">{selectedPeriod}</TableHead>
                    <TableHead className="text-right">{comparisonPeriod}</TableHead>
                    <TableHead className="text-right">Évolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-semibold bg-green-50">
                    <TableCell>PRODUITS D'EXPLOITATION</TableCell>
                    <TableCell className="text-right">{incomeResults.produitsExploitation.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {incomeStatement
                        .filter(item => item.type === 'produit' && item.nature === 'exploitation')
                        .reduce((sum, item) => sum + item.montant_n1, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">
                        +{(((incomeResults.produitsExploitation / 
                          incomeStatement
                            .filter(item => item.type === 'produit' && item.nature === 'exploitation')
                            .reduce((sum, item) => sum + item.montant_n1, 0)) - 1) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {incomeStatement
                    .filter(item => item.type === 'produit' && item.nature === 'exploitation')
                    .map(item => (
                      <TableRow key={item.code}>
                        <TableCell className="pl-6">{item.libelle}</TableCell>
                        <TableCell className="text-right">{item.montant_n.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.montant_n1.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {item.montant_n1 > 0 && (
                            <span className={((item.montant_n / item.montant_n1) - 1) >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {((item.montant_n / item.montant_n1) - 1) >= 0 ? '+' : ''}
                              {(((item.montant_n / item.montant_n1) - 1) * 100).toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  <TableRow className="font-semibold bg-red-50">
                    <TableCell>CHARGES D'EXPLOITATION</TableCell>
                    <TableCell className="text-right">({incomeResults.chargesExploitation.toLocaleString()})</TableCell>
                    <TableCell className="text-right">
                      ({incomeStatement
                        .filter(item => item.type === 'charge' && item.nature === 'exploitation')
                        .reduce((sum, item) => sum + item.montant_n1, 0)
                        .toLocaleString()})
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        +{(((incomeResults.chargesExploitation / 
                          incomeStatement
                            .filter(item => item.type === 'charge' && item.nature === 'exploitation')
                            .reduce((sum, item) => sum + item.montant_n1, 0)) - 1) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {incomeStatement
                    .filter(item => item.type === 'charge' && item.nature === 'exploitation')
                    .map(item => (
                      <TableRow key={item.code}>
                        <TableCell className="pl-6">{item.libelle}</TableCell>
                        <TableCell className="text-right">({item.montant_n.toLocaleString()})</TableCell>
                        <TableCell className="text-right">({item.montant_n1.toLocaleString()})</TableCell>
                        <TableCell className="text-right">
                          {item.montant_n1 > 0 && (
                            <span className={((item.montant_n / item.montant_n1) - 1) >= 0 ? 'text-red-600' : 'text-green-600'}>
                              {((item.montant_n / item.montant_n1) - 1) >= 0 ? '+' : ''}
                              {(((item.montant_n / item.montant_n1) - 1) * 100).toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  <TableRow className="font-bold bg-blue-50">
                    <TableCell>RESULTAT D'EXPLOITATION</TableCell>
                    <TableCell className={`text-right ${incomeResults.resultatExploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {incomeResults.resultatExploitation.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(incomeStatement
                        .filter(item => item.type === 'produit' && item.nature === 'exploitation')
                        .reduce((sum, item) => sum + item.montant_n1, 0) -
                      incomeStatement
                        .filter(item => item.type === 'charge' && item.nature === 'exploitation')
                        .reduce((sum, item) => sum + item.montant_n1, 0)).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Amélioration
                      </Badge>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow className="font-bold border-t-2">
                    <TableCell>RESULTAT NET</TableCell>
                    <TableCell className={`text-right ${incomeResults.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {incomeResults.resultatNet.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      6200000
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default">
                        +37.1%
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tresorerie" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tableau des Flux de Trésorerie</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => exportToExcel('Flux de Trésorerie')}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => printReport('Flux de Trésorerie')}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Flux d'Exploitation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cashFlowTotals.fluxExploitation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashFlowTotals.fluxExploitation.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Flux d'Investissement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cashFlowTotals.fluxInvestissement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashFlowTotals.fluxInvestissement.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Variation Trésorerie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cashFlowTotals.variationTresorerie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cashFlowTotals.variationTresorerie.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flux de Trésorerie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-semibold bg-green-50">
                    <TableCell>FLUX DE TRESORERIE D'EXPLOITATION</TableCell>
                    <TableCell className="text-right font-bold">{cashFlowTotals.fluxExploitation.toLocaleString()}</TableCell>
                  </TableRow>
                  {cashFlow
                    .filter(item => item.type === 'exploitation')
                    .map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="pl-6">{item.libelle}</TableCell>
                        <TableCell className={`text-right ${item.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.montant.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  <TableRow className="font-semibold bg-blue-50">
                    <TableCell>FLUX DE TRESORERIE D'INVESTISSEMENT</TableCell>
                    <TableCell className="text-right font-bold">{cashFlowTotals.fluxInvestissement.toLocaleString()}</TableCell>
                  </TableRow>
                  {cashFlow
                    .filter(item => item.type === 'investissement')
                    .map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="pl-6">{item.libelle}</TableCell>
                        <TableCell className={`text-right ${item.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.montant.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  <TableRow className="font-semibold bg-orange-50">
                    <TableCell>FLUX DE TRESORERIE DE FINANCEMENT</TableCell>
                    <TableCell className="text-right font-bold">{cashFlowTotals.fluxFinancement.toLocaleString()}</TableCell>
                  </TableRow>
                  {cashFlow
                    .filter(item => item.type === 'financement')
                    .map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="pl-6">{item.libelle}</TableCell>
                        <TableCell className={`text-right ${item.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.montant.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  <TableRow className="font-bold border-t-2">
                    <TableCell>VARIATION DE TRESORERIE</TableCell>
                    <TableCell className={`text-right ${cashFlowTotals.variationTresorerie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cashFlowTotals.variationTresorerie.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Analyse par Ratios Financiers</h3>
            <Button variant="outline" size="sm" onClick={() => exportToExcel('Ratios')}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span>Liquidité Générale</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{ratios.ratioLiquidite.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mb-2">
                  Actif Circulant / Dettes CT
                </p>
                <Badge variant={ratios.ratioLiquidite >= 1.5 ? "default" : "destructive"}>
                  {ratios.ratioLiquidite >= 1.5 ? "Bon" : "Attention"}
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
                <div className="text-3xl font-bold mb-2">{(ratios.ratioEndettement * 100).toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mb-2">
                  Dettes / Total Passif
                </p>
                <Badge variant={ratios.ratioEndettement <= 0.6 ? "default" : "destructive"}>
                  {ratios.ratioEndettement <= 0.6 ? "Normal" : "Élevé"}
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
                <div className="text-3xl font-bold mb-2">{(ratios.ratioAutonomie * 100).toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mb-2">
                  Capitaux Propres / Total Passif
                </p>
                <Badge variant={ratios.ratioAutonomie >= 0.4 ? "default" : "secondary"}>
                  {ratios.ratioAutonomie >= 0.4 ? "Bon" : "Moyen"}
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
                <div className="text-3xl font-bold mb-2">{ratios.margeExploitation.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mb-2">
                  Résultat Expl. / CA
                </p>
                <Badge variant={ratios.margeExploitation >= 10 ? "default" : "secondary"}>
                  {ratios.margeExploitation >= 10 ? "Excellent" : "Normal"}
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
                <div className="text-3xl font-bold mb-2">{ratios.margeNette.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mb-2">
                  Résultat Net / CA
                </p>
                <Badge variant={ratios.margeNette >= 5 ? "default" : "secondary"}>
                  {ratios.margeNette >= 5 ? "Très Bon" : "Correct"}
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
                <div className="text-3xl font-bold mb-2">{ratios.rentabiliteCapitaux.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mb-2">
                  Résultat Net / Capitaux Propres
                </p>
                <Badge variant={ratios.rentabiliteCapitaux >= 15 ? "default" : "secondary"}>
                  {ratios.rentabiliteCapitaux >= 15 ? "Excellent" : "Bien"}
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
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Points Forts</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• Excellente marge d'exploitation de {ratios.margeExploitation.toFixed(1)}%</li>
                    <li>• Forte rentabilité des capitaux propres ({ratios.rentabiliteCapitaux.toFixed(1)}%)</li>
                    <li>• Ratio de liquidité satisfaisant ({ratios.ratioLiquidite.toFixed(2)})</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">Points d'Attention</h4>
                  <ul className="space-y-1 text-sm text-orange-700">
                    <li>• Surveiller l'évolution du niveau d'endettement</li>
                    <li>• Optimiser la gestion des stocks (variation importante)</li>
                    <li>• Suivre les délais de paiement clients</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annexes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>États Annexes OHADA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Tableau d'Amortissements</div>
                      <div className="text-sm text-muted-foreground">Détail des amortissements par poste</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Tableau des Provisions</div>
                      <div className="text-sm text-muted-foreground">Provisions constituées et reprises</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">État des Créances</div>
                      <div className="text-sm text-muted-foreground">Analyse par échéance</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">État des Dettes</div>
                      <div className="text-sm text-muted-foreground">Analyse par échéance et nature</div>
                    </div>
                    <Button variant="outline" size="sm">
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
                      <li>• Amortissement linéaire</li>
                      <li>• Évaluation stocks FIFO</li>
                      <li>• Provisions au cas par cas</li>
                      <li>• Créances en valeur nominale</li>
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
                      <li>• Cautions bancaires: 2.500.000 FCFA</li>
                      <li>• Engagements de crédit-bail: 0 FCFA</li>
                      <li>• Autres engagements: 0 FCFA</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;