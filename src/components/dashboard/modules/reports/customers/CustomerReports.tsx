import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag,
  Heart,
  Shield,
  Download,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { useCustomerReports } from '@/hooks/useCustomerReports';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';

const CustomerReports = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const { metrics, segmentation, behavior, loyalty, insurance, topCustomers, isLoading, refetch } = useCustomerReports(period);
  const { formatAmount } = useCurrencyFormatting();

  const getSegmentColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports Clients</h2>
          <p className="text-muted-foreground">
            Analyses du comportement et de la segmentation clientèle
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs Clients */}
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Users className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                {metric.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="segmentation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="behavior">Comportement</TabsTrigger>
          <TabsTrigger value="loyalty">Fidélisation</TabsTrigger>
          <TabsTrigger value="insurance">Assurances</TabsTrigger>
        </TabsList>

        <TabsContent value="segmentation" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par Type
                </CardTitle>
                <CardDescription>Segmentation de la base clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentation.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getSegmentColor(index)}`}></div>
                          <span className="font-medium">{segment.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {segment.count} clients ({segment.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={segment.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Top Clients
                </CardTitle>
                <CardDescription>Meilleurs clients par CA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.visitCount} visites</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(customer.totalPurchases)}</p>
                        <Badge variant="outline" className="text-xs">{customer.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analyse Comportementale
              </CardTitle>
              <CardDescription>Métriques de comportement client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {behavior.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{item.metric}</h4>
                      <Badge className="bg-green-50 text-green-600">{item.trend}</Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      {item.metric.includes('Taux') ? `${item.value.toFixed(1)}%` : item.value.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Programme de Fidélisation
              </CardTitle>
              <CardDescription>Segmentation par fidélité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loyalty.map((segment, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          segment.segment === 'VIP' ? 'bg-purple-100 text-purple-600' :
                          segment.segment === 'Régulier' ? 'bg-blue-100 text-blue-600' :
                          segment.segment === 'Occasionnel' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }>
                          {segment.segment}
                        </Badge>
                        <span className="font-medium">{segment.clients} clients</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{segment.avgFrequency}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Visites</p>
                        <p className="font-semibold">{segment.visits}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fréquence</p>
                        <p className="font-semibold">{segment.avgFrequency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rétention</p>
                        <p className="font-semibold">{segment.retention}%</p>
                      </div>
                    </div>
                    <Progress value={segment.retention} className="mt-3 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Clients par Assureur
              </CardTitle>
              <CardDescription>Répartition et CA par assurance</CardDescription>
            </CardHeader>
            <CardContent>
              {insurance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun client assuré trouvé
                </div>
              ) : (
                <div className="space-y-4">
                  {insurance.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{item.assureur}</h4>
                        <Badge variant="outline">{item.clients} clients</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">CA Total</p>
                          <p className="font-semibold">{formatAmount(item.caTotal)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taux Couverture Moyen</p>
                          <p className="font-semibold">{item.tauxCouverture.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerReports;
