 import React, { useState } from 'react';
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
 import { Textarea } from '@/components/ui/textarea';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { useCreateZoneMutation } from '@/hooks/useGeospatialReports';
 
 interface ZoneFormModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 const ZoneFormModal: React.FC<ZoneFormModalProps> = ({ open, onOpenChange }) => {
   const [zoneName, setZoneName] = useState('');
   const [zoneType, setZoneType] = useState<'centre-ville' | 'residentiel' | 'industriel' | 'peripherie' | 'commercial' | 'other'>('other');
   const [description, setDescription] = useState('');
   const [color, setColor] = useState('#3B82F6');
 
   const createMutation = useCreateZoneMutation();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!zoneName.trim()) return;
 
     await createMutation.mutateAsync({
       zone_name: zoneName,
       zone_type: zoneType,
       description: description || undefined,
       color,
       is_active: true
     });
 
     // Reset form
     setZoneName('');
     setZoneType('other');
     setDescription('');
     setColor('#3B82F6');
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[425px]">
         <DialogHeader>
           <DialogTitle>Nouvelle Zone Géographique</DialogTitle>
           <DialogDescription>
             Créez une nouvelle zone pour segmenter vos clients géographiquement.
           </DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="zoneName">Nom de la zone *</Label>
             <Input
               id="zoneName"
               value={zoneName}
               onChange={(e) => setZoneName(e.target.value)}
               placeholder="Ex: Centre-Ville Dakar"
               required
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="zoneType">Type de zone</Label>
             <Select value={zoneType} onValueChange={(val: any) => setZoneType(val)}>
               <SelectTrigger>
                 <SelectValue placeholder="Sélectionner un type" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="centre-ville">Centre-Ville</SelectItem>
                 <SelectItem value="residentiel">Résidentiel</SelectItem>
                 <SelectItem value="industriel">Industriel</SelectItem>
                 <SelectItem value="peripherie">Périphérie</SelectItem>
                 <SelectItem value="commercial">Commercial</SelectItem>
                 <SelectItem value="other">Autre</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="description">Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Description de la zone..."
               rows={3}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="color">Couleur</Label>
             <div className="flex items-center gap-2">
               <Input
                 id="color"
                 type="color"
                 value={color}
                 onChange={(e) => setColor(e.target.value)}
                 className="w-16 h-10 p-1"
               />
               <span className="text-sm text-muted-foreground">{color}</span>
             </div>
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Annuler
             </Button>
             <Button type="submit" disabled={createMutation.isPending}>
               {createMutation.isPending ? 'Création...' : 'Créer'}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default ZoneFormModal;