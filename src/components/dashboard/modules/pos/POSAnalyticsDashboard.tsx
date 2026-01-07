import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePOSAnalytics } from '@/hooks/usePOSAnalytics';
import { TrendingUp, ShoppingCart, Users, CreditCard, BarChart3, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const POSAnalyticsDashboard: React.FC = () => {
  const { dashboardMetrics, topProducts, paymentMethodStats, hourlyAnalytics } = usePOSAnalytics();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const metrics = dashboardMetrics || {
    total_ventes: 0,
    total_transactions: 0,
    panier_moyen: 0,
    repartition_paiements: {}
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: DEFAULT_SETTINGS.currency.code,
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_ventes)}</div>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_transactions}</div>
            <p className="text-xs text-muted-foreground">Nombre de ventes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.panier_moyen)}</div>
            <p className="text-xs text-muted-foreground">Par transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modes de Paiement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(metrics.repartition_paiements).length}
            </div>
            <p className="text-xs text-muted-foreground">Méthodes utilisées</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <Tabs defaultValue="hourly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hourly">Par Heure</TabsTrigger>
          <TabsTrigger value="products">Top Produits</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ventes par Heure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={hourlyAnalytics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="heure" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'total_ventes') return [formatCurrency(value), 'Ventes'];
                      return [value, 'Transactions'];
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="montant_total_ventes" 
                    stroke="hsl(var(--primary))" 
                    name="Ventes (FCFA)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="nombre_transactions" 
                    stroke="hsl(var(--secondary))" 
                    name="Transactions"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topProducts || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="libelle_produit" type="category" width={150} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="ca_genere" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Paiements</CardTitle>
              </CardHeader>
              <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodStats ? [
                        { name: 'Espèces', value: paymentMethodStats.especes.montant },
                        { name: 'Carte', value: paymentMethodStats.carte.montant },
                        { name: 'Mobile', value: paymentMethodStats.mobile.montant },
                        { name: 'Assurance', value: paymentMethodStats.assurance.montant }
                      ].filter(p => p.value > 0) : []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails par Mode de Paiement</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                  {paymentMethodStats && Object.entries(paymentMethodStats).map(([name, stat], index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.pourcentage.toFixed(1)}% des paiements
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(stat.montant)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
