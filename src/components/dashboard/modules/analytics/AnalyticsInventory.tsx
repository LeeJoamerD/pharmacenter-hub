import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { StockCategoryLevel, StockAlert } from '@/hooks/useAdminAnalytics';

interface AnalyticsInventoryProps {
  stockLevels: StockCategoryLevel[];
  stockLevelsLoading: boolean;
  stockAlerts: StockAlert[];
  stockAlertsLoading: boolean;
}

const AnalyticsInventory: React.FC<AnalyticsInventoryProps> = ({
  stockLevels,
  stockLevelsLoading,
  stockAlerts,
  stockAlertsLoading,
}) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: StockAlert['status']) => {
    switch (status) {
      case 'critique':
        return 'destructive';
      case 'bas':
        return 'default';
      case 'moyen':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: StockAlert['status']) => {
    switch (status) {
      case 'critique':
        return 'Critique';
      case 'bas':
        return 'Stock Bas';
      case 'moyen':
        return 'Attention';
      default:
        return status;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value} unités (moy.)
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Niveaux de Stock par Catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Niveaux de Stock par Catégorie
          </CardTitle>
          <CardDescription>Comparaison stock moyen actuel vs seuil d'alerte moyen</CardDescription>
        </CardHeader>
        <CardContent>
          {stockLevelsLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : stockLevels.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Aucune donnée de stock disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stockLevels} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  className="text-xs" 
                  width={120}
                  tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="stock" 
                  fill="hsl(var(--primary))" 
                  name="Stock moyen actuel" 
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="alerte" 
                  fill="hsl(var(--destructive))" 
                  name="Seuil d'alerte moyen" 
                  radius={[0, 4, 4, 0]}
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Alertes de Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
              Alertes de Stock
            </CardTitle>
            <CardDescription>Produits nécessitant une attention immédiate</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard/stock')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir tout le stock
          </Button>
        </CardHeader>
        <CardContent>
          {stockAlertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : stockAlerts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-muted-foreground">
                Aucune alerte de stock active - Tous les niveaux sont satisfaisants
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockAlerts.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/stock?product=${item.productId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      item.status === 'critique' 
                        ? 'bg-destructive/10 text-destructive' 
                        : item.status === 'bas'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium line-clamp-1">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.level === 0 ? 'Rupture de stock' : `${item.level} unités restantes`}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsInventory;
