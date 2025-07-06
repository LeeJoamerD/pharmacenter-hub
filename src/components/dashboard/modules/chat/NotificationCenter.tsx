import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  MessageSquare,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  BellRing,
  BellOff,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'support' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sender?: string;
  action?: () => void;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      title: 'Nouveau message',
      message: 'Dr. Martin vous a envoyé un message dans le canal #pharmaciens',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
      priority: 'medium',
      sender: 'Dr. Martin Dubois'
    },
    {
      id: '2',
      type: 'support',
      title: 'Nouvelle demande de support',
      message: 'Marie Dupont demande une assistance pour son ordonnance',
      timestamp: new Date(Date.now() - 600000),
      isRead: false,
      priority: 'high',
      sender: 'Marie Dupont'
    },
    {
      id: '3',
      type: 'alert',
      title: 'Alerte stock critique',
      message: 'Le stock de Doliprane 1000mg est en dessous du seuil critique',
      timestamp: new Date(Date.now() - 900000),
      isRead: true,
      priority: 'urgent',
      sender: 'Système'
    },
    {
      id: '4',
      type: 'system',
      title: 'Sauvegarde terminée',
      message: 'La sauvegarde quotidienne des conversations a été effectuée avec succès',
      timestamp: new Date(Date.now() - 1800000),
      isRead: true,
      priority: 'low',
      sender: 'Système'
    },
    {
      id: '5',
      type: 'message',
      title: 'Mention dans #général',
      message: 'Vous avez été mentionné par Sophie dans le canal général',
      timestamp: new Date(Date.now() - 2700000),
      isRead: false,
      priority: 'medium',
      sender: 'Sophie Martin'
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    support: true,
    system: false,
    alerts: true,
    sound: true,
    desktop: true,
    email: false
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'support':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-50 text-gray-600', label: 'Faible' },
      medium: { color: 'bg-blue-50 text-blue-600', label: 'Moyen' },
      high: { color: 'bg-orange-50 text-orange-600', label: 'Élevé' },
      urgent: { color: 'bg-red-50 text-red-600', label: 'Urgent' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filterNotifications = (type?: string) => {
    if (!type || type === 'all') return notifications;
    return notifications.filter(notification => notification.type === type);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Centre de Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Gérez toutes vos notifications en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Tout marquer lu
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Liste des notifications */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="message">Messages</TabsTrigger>
                  <TabsTrigger value="support">Support</TabsTrigger>
                  <TabsTrigger value="alert">Alertes</TabsTrigger>
                  <TabsTrigger value="system">Système</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-[480px]">
                    <NotificationList 
                      notifications={filterNotifications()} 
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="message" className="mt-4">
                  <ScrollArea className="h-[480px]">
                    <NotificationList 
                      notifications={filterNotifications('message')} 
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="support" className="mt-4">
                  <ScrollArea className="h-[480px]">
                    <NotificationList 
                      notifications={filterNotifications('support')} 
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="alert" className="mt-4">
                  <ScrollArea className="h-[480px]">
                    <NotificationList 
                      notifications={filterNotifications('alert')} 
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="system" className="mt-4">
                  <ScrollArea className="h-[480px]">
                    <NotificationList 
                      notifications={filterNotifications('system')} 
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>

        {/* Paramètres de notification */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-base">Paramètres</CardTitle>
              <CardDescription>
                Configurez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Messages</label>
                    <p className="text-xs text-muted-foreground">Notifications de messages</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.messages}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, messages: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Support Client</label>
                    <p className="text-xs text-muted-foreground">Demandes de support</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.support}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, support: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Alertes</label>
                    <p className="text-xs text-muted-foreground">Alertes système importantes</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.alerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, alerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Système</label>
                    <p className="text-xs text-muted-foreground">Notifications système</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.system}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, system: checked }))
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium">Méthodes de notification</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    <label className="text-sm">Sons</label>
                  </div>
                  <Switch 
                    checked={notificationSettings.sound}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, sound: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <label className="text-sm">Bureau</label>
                  </div>
                  <Switch 
                    checked={notificationSettings.desktop}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, desktop: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <label className="text-sm">Email</label>
                  </div>
                  <Switch 
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Composant pour la liste des notifications
interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationList = ({ notifications, onMarkAsRead, onDelete }: NotificationListProps) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'support':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-50 text-gray-600', label: 'Faible' },
      medium: { color: 'bg-blue-50 text-blue-600', label: 'Moyen' },
      high: { color: 'bg-orange-50 text-orange-600', label: 'Élevé' },
      urgent: { color: 'bg-red-50 text-red-600', label: 'Urgent' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-2 p-3">
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Aucune notification</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border transition-colors ${
              notification.isRead 
                ? 'bg-background border-border' 
                : 'bg-blue-50/50 border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    {getPriorityBadge(notification.priority)}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{notification.sender}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {notification.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    title="Marquer comme lu"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationCenter;