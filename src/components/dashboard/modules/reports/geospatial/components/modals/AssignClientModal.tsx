import React, { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  useZoneAssignments, 
  useAssignClientToZoneMutation, 
  useRemoveClientFromZoneMutation 
} from '@/hooks/useGeospatialReports';
import { GeoZone } from '@/types/geospatial.types';
import { Skeleton } from '@/components/ui/skeleton';

interface AssignClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: GeoZone;
}

const AssignClientModal: React.FC<AssignClientModalProps> = ({ open, onOpenChange, zone }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { tenantId } = useTenant();

  // Fetch all clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-for-assignment', tenantId],
    queryFn: async () => {
      const allClients: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('clients')
          .select('id, nom, prenom, telephone, adresse')
          .eq('tenant_id', tenantId!)
          .order('nom')
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allClients.push(...data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      return allClients;
    },
    enabled: !!tenantId && open,
  });

  // Fetch current zone assignments
  const { data: assignments, isLoading: assignmentsLoading } = useZoneAssignments(zone.id);

  const assignMutation = useAssignClientToZoneMutation();
  const removeMutation = useRemoveClientFromZoneMutation();

  // Filter clients by search term
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm.trim()) return clients;
    
    const term = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.nom?.toLowerCase().includes(term) ||
      c.prenom?.toLowerCase().includes(term) ||
      c.telephone?.toLowerCase().includes(term) ||
      c.adresse?.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  // Set of assigned client IDs for quick lookup
  const assignedClientIds = useMemo(() => {
    return new Set(assignments?.map(a => a.client_id) || []);
  }, [assignments]);

  const handleToggleClient = async (clientId: string) => {
    if (assignedClientIds.has(clientId)) {
      // Find the assignment to remove
      const assignment = assignments?.find(a => a.client_id === clientId);
      if (assignment) {
        await removeMutation.mutateAsync(assignment.id);
      }
    } else {
      await assignMutation.mutateAsync({ zoneId: zone.id, clientId });
    }
  };

  const isLoading = clientsLoading || assignmentsLoading;
  const isPending = assignMutation.isPending || removeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigner des Clients à la Zone
          </DialogTitle>
          <DialogDescription>
            Zone: <Badge variant="outline">{zone.zone_name}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{assignedClientIds.size} clients assignés</span>
            <span>•</span>
            <span>{filteredClients.length} clients affichés</span>
          </div>

          {/* Client List */}
          <ScrollArea className="h-[350px] border rounded-md">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun client trouvé</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredClients.map((client) => {
                  const isAssigned = assignedClientIds.has(client.id);
                  return (
                    <div
                      key={client.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                        isAssigned ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => !isPending && handleToggleClient(client.id)}
                    >
                      <Checkbox
                        checked={isAssigned}
                        disabled={isPending}
                        onCheckedChange={() => handleToggleClient(client.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {client.nom} {client.prenom}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.telephone} • {client.adresse || 'Pas d\'adresse'}
                        </p>
                      </div>
                      {isAssigned && (
                        <Badge variant="secondary" className="shrink-0">
                          Assigné
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignClientModal;