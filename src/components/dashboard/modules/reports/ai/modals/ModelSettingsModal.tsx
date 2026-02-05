import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AIModelDisplay } from '@/services/AIReportsService';
import { Play, Pause } from 'lucide-react';

interface ModelSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: AIModelDisplay;
  onStartTraining: (modelId: string, epochs?: number) => void;
  onToggleStatus: (modelId: string, source: 'forecast' | 'learning') => void;
}

const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  open,
  onOpenChange,
  model,
  onStartTraining,
  onToggleStatus
}) => {
  const [epochs, setEpochs] = useState(50);

  if (!model) return null;

  const handleStartTraining = () => {
    onStartTraining(model.id, epochs);
  };

  const handleToggle = () => {
    const source = model.id.startsWith('default-') ? 'forecast' : 'learning';
    onToggleStatus(model.id, source);
  };

  const getStatusBadge = () => {
    switch (model.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'training':
        return <Badge className="bg-blue-100 text-blue-800">En entraînement</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      default:
        return <Badge variant="outline">{model.status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {model.name}
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Configuration et paramètres du modèle {model.type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations du modèle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium">{model.type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Précision</Label>
              <p className="font-medium">{model.accuracy}%</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Dernier entraînement</Label>
              <p className="font-medium">{model.lastTrained}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Epochs configurés</Label>
              <p className="font-medium">{model.epochs || 50}</p>
            </div>
          </div>

          {/* Progression si en entraînement */}
          {model.status === 'training' && model.progress !== undefined && (
            <div className="space-y-2">
              <Label>Progression de l'entraînement</Label>
              <Progress value={model.progress} className="h-3" />
              <p className="text-sm text-muted-foreground text-right">{model.progress}%</p>
            </div>
          )}

          {/* Configuration d'entraînement */}
          <div className="space-y-2">
            <Label>Nombre d'epochs pour le prochain entraînement</Label>
            <Select
              value={epochs.toString()}
              onValueChange={(value) => setEpochs(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 epochs (rapide)</SelectItem>
                <SelectItem value="50">50 epochs (standard)</SelectItem>
                <SelectItem value="100">100 epochs (approfondi)</SelectItem>
                <SelectItem value="200">200 epochs (intensif)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleToggle}
            >
              {model.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Désactiver
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activer
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleStartTraining}
              disabled={model.status === 'training'}
            >
              <Play className="h-4 w-4 mr-2" />
              {model.status === 'training' ? 'En cours...' : 'Démarrer entraînement'}
            </Button>
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

export default ModelSettingsModal;
