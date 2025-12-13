import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Building, Trash2, Plus } from 'lucide-react';
import type { ChannelWithMetrics, ChannelPermission } from '@/hooks/useNetworkChannelManagement';

interface ChannelPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ChannelWithMetrics | null;
  permissions: ChannelPermission[];
  pharmacies: { id: string; nom_pharmacie: string }[];
  onCreatePermission: (data: {
    channel_id: string;
    role: string;
    permission_level: 'read' | 'write' | 'admin';
    pharmacy_id?: string;
  }) => Promise<any>;
  onUpdatePermission: (permId: string, updates: { permission_level: 'read' | 'write' | 'admin' }) => Promise<boolean>;
  onDeletePermission: (permId: string) => Promise<boolean>;
}

const ROLES = [
  { value: 'Admin', label: 'Administrateur' },
  { value: 'Pharmacien Titulaire', label: 'Pharmacien Titulaire' },
  { value: 'Pharmacien Adjoint', label: 'Pharmacien Adjoint' },
  { value: 'Préparateur', label: 'Préparateur' },
  { value: 'Technicien', label: 'Technicien' },
  { value: 'Caissier', label: 'Caissier' },
  { value: 'Vendeur', label: 'Vendeur' },
  { value: 'Gestionnaire de stock', label: 'Gestionnaire de stock' },
  { value: 'Comptable', label: 'Comptable' },
  { value: 'Secrétaire', label: 'Secrétaire' },
  { value: 'Livreur', label: 'Livreur' },
  { value: 'Stagiaire', label: 'Stagiaire' },
  { value: 'Invité', label: 'Invité' }
];

const PERMISSION_LEVELS = [
  { value: 'read', label: 'Lecture', color: 'bg-blue-500' },
  { value: 'write', label: 'Écriture', color: 'bg-green-500' },
  { value: 'admin', label: 'Administration', color: 'bg-purple-500' }
];

const ChannelPermissionModal = ({
  open,
  onOpenChange,
  channel,
  permissions,
  pharmacies,
  onCreatePermission,
  onUpdatePermission,
  onDeletePermission
}: ChannelPermissionModalProps) => {
  const [newRole, setNewRole] = useState('');
  const [newLevel, setNewLevel] = useState<'read' | 'write' | 'admin'>('read');
  const [newPharmacy, setNewPharmacy] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!channel) return null;

  const channelPermissions = permissions.filter(p => p.channel_id === channel.id);

  const handleAddPermission = async () => {
    if (!newRole) return;

    setLoading(true);
    await onCreatePermission({
      channel_id: channel.id,
      role: newRole,
      permission_level: newLevel,
      pharmacy_id: newPharmacy === 'all' ? undefined : (newPharmacy || undefined)
    });
    setNewRole('');
    setNewLevel('read');
    setNewPharmacy('');
    setLoading(false);
  };

  const handleUpdateLevel = async (permId: string, level: 'read' | 'write' | 'admin') => {
    await onUpdatePermission(permId, { permission_level: level });
  };

  const handleDelete = async (permId: string) => {
    if (confirm('Supprimer cette permission ?')) {
      await onDeletePermission(permId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permissions du canal : {channel.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Permission */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une permission
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Rôle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Niveau</Label>
                <Select value={newLevel} onValueChange={(v) => setNewLevel(v as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pharmacie (inter-tenant)</Label>
                <Select value={newPharmacy} onValueChange={setNewPharmacy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les pharmacies</SelectItem>
                    {pharmacies.map(pharmacy => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.nom_pharmacie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              className="mt-4" 
              onClick={handleAddPermission}
              disabled={!newRole || loading}
            >
              {loading ? 'Ajout...' : 'Ajouter la permission'}
            </Button>
          </div>

          <Separator />

          {/* Current Permissions */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permissions actuelles ({channelPermissions.length})
            </h4>

            <ScrollArea className="h-64">
              {channelPermissions.length > 0 ? (
                <div className="space-y-3">
                  {channelPermissions.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{perm.role}</Badge>
                        {perm.pharmacy_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building className="h-3 w-3" />
                            {perm.pharmacy_name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={perm.permission_level} 
                          onValueChange={(v) => handleUpdateLevel(perm.id, v as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERMISSION_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(perm.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune permission configurée</p>
                  <p className="text-sm">Les permissions par défaut s'appliquent</p>
                </div>
              )}
            </ScrollArea>
          </div>
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

export default ChannelPermissionModal;
