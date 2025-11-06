import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Gift, Percent, DollarSign } from 'lucide-react';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { useCurrency } from '@/contexts/CurrencyContext';

const RewardsTab = () => {
  const { rewards, rewardsLoading } = useLoyaltyProgram();
  const { formatPrice } = useCurrency();

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'Remise':
        return <Percent className="h-5 w-5 text-green-600" />;
      case 'Produit gratuit':
        return <Gift className="h-5 w-5 text-purple-600" />;
      case 'Cashback':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };

  if (rewardsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Récompense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards?.map((reward: any) => (
          <Card key={reward.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getRewardIcon(reward.type_recompense)}
                  <CardTitle className="text-base">{reward.nom}</CardTitle>
                </div>
                <Switch defaultChecked={reward.est_actif} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{reward.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Coût en points:</span>
                  <Badge variant="secondary" className="font-mono">
                    {reward.cout_points} pts
                  </Badge>
                </div>

                {reward.valeur && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valeur:</span>
                    <span className="text-sm font-medium">
                      {reward.type_recompense === 'Remise'
                        ? `${reward.valeur}%`
                        : formatPrice(reward.valeur)}
                    </span>
                  </div>
                )}

                {reward.niveau_requis && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Niveau requis:</span>
                    <Badge variant="outline">{reward.niveau_requis}</Badge>
                  </div>
                )}

                {reward.stock_disponible !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock:</span>
                    <span className="text-sm font-medium">{reward.stock_disponible}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full">
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!rewards || rewards.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune récompense disponible</p>
              <p className="text-sm text-muted-foreground mb-4">
                Créez des récompenses pour fidéliser vos clients
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer une récompense
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RewardsTab;
