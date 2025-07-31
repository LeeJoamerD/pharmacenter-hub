import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";;

// --- Fonctions utilitaires locales (pour remplacer celles du backend) ---

/**
 * Formate un nombre en devise (Franc CFA).
 * @param {number} amount - Le montant à formater.
 * @returns {string} - Le montant formaté.
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF', // Franc CFA d'Afrique Centrale
    minimumFractionDigits: 0,
  }).format(amount);
};

const DashboardHome = () => {
  // Utilisation des données statiques définies ci-dessus
  const { 
    todaySales, 
    todayTransactions, 
    lowStockCount, 
    expiringCount, 
    activeSessions 
  } = staticData;

  // La fonction de rafraîchissement est maintenant une simple alerte pour la démo.
  const handleRefresh = () => {
    alert("Ceci est une démo statique. Le rafraîchissement n'est pas actif.");
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton de rafraîchissement (désactivé pour la démo) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Aperçu de l'activité de votre pharmacie aujourd'hui
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
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
            <div className="text-2xl font-bold">{formatCurrency(todaySales)}</div>
            <p className="text-xs text-muted-foreground">
              {todayTransactions} transaction{todayTransactions > 1 ? 's' : ''} aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions actives</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Caisse{activeSessions > 1 ? 's' : ''} ouverte{activeSessions > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes stock</CardTitle>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Produit{lowStockCount > 1 ? 's' : ''} sous le seuil d'alerte
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiration proche</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              Lot{expiringCount > 1 ? 's' : ''} expirant dans 30 jours
            </p>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
