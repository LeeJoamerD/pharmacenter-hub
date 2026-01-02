import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid, List, BarChart, Users, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientDialog } from './clients/ClientDialog';
import { ClientTable } from './clients/ClientTable';
import { ClientCard } from './clients/ClientCard';
import { ClientFilters } from './clients/ClientFilters';
import ClientAnalytics from './clients/ClientAnalytics';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { Client, ClientFormData, clientFormSchema } from './clients/types';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const ClientModule = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    taux_remise_min: '',
    taux_remise_max: '',
    type_client: ''
  });

  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer tous les clients depuis la base de données
  const { data: clients = [], isLoading, refetch } = useTenantQueryWithCache(
    ['clients'],
    'clients',
    '*',
    {},
    { 
      orderBy: { column: 'created_at', ascending: false }
    }
  );

  console.log('Clients data:', clients);
  console.log('Is loading:', isLoading);

  // Mutations - uniquement pour les clients "Ordinaire" (legacy)
  const updateMutation = useTenantMutation('clients', 'update', {
    onSuccess: () => {
      toast.success('Client modifié avec succès');
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification du client');
      console.error(error);
    }
  });

  const deleteMutation = useTenantMutation('clients', 'delete', {
    onSuccess: () => {
      toast.success('Client supprimé avec succès');
      refetch();
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du client');
      console.error(error);
    }
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      nom_complet: '',
      telephone: '',
      adresse: '',
      taux_remise_automatique: 0,
    }
  });

  const handleSubmit = (data: ClientFormData) => {
    try {
      if (editingClient) {
        // Seuls les clients "Ordinaire" peuvent être modifiés ici
        if (editingClient.type_client !== 'Ordinaire') {
          toast.error('Ce type de client ne peut être modifié que depuis son module d\'origine');
          return;
        }
        updateMutation.mutate({ 
          id: editingClient.id, 
          ...data,
          type_client: 'Ordinaire'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error('Erreur lors de la validation du formulaire. Veuillez vérifier tous les champs.');
    }
  };

  const handleEdit = (client: Client) => {
    // Vérifier si le client peut être modifié ici
    if (client.type_client !== 'Ordinaire') {
      const moduleMap: Record<string, string> = {
        'Personnel': 'Administration > Personnel > Employés',
        'Entreprise': 'Administration > Partenaires > Sociétés',
        'Conventionné': 'Administration > Partenaires > Conventionnés'
      };
      toast.info(`Ce client de type "${client.type_client}" doit être modifié depuis le module ${moduleMap[client.type_client as string] || 'correspondant'}`);
      return;
    }
    
    setEditingClient(client);
    form.reset({
      nom_complet: client.nom_complet || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      taux_remise_automatique: client.taux_remise_automatique || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const client = clients.find((c: Client) => c.id === id);
    if (client && client.type_client !== 'Ordinaire') {
      toast.error('Seuls les clients de type "Ordinaire" peuvent être supprimés depuis ce module');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    form.reset({
      nom_complet: '',
      telephone: '',
      adresse: '',
      taux_remise_automatique: 0,
    });
  };

  const filteredClients = clients.filter((client: Client) => {
    // Recherche par texte
    const matchesSearch = searchTerm === '' || 
      (client.nom_complet && client.nom_complet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.telephone && client.telephone.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtres
    const taux = client.taux_remise_automatique || 0;
    const matchesTauxMin = filters.taux_remise_min === '' || taux >= parseFloat(filters.taux_remise_min);
    const matchesTauxMax = filters.taux_remise_max === '' || taux <= parseFloat(filters.taux_remise_max);
    const matchesType = filters.type_client === '' || client.type_client === filters.type_client;

    return matchesSearch && matchesTauxMin && matchesTauxMax && matchesType;
  });

  const clearFilters = () => {
    setFilters({
      taux_remise_min: '',
      taux_remise_max: '',
      type_client: ''
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des clients...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <ClientAnalytics clients={filteredClients} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des Clients</CardTitle>
                  <CardDescription>
                    Consultez et gérez tous vos clients
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Message informatif */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Création de clients</AlertTitle>
                  <AlertDescription>
                    Les comptes clients sont créés automatiquement depuis les modules :
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li><strong>Personnel</strong> : Administration → Personnel → Employés</li>
                      <li><strong>Entreprise</strong> : Administration → Partenaires → Sociétés</li>
                      <li><strong>Conventionné</strong> : Administration → Partenaires → Conventionnés</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Barre de recherche et filtres */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ClientFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      onClearFilters={clearFilters}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{clients.length}</div>
                      <p className="text-sm text-muted-foreground">Total clients</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {clients.filter((c: Client) => c.type_client === 'Conventionné').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Conventionnés</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {clients.filter((c: Client) => c.type_client === 'Entreprise').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Entreprises</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {clients.filter((c: Client) => c.type_client === 'Personnel').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Personnel</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Liste des clients */}
                {filteredClients.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'Aucun client trouvé pour cette recherche' : 'Aucun client enregistré'}
                      </div>
                    </CardContent>
                  </Card>
                ) : viewMode === 'table' ? (
                  <ClientTable
                    clients={filteredClients}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ) : (
                  <ClientCard
                    clients={filteredClients}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={editingClient}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ClientModule;