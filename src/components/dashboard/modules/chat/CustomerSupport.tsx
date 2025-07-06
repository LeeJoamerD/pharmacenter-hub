import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveChat from './LiveChat';
import { 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MessageSquare,
  UserPlus,
  TrendingUp
} from 'lucide-react';

interface SupportTicket {
  id: string;
  customerName: string;
  subject: string;
  status: 'active' | 'pending' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  createdAt: string;
  responseTime: string;
  messages: number;
}

const CustomerSupport = () => {
  const [activeTab, setActiveTab] = useState('active');
  
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      customerName: 'Marie Dupont',
      subject: 'Question sur ordonnance',
      status: 'active',
      priority: 'high',
      assignedTo: 'Sophie Martin',
      createdAt: '14:32',
      responseTime: '2 min',
      messages: 5
    },
    {
      id: '2',
      customerName: 'Jean Moreau',
      subject: 'Disponibilité médicament',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Non assigné',
      createdAt: '14:15',
      responseTime: '15 min',
      messages: 2
    },
    {
      id: '3',
      customerName: 'Claire Bernard',
      subject: 'Horaires pharmacie',
      status: 'resolved',
      priority: 'low',
      assignedTo: 'Pierre Durand',
      createdAt: '13:45',
      responseTime: '1 min',
      messages: 3
    },
    {
      id: '4',
      customerName: 'Robert Leroy',
      subject: 'Effet indésirable à signaler',
      status: 'escalated',
      priority: 'urgent',
      assignedTo: 'Dr. Martin',
      createdAt: '13:30',
      responseTime: '30 sec',
      messages: 8
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-blue-50 text-blue-600', label: 'Actif' },
      pending: { color: 'bg-orange-50 text-orange-600', label: 'En attente' },
      resolved: { color: 'bg-green-50 text-green-600', label: 'Résolu' },
      escalated: { color: 'bg-red-50 text-red-600', label: 'Escaladé' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-50 text-gray-600', label: 'Faible' },
      medium: { color: 'bg-yellow-50 text-yellow-600', label: 'Moyen' },
      high: { color: 'bg-orange-50 text-orange-600', label: 'Élevé' },
      urgent: { color: 'bg-red-50 text-red-600', label: 'Urgent' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'escalated':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    if (activeTab === 'all') return true;
    return ticket.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Client</h2>
          <p className="text-muted-foreground">
            Gestion des conversations et support client en temps réel
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      {/* Métriques Support */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Actifs</p>
                <p className="text-lg font-bold">
                  {supportTickets.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="text-lg font-bold">
                  {supportTickets.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Résolus</p>
                <p className="text-lg font-bold">
                  {supportTickets.filter(t => t.status === 'resolved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Temps moyen</p>
                <p className="text-lg font-bold">4.2 min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Liste des tickets */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-base">Conversations Support</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 text-xs">
                  <TabsTrigger value="active">Actifs</TabsTrigger>
                  <TabsTrigger value="pending">Attente</TabsTrigger>
                  <TabsTrigger value="resolved">Résolus</TabsTrigger>
                  <TabsTrigger value="escalated">Escaladés</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                <div className="space-y-2 p-3">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedTicket === ticket.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ticket.status)}
                          <span className="font-medium text-sm">{ticket.customerName}</span>
                        </div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {ticket.subject}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {ticket.assignedTo}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">{ticket.messages} msg</span>
                          <span className="text-muted-foreground">{ticket.createdAt}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Interface de chat */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <LiveChat ticketId={selectedTicket} />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez un ticket de support pour commencer l'assistance
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;