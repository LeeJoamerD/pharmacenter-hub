import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, RefreshCw, Key, Calendar, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { EncryptionConfig, KeyRotation } from '@/hooks/useNetworkSecurity';

interface EncryptionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EncryptionConfig | null;
  rotations: KeyRotation[];
  onRotateKey: (configId: string) => Promise<void>;
  isRotating?: boolean;
}

const EncryptionDetailDialog: React.FC<EncryptionDetailDialogProps> = ({
  open,
  onOpenChange,
  config,
  rotations,
  onRotateKey,
  isRotating = false,
}) => {
  if (!config) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  const configRotations = rotations.filter(r => r.encryption_config_id === config.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Configuration de Chiffrement
          </DialogTitle>
          <DialogDescription>
            Détails et historique des rotations de clés pour {config.resource_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Status Header */}
            <div className="flex items-center gap-3">
              <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                {config.status === 'active' ? 'Actif' : config.status}
              </Badge>
              {config.auto_rotation_enabled && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  Rotation Automatique
                </Badge>
              )}
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ressource</p>
                <p className="font-medium">{config.resource_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Type de chiffrement</p>
                <p className="font-medium">{config.encryption_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Algorithme</p>
                <p className="font-medium">{config.algorithm}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Période de rotation</p>
                <p className="font-medium">{config.key_rotation_days} jours</p>
              </div>
            </div>

            <Separator />

            {/* Rotation Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dernière rotation</span>
                </div>
                <p className="font-medium">{formatDate(config.last_rotation_at)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Prochaine rotation</span>
                </div>
                <p className="font-medium">{formatDate(config.next_rotation_at)}</p>
              </div>
            </div>

            {/* Keys Info */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Clés actives</p>
                    <p className="text-sm text-muted-foreground">
                      {config.active_keys_count} clé(s) en circulation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Sécurisé</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Options de sécurité</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>Rotation automatique</span>
                  <span className={config.auto_rotation_enabled ? 'text-green-600' : 'text-gray-500'}>
                    {config.auto_rotation_enabled ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>Chiffrement métadonnées</span>
                  <span className={config.metadata_encryption ? 'text-green-600' : 'text-gray-500'}>
                    {config.metadata_encryption ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Rotation History */}
            <div>
              <h4 className="font-medium mb-3">Historique des rotations</h4>
              {configRotations.length > 0 ? (
                <div className="space-y-2">
                  {configRotations.slice(0, 5).map((rotation) => (
                    <div key={rotation.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium capitalize">{rotation.rotation_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(rotation.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={rotation.status === 'completed' ? 'default' : 'secondary'}>
                        {rotation.status === 'completed' ? 'Terminé' : rotation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune rotation enregistrée</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button 
            onClick={() => onRotateKey(config.id)} 
            disabled={isRotating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRotating ? 'animate-spin' : ''}`} />
            Rotation manuelle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EncryptionDetailDialog;
