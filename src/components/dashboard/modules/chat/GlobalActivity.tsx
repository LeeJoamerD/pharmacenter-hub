import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MessageCircle, Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const GlobalActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'message',
      user: 'Dr. Martin',
      pharmacy: 'Pharmacie du Centre',
      action: 'a envoyé un message dans',
      target: '#fournisseurs-communs',
      time: '2 min',
      icon: MessageCircle,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'collaboration',
      user: 'Équipe Lyon',
      pharmacy: 'Pharmacie de la Gare',
      action: 'a rejoint la collaboration',
      target: 'Achats Groupés Q1',
      time: '5 min',
      icon: Users,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'alert',
      user: 'Système',
      pharmacy: 'Réseau National',
      action: 'alerte diffusée',
      target: 'Rappel Médicament X',
      time: '12 min',
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      id: 4,
      type: 'completion',
      user: 'Pharmacie Rurale',
      pharmacy: 'Provence',
      action: 'a terminé la formation',
      target: 'Pharmacovigilance 2024',
      time: '25 min',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 5,
      type: 'message',
      user: 'Dr. Dubois',
      pharmacy: 'Pharmacie Hospitalière',
      action: 'a partagé un document dans',
      target: '#urgences-sanitaires',
      time: '1h',
      icon: MessageCircle,
      color: 'text-blue-600'
    }
  ];

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'message': return { text: 'Message', variant: 'default' as const };
      case 'collaboration': return { text: 'Collaboration', variant: 'secondary' as const };
      case 'alert': return { text: 'Alerte', variant: 'destructive' as const };
      case 'completion': return { text: 'Formation', variant: 'secondary' as const };
      default: return { text: 'Activité', variant: 'outline' as const };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>Activité Globale Réseau</CardTitle>
        </div>
        <CardDescription>
          Activités récentes dans le réseau multi-officines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
              <div className="flex-shrink-0 mt-1">
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{activity.user}</span>
                  <Badge variant={getActivityBadge(activity.type).variant} className="text-xs">
                    {getActivityBadge(activity.type).text}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {activity.action} <span className="font-medium">{activity.target}</span>
                </p>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{activity.pharmacy}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-sm text-primary hover:underline">
            Voir toute l'activité réseau
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalActivity;