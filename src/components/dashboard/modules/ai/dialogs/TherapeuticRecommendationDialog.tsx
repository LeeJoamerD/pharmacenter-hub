import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, X } from 'lucide-react';
import type { TherapeuticRecommendation } from '@/hooks/usePharmaceuticalExpert';

interface TherapeuticRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation?: TherapeuticRecommendation | null;
  onSave: (data: Partial<TherapeuticRecommendation>) => Promise<void>;
}

const TherapeuticRecommendationDialog: React.FC<TherapeuticRecommendationDialogProps> = ({
  open,
  onOpenChange,
  recommendation,
  onSave
}) => {
  const [formData, setFormData] = useState({
    condition_name: '',
    condition_category: '',
    first_line_treatments: [] as { name: string; dosage: string }[],
    alternative_treatments: [] as { name: string; dosage: string }[],
    contraindications: '',
    duration: '',
    monitoring: '',
    evidence_level: '',
    source_guidelines: [] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [newFirstLine, setNewFirstLine] = useState({ name: '', dosage: '' });
  const [newAlternative, setNewAlternative] = useState({ name: '', dosage: '' });

  useEffect(() => {
    if (recommendation) {
      setFormData({
        condition_name: recommendation.condition_name,
        condition_category: recommendation.condition_category || '',
        first_line_treatments: recommendation.first_line_treatments || [],
        alternative_treatments: recommendation.alternative_treatments || [],
        contraindications: recommendation.contraindications || '',
        duration: recommendation.duration || '',
        monitoring: recommendation.monitoring || '',
        evidence_level: recommendation.evidence_level || '',
        source_guidelines: recommendation.source_guidelines || []
      });
    } else {
      setFormData({
        condition_name: '',
        condition_category: '',
        first_line_treatments: [],
        alternative_treatments: [],
        contraindications: '',
        duration: '',
        monitoring: '',
        evidence_level: '',
        source_guidelines: []
      });
    }
  }, [recommendation, open]);

  const handleSave = async () => {
    if (!formData.condition_name.trim()) return;
    
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const addFirstLineTreatment = () => {
    if (!newFirstLine.name.trim()) return;
    setFormData({
      ...formData,
      first_line_treatments: [...formData.first_line_treatments, newFirstLine]
    });
    setNewFirstLine({ name: '', dosage: '' });
  };

  const removeFirstLineTreatment = (index: number) => {
    setFormData({
      ...formData,
      first_line_treatments: formData.first_line_treatments.filter((_, i) => i !== index)
    });
  };

  const addAlternativeTreatment = () => {
    if (!newAlternative.name.trim()) return;
    setFormData({
      ...formData,
      alternative_treatments: [...formData.alternative_treatments, newAlternative]
    });
    setNewAlternative({ name: '', dosage: '' });
  };

  const removeAlternativeTreatment = (index: number) => {
    setFormData({
      ...formData,
      alternative_treatments: formData.alternative_treatments.filter((_, i) => i !== index)
    });
  };

  const categories = [
    'Douleur',
    'Infection',
    'Allergie',
    'Cardiovasculaire',
    'Digestif',
    'Respiratoire',
    'Dermatologie',
    'Neurologie',
    'Autre'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {recommendation ? 'Modifier la Recommandation' : 'Nouvelle Recommandation'}
          </DialogTitle>
          <DialogDescription>
            Définissez une recommandation thérapeutique basée sur les guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition / Pathologie *</Label>
              <Input
                id="condition"
                placeholder="Ex: Douleur légère à modérée"
                value={formData.condition_name}
                onChange={(e) => setFormData({ ...formData, condition_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.condition_category}
                onValueChange={(value) => setFormData({ ...formData, condition_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* First Line Treatments */}
          <div className="space-y-3">
            <Label>Traitements de 1ère Intention</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.first_line_treatments.map((t, index) => (
                <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                  {t.name} {t.dosage && `(${t.dosage})`}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeFirstLineTreatment(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du médicament"
                value={newFirstLine.name}
                onChange={(e) => setNewFirstLine({ ...newFirstLine, name: e.target.value })}
              />
              <Input
                placeholder="Posologie"
                value={newFirstLine.dosage}
                onChange={(e) => setNewFirstLine({ ...newFirstLine, dosage: e.target.value })}
              />
              <Button type="button" size="icon" onClick={addFirstLineTreatment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Alternative Treatments */}
          <div className="space-y-3">
            <Label>Traitements Alternatifs</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.alternative_treatments.map((t, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                  {t.name} {t.dosage && `(${t.dosage})`}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => removeAlternativeTreatment(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du médicament"
                value={newAlternative.name}
                onChange={(e) => setNewAlternative({ ...newAlternative, name: e.target.value })}
              />
              <Input
                placeholder="Posologie"
                value={newAlternative.dosage}
                onChange={(e) => setNewAlternative({ ...newAlternative, dosage: e.target.value })}
              />
              <Button type="button" size="icon" onClick={addAlternativeTreatment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraindications">Contre-indications</Label>
            <Textarea
              id="contraindications"
              placeholder="Ex: AINS si ulcère, insuffisance rénale..."
              value={formData.contraindications}
              onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durée du traitement</Label>
              <Input
                id="duration"
                placeholder="Ex: 3-5 jours max sans avis médical"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Niveau de Preuve</Label>
              <Select
                value={formData.evidence_level}
                onValueChange={(value) => setFormData({ ...formData, evidence_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Preuves solides</SelectItem>
                  <SelectItem value="B">B - Preuves modérées</SelectItem>
                  <SelectItem value="C">C - Preuves faibles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monitoring">Points de Surveillance</Label>
            <Textarea
              id="monitoring"
              placeholder="Ex: Évaluer efficacité à 48h..."
              value={formData.monitoring}
              onChange={(e) => setFormData({ ...formData, monitoring: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.condition_name.trim()}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TherapeuticRecommendationDialog;
