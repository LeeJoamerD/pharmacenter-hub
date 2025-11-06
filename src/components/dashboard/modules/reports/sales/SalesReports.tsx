import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSalesReports } from '@/hooks/useSalesReports';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { exportSalesReportToPDF } from '@/utils/salesReportExport';
import type { SalesPeriod, SalesCategory } from '@/types/salesReports';

const SalesReports = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriod>('month');
  const [selectedCategory, setSelectedCategory] = useState<SalesCategory>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Récupération des données de ventes en temps réel
  const { data, isLoading, error, refetch } = useSalesReports(selectedPeriod, selectedCategory);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Données actualisées",
        description: "Les rapports de ventes ont été mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive"
      });
    }
  };

  const handleExport = async (format: string) => {
    if (format !== 'PDF') return;
    
    setIsExporting(true);
    try {
      // Récupération des infos du tenant pour l'en-tête PDF
      const { data: tenantInfo, error: tenantError } = await supabase
        .from('pharmacies')
        .select('name, logo')
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;

      await exportSalesReportToPDF(
        data,
        selectedPeriod,
        selectedCategory,
        { nom_entreprise: tenantInfo?.name || 'Pharmacie' }
      );

      toast({
        title: "Export réussi",
        description: "Le rapport PDF a été téléchargé avec succès",
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Affichage de l'erreur si présente
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground mb-4">
                Impossible de charger les rapports de ventes
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports de Ventes</h2>
          <p className="text-muted-foreground">
            Analyses détaillées des performances commerciales
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as SalesCategory)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="medicines">Médicaments</SelectItem>
              <SelectItem value="parapharmacy">Parapharmacie</SelectItem>
              <SelectItem value="medical">Matériel médical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as SalesPeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={() => handleExport('PDF')} 
            disabled={isExporting || isLoading}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Export en cours...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* KPIs de ventes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Aujourd'hui</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.kpis.caAujourdhui.toLocaleString('fr-FR')} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.kpis.caVariation >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
                  )}
                  {data.kpis.caVariation >= 0 ? '+' : ''}{data.kpis.caVariation.toFixed(1)}% vs période précédente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data.kpis.transactions}</div>
                <p className="text-xs text-muted-foreground">
                  {data.kpis.transactionsVariation >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
                  )}
                  {data.kpis.transactionsVariation >= 0 ? '+' : ''}{data.kpis.transactionsVariation.toFixed(1)}% vs période précédente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.floor(data.kpis.panierMoyen).toLocaleString('fr-FR')} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.kpis.panierMoyenVariation >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
                  )}
                  {data.kpis.panierMoyenVariation >= 0 ? '+' : ''}{data.kpis.panierMoyenVariation.toFixed(1)}% vs période précédente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Uniques</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data.kpis.clientsUniques}</div>
                <p className="text-xs text-muted-foreground">
                  {data.kpis.clientsUniquesVariation >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 inline mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 inline mr-1" />
                  )}
                  {data.kpis.clientsUniquesVariation >= 0 ? '+' : ''}{data.kpis.clientsUniquesVariation.toFixed(1)}% vs période précédente
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evolution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="staff">Équipe</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution des Ventes - 7 derniers jours
              </CardTitle>
              <CardDescription>
                Comparaison ventes réalisées vs objectifs fixés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : data.evolutionData.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  Aucune donnée disponible pour cette période
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString()} FCFA`, 
                        name === 'ventes' ? 'Ventes' : 'Objectif'
                      ]}
                    />
                    <Bar dataKey="ventes" fill="#10b981" name="ventes" />
                    <Bar dataKey="objectif" fill="#f59e0b" name="objectif" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Évolution du Nombre de Transactions</CardTitle>
              <CardDescription>Volume des transactions sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[250px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : data.evolutionData.length === 0 ? (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} transactions`, 'Transactions']} />
                    <Line 
                      type="monotone" 
                      dataKey="transactions" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top 5 Produits - Performances
              </CardTitle>
              <CardDescription>
                Classement des produits par chiffre d'affaires généré
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : data.topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Aucun produit vendu pour cette période
                </div>
              ) : (
                <div className="space-y-4">
                  {data.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{product.produit}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantite} unités vendues
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.ventes.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-sm text-green-600">Marge: {product.marge.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance de l'Équipe
              </CardTitle>
              <CardDescription>
                Résultats individuels des agents de vente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : data.staffPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Aucune donnée de performance disponible
                </div>
              ) : (
                <div className="space-y-4">
                  {data.staffPerformance.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {staff.nom.split(' ')[0]?.[0]}{staff.nom.split(' ')[1]?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{staff.nom}</p>
                          <p className="text-sm text-muted-foreground">
                            {staff.transactions} transactions • Moy: {Math.floor(staff.moyenne).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold">{staff.ventes.toLocaleString('fr-FR')} FCFA</p>
                          <Badge 
                            variant={staff.performance >= 100 ? "default" : staff.performance >= 90 ? "secondary" : "destructive"}
                          >
                            {staff.performance.toFixed(0)}% objectif
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Répartition par Catégorie
                </CardTitle>
                <CardDescription>
                  Distribution du chiffre d'affaires par segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : data.categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucune catégorie disponible
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {data.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Détail par Catégorie</CardTitle>
                <CardDescription>
                  Chiffres détaillés et pourcentages de répartition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : data.categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Aucune catégorie disponible
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{category.value.toLocaleString('fr-FR')} FCFA</p>
                          <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesReports;