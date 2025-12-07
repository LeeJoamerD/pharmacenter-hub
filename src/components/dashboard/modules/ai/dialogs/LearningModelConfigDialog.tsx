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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { LearningModel } from '@/hooks/useContinuousLearning';
import { Settings } from 'lucide-react';

interface LearningModelConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: LearningModel | null;
  onSave: (data: { id: string; updates: Partial<LearningModel> }) => void;
  onCreate?: (data: Partial<LearningModel>) => void;
  isCreating?: boolean;
}

export function LearningModelConfigDialog({
  open,
  onOpenChange,
  model,
  onSave,
  onCreate,
  isCreating = false
}: LearningModelConfigDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelType, setModelType] = useState('prediction');
  const [epochs, setEpochs] = useState(50);
  const [trainingFrequency, setTrainingFrequency] = useState('weekly');
  const [learningRate, setLearningRate] = useState(0.001);
  const [batchSize, setBatchSize] = useState(32);

  useEffect(() => {
    if (model && !isCreating) {
      setName(model.name);
      setDescription(model.description || '');
      setModelType(model.model_type);
      setEpochs(model.epochs);
      setTrainingFrequency(model.training_frequency);
      const hp = model.hyperparameters as Record<string, number>;
      setLearningRate(hp?.learning_rate || 0.001);
      setBatchSize(hp?.batch_size || 32);
    } else {
      setName('');
      setDescription('');
      setModelType('prediction');
      setEpochs(50);
      setTrainingFrequency('weekly');
      setLearningRate(0.001);
      setBatchSize(32);
    }
  }, [model, isCreating, open]);

  const handleSubmit = () => {
    const data = {
      name,
      description,
      model_type: modelType,
      epochs,
      training_frequency: trainingFrequency,
      hyperparameters: {
        learning_rate: learningRate,
        batch_size: batchSize
      }
    };

    if (isCreating && onCreate) {
      onCreate(data);
    } else if (model) {
      onSave({ id: model.id, updates: data });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isCreating ? 'Nouveau Modèle' : 'Configuration du Modèle'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Créez un nouveau modèle d\'apprentissage'
              : 'Modifiez les hyperparamètres et la configuration du modèle'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du modèle</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prédiction des ventes"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du modèle..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de modèle</Label>
              <Select value={modelType} onValueChange={setModelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prediction">Prédiction</SelectItem>
                  <SelectItem value="classification">Classification</SelectItem>
                  <SelectItem value="clustering">Clustering</SelectItem>
                  <SelectItem value="regression">Régression</SelectItem>
                  <SelectItem value="anomaly">Détection d'anomalies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fréquence d'entraînement</Label>
              <Select value={trainingFrequency} onValueChange={setTrainingFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre d'epochs: {epochs}</Label>
            <Slider
              value={[epochs]}
              onValueChange={([value]) => setEpochs(value)}
              min={10}
              max={200}
              step={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Learning Rate</Label>
              <Select 
                value={learningRate.toString()} 
                onValueChange={(v) => setLearningRate(parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1</SelectItem>
                  <SelectItem value="0.01">0.01</SelectItem>
                  <SelectItem value="0.001">0.001</SelectItem>
                  <SelectItem value="0.0001">0.0001</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch Size</Label>
              <Select 
                value={batchSize.toString()} 
                onValueChange={(v) => setBatchSize(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                  <SelectItem value="64">64</SelectItem>
                  <SelectItem value="128">128</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {isCreating ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
