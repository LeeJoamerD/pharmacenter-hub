import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, TrendingUp, DollarSign, ShoppingCart, Calendar, Target } from 'lucide-react';
import type { Client } from './types';

interface ClientAnalyticsProps {
  clients: Client[];
}

const ClientAnalytics = ({ clients }: ClientAnalyticsProps) => {
  // Calculs des statistiques basés sur la structure réelle
  const totalClients = clients.length;
  const clientsWithDiscount = clients.filter(c => (c.taux_remise_automatique || 0) > 0).length;
  const clientsWithoutDiscount = clients.filter(c => (c.taux_remise_automatique || 0) === 0).length;
  const averageDiscount = clients.length > 0 ? 
    clients.reduce((sum, client) => sum + (client.taux_remise_automatique || 0), 0) / clients.length : 0;

  // Répartition par type de client
  const clientsByType = clients.reduce((acc, client) => {
    const type = client.type_client || 'Non défini';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Données par type de client pour le graphique
  const clientTypeData = Object.entries(clientsByType).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // Répartition par taux de remise
  const discountRanges = [
    { name: '0%', value: clients.filter(c => (c.taux_remise_automatique || 0) === 0).length, color: '#6b7280' },
    { name: '1-5%', value: clients.filter(c => {
      const taux = c.taux_remise_automatique || 0;
      return taux > 0 && taux <= 5;
    }).length, color: '#3b82f6' },
    { name: '6-10%', value: clients.filter(c => {
      const taux = c.taux_remise_automatique || 0;
      return taux > 5 && taux <= 10;
    }).length, color: '#10b981' },
    { name: '11%+', value: clients.filter(c => (c.taux_remise_automatique || 0) > 10).length, color: '#f97316' }
  ];

  // Clients récents
  const recentClients = clients
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(client => ({
      name: client.nom_complet || 'Client sans nom',
      telephone: client.telephone || 'N/A',
      taux_remise: client.taux_remise_automatique || 0,
      date_creation: new Date(client.created_at).toLocaleDateString('fr-FR')
    }));

  // Données de tendance par mois (simulées)
  const monthlyData = [
    { month: 'Jan', nouveaux: 5, actifs: 15 },
    { month: 'Fév', nouveaux: 8, actifs: 22 },
    { month: 'Mar', nouveaux: 12, actifs: 31 },
    { month: 'Avr', nouveaux: 7, actifs: 28 },
    { month: 'Mai', nouveaux: 10, actifs: 35 },
    { month: 'Juin', nouveaux: 6, actifs: 30 }
  ];

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tous types confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avec remise</p>
                <p className="text-2xl font-bold">{clientsWithDiscount}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Bénéficient d'une remise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sans remise</p>
                <p className="text-2xl font-bold">{clientsWithoutDiscount}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Taux standard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remise Moyenne</p>
                <p className="text-2xl font-bold">{averageDiscount.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tous clients confondus
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par taux de remise */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par taux de remise</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={discountRanges}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {discountRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par type de client */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#82ca9d"
                  dataKey="value"
                >
                  {clientTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Clients récents */}
      <Card>
        <CardHeader>
          <CardTitle>Clients récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentClients.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucun client trouvé</p>
            ) : (
              recentClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.telephone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{client.taux_remise}% de remise</p>
                    <p className="text-xs text-muted-foreground">{client.date_creation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnalytics;