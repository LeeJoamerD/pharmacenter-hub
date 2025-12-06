import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Cloud, Plus, Save } from 'lucide-react';
import type { InfluentialFactor } from '@/hooks/useAdvancedForecasting';

interface AddFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (factor: Omit<InfluentialFactor, 'id'>) => void;
  editingFactor?: InfluentialFactor | null;
}

const AddFactorDialog: React.FC<AddFactorDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  editingFactor
}) => {
  const [formData, setFormData] = useState({
    factor_name: '',
    description: '',
    influence_score: 50,
    trend_type: 'positive' as 'positive' | 'negative' | 'cyclical' | 'spike' | 'controlled' | 'variable',
    is_active: true,
    weight: 1.0,
    data_source: 'manual'
  });

  useEffect(() => {
    if (editingFactor) {
      setFormData({
        factor_name: editingFactor.factor_name,
        description: editingFactor.description || '',
        influence_score: editingFactor.influence_score,
        trend_type: editingFactor.trend_type,
        is_active: editingFactor.is_active,
        weight: editingFactor.weight,
        data_source: editingFactor.data_source
      });
    } else {
      setFormData({
        factor_name: '',
        description: '',
        influence_score: 50,
        trend_type: 'positive',
        is_active: true,
        weight: 1.0,
        data_source: 'manual'
      });
    }
  }, [editingFactor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const trendTypes = [
    { value: 'positive', label: 'Positif' },
    { value: 'negative', label: 'Négatif' },
    { value: 'cyclical', label: 'Cyclique' },
    { value: 'spike', label: 'Pic' },
    { value: 'controlled', label: 'Contrôlé' },
    { value: 'variable', label: 'Variable' }
  ];

  const dataSources = [
    { value: 'manual', label: 'Saisie manuelle' },
    { value: 'internal', label: 'Données internes' },
    { value: 'weather_api', label: 'API Météo' },
    { value: 'events_api', label: 'API Événements' },
    { value: 'external', label: 'Source externe' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            {editingFactor ? 'Modifier le Facteur' : 'Ajouter un Facteur Influent'}
          </DialogTitle>
          <DialogDescription>
            Les facteurs influents affectent les prévisions IA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="factor_name">Nom du facteur *</Label>
            <Input
              id="factor_name"
              value={formData.factor_name}
              onChange={(e) => setFormData(prev => ({ ...prev, factor_name: e.target.value }))}
              placeholder="Ex: Épidémie grippe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'impact du facteur..."
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Score d'influence</Label>
              <span className="text-sm font-bold">{formData.influence_score}%</span>
            </div>
            <Slider
              value={[formData.influence_score]}
              onValueChange={(value) => setFormData(prev => ({ ...prev, influence_score: value[0] }))}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Impact estimé de ce facteur sur les prévisions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de tendance</Label>
              <Select
                value={formData.trend_type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  trend_type: value as typeof formData.trend_type 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trendTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source de données</Label>
              <Select
                value={formData.data_source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, data_source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Poids du facteur</Label>
              <span className="text-sm font-bold">{formData.weight.toFixed(1)}x</span>
            </div>
            <Slider
              value={[formData.weight * 10]}
              onValueChange={(value) => setFormData(prev => ({ ...prev, weight: value[0] / 10 }))}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Multiplicateur appliqué à l'influence
            </p>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="is_active">Facteur actif</Label>
              <p className="text-xs text-muted-foreground">
                Les facteurs inactifs ne sont pas pris en compte
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {editingFactor ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFactorDialog;
