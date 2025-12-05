import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Search, 
  Plus,
  Zap,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Dialogs
import NewMessageDialog from './dialogs/NewMessageDialog';
import CreateCollaborationDialog from './dialogs/CreateCollaborationDialog';
import NetworkAlertDialog from './dialogs/NetworkAlertDialog';
import ExpertSearchDialog from './dialogs/ExpertSearchDialog';

interface Collaboration {
  id: string;
  title: string;
  participants: number;
  status: 'active' | 'scheduled' | 'draft' | 'completed';
  lastActivity: string;
}

const QuickNetworkActions = () => {
  const { currentTenant } = useTenant();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [expertSearchOpen, setExpertSearchOpen] = useState(false);

  useEffect(() => {
    loadCollaborations();
  }, [currentTenant?.id]);

  const loadCollaborations = async () => {
    setLoading(true);
    try {
      // Load collaboration channels
      const { data: channels } = await supabase
        .from('network_channels')
        .select('id, name, description, created_at')
        .eq('channel_type', 'collaboration')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get participant counts
      const collabs: Collaboration[] = await Promise.all(
        (channels || []).map(async (ch) => {
          const { count } = await supabase
            .from('channel_participants')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', ch.id);

          return {
            id: ch.id,
            title: ch.name,
            participants: count || 0,
            status: 'active' as const,
            lastActivity: ch.created_at
          };
        })
      );

      setCollaborations(collabs);
    } catch (error) {
      console.error('Erreur chargement collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: MessageCircle,
      title: "Nouveau Message Réseau",
      description: "Envoyer un message à une officine",
      action: "Composer",
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      badge: null,
      onClick: () => setNewMessageOpen(true)
    },
    {
      icon: Users,
      title: "Créer Collaboration",
      description: "Démarrer un projet inter-officines",
      action: "Créer",
      color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
      badge: "Nouveau",
      onClick: () => setCollaborationOpen(true)
    },
    {
      icon: AlertTriangle,
      title: "Alerte Réseau",
      description: "Diffuser une alerte urgente",
      action: "Diffuser",
      color: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
      badge: "Urgent",
      onClick: () => setAlertOpen(true)
    },
    {
      icon: Calendar,
      title: "Planifier Réunion",
      description: "Organiser une visioconférence",
      action: "Planifier",
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
      badge: null,
      onClick: () => {
        alert('Fonctionnalité de planification de réunions à venir');
      }
    },
    {
      icon: FileText,
      title: "Circulaire Officielle",
      description: "Rédiger une communication officielle",
      action: "Rédiger",
      color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
      badge: null,
      onClick: () => {
        alert('Fonctionnalité de rédaction de circulaires à venir');
      }
    },
    {
      icon: Search,
      title: "Recherche Expert",
      description: "Trouver un expert dans le réseau",
      action: "Rechercher",
      color: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20",
      badge: null,
      onClick: () => setExpertSearchOpen(true)
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600';
      case 'draft': return 'bg-gray-500/10 text-gray-600';
      case 'completed': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'scheduled': return 'Planifié';
      case 'draft': return 'Brouillon';
      case 'completed': return 'Terminé';
      default: return 'Inconnu';
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions rapides */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Actions Rapides Réseau</CardTitle>
              </div>
              <CardDescription>
                Accès rapide aux fonctionnalités essentielles du réseau
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action, index) => (
                  <div key={index} className="group">
                    <Button 
                      variant="ghost" 
                      className={`w-full h-auto p-4 flex-col gap-3 ${action.color} transition-colors`}
                      onClick={action.onClick}
                    >
                      <div className="flex items-center justify-between w-full">
                        <action.icon className="h-5 w-5" />
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-left w-full">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <div className="w-full">
                        <span className="text-xs font-medium">{action.action}</span>
                      </div>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collaborations récentes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Collaborations Récentes</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={loadCollaborations} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <CardDescription>
                Projets inter-officines en cours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-3 rounded-lg border">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {collaborations.length > 0 ? (
                    collaborations.map((collab) => (
                      <div key={collab.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className={`text-xs ${getStatusColor(collab.status)}`}>
                            {getStatusText(collab.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(collab.lastActivity), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1">{collab.title}</h4>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {collab.participants} participants
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune collaboration en cours</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setCollaborationOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Collaboration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <NewMessageDialog 
        open={newMessageOpen} 
        onOpenChange={setNewMessageOpen} 
      />
      <CreateCollaborationDialog 
        open={collaborationOpen} 
        onOpenChange={setCollaborationOpen}
        onSuccess={loadCollaborations}
      />
      <NetworkAlertDialog 
        open={alertOpen} 
        onOpenChange={setAlertOpen} 
      />
      <ExpertSearchDialog 
        open={expertSearchOpen} 
        onOpenChange={setExpertSearchOpen} 
      />
    </>
  );
};

export default QuickNetworkActions;
