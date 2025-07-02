import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, UserPlus, Edit, Trash2, Upload, Download } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      user: 'Dr. Sarah Martin',
      action: 'a ajouté un nouveau personnel',
      details: 'Marie Dupont - Assistante Pharmacienne',
      time: 'Il y a 15 minutes',
      icon: UserPlus,
      iconColor: 'text-green-500'
    },
    {
      id: 2,
      user: 'Admin Système',
      action: 'a modifié les paramètres',
      details: 'Configuration des alertes de stock',
      time: 'Il y a 32 minutes',
      icon: Edit,
      iconColor: 'text-blue-500'
    },
    {
      id: 3,
      user: 'Jean Dubois',
      action: 'a uploadé un document',
      details: 'Licence pharmaceutique 2025',
      time: 'Il y a 1 heure',
      icon: Upload,
      iconColor: 'text-purple-500'
    },
    {
      id: 4,
      user: 'Dr. Paul Leroy',
      action: 'a supprimé un partenaire',
      details: 'Laboratoire ABC - Contrat expiré',
      time: 'Il y a 2 heures',
      icon: Trash2,
      iconColor: 'text-red-500'
    },
    {
      id: 5,
      user: 'Système Auto',
      action: 'a généré un rapport',
      details: 'Rapport mensuel de conformité',
      time: 'Il y a 3 heures',
      icon: Download,
      iconColor: 'text-gray-500'
    },
    {
      id: 6,
      user: 'Marie Durand',
      action: 'a modifié un produit',
      details: 'Mise à jour prix Doliprane 1000mg',
      time: 'Il y a 4 heures',
      icon: Edit,
      iconColor: 'text-blue-500'
    },
    {
      id: 7,
      user: 'Dr. Sarah Martin',
      action: 'a approuvé une demande',
      details: 'Congé de Pierre Lambert',
      time: 'Il y a 5 heures',
      icon: UserPlus,
      iconColor: 'text-green-500'
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(activity.user)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {activity.action}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.details}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;