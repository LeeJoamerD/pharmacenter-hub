import { useState, useMemo } from "react";
import { useLots } from "@/hooks/useLots";
import { useLotMovements } from "@/hooks/useLotMovements";
import { LotCalculationService } from "@/services/lotCalculationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, TrendingUp, TrendingDown, RotateCcw, DollarSign,
  Calendar, AlertTriangle, Target, Activity, PieChart
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LotAnalyticsData {
  lotId: string;
  lotNumber: string;
  productName: string;
  rotationAnalysis: any;
  fifoAnalysis: any;
  expirationRisk: any;
  stockValue: any;
  usagePercentage: any;
  salePriority: any;
  performanceMetrics: any;
  predictedStockout: Date | null;
  carryingCost: any;
}

export const LotAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // jours
  const [analysisType, setAnalysisType] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  const { useLotsQuery, calculateDaysToExpiration } = useLots();
  const { useLotMovementStatsQuery } = useLotMovements();

  const { data: lots } = useLotsQuery();
  const { data: movementStats } = useLotMovementStatsQuery();

  const analyticsData = useMemo(() => {
    if (!lots) return [];

    const data: LotAnalyticsData[] = lots.map(lot => {
      const daysInStock = lot.date_reception 
        ? Math.floor((new Date().getTime() - new Date(lot.date_reception).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const averageDailySales = 2; // Mock data - à calculer depuis les ventes réelles
      const productValue = lot.prix_achat_unitaire || 1000;
      const targetRotation = 12; // 12 fois par an

      // Calculs analytiques
      const rotationAnalysis = LotCalculationService.calculateRotationRate(
        lot.quantite_initiale, 
        lot.quantite_restante, 
        daysInStock
      );

      const fifoAnalysis = LotCalculationService.analyzeFIFOCompliance(
        new Date(lot.date_reception || new Date()),
        new Date(lot.date_reception || new Date()) // Mock oldest lot date
      );

      const expirationRisk = lot.date_peremption 
        ? LotCalculationService.assessExpirationRisk(
            new Date(lot.date_peremption),
            lot.quantite_restante,
            averageDailySales,
            productValue
          )
        : { riskLevel: 'low', daysToExpiration: 999, recommendedActions: [], estimatedLoss: 0 };

      const stockValue = LotCalculationService.calculateStockValue(
        lot.quantite_restante,
        productValue
      );

      const usagePercentage = LotCalculationService.calculateUsagePercentage(
        lot.quantite_initiale,
        lot.quantite_restante
      );

      const daysToExpiration = lot.date_peremption ? calculateDaysToExpiration(lot.date_peremption) : 999;
      const salePriority = LotCalculationService.calculateSalePriority(
        daysToExpiration,
        lot.quantite_restante,
        averageDailySales,
        1 // Position FIFO mock
      );

      const performanceMetrics = LotCalculationService.calculateLotPerformanceMetrics(
        lot.quantite_initiale,
        lot.quantite_restante,
        daysInStock,
        targetRotation
      );

      const predictedStockout = LotCalculationService.predictStockoutDate(
        lot.quantite_restante,
        averageDailySales
      );

      const carryingCost = LotCalculationService.calculateCarryingCost(
        stockValue.value,
        0.15, // 15% de coût de portage annuel
        daysInStock
      );

      return {
        lotId: lot.id,
        lotNumber: lot.numero_lot,
        productName: lot.produit?.nom_produit || 'Produit inconnu',
        rotationAnalysis,
        fifoAnalysis,
        expirationRisk,
        stockValue,
        usagePercentage,
        salePriority,
        performanceMetrics,
        predictedStockout,
        carryingCost
      };
    });

    // Tri des données
    return data.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.salePriority.value - a.salePriority.value;
        case 'rotation':
          return b.rotationAnalysis.rotationRate - a.rotationAnalysis.rotationRate;
        case 'value':
          return b.stockValue.value - a.stockValue.value;
        case 'risk':
          const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return (riskOrder[b.expirationRisk.riskLevel as keyof typeof riskOrder] || 0) - 
                 (riskOrder[a.expirationRisk.riskLevel as keyof typeof riskOrder] || 0);
        default:
          return 0;
      }
    });
  }, [lots, sortBy]);

  const filteredData = useMemo(() => {
    if (analysisType === "all") return analyticsData;
    
    return analyticsData.filter(item => {
      switch (analysisType) {
        case 'high_risk':
          return item.expirationRisk.riskLevel === 'high';
        case 'slow_moving':
          return item.rotationAnalysis.classification === 'Lent';
        case 'high_value':
          return item.stockValue.value > 10000;
        default:
          return true;
      }
    });
  }, [analyticsData, analysisType]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRotationColor = (classification: string) => {
    switch (classification) {
      case 'Rapide': return 'text-green-600';
      case 'Moyen': return 'text-orange-600';
      case 'Lent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête et contrôles */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <BarChart3 className="h-8 w-8 text-indigo-600 mt-1" />
              <div>
                <h3 className="font-semibold text-indigo-900">Analytics Avancées des Lots</h3>
                <p className="text-indigo-700 mt-1">
                  Analyses approfondies pour optimiser la gestion et la performance des lots.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                  <SelectItem value="365">1 an</SelectItem>
                </SelectContent>
              </Select>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lots</SelectItem>
                  <SelectItem value="high_risk">Risque élevé</SelectItem>
                  <SelectItem value="slow_moving">Rotation lente</SelectItem>
                  <SelectItem value="high_value">Haute valeur</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="rotation">Rotation</SelectItem>
                  <SelectItem value="value">Valeur</SelectItem>
                  <SelectItem value="risk">Risque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Lots Analysés</p>
                <p className="text-2xl font-bold">{filteredData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                <p className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.stockValue.value, 0).toLocaleString()} F
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Risque Élevé</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredData.filter(item => item.expirationRisk.riskLevel === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RotateCcw className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rotation Moyenne</p>
                <p className="text-2xl font-bold">
                  {filteredData.length > 0 
                    ? (filteredData.reduce((sum, item) => sum + item.rotationAnalysis.rotationRate, 0) / filteredData.length).toFixed(1)
                    : 0
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Performance Moy.</p>
                <p className="text-2xl font-bold">
                  {filteredData.length > 0 
                    ? Math.round(filteredData.reduce((sum, item) => sum + item.performanceMetrics.performanceScore, 0) / filteredData.length)
                    : 0
                  }%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table détaillée */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse Détaillée par Lot</CardTitle>
          <CardDescription>
            Indicateurs de performance et recommandations pour chaque lot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Rotation</TableHead>
                  <TableHead>Valeur Stock</TableHead>
                  <TableHead>Risque Expiration</TableHead>
                  <TableHead>Priorité Vente</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Rupture Prévue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.lotId}>
                    <TableCell className="font-medium">{item.lotNumber}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.productName}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`font-medium ${getRotationColor(item.rotationAnalysis.classification)}`}>
                          {item.rotationAnalysis.classification}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.rotationAnalysis.rotationRate.toFixed(2)}x/an
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {item.stockValue.value.toLocaleString()} F
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskColor(item.expirationRisk.riskLevel) as any}>
                        {item.expirationRisk.riskLevel.toUpperCase()}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.expirationRisk.daysToExpiration} jours
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {item.salePriority.value.toFixed(0)}/100
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.salePriority.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Progress value={item.performanceMetrics.performanceScore} className="w-16" />
                        <div className="text-sm font-medium">
                          {item.performanceMetrics.performanceScore}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.predictedStockout ? (
                        <div className="text-sm">
                          {format(item.predictedStockout, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};