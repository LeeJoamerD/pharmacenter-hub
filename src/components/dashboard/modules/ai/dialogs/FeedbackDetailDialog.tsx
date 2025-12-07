import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smile, 
  ThumbsUp, 
  Meh, 
  ThumbsDown, 
  Frown,
  Calendar,
  Tag,
  Globe,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SentimentAnalysis } from '@/hooks/useSentimentAnalysis';

interface FeedbackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: SentimentAnalysis | null;
  onDelete?: (id: string) => void;
}

const sentimentConfig: Record<string, { label: string; icon: React.ReactNode; colorClass: string }> = {
  'very_positive': { 
    label: 'Très Positif', 
    icon: <Smile className="h-6 w-6 text-green-600" />,
    colorClass: 'bg-green-50 text-green-700 border-green-200'
  },
  'positive': { 
    label: 'Positif', 
    icon: <ThumbsUp className="h-6 w-6 text-green-500" />,
    colorClass: 'bg-green-50 text-green-600 border-green-200'
  },
  'neutral': { 
    label: 'Neutre', 
    icon: <Meh className="h-6 w-6 text-gray-500" />,
    colorClass: 'bg-gray-50 text-gray-600 border-gray-200'
  },
  'negative': { 
    label: 'Négatif', 
    icon: <ThumbsDown className="h-6 w-6 text-orange-500" />,
    colorClass: 'bg-orange-50 text-orange-600 border-orange-200'
  },
  'very_negative': { 
    label: 'Très Négatif', 
    icon: <Frown className="h-6 w-6 text-red-600" />,
    colorClass: 'bg-red-50 text-red-600 border-red-200'
  }
};

const sourceLabels: Record<string, string> = {
  'google_reviews': 'Google Reviews',
  'facebook': 'Facebook',
  'email': 'Email',
  'enquete': 'Enquête',
  'manual': 'Saisie manuelle'
};

const categoryLabels: Record<string, string> = {
  'service': 'Service Client',
  'produits': 'Produits',
  'prix': 'Prix',
  'conseil': 'Conseil Pharmaceutique',
  'horaires': 'Horaires',
  'digital': 'Digital/Site'
};

const FeedbackDetailDialog: React.FC<FeedbackDetailDialogProps> = ({
  open,
  onOpenChange,
  analysis,
  onDelete
}) => {
  if (!analysis) return null;

  const config = sentimentConfig[analysis.sentiment] || sentimentConfig['neutral'];
  const scorePercentage = Math.round(analysis.score * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Détails de l'Analyse</DialogTitle>
          <DialogDescription>
            Analyse de sentiment effectuée le {format(new Date(analysis.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sentiment Badge */}
          <div className={`p-4 rounded-lg border ${config.colorClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.icon}
                <div>
                  <div className="font-semibold text-lg">{config.label}</div>
                  <div className="text-sm opacity-80">Score de confiance: {scorePercentage}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{scorePercentage}%</div>
              </div>
            </div>
            <Progress value={scorePercentage} className="mt-3 h-2" />
          </div>

          {/* Original Text */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Texte analysé</h4>
            <p className="text-sm p-3 bg-muted rounded-lg italic">"{analysis.text}"</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">Source: </span>
                {sourceLabels[analysis.source] || analysis.source}
              </span>
            </div>
            {analysis.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Catégorie: </span>
                  {categoryLabels[analysis.category] || analysis.category}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(analysis.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </span>
            </div>
          </div>

          {/* Emotions */}
          {analysis.emotions && analysis.emotions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Émotions détectées</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.emotions.map((emotion, index) => (
                  <Badge key={index} variant="secondary">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Mots-clés identifiés</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                onDelete(analysis.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDetailDialog;
