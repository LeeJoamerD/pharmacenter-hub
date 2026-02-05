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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  GripVertical,
  Truck,
  Package
} from 'lucide-react';
import { 
  useRouteStops, 
  useAddRouteStopMutation, 
  useDeleteRouteStopMutation 
} from '@/hooks/useGeospatialReports';
import { DeliveryRoute, DeliveryRouteStop } from '@/types/geospatial.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RouteStopsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: DeliveryRoute;
}

const RouteStopsModal: React.FC<RouteStopsModalProps> = ({ open, onOpenChange, route }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteStopId, setDeleteStopId] = useState<string | null>(null);
  
  // Form states
  const [address, setAddress] = useState('');
  const [stopType, setStopType] = useState<'pickup' | 'delivery' | 'both'>('delivery');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: stops, isLoading } = useRouteStops(route.id);
  const addStopMutation = useAddRouteStopMutation();
  const deleteStopMutation = useDeleteRouteStopMutation();

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    const nextOrder = (stops?.length || 0) + 1;

    await addStopMutation.mutateAsync({
      routeId: route.id,
      data: {
        stop_order: nextOrder,
        address,
        stop_type: stopType,
        estimated_time_min: estimatedTime ? parseInt(estimatedTime) : 5,
        notes: notes || undefined
      }
    });

    // Reset form
    setAddress('');
    setStopType('delivery');
    setEstimatedTime('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDeleteStop = async () => {
    if (deleteStopId) {
      await deleteStopMutation.mutateAsync(deleteStopId);
      setDeleteStopId(null);
    }
  };

  const getStopTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'delivery':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'both':
        return <MapPin className="h-4 w-4 text-purple-600" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getStopTypeBadge = (type: string) => {
    switch (type) {
      case 'pickup':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Collecte</Badge>;
      case 'delivery':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Livraison</Badge>;
      case 'both':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Les deux</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gestion des Arrêts
            </DialogTitle>
            <DialogDescription>
              Route: <Badge variant="outline">{route.route_name}</Badge> ({route.route_code})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add new stop button/form */}
            {!showAddForm ? (
              <Button onClick={() => setShowAddForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un arrêt
              </Button>
            ) : (
              <form onSubmit={handleAddStop} className="border rounded-lg p-4 space-y-3 bg-accent/30">
                <h4 className="font-medium">Nouvel arrêt</h4>
                
                <div className="space-y-2">
                  <Label>Adresse *</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse de l'arrêt"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={stopType} onValueChange={(v: any) => setStopType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery">Livraison</SelectItem>
                        <SelectItem value="pickup">Collecte</SelectItem>
                        <SelectItem value="both">Les deux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Temps estimé (min)</Label>
                    <Input
                      type="number"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      placeholder="5"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes additionnelles..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={addStopMutation.isPending}>
                    {addStopMutation.isPending ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            )}

            {/* Stops list */}
            <ScrollArea className="h-[300px] border rounded-md">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Skeleton className="h-6 w-6" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !stops || stops.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun arrêt configuré</p>
                  <p className="text-sm">Ajoutez des arrêts pour cette route</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="font-bold text-sm w-6">{stop.stop_order}</span>
                      </div>
                      
                      {getStopTypeIcon(stop.stop_type)}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{stop.address}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getStopTypeBadge(stop.stop_type)}
                          <span>• {stop.estimated_time_min} min</span>
                          {stop.notes && <span className="truncate">• {stop.notes}</span>}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteStopId(stop.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Summary */}
            {stops && stops.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-accent/30 rounded-lg">
                <span>{stops.length} arrêt(s)</span>
                <span>
                  Temps total estimé: {stops.reduce((acc, s) => acc + s.estimated_time_min, 0)} min
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteStopId} onOpenChange={() => setDeleteStopId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet arrêt ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'arrêt sera définitivement supprimé de la route.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStopMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RouteStopsModal;