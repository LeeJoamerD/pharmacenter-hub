import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThumbsUp, ThumbsDown, Trash2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SentimentKeyword } from '@/hooks/useSentimentAnalysis';

interface KeywordConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword: SentimentKeyword | null;
  onUpdateImpact: (id: string, impact: 'low' | 'medium' | 'high') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const impactLabels: Record<string, { label: string; colorClass: string }> = {
  'low': { label: 'Faible', colorClass: 'bg-blue-50 text-blue-600' },
  'medium': { label: 'Moyen', colorClass: 'bg-orange-50 text-orange-600' },
  'high': { label: 'Élevé', colorClass: 'bg-red-50 text-red-600' }
};

const KeywordConfigDialog: React.FC<KeywordConfigDialogProps> = ({
  open,
  onOpenChange,
  keyword,
  onUpdateImpact,
  onDelete
}) => {
  const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (keyword) {
      setImpact(keyword.impact);
    }
  }, [keyword]);

  if (!keyword) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdateImpact(keyword.id, impact);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(keyword.id);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Configuration du Mot-clé
          </DialogTitle>
          <DialogDescription>
            Modifier l'impact du mot-clé sur l'analyse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Keyword Info */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold">"{keyword.word}"</span>
              {keyword.sentiment === 'positive' ? (
                <Badge className="bg-green-50 text-green-600">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Positif
                </Badge>
              ) : (
                <Badge className="bg-red-50 text-red-600">
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Négatif
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>Fréquence: <span className="font-medium text-foreground">{keyword.frequency}</span></div>
              <div>Dernière détection: <span className="font-medium text-foreground">
                {format(new Date(keyword.last_detected_at), 'dd/MM/yyyy', { locale: fr })}
              </span></div>
            </div>
          </div>

          {/* Impact Selection */}
          <div className="space-y-2">
            <Label>Niveau d'Impact</Label>
            <Select value={impact} onValueChange={(v) => setImpact(v as 'low' | 'medium' | 'high')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    Faible - Peu d'influence sur le score
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    Moyen - Influence modérée
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    Élevé - Forte influence sur le score
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              L'impact détermine l'importance de ce mot-clé dans le calcul du sentiment global.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KeywordConfigDialog;
