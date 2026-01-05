import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Building2, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PlatformOverview = () => {
  const [stats, setStats] = useState({
    globalProducts: 0,
    pharmacies: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsResult, pharmaciesResult] = await Promise.all([
          supabase
            .from('catalogue_global_produits')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('pharmacies')
            .select('id', { count: 'exact', head: true })
        ]);

        setStats({
          globalProducts: productsResult.count || 0,
          pharmacies: pharmaciesResult.count || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Produits Catalogue Global',
      value: stats.loading ? '...' : stats.globalProducts.toLocaleString(),
      description: 'Produits dans le catalogue complet',
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Pharmacies',
      value: stats.loading ? '...' : stats.pharmacies.toLocaleString(),
      description: 'Pharmacies inscrites',
      icon: Building2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vue d'ensemble</h1>
        <p className="text-muted-foreground mt-1">
          Tableau de bord de l'administration plateforme
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez rapidement aux fonctionnalités d'administration
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <a 
            href="/platform-admin/catalogue" 
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">Gérer le Catalogue Global</h3>
              <p className="text-sm text-muted-foreground">
                Importer et gérer les produits du catalogue complet
              </p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformOverview;
