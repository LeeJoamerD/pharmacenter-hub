import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, TrendingUp, TrendingDown, Minus, Wifi, Database, Shield } from 'lucide-react';

const NetworkMetrics = () => {
  const metrics = [
    {
      title: "Disponibilité Réseau",
      value: "99.8%",
      target: 99.9,
      current: 99.8,
      trend: "stable",
      icon: Wifi,
      color: "text-green-600"
    },
    {
      title: "Latence Moyenne",
      value: "45ms",
      description: "< 100ms cible",
      trend: "up",
      icon: Database,
      color: "text-blue-600"
    },
    {
      title: "Messages/Seconde",
      value: "1,247",
      description: "Pic: 2,845",
      trend: "up",
      icon: BarChart,
      color: "text-purple-600"
    },
    {
      title: "Sécurité",
      value: "100%",
      description: "Chiffrement actif",
      trend: "stable",
      icon: Shield,
      color: "text-green-600"
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          <CardTitle>Métriques Réseau</CardTitle>
        </div>
        <CardDescription>
          Performance temps réel du réseau PharmaSoft
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-sm font-medium">{metric.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-bold ${getTrendColor(metric.trend)}`}>
                    {metric.value}
                  </span>
                </div>
              </div>
              
              {metric.target && metric.current && (
                <div className="space-y-1">
                  <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Cible: {metric.target}%
                  </p>
                </div>
              )}
              
              {metric.description && (
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-muted-foreground">Système opérationnel</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dernière vérification: il y a 30 secondes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkMetrics;