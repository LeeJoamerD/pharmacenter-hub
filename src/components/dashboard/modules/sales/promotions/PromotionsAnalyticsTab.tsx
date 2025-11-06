import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { usePromotions } from '@/hooks/usePromotions';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { useCurrency } from '@/contexts/CurrencyContext';

const PromotionsAnalyticsTab = () => {
  const { promotions, statistics: promoStats, promotionUsages } = usePromotions();
  const { statistics: loyaltyStats } = useLoyaltyProgram();
  const { formatPrice } = useCurrency();
  const [period, setPeriod] = useState('month');

  return (
    <div className="space-y-6">
      {/* Filtres de période */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analyse des Performances</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoStats?.totalUsages || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{promoStats?.monthlyUsages || 0} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remises Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(promoStats?.totalRemises || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Économies clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Fidélité</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyaltyStats?.actifs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {loyaltyStats?.total || 0} membres totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoStats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Promotions utilisées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau de performance des promotions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions?.slice(0, 10).map((promo: any) => {
                const usageRate = promo.limite_utilisations
                  ? (promo.nombre_utilisations / promo.limite_utilisations) * 100
                  : 0;

                return (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{promo.nom}</p>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{promo.type_promotion}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{promo.nombre_utilisations}</TableCell>
                    <TableCell>{promo.limite_utilisations || '∞'}</TableCell>
                    <TableCell>
                      <span className={usageRate > 80 ? 'text-green-600 font-medium' : ''}>
                        {usageRate.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.est_actif ? "default" : "secondary"}>
                        {promo.est_actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!promotions || promotions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucune donnée disponible
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Distribution par niveaux de fidélité */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution par Niveaux de Fidélité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-100 text-purple-800">Platinum</Badge>
                <span className="text-sm text-muted-foreground">{loyaltyStats?.platinum || 0} membres</span>
              </div>
              <span className="font-medium">{formatPrice((loyaltyStats?.platinum || 0) * 2100000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>
                <span className="text-sm text-muted-foreground">{loyaltyStats?.gold || 0} membres</span>
              </div>
              <span className="font-medium">{formatPrice((loyaltyStats?.gold || 0) * 1425000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-gray-100 text-gray-800">Silver</Badge>
                <span className="text-sm text-muted-foreground">{loyaltyStats?.silver || 0} membres</span>
              </div>
              <span className="font-medium">{formatPrice((loyaltyStats?.silver || 0) * 620000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-orange-100 text-orange-800">Bronze</Badge>
                <span className="text-sm text-muted-foreground">{loyaltyStats?.bronze || 0} membres</span>
              </div>
              <span className="font-medium">{formatPrice((loyaltyStats?.bronze || 0) * 250000)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionsAnalyticsTab;
