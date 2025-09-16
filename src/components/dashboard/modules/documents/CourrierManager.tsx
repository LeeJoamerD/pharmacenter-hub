import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Mail, Send, Calendar, Search, Filter, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Courrier {
  id: string;
  name: string;
  document_type: string;
  sender?: string;
  recipient?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  category: string;
}

const CourrierManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('arrives');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newCourrierDialog, setNewCourrierDialog] = useState(false);

  useEffect(() => {
    loadCourriers();
  }, [activeTab]);

  const loadCourriers = async () => {
    try {
      setLoading(true);
      const documentType = activeTab === 'arrives' ? 'courrier_arrive' : 'courrier_depart';
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', documentType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourriers(data || []);
    } catch (error) {
      console.error('Error loading courriers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les courriers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourriers = courriers.filter(courrier => {
    const matchesSearch = courrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courrier.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courrier.recipient?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || courrier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { variant: 'secondary' as const, label: 'Brouillon' },
      'sent': { variant: 'default' as const, label: 'Envoyé' },
      'received': { variant: 'default' as const, label: 'Reçu' },
      'processed': { variant: 'default' as const, label: 'Traité' },
      'archived': { variant: 'outline' as const, label: 'Archivé' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { variant: 'secondary' as const, label: 'Faible' },
      'normal': { variant: 'outline' as const, label: 'Normale' },
      'high': { variant: 'destructive' as const, label: 'Haute' },
      'urgent': { variant: 'destructive' as const, label: 'Urgente' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Courriers</h2>
          <p className="text-muted-foreground">
            Gérez vos courriers entrants et sortants
          </p>
        </div>
        <Dialog open={newCourrierDialog} onOpenChange={setNewCourrierDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Courrier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Courrier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courrier-type">Type de Courrier</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="courrier_arrive">Courrier Arrivé</SelectItem>
                    <SelectItem value="courrier_depart">Courrier Départ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="courrier-title">Titre</Label>
                <Input id="courrier-title" placeholder="Titre du courrier" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courrier-sender">Expéditeur</Label>
                <Input id="courrier-sender" placeholder="Nom de l'expéditeur" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courrier-recipient">Destinataire</Label>
                <Input id="courrier-recipient" placeholder="Nom du destinataire" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewCourrierDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setNewCourrierDialog(false)}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="arrives" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Courriers Arrivés
          </TabsTrigger>
          <TabsTrigger value="departs" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Courriers Départs
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="received">Reçu</SelectItem>
                      <SelectItem value="processed">Traité</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courriers Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'arrives' ? 'Courriers Arrivés' : 'Courriers Départs'}
              </CardTitle>
              <CardDescription>
                {filteredCourriers.length} courrier{filteredCourriers.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>
                      {activeTab === 'arrives' ? 'Expéditeur' : 'Destinataire'}
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourriers.map((courrier) => (
                    <TableRow key={courrier.id}>
                      <TableCell className="font-medium">
                        {courrier.name}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'arrives' ? courrier.sender : courrier.recipient}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(courrier.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(courrier.priority)}
                      </TableCell>
                      <TableCell>
                        {new Date(courrier.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredCourriers.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun courrier trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourrierManager;