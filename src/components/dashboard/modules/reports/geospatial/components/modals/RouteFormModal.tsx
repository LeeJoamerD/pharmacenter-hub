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
 import { Textarea } from '@/components/ui/textarea';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { useCreateRouteMutation } from '@/hooks/useGeospatialReports';
import { useUpdateRouteMutation } from '@/hooks/useGeospatialReports';
import { DeliveryRoute } from '@/types/geospatial.types';
 
 interface RouteFormModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
  route?: DeliveryRoute | null;
 }
 
const RouteFormModal: React.FC<RouteFormModalProps> = ({ open, onOpenChange, route }) => {
   const [routeName, setRouteName] = useState('');
   const [routeCode, setRouteCode] = useState('');
   const [description, setDescription] = useState('');
   const [distanceKm, setDistanceKm] = useState('');
   const [durationMin, setDurationMin] = useState('');
   const [status, setStatus] = useState<'active' | 'inactive' | 'en_cours'>('active');
 
   const createMutation = useCreateRouteMutation();
  const updateMutation = useUpdateRouteMutation();

  const isEditMode = !!route;

  useEffect(() => {
    if (route) {
      setRouteName(route.route_name);
      setRouteCode(route.route_code);
      setDescription(route.description || '');
      setDistanceKm(route.estimated_distance_km?.toString() || '');
      setDurationMin(route.estimated_duration_min?.toString() || '');
      setStatus(route.status);
    } else {
      setRouteName('');
      setRouteCode('');
      setDescription('');
      setDistanceKm('');
      setDurationMin('');
      setStatus('active');
    }
  }, [route, open]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!routeName.trim() || !routeCode.trim()) return;
 
    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: route.id,
        data: {
          route_name: routeName,
          route_code: routeCode,
          description: description || undefined,
          estimated_distance_km: distanceKm ? parseFloat(distanceKm) : 0,
          estimated_duration_min: durationMin ? parseInt(durationMin) : 0,
          status
        }
      });
    } else {
      await createMutation.mutateAsync({
        route_name: routeName,
        route_code: routeCode,
        description: description || undefined,
        estimated_distance_km: distanceKm ? parseFloat(distanceKm) : 0,
        estimated_duration_min: durationMin ? parseInt(durationMin) : 0,
        status,
        efficiency_score: 0
      });
    }
 
     // Reset form
     setRouteName('');
     setRouteCode('');
     setDescription('');
     setDistanceKm('');
     setDurationMin('');
     setStatus('active');
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier la Route' : 'Nouvelle Route de Livraison'}</DialogTitle>
           <DialogDescription>
            {isEditMode ? 'Modifiez les informations de cette route.' : 'Créez une nouvelle route pour optimiser vos livraisons.'}
           </DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="routeName">Nom de la route *</Label>
               <Input
                 id="routeName"
                 value={routeName}
                 onChange={(e) => setRouteName(e.target.value)}
                 placeholder="Ex: Route Centre-Ville"
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="routeCode">Code *</Label>
               <Input
                 id="routeCode"
                 value={routeCode}
                 onChange={(e) => setRouteCode(e.target.value)}
                 placeholder="Ex: R001"
                 required
               />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="description">Description</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Description de la route..."
               rows={2}
             />
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="distance">Distance estimée (km)</Label>
               <Input
                 id="distance"
                 type="number"
                 value={distanceKm}
                 onChange={(e) => setDistanceKm(e.target.value)}
                 placeholder="0"
                 min="0"
                 step="0.1"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="duration">Durée estimée (min)</Label>
               <Input
                 id="duration"
                 type="number"
                 value={durationMin}
                 onChange={(e) => setDurationMin(e.target.value)}
                 placeholder="0"
                 min="0"
               />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="status">Statut</Label>
             <Select value={status} onValueChange={(val: any) => setStatus(val)}>
               <SelectTrigger>
                 <SelectValue placeholder="Sélectionner un statut" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="active">Active</SelectItem>
                 <SelectItem value="inactive">Inactive</SelectItem>
                 <SelectItem value="en_cours">En cours</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Annuler
             </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending 
                ? (isEditMode ? 'Mise à jour...' : 'Création...') 
                : (isEditMode ? 'Mettre à jour' : 'Créer')}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default RouteFormModal;