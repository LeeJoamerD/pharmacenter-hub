import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Users, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PredictionSegment {
  segment: string;
  totalClients: number;
  riskHigh: number;
  riskMedium: number;
  riskLow: number;
  averageLTV: number;
  retentionRate: number;
}

interface PredictionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prediction: PredictionSegment | null;
}

export const PredictionDetailDialog: React.FC<PredictionDetailDialogProps> = ({
  open,
  onOpenChange,
  prediction
}) => {
  if (!prediction) return null;

  const riskDistribution = [
    { label: 'Risque Élevé', value: prediction.riskHigh, color: 'bg-red-500' },
    { label: 'Risque Moyen', value: prediction.riskMedium, color: 'bg-orange-500' },
    { label: 'Risque Faible', value: prediction.riskLow, color: 'bg-green-500' },
  ];

  const getRecommendations = (segment: string, riskHigh: number) => {
    const recs = [];
    if (segment === 'Premium') {
      recs.push('Maintenir le programme VIP actif');
      recs.push('Proposer des offres exclusives');
    } else if (segment === 'Régulier') {
      recs.push('Campagne de fidélisation ciblée');
      recs.push('Offres de montée en gamme');
    } else {
      recs.push('Programme d\'onboarding personnalisé');
      recs.push('Remises première commande');
    }
    if (riskHigh > 10) {
      recs.push('⚠️ Action urgente: Campagne de réactivation');
    }
    return recs;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Détails Segment: {prediction.segment}
          </DialogTitle>
          <DialogDescription>
            Analyse prédictive détaillée du segment client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{prediction.totalClients}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{prediction.retentionRate}%</div>
                <div className="text-sm text-muted-foreground">Rétention</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{prediction.riskHigh}</div>
                <div className="text-sm text-muted-foreground">À risque élevé</div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium">Distribution des risques</h4>
            {riskDistribution.map((risk) => (
              <div key={risk.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{risk.label}</span>
                  <span>{risk.value} clients ({prediction.totalClients > 0 ? Math.round((risk.value / prediction.totalClients) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${risk.color}`}
                    style={{ width: `${prediction.totalClients > 0 ? (risk.value / prediction.totalClients) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* LTV */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">LTV Moyenne du Segment</span>
              <span className="text-xl font-bold text-primary">
                {prediction.averageLTV.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="font-medium">Actions Recommandées</h4>
            <ul className="space-y-2">
              {getRecommendations(prediction.segment, prediction.riskHigh).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
