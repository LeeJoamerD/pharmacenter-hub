 import React, { useState } from 'react';
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 import { NarcoticProduct } from '@/services/RegulatoryService';
 
 interface Props {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   products: NarcoticProduct[];
   onSubmit: (data: any) => void;
   tenantId?: string;
 }
 
 const AddNarcoticMovementDialog: React.FC<Props> = ({ open, onOpenChange, products, onSubmit, tenantId }) => {
   const [formData, setFormData] = useState({
     produit_id: '',
     type_mouvement: 'sortie' as 'entree' | 'sortie' | 'ajustement' | 'destruction',
     quantite: '',
     ordonnance_reference: '',
     prescripteur: '',
     notes: ''
   });
 
   const handleSubmit = () => {
     if (!formData.produit_id || !formData.quantite || !tenantId) return;
     const product = products.find(p => p.id === formData.produit_id);
     const quantite = parseInt(formData.quantite);
     const stock_avant = product?.stock_actuel || 0;
     const stock_apres = formData.type_mouvement === 'entree' 
       ? stock_avant + quantite 
       : stock_avant - quantite;
 
     onSubmit({
       tenant_id: tenantId,
       produit_id: formData.produit_id,
       type_mouvement: formData.type_mouvement,
       quantite,
       stock_avant,
       stock_apres,
       ordonnance_reference: formData.ordonnance_reference || undefined,
       prescripteur: formData.prescripteur || undefined,
       notes: formData.notes || undefined
     });
     setFormData({ produit_id: '', type_mouvement: 'sortie', quantite: '', ordonnance_reference: '', prescripteur: '', notes: '' });
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent>
         <DialogHeader>
           <DialogTitle>Enregistrer un Mouvement</DialogTitle>
           <DialogDescription>Enregistrez une entrée ou sortie de stupéfiant</DialogDescription>
         </DialogHeader>
         <div className="space-y-4">
           <div className="space-y-2">
             <Label>Produit</Label>
             <Select value={formData.produit_id} onValueChange={(v) => setFormData({ ...formData, produit_id: v })}>
               <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
               <SelectContent>
                 {products.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle_produit}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label>Type de mouvement</Label>
             <Select value={formData.type_mouvement} onValueChange={(v: any) => setFormData({ ...formData, type_mouvement: v })}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="entree">Entrée</SelectItem>
                 <SelectItem value="sortie">Sortie</SelectItem>
                 <SelectItem value="ajustement">Ajustement</SelectItem>
                 <SelectItem value="destruction">Destruction</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label>Quantité</Label>
             <Input type="number" min="1" value={formData.quantite} onChange={(e) => setFormData({ ...formData, quantite: e.target.value })} />
           </div>
           <div className="space-y-2">
             <Label>Référence ordonnance (optionnel)</Label>
             <Input value={formData.ordonnance_reference} onChange={(e) => setFormData({ ...formData, ordonnance_reference: e.target.value })} />
           </div>
           <div className="space-y-2">
             <Label>Prescripteur (optionnel)</Label>
             <Input value={formData.prescripteur} onChange={(e) => setFormData({ ...formData, prescripteur: e.target.value })} />
           </div>
           <div className="space-y-2">
             <Label>Notes (optionnel)</Label>
             <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
           <Button onClick={handleSubmit} disabled={!formData.produit_id || !formData.quantite}>Enregistrer</Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AddNarcoticMovementDialog;