import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Clock,
  Target 
} from 'lucide-react';

const SalesDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Journalier</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 250 FCFA</div>
            <p className="text-xs text-muted-foreground">
              +20.1% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +7 depuis ce matin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 890 FCFA</div>
            <p className="text-xs text-muted-foreground">
              -4% par rapport à la moyenne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif Mensuel</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              680k FCFA / 1M FCFA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* État des caisses et actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              État des Caisses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Caisse 1 - Principal</p>
                  <p className="text-sm text-muted-foreground">Ouverte depuis 08:00</p>
                </div>
                <div className="text-right">
                  <Badge variant="default">Ouverte</Badge>
                  <p className="text-sm font-medium mt-1">45 250 FCFA</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Caisse 2 - Secondaire</p>
                  <p className="text-sm text-muted-foreground">Fermée</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">Fermée</Badge>
                  <p className="text-sm font-medium mt-1">0 FCFA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes & Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>3 factures en attente</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Ventes en hausse (+15%)</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Réconciliation à faire</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { numero: 'VT-2024-001', client: 'Client Ordinaire', montant: '12 500 FCFA', heure: '14:35' },
              { numero: 'VT-2024-002', client: 'Jean Dupont', montant: '8 750 FCFA', heure: '14:28' },
              { numero: 'VT-2024-003', client: 'Marie Kouakou', montant: '15 200 FCFA', heure: '14:15' },
              { numero: 'VT-2024-004', client: 'Client Assuré', montant: '22 100 FCFA', heure: '14:08' },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{transaction.numero}</p>
                  <p className="text-sm text-muted-foreground">{transaction.client}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{transaction.montant}</p>
                  <p className="text-sm text-muted-foreground">{transaction.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesDashboard;