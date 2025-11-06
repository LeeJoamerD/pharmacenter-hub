import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, Pill } from 'lucide-react';

interface PrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrescriptionSaved?: (prescriptionId: string) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  open,
  onOpenChange,
  onPrescriptionSaved
}) => {
  const { createPrescription } = usePrescriptions();
  const [prescriptionData, setPrescriptionData] = useState({
    medecin: '',
    numeroOrdonnance: '',
    dateOrdonnance: new Date().toISOString().split('T')[0],
    patientNom: '',
    patientAge: '',
    diagnostic: '',
    lignes: [{ medicament: '', posologie: '', duree: '', quantite: 1 }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLigne = () => {
    setPrescriptionData(prev => ({
      ...prev,
      lignes: [...prev.lignes, { medicament: '', posologie: '', duree: '', quantite: 1 }]
    }));
  };

  const removeLigne = (index: number) => {
    if (prescriptionData.lignes.length > 1) {
      setPrescriptionData(prev => ({
        ...prev,
        lignes: prev.lignes.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLigne = (index: number, field: string, value: any) => {
    setPrescriptionData(prev => ({
      ...prev,
      lignes: prev.lignes.map((ligne, i) =>
        i === index ? { ...ligne, [field]: value } : ligne
      )
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!prescriptionData.medecin || !prescriptionData.numeroOrdonnance || !prescriptionData.patientNom) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (prescriptionData.lignes.some(l => !l.medicament || !l.posologie)) {
      toast.error('Veuillez compléter tous les médicaments');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPrescription({
        medecin_nom: prescriptionData.medecin,
        date_prescription: prescriptionData.dateOrdonnance,
        type_prescription: 'Ordinaire',
        diagnostic: prescriptionData.diagnostic || undefined,
        lignes: prescriptionData.lignes.map(l => ({
          nom_medicament: l.medicament,
          posologie: l.posologie,
          duree_traitement: l.duree || undefined,
          quantite_prescrite: l.quantite,
          produit_id: undefined,
          dosage: undefined,
          notes: undefined
        }))
      });

      toast.success('Ordonnance enregistrée avec succès');
      onPrescriptionSaved?.(result.id);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement de l\'ordonnance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPrescriptionData({
      medecin: '',
      numeroOrdonnance: '',
      dateOrdonnance: new Date().toISOString().split('T')[0],
      patientNom: '',
      patientAge: '',
      diagnostic: '',
      lignes: [{ medicament: '', posologie: '', duree: '', quantite: 1 }]
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enregistrer une Ordonnance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de l'ordonnance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medecin">Médecin Prescripteur *</Label>
              <Input
                id="medecin"
                value={prescriptionData.medecin}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, medecin: e.target.value }))}
                placeholder="Dr. Nom du médecin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Numéro d'Ordonnance *</Label>
              <Input
                id="numero"
                value={prescriptionData.numeroOrdonnance}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, numeroOrdonnance: e.target.value }))}
                placeholder="ORD-2024-0001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date de l'Ordonnance</Label>
              <Input
                id="date"
                type="date"
                value={prescriptionData.dateOrdonnance}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, dateOrdonnance: e.target.value }))}
              />
            </div>
          </div>

          {/* Informations du patient */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold">Informations du Patient</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-nom">Nom du Patient *</Label>
                <Input
                  id="patient-nom"
                  value={prescriptionData.patientNom}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, patientNom: e.target.value }))}
                  placeholder="Nom complet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient-age">Âge</Label>
                <Input
                  id="patient-age"
                  type="number"
                  value={prescriptionData.patientAge}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, patientAge: e.target.value }))}
                  placeholder="Âge"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="diagnostic">Diagnostic</Label>
                <Textarea
                  id="diagnostic"
                  value={prescriptionData.diagnostic}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, diagnostic: e.target.value }))}
                  placeholder="Diagnostic médical..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Médicaments prescrits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Médicaments Prescrits
              </h3>
              <Button onClick={addLigne} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {prescriptionData.lignes.map((ligne, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Médicament #{index + 1}</span>
                  {prescriptionData.lignes.length > 1 && (
                    <Button
                      onClick={() => removeLigne(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Nom du Médicament *</Label>
                    <Input
                      value={ligne.medicament}
                      onChange={(e) => updateLigne(index, 'medicament', e.target.value)}
                      placeholder="Nom du médicament"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min={1}
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Posologie *</Label>
                    <Input
                      value={ligne.posologie}
                      onChange={(e) => updateLigne(index, 'posologie', e.target.value)}
                      placeholder="Ex: 2 fois par jour"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Durée du Traitement</Label>
                    <Input
                      value={ligne.duree}
                      onChange={(e) => updateLigne(index, 'duree', e.target.value)}
                      placeholder="Ex: 7 jours"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'Ordonnance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
