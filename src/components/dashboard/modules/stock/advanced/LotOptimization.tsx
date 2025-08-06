import { useState, useEffect } from "react";
import { useLots } from "@/hooks/useLots";
import { useFIFOConfiguration } from "@/hooks/useFIFOConfiguration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Target, Zap, Settings, RefreshCw, TrendingUp, 
  CheckCircle, AlertCircle, Lightbulb, BarChart3
} from "lucide-react";

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: any;
  actions: any;
}

interface OptimizationSuggestion {
  id: string;
  type: 'transfer' | 'promotion' | 'reorder' | 'adjustment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  lotId: string;
  lotNumber: string;
  productName: string;
  currentValue: number;
  suggestedValue: number;
  expectedBenefit: string;
}

export const LotOptimization = () => {
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

  const { useLotsQuery, useLowStockLots, useExpiringLots } = useLots();
  const { validateFIFOCompliance, getNextLotToSell } = useFIFOConfiguration();

  const { data: allLots } = useLotsQuery();
  const { data: lowStockLots } = useLowStockLots();
  const { data: expiringLots } = useExpiringLots(30);

  // Règles d'optimisation par défaut
  useEffect(() => {
    const defaultRules: OptimizationRule[] = [
      {
        id: 'expiration_optimization',
        name: 'Optimisation des Expirations',
        description: 'Suggère des actions pour les lots proches de l\'expiration',
        isActive: true,
        priority: 1,
        conditions: { daysToExpiration: { lte: 30 } },
        actions: { type: 'promotion', discount: 10 }
      },
      {
        id: 'fifo_compliance',
        name: 'Conformité FIFO',
        description: 'Vérifie et corrige la conformité aux règles FIFO',
        isActive: true,
        priority: 2,
        conditions: { fifoViolation: true },
        actions: { type: 'reorder', priority: 'high' }
      },
      {
        id: 'stock_balancing',
        name: 'Équilibrage des Stocks',
        description: 'Redistribue les stocks selon les niveaux optimaux',
        isActive: true,
        priority: 3,
        conditions: { stockLevel: { lte: 10 } },
        actions: { type: 'transfer', threshold: 20 }
      },
      {
        id: 'value_optimization',
        name: 'Optimisation de la Valeur',
        description: 'Maximise la valeur du stock par rotation intelligente',
        isActive: false,
        priority: 4,
        conditions: { rotationRate: { lte: 6 } },
        actions: { type: 'promotion', incentive: 'volume' }
      }
    ];

    setOptimizationRules(defaultRules);
    setSelectedRules(defaultRules.filter(r => r.isActive).map(r => r.id));
  }, []);

  const runOptimization = async () => {
    setIsOptimizing(true);
    try {
      const newSuggestions: OptimizationSuggestion[] = [];

      if (!allLots) return;

      // Règle 1: Optimisation des expirations
      if (selectedRules.includes('expiration_optimization') && expiringLots) {
        for (const lot of expiringLots) {
          const daysToExpiration = lot.date_peremption 
            ? Math.floor((new Date(lot.date_peremption).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysToExpiration <= 30) {
            let priority: 'high' | 'medium' | 'low' = 'low';
            let discount = 5;

            if (daysToExpiration <= 7) {
              priority = 'high';
              discount = 20;
            } else if (daysToExpiration <= 15) {
              priority = 'medium';
              discount = 15;
            } else {
              priority = 'low';
              discount = 10;
            }

            newSuggestions.push({
              id: `exp_${lot.id}`,
              type: 'promotion',
              priority,
              title: 'Promotion d\'urgence',
              description: `Appliquer une remise de ${discount}% pour écouler le stock avant expiration`,
              lotId: lot.id,
              lotNumber: lot.numero_lot,
                  productName: 'Produit inconnu',
              currentValue: 0,
              suggestedValue: discount,
              expectedBenefit: `Éviter une perte de ${(lot.quantite_restante * (lot.prix_achat_unitaire || 1000)).toLocaleString()} F`
            });
          }
        }
      }

      // Règle 2: Conformité FIFO
      if (selectedRules.includes('fifo_compliance')) {
        const productsWithMultipleLots = allLots.reduce((acc, lot) => {
          if (!acc[lot.produit_id]) acc[lot.produit_id] = [];
          acc[lot.produit_id].push(lot);
          return acc;
        }, {} as Record<string, any[]>);

        for (const [productId, lots] of Object.entries(productsWithMultipleLots)) {
          if (Array.isArray(lots) && lots.length > 1) {
            const nextLotId = await getNextLotToSell(productId);
            const currentFirstLot = lots.sort((a: any, b: any) => 
              new Date(a.date_reception).getTime() - new Date(b.date_reception).getTime()
            )[0];

            if (nextLotId && nextLotId !== currentFirstLot.id) {
              const suggestedLot = lots.find((l: any) => l.id === nextLotId);
              if (suggestedLot) {
                newSuggestions.push({
                  id: `fifo_${productId}`,
                  type: 'reorder',
                  priority: 'medium',
                  title: 'Correction FIFO',
                  description: `Prioriser la vente du lot ${suggestedLot.numero_lot} selon les règles FIFO`,
                  lotId: suggestedLot.id,
                  lotNumber: suggestedLot.numero_lot,
                  productName: suggestedLot.produit?.libelle_produit || 'Produit inconnu',
                  currentValue: 0,
                  suggestedValue: 1,
                  expectedBenefit: 'Conformité aux règles de rotation'
                });
              }
            }
          }
        }
      }

      // Règle 3: Équilibrage des stocks
      if (selectedRules.includes('stock_balancing') && lowStockLots) {
        for (const lot of lowStockLots) {
          const stockPercentage = (lot.quantite_restante / lot.quantite_initiale) * 100;
          
          if (stockPercentage <= 10) {
            newSuggestions.push({
              id: `stock_${lot.id}`,
              type: 'reorder',
              priority: 'high',
              title: 'Réapprovisionnement urgent',
              description: `Stock critique à ${stockPercentage.toFixed(1)}% - Commande recommandée`,
              lotId: lot.id,
              lotNumber: lot.numero_lot,
              productName: lot.produit?.libelle_produit || 'Produit inconnu',
              currentValue: lot.quantite_restante,
              suggestedValue: lot.quantite_initiale,
              expectedBenefit: 'Éviter la rupture de stock'
            });
          }
        }
      }

      setSuggestions(newSuggestions);
    } finally {
      setIsOptimizing(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const applySuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    // Ici on implémenterait l'application réelle de la suggestion
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion': return <TrendingUp className="h-4 w-4" />;
      case 'reorder': return <RefreshCw className="h-4 w-4" />;
      case 'transfer': return <Target className="h-4 w-4" />;
      case 'adjustment': return <Settings className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Target className="h-8 w-8 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900">Optimisation Intelligente des Lots</h3>
              <p className="text-emerald-700 mt-1">
                Suggestions automatisées pour maximiser l'efficacité et réduire les pertes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="optimization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Optimisation
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Règles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimization">
          <div className="space-y-6">
            {/* Contrôles d'optimisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Lancer l'Optimisation
                </CardTitle>
                <CardDescription>
                  Analysez vos lots et obtenez des suggestions d'amélioration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={runOptimization} disabled={isOptimizing}>
                    <Zap className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-pulse' : ''}`} />
                    {isOptimizing ? 'Optimisation en cours...' : 'Optimiser Maintenant'}
                  </Button>
                  <Button variant="outline" disabled={suggestions.length === 0}>
                    Appliquer Toutes
                  </Button>
                </div>

                {suggestions.length > 0 && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      {suggestions.length} suggestions d'optimisation générées. 
                      Examinez les recommandations ci-dessous.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Statistiques des suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Priorité Haute</p>
                      <p className="text-2xl font-bold text-red-600">
                        {suggestions.filter(s => s.priority === 'high').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Promotions</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {suggestions.filter(s => s.type === 'promotion').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <RefreshCw className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Réapprovisionnements</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {suggestions.filter(s => s.type === 'reorder').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{suggestions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>Suggestions d'Optimisation</CardTitle>
                <CardDescription>
                  Actions recommandées pour améliorer la gestion de vos lots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead>Lot</TableHead>
                          <TableHead>Suggestion</TableHead>
                          <TableHead>Bénéfice Attendu</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((suggestion) => (
                          <TableRow key={suggestion.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(suggestion.type)}
                                <span className="capitalize">{suggestion.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPriorityColor(suggestion.priority) as any}>
                                {suggestion.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{suggestion.lotNumber}</div>
                                <div className="text-sm text-muted-foreground">{suggestion.productName}</div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div>
                                <div className="font-medium">{suggestion.title}</div>
                                <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{suggestion.expectedBenefit}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => applySuggestion(suggestion.id)}
                                >
                                  Appliquer
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => applySuggestion(suggestion.id)}
                                >
                                  Ignorer
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune suggestion d'optimisation pour le moment
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Règles d'Optimisation</CardTitle>
              <CardDescription>
                Activez ou désactivez les règles selon vos besoins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => toggleRule(rule.id)}
                        className="rounded"
                      />
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <Badge variant={rule.isActive ? 'secondary' : 'outline'}>
                      Priorité {rule.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance de l'Optimisation</CardTitle>
              <CardDescription>
                Suivi des améliorations apportées par l'optimisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Les métriques de performance seront affichées ici après l'application des suggestions
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};