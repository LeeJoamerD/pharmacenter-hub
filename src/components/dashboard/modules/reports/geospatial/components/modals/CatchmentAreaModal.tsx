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
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { useCreateCatchmentAreaMutation } from '@/hooks/useGeospatialReports';
 
 interface CatchmentAreaModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 const CatchmentAreaModal: React.FC<CatchmentAreaModalProps> = ({ open, onOpenChange }) => {
   const [areaName, setAreaName] = useState('');
   const [areaType, setAreaType] = useState<'premium' | 'familiale' | 'etudiante' | 'commerciale' | 'other'>('other');
   const [population, setPopulation] = useState('');
   const [penetrationRate, setPenetrationRate] = useState('');
   const [avgBasket, setAvgBasket] = useState('');
   const [competitionLevel, setCompetitionLevel] = useState<'faible' | 'moyenne' | 'elevee'>('moyenne');
   const [opportunityLevel, setOpportunityLevel] = useState<'excellente' | 'bonne' | 'moderee' | 'faible'>('bonne');
 
   const createMutation = useCreateCatchmentAreaMutation();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!areaName.trim()) return;
 
     await createMutation.mutateAsync({
       area_name: areaName,
       area_type: areaType,
       estimated_population: population ? parseInt(population) : 0,
       penetration_rate: penetrationRate ? parseFloat(penetrationRate) : 0,
       avg_basket: avgBasket ? parseFloat(avgBasket) : 0,
       competition_level: competitionLevel,
       opportunity_level: opportunityLevel
     });
 
     // Reset form
     setAreaName('');
     setAreaType('other');
     setPopulation('');
     setPenetrationRate('');
     setAvgBasket('');
     setCompetitionLevel('moyenne');
     setOpportunityLevel('bonne');
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
           <DialogTitle>Nouvelle Zone de Chalandise</DialogTitle>
           <DialogDescription>
             Définissez une zone de chalandise pour analyser le potentiel commercial.
           </DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="areaName">Nom de la zone *</Label>
               <Input
                 id="areaName"
                 value={areaName}
                 onChange={(e) => setAreaName(e.target.value)}
                 placeholder="Ex: Zone Premium"
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="areaType">Type</Label>
               <Select value={areaType} onValueChange={(val: any) => setAreaType(val)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Sélectionner" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="premium">Premium</SelectItem>
                   <SelectItem value="familiale">Familiale</SelectItem>
                   <SelectItem value="etudiante">Étudiante</SelectItem>
                   <SelectItem value="commerciale">Commerciale</SelectItem>
                   <SelectItem value="other">Autre</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="population">Population</Label>
               <Input
                 id="population"
                 type="number"
                 value={population}
                 onChange={(e) => setPopulation(e.target.value)}
                 placeholder="0"
                 min="0"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="penetration">Pénétration (%)</Label>
               <Input
                 id="penetration"
                 type="number"
                 value={penetrationRate}
                 onChange={(e) => setPenetrationRate(e.target.value)}
                 placeholder="0"
                 min="0"
                 max="100"
                 step="0.1"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="avgBasket">Panier moyen</Label>
               <Input
                 id="avgBasket"
                 type="number"
                 value={avgBasket}
                 onChange={(e) => setAvgBasket(e.target.value)}
                 placeholder="0"
                 min="0"
               />
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="competition">Niveau de concurrence</Label>
               <Select value={competitionLevel} onValueChange={(val: any) => setCompetitionLevel(val)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="faible">Faible</SelectItem>
                   <SelectItem value="moyenne">Moyenne</SelectItem>
                   <SelectItem value="elevee">Élevée</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="opportunity">Niveau d'opportunité</Label>
               <Select value={opportunityLevel} onValueChange={(val: any) => setOpportunityLevel(val)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="excellente">Excellente</SelectItem>
                   <SelectItem value="bonne">Bonne</SelectItem>
                   <SelectItem value="moderee">Modérée</SelectItem>
                   <SelectItem value="faible">Faible</SelectItem>
                 </SelectContent>
               </Select>
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
 
 export default CatchmentAreaModal;