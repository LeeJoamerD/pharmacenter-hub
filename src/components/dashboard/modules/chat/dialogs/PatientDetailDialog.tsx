import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, Phone, Mail, AlertTriangle, Heart, FileText, Plus, X, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import type { NetworkPatient } from '@/hooks/useNetworkBusinessIntegrations';

interface PatientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: NetworkPatient | null;
  onUpdatePatient?: (patientId: string, data: { allergies?: string[]; chronic_conditions?: string[] }) => void;
  isUpdating?: boolean;
}

interface Prescription {
  id: string;
  doctorName: string;
  date: string;
  status: string;
}

interface Purchase {
  id: string;
  date: string;
  total: number;
  itemsCount: number;
}

export function PatientDetailDialog({ open, onOpenChange, patient, onUpdatePatient, isUpdating }: PatientDetailDialogProps) {
  const { tenantId } = useTenant();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);

  useEffect(() => {
    if (open && patient) {
      setAllergies(patient.allergies || []);
      setConditions(patient.chronicConditions || []);
      loadPatientHistory();
    }
  }, [open, patient]);

  const loadPatientHistory = async () => {
    if (!patient || !tenantId) return;
    setIsLoading(true);
    
    try {
      // Load prescriptions
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('id, prescripteur_nom, date_prescription, statut')
        .eq('tenant_id', tenantId)
        .eq('client_id', patient.id)
        .order('date_prescription', { ascending: false })
        .limit(10);

      setPrescriptions((prescriptionsData as any)?.map((p: any) => ({
        id: p.id,
        doctorName: p.prescripteur_nom || 'Médecin',
        date: p.date_prescription,
        status: p.statut || 'active'
      })) || []);

      // Load purchases
      const { data: purchasesData } = await supabase
        .from('ventes')
        .select('id, created_at, montant_total_ttc, lignes_ventes(count)')
        .eq('tenant_id', tenantId)
        .eq('client_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setPurchases(purchasesData?.map(v => ({
        id: v.id,
        date: v.created_at,
        total: v.montant_total_ttc || 0,
        itemsCount: (v.lignes_ventes as any)?.[0]?.count || 0
      })) || []);
    } catch (error) {
      console.error('Error loading patient history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setConditions(conditions.filter(c => c !== condition));
  };

  const handleSave = () => {
    if (patient && onUpdatePatient) {
      onUpdatePatient(patient.id, { allergies, chronic_conditions: conditions });
      setEditMode(false);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Dossier Patient - {patient.name}
          </DialogTitle>
          <DialogDescription>
            Informations médicales et historique du patient
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="prescriptions">Ordonnances</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Âge</p>
                  <p className="font-medium">{patient.age ? `${patient.age} ans` : 'Non renseigné'}</p>
                </div>
              </div>
              {patient.telephone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{patient.telephone}</p>
                  </div>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Prescriptions</p>
                  <p className="font-medium">{patient.prescriptions}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Allergies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Allergies connues
                </Label>
                {!editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    Modifier
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {allergies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune allergie connue</p>
                ) : (
                  allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive" className="flex items-center gap-1">
                      {allergy}
                      {editMode && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeAllergy(allergy)} />
                      )}
                    </Badge>
                  ))
                )}
              </div>
              
              {editMode && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nouvelle allergie..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <Button variant="outline" size="sm" onClick={addAllergy}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Chronic Conditions */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-orange-500" />
                Conditions chroniques
              </Label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {conditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune condition chronique</p>
                ) : (
                  conditions.map((condition, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {condition}
                      {editMode && (
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeCondition(condition)} />
                      )}
                    </Badge>
                  ))
                )}
              </div>
              
              {editMode && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nouvelle condition..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {editMode && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prescriptions">
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : prescriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune ordonnance</p>
              ) : (
                <div className="space-y-2">
                  {prescriptions.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{p.doctorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(p.date), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : purchases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun achat</p>
              ) : (
                <div className="space-y-2">
                  {purchases.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{p.itemsCount} article(s)</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(p.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <p className="font-medium">{p.total.toFixed(0)} FCFA</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
