import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, BarChart } from 'lucide-react';
import ClientList from './clients/ClientList';
import ClientForm from './clients/ClientForm';
import ClientAnalytics from './clients/ClientAnalytics';

export interface Client {
  id?: number;
  noms: string;
  prenoms: string;
  adresse: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  email: string;
  niu_cni: string;
  profession: string;
  date_naissance: string;
  situation_familiale: 'celibataire' | 'marie' | 'divorce' | 'veuf';
  nombre_enfants: number;
  type_client: 'particulier' | 'professionnel' | 'entreprise';
  statut: 'actif' | 'inactif' | 'suspendu';
  date_creation: string;
  derniere_visite?: string;
  total_achats?: number;
  nombre_commandes?: number;
  notes?: string;
}

const ClientModule = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      noms: 'KOUAME',
      prenoms: 'Jean Baptiste',
      adresse: 'Abidjan, Cocody Riviera',
      telephone_appel: '+225 0123456789',
      telephone_whatsapp: '+225 0123456789',
      email: 'jean.kouame@email.com',
      niu_cni: 'CI0123456789',
      profession: 'Ingénieur',
      date_naissance: '1985-03-15',
      situation_familiale: 'marie',
      nombre_enfants: 2,
      type_client: 'particulier',
      statut: 'actif',
      date_creation: '2024-01-15',
      derniere_visite: '2024-06-15',
      total_achats: 450000,
      nombre_commandes: 12,
      notes: 'Client fidèle depuis 2024'
    },
    {
      id: 2,
      noms: 'TRAORE',
      prenoms: 'Aminata',
      adresse: 'Abidjan, Yopougon',
      telephone_appel: '+225 0987654321',
      telephone_whatsapp: '+225 0987654321',
      email: 'aminata.traore@email.com',
      niu_cni: 'CI0987654321',
      profession: 'Pharmacien',
      date_naissance: '1978-08-22',
      situation_familiale: 'celibataire',
      nombre_enfants: 0,
      type_client: 'professionnel',
      statut: 'actif',
      date_creation: '2024-02-10',
      derniere_visite: '2024-06-20',
      total_achats: 750000,
      nombre_commandes: 18,
      notes: 'Pharmacien partenaire'
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleAddClient = (client: Client) => {
    const newClient = { ...client, id: Date.now() };
    setClients([...clients, newClient]);
  };

  const handleEditClient = (client: Client) => {
    setClients(clients.map(c => c.id === client.id ? client : c));
    setSelectedClient(null);
  };

  const handleDeleteClient = (clientId: number) => {
    setClients(clients.filter(c => c.id !== clientId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Liste des Clients
              </TabsTrigger>
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Formulaire Client
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <ClientList 
                clients={clients}
                onEditClient={(client) => {
                  setSelectedClient(client);
                  setActiveTab('form');
                }}
                onDeleteClient={handleDeleteClient}
              />
            </TabsContent>

            <TabsContent value="form" className="mt-6">
              <ClientForm 
                client={selectedClient}
                onSubmit={selectedClient ? handleEditClient : handleAddClient}
                onCancel={() => {
                  setSelectedClient(null);
                  setActiveTab('list');
                }}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <ClientAnalytics clients={clients} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientModule;