import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLoyaltyProgram } from '@/hooks/useLoyaltyProgram';
import { Gift, Star, Trophy, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface LoyaltyPanelProps {
  clientId: string | null;
  onApplyReward?: (rewardId: string, discount: number) => void;
}

export const LoyaltyPanel: React.FC<LoyaltyPanelProps> = ({ clientId, onApplyReward }) => {
  const { getClientLoyalty, rewards, usePoints } = useLoyaltyProgram();
  const [clientProgram, setClientProgram] = React.useState<any>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  React.useEffect(() => {
    if (clientId) {
      getClientLoyalty(clientId).then(setClientProgram);
    }
  }, [clientId, getClientLoyalty]);

  const handleApplyReward = async () => {
    if (!selectedRewardId || !clientId || !clientProgram) return;

    const reward = rewards?.find(r => r.id === selectedRewardId);
    if (!reward) return;

    try {
      await usePoints({ 
        clientId, 
        points: reward.cout_points, 
        rewardId: selectedRewardId 
      });
      toast.success('Récompense appliquée !');
      onApplyReward?.(selectedRewardId, reward.valeur || 0);
      setSelectedRewardId(null);
      getClientLoyalty(clientId).then(setClientProgram);
    } catch (error) {
      toast.error('Erreur lors de l\'application de la récompense');
    }
  };

  const availableRewards = rewards?.filter(r => 
    r.est_actif && 
    (!r.niveau_requis || (clientProgram && clientProgram.niveau_fidelite >= r.niveau_requis)) &&
    (clientProgram && clientProgram.points_actuels >= r.cout_points)
  );

  if (!clientId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sélectionnez un client pour voir ses points de fidélité
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Points du client */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Points de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">
              {clientProgram?.points_actuels || 0}
            </p>
            <p className="text-sm text-muted-foreground">points disponibles</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {clientProgram?.points_cumules || 0}
            </p>
            <p className="text-xs text-muted-foreground">points cumulés</p>
          </div>
          </div>

          {clientProgram?.niveau_fidelite && (
            <div className="mt-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <Badge variant="secondary">{clientProgram.niveau_fidelite}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Récompenses disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Récompenses Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!availableRewards || availableRewards.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucune récompense disponible pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRewardId === reward.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRewardId(reward.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{reward.nom}</h4>
                      <p className="text-sm text-muted-foreground">
                        {reward.description}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {reward.cout_points} pts
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {reward.valeur && reward.valeur > 0 && (
                        <span className="text-green-600 font-semibold">
                          -{reward.valeur} FCFA
                        </span>
                      )}
                      {reward.type_recompense && (
                        <span className="text-blue-600 font-semibold">
                          {reward.type_recompense}
                        </span>
                      )}
                    </div>
                    {reward.est_actif && (
                      <Badge variant="secondary" className="text-xs">
                        Actif
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {selectedRewardId && (
                <Button
                  onClick={handleApplyReward}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Gift className="h-4 w-4" />
                  Appliquer la Récompense
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
