import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, MessageCircle, Activity, Globe, Shield } from 'lucide-react';

const NetworkOverview = () => {
  const networkStats = [
    {
      title: "Officines Connectées",
      value: "147",
      change: "+12",
      icon: Building,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Utilisateurs Actifs",
      value: "2,834",
      change: "+234",
      icon: Users,
      color: "bg-green-500/10 text-green-600"
    },
    {
      title: "Messages Échangés",
      value: "18,472",
      change: "+1,824",
      icon: MessageCircle,
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      title: "Collaborations",
      value: "89",
      change: "+7",
      icon: Activity,
      color: "bg-orange-500/10 text-orange-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Vue d'Ensemble Réseau PharmaSoft</CardTitle>
        </div>
        <CardDescription>
          Statistiques temps réel du réseau multi-officines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {networkStats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">
            Réseau sécurisé - Toutes les communications sont chiffrées
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkOverview;