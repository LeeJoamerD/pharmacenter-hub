import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Building, 
  MessageSquare, 
  FileText,
  Video,
  Users,
  Search,
  Shield,
  Check,
  X
} from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  code?: string;
  city?: string;
  region?: string;
  status: string;
}

interface ChatPermission {
  id: string;
  source_tenant_id: string;
  target_tenant_id: string;
  permission_type: 'chat' | 'channel_invite' | 'file_share' | 'video_call';
  is_granted: boolean;
}

interface InterTenantPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTenantId: string;
  pharmacies: Pharmacy[];
  existingPermissions: ChatPermission[];
  onUpdatePermission: (data: {
    targetTenantId: string;
    permissionType: 'chat' | 'channel_invite' | 'file_share' | 'video_call';
    isGranted: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

const PERMISSION_TYPES = [
  { type: 'chat' as const, label: 'Chat', icon: MessageSquare, description: 'Messagerie directe' },
  { type: 'channel_invite' as const, label: 'Invitations canaux', icon: Users, description: 'Inviter aux canaux' },
  { type: 'file_share' as const, label: 'Partage fichiers', icon: FileText, description: 'Partager des fichiers' },
  { type: 'video_call' as const, label: 'Appels vidéo', icon: Video, description: 'Appels vidéo/audio' }
];

const InterTenantPermissionDialog = ({
  open,
  onOpenChange,
  currentTenantId,
  pharmacies,
  existingPermissions,
  onUpdatePermission,
  loading = false
}: InterTenantPermissionDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  // Filter out current pharmacy
  const otherPharmacies = pharmacies.filter(p => p.id !== currentTenantId);
  
  const filteredPharmacies = otherPharmacies.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get permission status for a specific pharmacy and type
  const getPermissionStatus = (pharmacyId: string, permissionType: string): boolean => {
    const key = `${pharmacyId}-${permissionType}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    
    const existing = existingPermissions.find(
      p => p.target_tenant_id === pharmacyId && p.permission_type === permissionType
    );
    return existing?.is_granted ?? false;
  };

  // Handle permission toggle
  const handleTogglePermission = (pharmacyId: string, permissionType: string, isGranted: boolean) => {
    const key = `${pharmacyId}-${permissionType}`;
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(key, isGranted);
      return newMap;
    });
  };

  // Save all pending changes
  const handleSaveChanges = async () => {
    try {
      for (const [key, isGranted] of pendingChanges.entries()) {
        const [pharmacyId, permissionType] = key.split('-');
        await onUpdatePermission({
          targetTenantId: pharmacyId,
          permissionType: permissionType as 'chat' | 'channel_invite' | 'file_share' | 'video_call',
          isGranted
        });
      }

      toast({
        title: "Permissions mises à jour",
        description: "Les permissions inter-pharmacies ont été sauvegardées."
      });

      setPendingChanges(new Map());
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions.",
        variant: "destructive"
      });
    }
  };

  // Count granted permissions for a pharmacy
  const countGrantedPermissions = (pharmacyId: string): number => {
    return PERMISSION_TYPES.filter(p => getPermissionStatus(pharmacyId, p.type)).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions Inter-Pharmacies
          </DialogTitle>
          <DialogDescription>
            Gérez les permissions de communication entre votre pharmacie et les autres officines du réseau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Liste des pharmacies */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une pharmacie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredPharmacies.length > 0 ? (
                  filteredPharmacies.map((pharmacy) => {
                    const grantedCount = countGrantedPermissions(pharmacy.id);
                    return (
                      <div
                        key={pharmacy.id}
                        onClick={() => setSelectedPharmacy(pharmacy)}
                        className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                          selectedPharmacy?.id === pharmacy.id
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{pharmacy.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {pharmacy.city}{pharmacy.region ? `, ${pharmacy.region}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {grantedCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {grantedCount}/{PERMISSION_TYPES.length}
                            </Badge>
                          )}
                          <div className={`w-2 h-2 rounded-full ${
                            pharmacy.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucune pharmacie trouvée
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Détails des permissions */}
          <div className="border rounded-lg p-4">
            {selectedPharmacy ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedPharmacy.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPharmacy.code ? `Code: ${selectedPharmacy.code}` : ''} 
                    {selectedPharmacy.city ? ` • ${selectedPharmacy.city}` : ''}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Permissions accordées</Label>
                  
                  {PERMISSION_TYPES.map(({ type, label, icon: Icon, description }) => (
                    <div key={type} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </div>
                      </div>
                      <Switch
                        checked={getPermissionStatus(selectedPharmacy.id, type)}
                        onCheckedChange={(checked) => 
                          handleTogglePermission(selectedPharmacy.id, type, checked)
                        }
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total: {countGrantedPermissions(selectedPharmacy.id)}/{PERMISSION_TYPES.length} permissions
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        PERMISSION_TYPES.forEach(p => 
                          handleTogglePermission(selectedPharmacy.id, p.type, false)
                        );
                      }}
                      disabled={loading}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Tout retirer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        PERMISSION_TYPES.forEach(p => 
                          handleTogglePermission(selectedPharmacy.id, p.type, true)
                        );
                      }}
                      disabled={loading}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Tout accorder
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez une pharmacie pour gérer ses permissions
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {pendingChanges.size > 0 && (
            <span className="text-sm text-muted-foreground mr-auto">
              {pendingChanges.size} modification(s) en attente
            </span>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Fermer
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={loading || pendingChanges.size === 0}
          >
            Sauvegarder les modifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterTenantPermissionDialog;
