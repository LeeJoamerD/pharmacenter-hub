import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Target, AlertCircle, Lightbulb } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { AnalyticsKPI, TopProductAnalytics, StaffPerformanceData } from '@/hooks/useSalesAnalytics';

interface InsightsPanelProps {
  kpis: AnalyticsKPI | undefined;
  topProducts: TopProductAnalytics[] | undefined;
  staffPerformance: StaffPerformanceData[] | undefined;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ kpis, topProducts, staffPerformance }) => {
  const { formatPrice } = useCurrency();

  if (!kpis) return null;

  const insights = [];

  // Insights positifs
  if (kpis.caVariation > 10) {
    insights.push({
      type: 'positive',
      icon: TrendingUp,
      title: 'Forte croissance',
      description: `Le CA a augmenté de ${kpis.caVariation.toFixed(1)}% sur cette période. Excellente performance !`,
      color: 'green',
    });
  }

  if (kpis.clientsUniquesVariation > 15) {
    insights.push({
      type: 'positive',
      icon: TrendingUp,
      title: 'Acquisition client excellente',
      description: `+${kpis.clientsUniquesVariation.toFixed(1)}% de clients uniques. Votre stratégie d'acquisition fonctionne.`,
      color: 'green',
    });
  }

  if (kpis.panierMoyenVariation > 5) {
    insights.push({
      type: 'positive',
      icon: Target,
      title: 'Panier moyen en hausse',
      description: `Le panier moyen a augmenté de ${kpis.panierMoyenVariation.toFixed(1)}%. Les clients achètent plus.`,
      color: 'green',
    });
  }

  // Insights d'attention
  if (kpis.caVariation < -5) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Baisse du CA',
      description: `Le CA a diminué de ${Math.abs(kpis.caVariation).toFixed(1)}%. Analysez les causes et adaptez votre stratégie.`,
      color: 'orange',
    });
  }

  if (kpis.panierMoyenVariation < -5) {
    insights.push({
      type: 'warning',
      icon: TrendingDown,
      title: 'Panier moyen en baisse',
      description: `Le panier moyen a diminué de ${Math.abs(kpis.panierMoyenVariation).toFixed(1)}%. Encouragez l'achat multiple.`,
      color: 'orange',
    });
  }

  // Insights d'opportunité
  if (topProducts && topProducts.length > 0) {
    const topProduct = topProducts[0];
    insights.push({
      type: 'opportunity',
      icon: Lightbulb,
      title: 'Produit star',
      description: `"${topProduct.libelle}" génère ${topProduct.pourcentage_ca.toFixed(1)}% du CA. Maintenez le stock !`,
      color: 'blue',
    });
  }

  if (staffPerformance && staffPerformance.length > 0) {
    const topAgent = staffPerformance[0];
    insights.push({
      type: 'opportunity',
      icon: Target,
      title: 'Meilleur vendeur',
      description: `${topAgent.nom} excelle avec ${formatPrice(topAgent.ca)} de CA. Partagez ses bonnes pratiques !`,
      color: 'blue',
    });
  }

  // Insight temporel (simulé)
  insights.push({
    type: 'info',
    icon: Clock,
    title: 'Pic d\'activité',
    description: 'Les ventes sont généralement plus élevées en fin de semaine. Optimisez vos stocks en conséquence.',
    color: 'blue',
  });

  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-600 dark:text-green-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-800 dark:text-orange-200',
      icon: 'text-orange-600 dark:text-orange-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Insights & Recommandations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            const colors = colorClasses[insight.color as keyof typeof colorClasses];

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center mb-2">
                  <Icon className={`h-4 w-4 mr-2 ${colors.icon}`} />
                  <span className={`font-medium ${colors.text}`}>{insight.title}</span>
                </div>
                <p className={`text-sm ${colors.text}`}>{insight.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;
