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
import { Brain, Loader2 } from 'lucide-react';

interface AddFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string, source: string, category?: string) => Promise<void>;
  isLoading?: boolean;
  categories?: string[];
  sources?: string[];
}

const defaultCategories = ['service', 'produits', 'prix', 'conseil', 'horaires', 'digital'];
const defaultSources = ['google_reviews', 'facebook', 'email', 'enquete', 'manual'];

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

const AddFeedbackDialog: React.FC<AddFeedbackDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  categories = defaultCategories,
  sources = defaultSources
}) => {
  const [text, setText] = useState('');
  const [source, setSource] = useState('manual');
  const [category, setCategory] = useState<string>('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    await onSubmit(text, source, category || undefined);
    
    // Reset form
    setText('');
    setSource('manual');
    setCategory('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ajouter un Feedback
          </DialogTitle>
          <DialogDescription>
            Saisissez un commentaire client à analyser par l'IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-text">Texte du feedback</Label>
            <Textarea
              id="feedback-text"
              placeholder="Saisissez le commentaire client ici..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s} value={s}>
                      {sourceLabels[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie (optionnel)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>
                      {categoryLabels[c] || c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!text.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyser
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFeedbackDialog;
