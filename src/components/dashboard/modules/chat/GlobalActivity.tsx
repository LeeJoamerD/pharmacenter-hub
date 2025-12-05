import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, MessageCircle, Users, AlertCircle, CheckCircle, Clock, RefreshCw, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'message' | 'collaboration' | 'alert' | 'completion' | 'channel' | 'user';
  user: string;
  pharmacy: string;
  action: string;
  target: string;
  time: string;
  priority?: string;
}

const GlobalActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Souscrire aux nouveaux messages en temps réel
    const channel = supabase
      .channel('global-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'network_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          const newActivity: ActivityItem = {
            id: newMsg.id,
            type: newMsg.priority === 'urgent' ? 'alert' : 'message',
            user: newMsg.sender_name,
            pharmacy: newMsg.sender_name,
            action: 'a envoyé un message dans',
            target: `#${newMsg.channel_id?.slice(0, 8) || 'canal'}`,
            time: newMsg.created_at,
            priority: newMsg.priority
          };
          setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Charger les messages récents
      const { data: messages } = await supabase
        .from('network_messages')
        .select(`
          id,
          sender_name,
          sender_pharmacy_id,
          content,
          message_type,
          priority,
          created_at,
          channel:network_channels(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Charger les logs d'audit
      const { data: auditLogs } = await supabase
        .from('network_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const messageActivities: ActivityItem[] = (messages || []).map(msg => ({
        id: msg.id,
        type: msg.priority === 'urgent' ? 'alert' : 'message',
        user: msg.sender_name,
        pharmacy: msg.sender_name,
        action: msg.message_type === 'file' ? 'a partagé un document dans' : 'a envoyé un message dans',
        target: `#${(msg.channel as any)?.name || 'canal'}`,
        time: msg.created_at,
        priority: msg.priority
      }));

      const auditActivities: ActivityItem[] = (auditLogs || []).map(log => {
        const details = log.details as Record<string, any> || {};
        return {
          id: log.id,
          type: log.action_type?.includes('channel') ? 'channel' : 
                log.action_type?.includes('collaboration') ? 'collaboration' : 'user',
          user: details.actor_name || log.user_id || 'Système',
          pharmacy: details.actor_pharmacy_name || log.tenant_id || 'Réseau',
          action: details.action_description || log.action_type,
          target: details.target_name || '',
          time: log.created_at
        };
      });

      // Fusionner et trier par date
      const allActivities = [...messageActivities, ...auditActivities]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      setActivities(allActivities);
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string, priority?: string) => {
    if (priority === 'urgent') return AlertCircle;
    switch (type) {
      case 'message': return MessageCircle;
      case 'collaboration': return Users;
      case 'alert': return AlertCircle;
      case 'completion': return CheckCircle;
      case 'channel': return Hash;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string, priority?: string) => {
    if (priority === 'urgent') return 'text-red-600';
    switch (type) {
      case 'message': return 'text-blue-600';
      case 'collaboration': return 'text-green-600';
      case 'alert': return 'text-red-600';
      case 'completion': return 'text-green-600';
      case 'channel': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityBadge = (type: string, priority?: string) => {
    if (priority === 'urgent') return { text: 'Urgent', variant: 'destructive' as const };
    switch (type) {
      case 'message': return { text: 'Message', variant: 'default' as const };
      case 'collaboration': return { text: 'Collaboration', variant: 'secondary' as const };
      case 'alert': return { text: 'Alerte', variant: 'destructive' as const };
      case 'completion': return { text: 'Terminé', variant: 'secondary' as const };
      case 'channel': return { text: 'Canal', variant: 'outline' as const };
      default: return { text: 'Activité', variant: 'outline' as const };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Activité Globale Réseau</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={loadActivities} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Activités récentes dans le réseau multi-officines
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-3 pb-3 border-b">
                <div className="h-4 w-4 bg-muted rounded mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type, activity.priority);
              const badgeConfig = getActivityBadge(activity.type, activity.priority);
              
              return (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    <IconComponent className={`h-4 w-4 ${getActivityColor(activity.type, activity.priority)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{activity.user}</span>
                      <Badge variant={badgeConfig.variant} className="text-xs">
                        {badgeConfig.text}
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
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: fr })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-center">
          <Button variant="link" size="sm" className="text-primary">
            Voir toute l'activité réseau
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalActivity;
