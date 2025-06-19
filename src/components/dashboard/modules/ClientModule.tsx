
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, ListChecks, BarChart, User } from 'lucide-react';

export const ClientDashboardModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Tableau de bord des clients</h2>
    <p className="text-muted-foreground">Visualisez les données importantes concernant vos clients.</p>
    
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total des clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,254</div>
          <p className="text-xs text-muted-foreground">+8% depuis le mois dernier</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nouveaux clients</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">32</div>
          <p className="text-xs text-muted-foreground">Ce mois-ci</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consultations</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">128</div>
          <p className="text-xs text-muted-foreground">Ce mois-ci</p>
        </CardContent>
      </Card>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Démographie des clients</CardTitle>
          <CardDescription>Répartition par âge et sexe</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <div className="h-full w-full bg-muted/20 rounded-md flex items-center justify-center">
            <BarChart className="h-8 w-8 text-muted" />
            <span className="ml-2 text-muted-foreground">Graphique de démographie</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Clients fidèles</CardTitle>
          <CardDescription>Top 5 des clients avec le plus d'achats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Martin Dupont", visits: 24, spend: "1,240 €" },
              { name: "Marie Lambert", visits: 18, spend: "965 €" },
              { name: "Jean Lefebvre", visits: 15, spend: "820 €" },
              { name: "Sophie Moreau", visits: 12, spend: "750 €" },
              { name: "Pierre Durand", visits: 10, spend: "680 €" }
            ].map((client, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.visits} visites</p>
                  </div>
                </div>
                <div className="text-sm font-medium">{client.spend}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export const ClientDirectoryModule = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');

  const clients = [
    {
      id: 1,
      name: "Martin Dupont",
      email: "martin.dupont@email.com",
      phone: "06 12 34 56 78",
      address: "123 Rue de la Paix, 75001 Paris",
      birthDate: "15/03/1985",
      lastVisit: "12/01/2024",
      status: "Actif",
      totalSpent: "1,240 €"
    },
    {
      id: 2,
      name: "Marie Lambert",
      email: "marie.lambert@email.com",
      phone: "06 23 45 67 89",
      address: "456 Avenue des Champs, 75008 Paris",
      birthDate: "22/07/1990",
      lastVisit: "10/01/2024",
      status: "Actif",
      totalSpent: "965 €"
    },
    {
      id: 3,
      name: "Jean Lefebvre",
      email: "jean.lefebvre@email.com",
      phone: "06 34 56 78 90",
      address: "789 Boulevard Saint-Germain, 75006 Paris",
      birthDate: "08/11/1978",
      lastVisit: "05/01/2024",
      status: "Inactif",
      totalSpent: "820 €"
    },
    {
      id: 4,
      name: "Sophie Moreau",
      email: "sophie.moreau@email.com",
      phone: "06 45 67 89 01",
      address: "321 Rue du Faubourg, 75011 Paris",
      birthDate: "14/05/1993",
      lastVisit: "08/01/2024",
      status: "Actif",
      totalSpent: "750 €"
    },
    {
      id: 5,
      name: "Pierre Durand",
      email: "pierre.durand@email.com",
      phone: "06 56 78 90 12",
      address: "654 Place de la République, 75003 Paris",
      birthDate: "30/09/1982",
      lastVisit: "15/12/2023",
      status: "Inactif",
      totalSpent: "680 €"
    }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || client.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Répertoire des clients</h2>
          <p className="text-muted-foreground">Gérez votre base de données clients et consultez leurs informations.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Adresse</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dernière visite</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total dépensé</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">Né le {client.birthDate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div>
                        <div className="text-sm">{client.email}</div>
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">{client.address}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">{client.lastVisit}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        client.status === 'Actif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{client.totalSpent}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ListChecks className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          ×
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ClientHistoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Historique médical</h2>
    <p className="text-muted-foreground">Consultez et gérez l'historique médical et les traitements de vos clients.</p>
    
    <Card>
      <CardHeader>
        <CardTitle>Suivi des traitements</CardTitle>
        <CardDescription>Historique des prescriptions et consultations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
          <ListChecks className="h-12 w-12 text-muted" />
          <span className="ml-4 text-xl text-muted-foreground">Historique médical des clients</span>
        </div>
      </CardContent>
    </Card>
  </div>
);
