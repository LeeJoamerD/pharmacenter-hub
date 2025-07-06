import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  TrendingUp,
  UserCheck,
  MessageSquare,
  Bell,
  Activity
} from 'lucide-react';

const ChatDashboard = () => {
  const [metrics, setMetrics] = useState({
    activeConversations: 12,
    onlineUsers: 8,
    avgResponseTime: '2.3 min',
    dailyMessages: 245,
    customerSatisfaction: 4.7,
    resolvedToday: 18
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'message', user: 'Dr. Martin', message: 'Question sur Doliprane 1000mg', time: '2 min' },
    { id: 2, type: 'support', user: 'Client #1234', message: 'Demande info ordonnance', time: '5 min' },
    { id: 3, type: 'team', user: 'Sophie (Pharmacien)', message: 'Stock alerte partagée', time: '8 min' },
    { id: 4, type: 'system', user: 'Système', message: 'Backup conversations terminé', time: '15 min' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chat PharmaSoft</h2>
          <p className="text-muted-foreground">
            Hub central de communication temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-50 text-green-600">
            <Activity className="h-3 w-3 mr-1" />
            Système Actif
          </Badge>
        </div>
      </div>

      {/* Métriques Temps Réel */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Conversations</p>
                <p className="text-lg font-bold">{metrics.activeConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">En ligne</p>
                <p className="text-lg font-bold">{metrics.onlineUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Temps réponse</p>
                <p className="text-lg font-bold">{metrics.avgResponseTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Messages/jour</p>
                <p className="text-lg font-bold">{metrics.dailyMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
                <p className="text-lg font-bold">{metrics.customerSatisfaction}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-xs text-muted-foreground">Résolus</p>
                <p className="text-lg font-bold">{metrics.resolvedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activité Récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Activité Récente
            </CardTitle>
            <CardDescription>
              Dernières interactions et événements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'message' ? 'bg-blue-600' :
                    activity.type === 'support' ? 'bg-green-600' :
                    activity.type === 'team' ? 'bg-purple-600' : 'bg-gray-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.user}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions Rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Accès direct aux fonctions principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Nouvelle conversation équipe
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Voir support client actif
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Centre de notifications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Statistiques détaillées
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatDashboard;