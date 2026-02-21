/**
 * Modal pour saisir les détails du bénéficiaire lors d'une vente en bon
 */
import React, { useState, useEffect } from 'react';
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
import { ClipboardList } from 'lucide-react';

export interface BeneficiaryDetails {
  nom_beneficiaire: string;
  lien: string;
  matricule_agent: string;
  matricule_patient: string;
  numero_police: string;
  numero_bon: string;
  type_piece: string;
  reference_piece: string;
  telephone_agent: string;
  adresse_agent: string;
  medecin_traitant: string;
}

export const emptyBeneficiaryDetails: BeneficiaryDetails = {
  nom_beneficiaire: '',
  lien: '',
  matricule_agent: '',
  matricule_patient: '',
  numero_police: '',
  numero_bon: '',
  type_piece: '',
  reference_piece: '',
  telephone_agent: '',
  adresse_agent: '',
  medecin_traitant: '',
};

interface BeneficiaryDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  details: BeneficiaryDetails;
  onSave: (details: BeneficiaryDetails) => void;
}

const BeneficiaryDetailsModal: React.FC<BeneficiaryDetailsModalProps> = ({
  open,
  onOpenChange,
  clientName,
  details,
  onSave,
}) => {
  const [form, setForm] = useState<BeneficiaryDetails>(details);

  useEffect(() => {
    if (open) {
      setForm({
        ...details,
        nom_beneficiaire: details.nom_beneficiaire || clientName || '',
      });
    }
  }, [open, details, clientName]);

  const handleChange = (field: keyof BeneficiaryDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.nom_beneficiaire.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Détails du bénéficiaire
          </DialogTitle>
          <DialogDescription>
            Informations complémentaires pour la facturation assureur
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="nom_beneficiaire">Nom du bénéficiaire *</Label>
            <Input
              id="nom_beneficiaire"
              value={form.nom_beneficiaire}
              onChange={(e) => handleChange('nom_beneficiaire', e.target.value)}
              placeholder={clientName || 'Nom du bénéficiaire'}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="lien">Lien</Label>
            <Input
              id="lien"
              value={form.lien}
              onChange={(e) => handleChange('lien', e.target.value)}
              placeholder="Lien avec l'assuré"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="matricule_agent">Matricule Agent</Label>
            <Input
              id="matricule_agent"
              value={form.matricule_agent}
              onChange={(e) => handleChange('matricule_agent', e.target.value)}
              placeholder="Matricule agent"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="matricule_patient">Matricule Patient</Label>
            <Input
              id="matricule_patient"
              value={form.matricule_patient}
              onChange={(e) => handleChange('matricule_patient', e.target.value)}
              placeholder="Matricule patient"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="numero_police">N° Police</Label>
            <Input
              id="numero_police"
              value={form.numero_police}
              onChange={(e) => handleChange('numero_police', e.target.value)}
              placeholder="Numéro de police"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="numero_bon">N° Bon</Label>
            <Input
              id="numero_bon"
              value={form.numero_bon}
              onChange={(e) => handleChange('numero_bon', e.target.value)}
              placeholder="Numéro de bon"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type_piece">Type Pièce</Label>
            <Input
              id="type_piece"
              value={form.type_piece}
              onChange={(e) => handleChange('type_piece', e.target.value)}
              placeholder="Type de pièce"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="reference_piece">Réf. Pièce</Label>
            <Input
              id="reference_piece"
              value={form.reference_piece}
              onChange={(e) => handleChange('reference_piece', e.target.value)}
              placeholder="Référence pièce"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="telephone_agent">Tél. Agent</Label>
            <Input
              id="telephone_agent"
              value={form.telephone_agent}
              onChange={(e) => handleChange('telephone_agent', e.target.value)}
              placeholder="Téléphone agent"
            />
          </div>

          <div className="col-span-2 space-y-1">
            <Label htmlFor="adresse_agent">Adresse Agent</Label>
            <Input
              id="adresse_agent"
              value={form.adresse_agent}
              onChange={(e) => handleChange('adresse_agent', e.target.value)}
              placeholder="Adresse de l'agent"
            />
          </div>

          <div className="col-span-2 space-y-1">
            <Label htmlFor="medecin_traitant">Médecin Traitant</Label>
            <Input
              id="medecin_traitant"
              value={form.medecin_traitant}
              onChange={(e) => handleChange('medecin_traitant', e.target.value)}
              placeholder="Nom du médecin traitant"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!form.nom_beneficiaire.trim()}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BeneficiaryDetailsModal;
