
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export const ClientDirectoryModule = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold tracking-tight">Répertoire des clients</h2>
    <p className="text-muted-foreground">Gérez votre base de données clients et consultez leurs informations.</p>
    
    <Card>
      <CardHeader>
        <CardTitle>Liste des clients</CardTitle>
        <CardDescription>Recherchez et filtrez vos clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full bg-muted/20 rounded-md flex items-center justify-center">
          <Users className="h-12 w-12 text-muted" />
          <span className="ml-4 text-xl text-muted-foreground">Répertoire des clients</span>
        </div>
      </CardContent>
    </Card>
  </div>
);

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
