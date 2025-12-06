import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, X } from 'lucide-react';
import type { PharmacySpecialty } from '@/hooks/useNetworkPharmaTools';

interface CreateSpecialtyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (specialty: Partial<PharmacySpecialty>) => Promise<void>;
  editingSpecialty?: PharmacySpecialty | null;
}

export const CreateSpecialtyDialog: React.FC<CreateSpecialtyDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  editingSpecialty
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [patientDemographics, setPatientDemographics] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [protocols, setProtocols] = useState<string[]>([]);
  const [newProtocol, setNewProtocol] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');
  const [staffRequirements, setStaffRequirements] = useState<string[]>([]);
  const [newStaff, setNewStaff] = useState('');
  const [isNetworkShared, setIsNetworkShared] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingSpecialty) {
      setName(editingSpecialty.name);
      setDescription(editingSpecialty.description || '');
      setPatientDemographics(editingSpecialty.patient_demographics || '');
      setCertifications(editingSpecialty.certifications || []);
      setProtocols(editingSpecialty.protocols || []);
      setEquipment(editingSpecialty.equipment || []);
      setStaffRequirements(editingSpecialty.staff_requirements || []);
      setIsNetworkShared(editingSpecialty.is_network_shared || false);
    } else {
      resetForm();
    }
  }, [editingSpecialty, open]);

  const handleAddItem = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    listSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value.trim()) {
      listSetter([...list, value.trim()]);
      setter('');
    }
  };

  const handleRemoveItem = (
    index: number,
    list: string[],
    listSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    listSetter(list.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name) return;

    setLoading(true);
    try {
      await onSubmit({
        name,
        description,
        patient_demographics: patientDemographics,
        certifications,
        protocols,
        equipment,
        staff_requirements: staffRequirements,
        is_network_shared: isNetworkShared
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPatientDemographics('');
    setCertifications([]);
    setProtocols([]);
    setEquipment([]);
    setStaffRequirements([]);
    setIsNetworkShared(false);
  };

  const ArrayInputField: React.FC<{
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    items: string[];
    onAdd: () => void;
    onRemove: (index: number) => void;
  }> = ({ label, placeholder, value, onChange, items, onAdd, onRemove }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        />
        <Button type="button" variant="outline" size="icon" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
              {item}
              <button onClick={() => onRemove(idx)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            {editingSpecialty ? 'Modifier la spécialité' : 'Nouvelle spécialité pharmaceutique'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de la spécialité *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Oncologie, Pédiatrie, Gériatrie..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez cette spécialité..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Patients concernés</Label>
            <Input
              value={patientDemographics}
              onChange={(e) => setPatientDemographics(e.target.value)}
              placeholder="Ex: Patients cancéreux, enfants 0-18 ans..."
            />
          </div>

          <ArrayInputField
            label="Certifications requises"
            placeholder="Diplôme, formation..."
            value={newCertification}
            onChange={setNewCertification}
            items={certifications}
            onAdd={() => handleAddItem(newCertification, setNewCertification, certifications, setCertifications)}
            onRemove={(idx) => handleRemoveItem(idx, certifications, setCertifications)}
          />

          <ArrayInputField
            label="Protocoles"
            placeholder="Protocole à suivre..."
            value={newProtocol}
            onChange={setNewProtocol}
            items={protocols}
            onAdd={() => handleAddItem(newProtocol, setNewProtocol, protocols, setProtocols)}
            onRemove={(idx) => handleRemoveItem(idx, protocols, setProtocols)}
          />

          <ArrayInputField
            label="Équipement nécessaire"
            placeholder="Équipement..."
            value={newEquipment}
            onChange={setNewEquipment}
            items={equipment}
            onAdd={() => handleAddItem(newEquipment, setNewEquipment, equipment, setEquipment)}
            onRemove={(idx) => handleRemoveItem(idx, equipment, setEquipment)}
          />

          <ArrayInputField
            label="Personnel requis"
            placeholder="Type de personnel..."
            value={newStaff}
            onChange={setNewStaff}
            items={staffRequirements}
            onAdd={() => handleAddItem(newStaff, setNewStaff, staffRequirements, setStaffRequirements)}
            onRemove={(idx) => handleRemoveItem(idx, staffRequirements, setStaffRequirements)}
          />

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label>Partager avec le réseau</Label>
              <p className="text-xs text-muted-foreground">
                Rendre cette spécialité visible aux autres pharmacies
              </p>
            </div>
            <Switch checked={isNetworkShared} onCheckedChange={setIsNetworkShared} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!name || loading}>
            {loading ? 'Enregistrement...' : editingSpecialty ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSpecialtyDialog;
