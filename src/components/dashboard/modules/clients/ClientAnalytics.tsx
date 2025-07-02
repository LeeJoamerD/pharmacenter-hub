import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, TrendingUp, DollarSign, ShoppingCart, Calendar, Target } from 'lucide-react';
import type { Client } from '../ClientModule';

interface ClientAnalyticsProps {
  clients: Client[];
}

const ClientAnalytics = ({ clients }: ClientAnalyticsProps) => {
  // Calculs des statistiques
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.statut === 'actif').length;
  const totalRevenue = clients.reduce((sum, client) => sum + (client.total_achats || 0), 0);
  const totalOrders = clients.reduce((sum, client) => sum + (client.nombre_commandes || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Données pour les graphiques
  const clientTypeData = [
    { name: 'Particulier', value: clients.filter(c => c.type_client === 'particulier').length, color: '#3b82f6' },
    { name: 'Professionnel', value: clients.filter(c => c.type_client === 'professionnel').length, color: '#8b5cf6' },
    { name: 'Entreprise', value: clients.filter(c => c.type_client === 'entreprise').length, color: '#f97316' }
  ];

  const statusData = [
    { name: 'Actif', value: clients.filter(c => c.statut === 'actif').length, color: '#10b981' },
    { name: 'Inactif', value: clients.filter(c => c.statut === 'inactif').length, color: '#6b7280' },
    { name: 'Suspendu', value: clients.filter(c => c.statut === 'suspendu').length, color: '#ef4444' }
  ];

  const topClients = clients
    .sort((a, b) => (b.total_achats || 0) - (a.total_achats || 0))
    .slice(0, 5)
    .map(client => ({
      name: `${client.noms} ${client.prenoms}`,
      total: client.total_achats || 0,
      commandes: client.nombre_commandes || 0
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
              {activeClients} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total des achats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total commandes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Panier Moyen</p>
                <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Par commande
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type de client</CardTitle>
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
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top clients et tendances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClients}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value as number) : value,
                    name === 'total' ? 'Total Achats' : 'Commandes'
                  ]}
                />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendance mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="nouveaux" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Nouveaux clients"
                />
                <Line 
                  type="monotone" 
                  dataKey="actifs" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Clients actifs"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientAnalytics;