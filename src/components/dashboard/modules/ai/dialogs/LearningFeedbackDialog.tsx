import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LearningModel, LearningFeedback } from '@/hooks/useContinuousLearning';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface LearningFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: LearningModel[];
  onSubmit: (data: Partial<LearningFeedback>) => void;
  userName?: string;
}

export function LearningFeedbackDialog({
  open,
  onOpenChange,
  models,
  onSubmit,
  userName = 'Utilisateur'
}: LearningFeedbackDialogProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'positive' | 'mixed' | 'negative'>('positive');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    const selectedModel = models.find(m => m.id === selectedModelId);
    
    onSubmit({
      model_id: selectedModelId || undefined,
      model_name: selectedModel?.name || 'Modèle général',
      feedback_type: feedbackType,
      comment,
      user_name: userName,
      accuracy_before: selectedModel?.accuracy
    });

    // Reset form
    setSelectedModelId('');
    setFeedbackType('positive');
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ajouter un Feedback
          </DialogTitle>
          <DialogDescription>
            Partagez votre retour pour améliorer les performances des modèles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Modèle concerné</Label>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un modèle (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Général</SelectItem>
                {models.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.accuracy}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de feedback</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={feedbackType === 'positive' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setFeedbackType('positive')}
              >
                <ThumbsUp className={`h-5 w-5 ${feedbackType === 'positive' ? 'text-white' : 'text-green-600'}`} />
                <span className="text-xs">Positif</span>
              </Button>
              <Button
                type="button"
                variant={feedbackType === 'mixed' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setFeedbackType('mixed')}
              >
                <Minus className={`h-5 w-5 ${feedbackType === 'mixed' ? 'text-white' : 'text-orange-600'}`} />
                <span className="text-xs">Mitigé</span>
              </Button>
              <Button
                type="button"
                variant={feedbackType === 'negative' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setFeedbackType('negative')}
              >
                <ThumbsDown className={`h-5 w-5 ${feedbackType === 'negative' ? 'text-white' : 'text-red-600'}`} />
                <span className="text-xs">Négatif</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience avec ce modèle..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!comment.trim()}>
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
