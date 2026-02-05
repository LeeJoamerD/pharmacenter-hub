 import React, { useState } from 'react';
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { Checkbox } from '@/components/ui/checkbox';
 
 interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit: (data: any) => void;
   tenantId?: string;
 }
 
 const AddPharmacovigilanceDialog: React.FC<Props> = ({ open, onOpenChange, onSubmit, tenantId }) => {
   const [formData, setFormData] = useState({
     effet_indesirable: '',
     gravite: 'mineure' as 'mineure' | 'moderee' | 'grave' | 'fatale',
     patient_age: '',
     patient_gender: '',
     date_survenue: '',
     suivi_requis: false,
     notes: ''
   });
 
   const handleSubmit = () => {
     if (!formData.effet_indesirable || !formData.date_survenue || !tenantId) return;
     onSubmit({
       tenant_id: tenantId,
       effet_indesirable: formData.effet_indesirable,
       gravite: formData.gravite,
       patient_age: formData.patient_age ? parseInt(formData.patient_age) : undefined,
       patient_gender: formData.patient_gender || undefined,
       date_survenue: formData.date_survenue,
       suivi_requis: formData.suivi_requis,
       notes: formData.notes || undefined
     });
     setFormData({ effet_indesirable: '', gravite: 'mineure', patient_age: '', patient_gender: '', date_survenue: '', suivi_requis: false, notes: '' });
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Nouvelle Déclaration</DialogTitle>
           <DialogDescription>Déclarez un effet indésirable</DialogDescription>
         </DialogHeader>
         <div className="space-y-4">
           <div className="space-y-2">
             <Label>Effet indésirable *</Label>
             <Input value={formData.effet_indesirable} onChange={(e) => setFormData({ ...formData, effet_indesirable: e.target.value })} />
           </div>
           <div className="space-y-2">
             <Label>Gravité</Label>
             <Select value={formData.gravite} onValueChange={(v: any) => setFormData({ ...formData, gravite: v })}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="mineure">Mineure</SelectItem>
                 <SelectItem value="moderee">Modérée</SelectItem>
                 <SelectItem value="grave">Grave</SelectItem>
                 <SelectItem value="fatale">Fatale</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Âge patient</Label>
               <Input type="number" value={formData.patient_age} onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })} />
             </div>
             <div className="space-y-2">
               <Label>Genre</Label>
               <Select value={formData.patient_gender} onValueChange={(v) => setFormData({ ...formData, patient_gender: v })}>
                 <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="M">Masculin</SelectItem>
                   <SelectItem value="F">Féminin</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           <div className="space-y-2">
             <Label>Date survenue *</Label>
             <Input type="date" value={formData.date_survenue} onChange={(e) => setFormData({ ...formData, date_survenue: e.target.value })} />
           </div>
           <div className="flex items-center gap-2">
             <Checkbox checked={formData.suivi_requis} onCheckedChange={(c) => setFormData({ ...formData, suivi_requis: !!c })} />
             <Label>Suivi médical requis</Label>
           </div>
           <div className="space-y-2">
             <Label>Notes</Label>
             <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
           <Button onClick={handleSubmit} disabled={!formData.effet_indesirable || !formData.date_survenue}>Créer</Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AddPharmacovigilanceDialog;