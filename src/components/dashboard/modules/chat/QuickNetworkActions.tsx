import React from 'react';
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
  Zap
} from 'lucide-react';

const QuickNetworkActions = () => {
  const quickActions = [
    {
      icon: MessageCircle,
      title: "Nouveau Message Réseau",
      description: "Envoyer un message à une officine",
      action: "Composer",
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      badge: null
    },
    {
      icon: Users,
      title: "Créer Collaboration",
      description: "Démarrer un projet inter-officines",
      action: "Créer",
      color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
      badge: "Nouveau"
    },
    {
      icon: AlertTriangle,
      title: "Alerte Réseau",
      description: "Diffuser une alerte urgente",
      action: "Diffuser",
      color: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
      badge: "Urgent"
    },
    {
      icon: Calendar,
      title: "Planifier Réunion",
      description: "Organiser une visioconférence",
      action: "Planifier",
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
      badge: null
    },
    {
      icon: FileText,
      title: "Circulaire Officielle",
      description: "Rédiger une communication officielle",
      action: "Rédiger",
      color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
      badge: null
    },
    {
      icon: Search,
      title: "Recherche Expert",
      description: "Trouver un expert dans le réseau",
      action: "Rechercher",
      color: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20",
      badge: null
    }
  ];

  const recentCollaborations = [
    {
      title: "Achats Groupés Q1 2024",
      participants: 23,
      status: "active",
      lastActivity: "2h"
    },
    {
      title: "Formation Pharmacovigilance",
      participants: 156,
      status: "scheduled",
      lastActivity: "1j"
    },
    {
      title: "Protocole Urgences",
      participants: 12,
      status: "draft",
      lastActivity: "3j"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600';
      case 'draft': return 'bg-gray-500/10 text-gray-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'scheduled': return 'Planifié';
      case 'draft': return 'Brouillon';
      default: return 'Inconnu';
    }
  };

  return (
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
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Collaborations Récentes</CardTitle>
            </div>
            <CardDescription>
              Projets inter-officines en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCollaborations.map((collab, index) => (
                <div key={index} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(collab.status)}`}>
                      {getStatusText(collab.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{collab.lastActivity}</span>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{collab.title}</h4>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {collab.participants} participants
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Collaboration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickNetworkActions;