import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ShoppingCart, 
  Users, 
  PackageSearch, 
  LineChart, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar
} from "lucide-react";
import { useDashboardStats, useRefreshData } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils';

const DashboardHome = () => {
  const { salesSummary, stockLevels, expiringStock, sessions, isLoading, error } = useDashboardStats();
  const refreshData = useRefreshData();

  // Calculer les statistiques
  const todaySales = salesSummary.data?.total_ventes_ttc || 0;
  const todayTransactions = salesSummary.data?.nombre_ventes || 0;
  const lowStockCount = stockLevels.data?.filter((item: any) => item.status === 'Alerte').length || 0;
  const expiringCount = expiringStock.data?.report?.length || 0;
  const activeSessions = sessions.data?.filter((session: any) => session.statut === 'Ouverte').length || 0;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des données du tableau de bord. 
          <Button variant="outline" size="sm" onClick={refreshData} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Aperçu de l'activité de votre pharmacie aujourd'hui
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(todaySales)}</div>
                <p className="text-xs text-muted-foreground">
                  {todayTransactions} transaction{todayTransactions > 1 ? 's' : ''} aujourd'hui
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions actives</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Caisse{activeSessions > 1 ? 's' : ''} ouverte{activeSessions > 1 ? 's' : ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes stock</CardTitle>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground">
                  Produit{lowStockCount > 1 ? 's' : ''} sous le seuil d'alerte
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiration proche</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{expiringCount}</div>
                <p className="text-xs text-muted-foreground">
                  Lot{expiringCount > 1 ? 's' : ''} expirant dans 30 jours
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique et alertes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Graphique des ventes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fonctionnalité en cours de développement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <>
                  {lowStockCount > 0 && (
                    <div className="flex items-start space-x-3 p-2 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Stock faible</p>
                        <p className="text-xs text-muted-foreground">
                          {lowStockCount} produit{lowStockCount > 1 ? 's' : ''} à réapprovisionner
                        </p>
                      </div>
                      <Badge variant="secondary">{lowStockCount}</Badge>
                    </div>
                  )}
                  
                  {expiringCount > 0 && (
                    <div className="flex items-start space-x-3 p-2 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Expiration proche</p>
                        <p className="text-xs text-muted-foreground">
                          {expiringCount} lot{expiringCount > 1 ? 's' : ''} expire{expiringCount === 1 ? '' : 'nt'} bientôt
                        </p>
                      </div>
                      <Badge variant="destructive">{expiringCount}</Badge>
                    </div>
                  )}

                  {activeSessions > 0 && (
                    <div className="flex items-start space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Sessions actives</p>
                        <p className="text-xs text-muted-foreground">
                          {activeSessions} caisse{activeSessions > 1 ? 's' : ''} en cours d'utilisation
                        </p>
                      </div>
                      <Badge variant="default">{activeSessions}</Badge>
                    </div>
                  )}

                  {lowStockCount === 0 && expiringCount === 0 && activeSessions === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune alerte pour le moment</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome