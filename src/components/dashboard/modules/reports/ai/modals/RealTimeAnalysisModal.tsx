import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RealTimeAnalysisDisplay } from '@/services/AIReportsService';
import { TrendingUp, TrendingDown, Minus, Activity, Users, DollarSign, AlertTriangle } from 'lucide-react';

interface RealTimeAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis?: RealTimeAnalysisDisplay;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
};

const RealTimeAnalysisModal: React.FC<RealTimeAnalysisModalProps> = ({
  open,
  onOpenChange,
  analysis
}) => {
  if (!analysis) return null;

  const IconComponent = ICON_MAP[analysis.icon] || Activity;

  const getTrendIcon = () => {
    if (analysis.trend.startsWith('+')) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (analysis.trend.startsWith('-')) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = () => {
    if (analysis.status === 'Positif' || analysis.status === 'Optimal' || analysis.status === 'Normal') {
      return 'bg-green-100 text-green-800';
    } else if (analysis.status === 'Alerte' || analysis.status === 'Critique') {
      return 'bg-red-100 text-red-800';
    } else if (analysis.status === 'Pic Attendu') {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getAnalysisDetails = () => {
    switch (analysis.analysisType) {
      case 'sentiment':
        return {
          title: 'Analyse de Sentiment Client',
          description: 'Mesure la satisfaction globale des clients basée sur leurs interactions et achats.',
          metrics: [
            { label: 'Score moyen', value: `${analysis.score}/5`, progress: (analysis.score / 5) * 100 },
            { label: 'Tendance', value: analysis.trend },
          ],
          insights: [
            'Basé sur la fréquence d\'achats des clients',
            'Analyse des produits préférés',
            'Taux de retour et réclamations'
          ]
        };
      case 'pricing':
        return {
          title: 'Optimisation Pricing',
          description: 'Évalue l\'efficacité de votre stratégie de prix par rapport au marché.',
          metrics: [
            { label: 'Score d\'optimisation', value: `${analysis.score}%`, progress: analysis.score },
            { label: 'Amélioration', value: analysis.trend },
          ],
          insights: [
            'Marges optimisées sur les produits clés',
            'Prix compétitifs sur le marché local',
            'Opportunités de promotions identifiées'
          ]
        };
      case 'flux':
        return {
          title: 'Prévision Flux Client',
          description: 'Prédit l\'affluence client basée sur les historiques et tendances.',
          metrics: [
            { label: 'Clients aujourd\'hui', value: analysis.score.toString() },
            { label: 'Variation', value: analysis.trend },
          ],
          insights: [
            'Prédiction basée sur les ventes récentes',
            'Corrélation avec les jours de la semaine',
            'Impact des événements locaux'
          ]
        };
      case 'fraud':
        return {
          title: 'Détection de Fraude',
          description: 'Surveille les transactions suspectes et anomalies comportementales.',
          metrics: [
            { label: 'Taux d\'anomalie', value: `${(analysis.score * 100).toFixed(2)}%` },
            { label: 'Variation', value: analysis.trend },
          ],
          insights: [
            'Surveillance des transactions inhabituelles',
            'Détection de patterns suspects',
            'Alertes en temps réel'
          ]
        };
      default:
        return {
          title: analysis.title,
          description: 'Analyse en temps réel',
          metrics: [
            { label: 'Score', value: analysis.score.toString() },
            { label: 'Tendance', value: analysis.trend },
          ],
          insights: []
        };
    }
  };

  const details = getAnalysisDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${analysis.color}`} />
            {details.title}
          </DialogTitle>
          <DialogDescription>
            {details.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Statut actuel */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor()}>
                {analysis.status}
              </Badge>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className="text-sm font-medium">{analysis.trend}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{analysis.score}</p>
              <p className="text-xs text-muted-foreground">Score actuel</p>
            </div>
          </div>

          {/* Métriques détaillées */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Métriques</h4>
            {details.metrics.map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <div className="flex items-center gap-2">
                  {metric.progress !== undefined && (
                    <Progress value={metric.progress} className="w-20 h-2" />
                  )}
                  <span className="font-medium">{metric.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          {details.insights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Facteurs analysés</h4>
              <ul className="space-y-2">
                {details.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Note de mise à jour */}
          <div className="text-xs text-muted-foreground text-center">
            Mise à jour en temps réel • Rafraîchi automatiquement toutes les 5 minutes
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RealTimeAnalysisModal;
