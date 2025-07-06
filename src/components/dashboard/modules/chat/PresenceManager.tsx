import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Circle,
  Clock,
  MessageCircle,
  Settings,
  UserCheck,
  UserX,
  Moon
} from 'lucide-react';

interface UserPresence {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  customStatus?: string;
  lastSeen?: string;
  avatar?: string;
}

const PresenceManager = () => {
  const [currentUserStatus, setCurrentUserStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');
  const [customStatus, setCustomStatus] = useState('');
  
  const [users, setUsers] = useState<UserPresence[]>([
    {
      id: '1',
      name: 'Dr. Martin Dubois',
      role: 'Pharmacien Titulaire',
      status: 'online',
      customStatus: 'Disponible pour consultations'
    },
    {
      id: '2',
      name: 'Sophie Martin',
      role: 'Pharmacien Adjoint',
      status: 'online',
      customStatus: ''
    },
    {
      id: '3',
      name: 'Pierre Durand',
      role: 'Préparateur',
      status: 'busy',
      customStatus: 'En formation jusqu\'à 16h'
    },
    {
      id: '4',
      name: 'Marie Leroy',
      role: 'Caissier',
      status: 'away',
      customStatus: '',
      lastSeen: '15 min'
    },
    {
      id: '5',
      name: 'Claire Bernard',
      role: 'Assistant',
      status: 'offline',
      customStatus: '',
      lastSeen: '2h'
    },
    {
      id: '6',
      name: 'Jean Moreau',
      role: 'Livreur',
      status: 'online',
      customStatus: 'En tournée livraisons'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      case 'offline':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'En ligne';
      case 'away':
        return 'Absent';
      case 'busy':
        return 'Occupé';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Inconnu';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { color: 'bg-green-50 text-green-600', label: 'En ligne' },
      away: { color: 'bg-yellow-50 text-yellow-600', label: 'Absent' },
      busy: { color: 'bg-red-50 text-red-600', label: 'Occupé' },
      offline: { color: 'bg-gray-50 text-gray-600', label: 'Hors ligne' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const onlineUsers = users.filter(user => user.status === 'online');
  const awayUsers = users.filter(user => user.status === 'away');
  const busyUsers = users.filter(user => user.status === 'busy');
  const offlineUsers = users.filter(user => user.status === 'offline');

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Présence Équipe
        </CardTitle>
        <CardDescription>
          Statuts en temps réel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[520px]">
          <div className="p-3 space-y-4">
            {/* Statut personnel */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Votre statut</span>
                <Button variant="ghost" size="sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Circle className={`h-3 w-3 fill-current ${getStatusColor(currentUserStatus)}`} />
                <span className="text-sm">{getStatusLabel(currentUserStatus)}</span>
              </div>
              <div className="flex gap-1 mb-2">
                <Button
                  size="sm"
                  variant={currentUserStatus === 'online' ? 'default' : 'outline'}
                  className="text-xs h-6"
                  onClick={() => setCurrentUserStatus('online')}
                >
                  En ligne
                </Button>
                <Button
                  size="sm"
                  variant={currentUserStatus === 'away' ? 'default' : 'outline'}
                  className="text-xs h-6"
                  onClick={() => setCurrentUserStatus('away')}
                >
                  Absent
                </Button>
                <Button
                  size="sm"
                  variant={currentUserStatus === 'busy' ? 'default' : 'outline'}
                  className="text-xs h-6"
                  onClick={() => setCurrentUserStatus('busy')}
                >
                  Occupé
                </Button>
              </div>
              <input
                type="text"
                placeholder="Message de statut..."
                className="w-full text-xs p-1 bg-background border rounded"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
              />
            </div>

            <Separator />

            {/* Utilisateurs en ligne */}
            {onlineUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-3 w-3 fill-current text-green-500" />
                  <span className="text-sm font-medium">En ligne ({onlineUsers.length})</span>
                </div>
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                        {user.customStatus && (
                          <p className="text-xs text-muted-foreground italic">{user.customStatus}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Utilisateurs occupés */}
            {busyUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-3 w-3 fill-current text-red-500" />
                  <span className="text-sm font-medium">Occupés ({busyUsers.length})</span>
                </div>
                <div className="space-y-2">
                  {busyUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                        {user.customStatus && (
                          <p className="text-xs text-muted-foreground italic">{user.customStatus}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Utilisateurs absents */}
            {awayUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-sm font-medium">Absents ({awayUsers.length})</span>
                </div>
                <div className="space-y-2">
                  {awayUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                        {user.lastSeen && (
                          <p className="text-xs text-muted-foreground">Vu il y a {user.lastSeen}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Utilisateurs hors ligne */}
            {offlineUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-3 w-3 fill-current text-gray-400" />
                  <span className="text-sm font-medium">Hors ligne ({offlineUsers.length})</span>
                </div>
                <div className="space-y-2">
                  {offlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded opacity-60">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                        {user.lastSeen && (
                          <p className="text-xs text-muted-foreground">Vu il y a {user.lastSeen}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PresenceManager;