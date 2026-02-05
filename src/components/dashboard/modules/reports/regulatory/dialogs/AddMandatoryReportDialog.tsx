 import React, { useState } from 'react';
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 
 interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit: (data: any) => void;
   tenantId?: string;
 }
 
 const AddMandatoryReportDialog: React.FC<Props> = ({ open, onOpenChange, onSubmit, tenantId }) => {
   const [formData, setFormData] = useState({
     nom: '',
     type_rapport: '',
     frequence: 'mensuel' as 'quotidien' | 'hebdomadaire' | 'mensuel' | 'trimestriel' | 'annuel' | 'immediat',
     autorite_destinataire: '',
     prochaine_echeance: ''
   });
 
   const handleSubmit = () => {
     if (!formData.nom || !formData.type_rapport || !formData.autorite_destinataire || !formData.prochaine_echeance || !tenantId) return;
     onSubmit({ tenant_id: tenantId, ...formData });
     setFormData({ nom: '', type_rapport: '', frequence: 'mensuel', autorite_destinataire: '', prochaine_echeance: '' });
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Nouveau Rapport Obligatoire</DialogTitle>
           <DialogDescription>Planifiez un nouveau rapport réglementaire</DialogDescription>
         </DialogHeader>
         <div className="space-y-4">
           <div className="space-y-2">
             <Label>Nom du rapport *</Label>
             <Input value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} placeholder="Rapport Mensuel ANSM" />
           </div>
           <div className="space-y-2">
             <Label>Type *</Label>
             <Input value={formData.type_rapport} onChange={(e) => setFormData({ ...formData, type_rapport: e.target.value })} placeholder="Déclaration, Bilan..." />
           </div>
           <div className="space-y-2">
             <Label>Fréquence</Label>
             <Select value={formData.frequence} onValueChange={(v: any) => setFormData({ ...formData, frequence: v })}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="quotidien">Quotidien</SelectItem>
                 <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                 <SelectItem value="mensuel">Mensuel</SelectItem>
                 <SelectItem value="trimestriel">Trimestriel</SelectItem>
                 <SelectItem value="annuel">Annuel</SelectItem>
                 <SelectItem value="immediat">Immédiat</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label>Autorité destinataire *</Label>
             <Input value={formData.autorite_destinataire} onChange={(e) => setFormData({ ...formData, autorite_destinataire: e.target.value })} placeholder="ANSM, ARS..." />
           </div>
           <div className="space-y-2">
             <Label>Prochaine échéance *</Label>
             <Input type="date" value={formData.prochaine_echeance} onChange={(e) => setFormData({ ...formData, prochaine_echeance: e.target.value })} />
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
           <Button onClick={handleSubmit} disabled={!formData.nom || !formData.type_rapport || !formData.autorite_destinataire || !formData.prochaine_echeance}>Créer</Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AddMandatoryReportDialog;