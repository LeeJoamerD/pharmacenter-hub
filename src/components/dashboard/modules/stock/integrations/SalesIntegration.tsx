import { useState, useEffect } from "react";
import { useLots } from "@/hooks/useLots";
import { useFIFOConfiguration } from "@/hooks/useFIFOConfiguration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, Package, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SalesSuggestion {
  productId: string;
  suggestedLotId: string;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export const SalesIntegration = () => {
  const [salesSuggestions, setSalesSuggestions] = useState<SalesSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { useExpiringLots, calculateDaysToExpiration, determineUrgencyLevel } = useLots();
  const { getNextLotToSell, validateFIFOCompliance } = useFIFOConfiguration();

  const { data: expiringLots } = useExpiringLots(30); // Lots expirant dans 30 jours

  const generateSalesSuggestions = async () => {
    setIsGenerating(true);
    try {
      if (!expiringLots) return;

      const suggestions: SalesSuggestion[] = [];

      for (const lot of expiringLots) {
        const daysToExpiration = calculateDaysToExpiration(lot.date_peremption);
        const urgencyLevel = determineUrgencyLevel(daysToExpiration);
        
        let priority: 'high' | 'medium' | 'low' = 'low';
        let reason = '';

        if (urgencyLevel === 'critique' || daysToExpiration <= 7) {
          priority = 'high';
          reason = 'Expiration critique - Vente immédiate recommandée';
        } else if (urgencyLevel === 'eleve' || daysToExpiration <= 15) {
          priority = 'medium';
          reason = 'Expiration proche - Promotion recommandée';
        } else {
          priority = 'low';
          reason = 'Surveillance recommandée';
        }

        // Vérifier la conformité FIFO
        const isNextInFIFO = await getNextLotToSell(lot.produit_id);
        if (isNextInFIFO === lot.id) {
          priority = priority === 'low' ? 'medium' : 'high';
          reason += ' (Premier en FIFO)';
        }

        suggestions.push({
          productId: lot.produit_id,
          suggestedLotId: lot.id,
          lotNumber: lot.numero_lot,
          expirationDate: lot.date_peremption,
          quantity: lot.quantite_restante,
          priority,
          reason
        });
      }

      // Trier par priorité et date d'expiration
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      });

      setSalesSuggestions(suggestions);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (expiringLots && expiringLots.length > 0) {
      generateSalesSuggestions();
    }
  }, [expiringLots]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <ShoppingCart className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Intégration Ventes - Gestion des Lots</h3>
              <p className="text-blue-700 mt-1">
                Suggestions intelligentes pour optimiser les ventes en fonction des dates d'expiration et des règles FIFO.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Priorité Haute</p>
                <p className="text-2xl font-bold text-red-600">
                  {salesSuggestions.filter(s => s.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Priorité Moyenne</p>
                <p className="text-2xl font-bold text-orange-600">
                  {salesSuggestions.filter(s => s.priority === 'medium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Suggestions</p>
                <p className="text-2xl font-bold">{salesSuggestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Actions Recommandées
          </CardTitle>
          <CardDescription>
            Suggestions basées sur l'analyse des lots et les règles FIFO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={generateSalesSuggestions} disabled={isGenerating}>
              Actualiser les suggestions
            </Button>
          </div>

          {salesSuggestions.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {salesSuggestions.filter(s => s.priority === 'high').length} lots nécessitent une attention immédiate.
                Consultez les suggestions ci-dessous pour optimiser vos ventes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Table des suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Suggestions de Vente par Lot</CardTitle>
          <CardDescription>
            Lots recommandés pour la vente selon les priorités d'expiration et FIFO
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesSuggestions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesSuggestions.map((suggestion, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant={getPriorityColor(suggestion.priority) as any} className="flex items-center gap-1 w-fit">
                          {getPriorityIcon(suggestion.priority)}
                          {suggestion.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{suggestion.lotNumber}</TableCell>
                      <TableCell>
                        {format(new Date(suggestion.expirationDate), 'dd/MM/yyyy', { locale: fr })}
                        <div className="text-sm text-muted-foreground">
                          {calculateDaysToExpiration(suggestion.expirationDate)} jours
                        </div>
                      </TableCell>
                      <TableCell>{suggestion.quantity}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm">{suggestion.reason}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Créer Promotion
                          </Button>
                          <Button size="sm" variant="outline">
                            Priorité Vente
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
              Aucune suggestion de vente pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};