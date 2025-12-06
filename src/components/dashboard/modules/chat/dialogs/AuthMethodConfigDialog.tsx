import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Smartphone, Mail, Key, Fingerprint, MessageSquare, Users } from 'lucide-react';
import type { SecurityAuthMethod } from '@/hooks/useNetworkSecurity';

interface AuthMethodConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methods: SecurityAuthMethod[];
  onToggleMethod: (methodId: string, enabled: boolean) => Promise<void>;
  isUpdating?: boolean;
}

const AuthMethodConfigDialog: React.FC<AuthMethodConfigDialogProps> = ({
  open,
  onOpenChange,
  methods,
  onToggleMethod,
  isUpdating = false,
}) => {
  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'app': return <Smartphone className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'biometric': return <Fingerprint className="h-5 w-5" />;
      case 'hardware_key': return <Key className="h-5 w-5" />;
      default: return <Key className="h-5 w-5" />;
    }
  };

  const getMethodName = (type: string) => {
    switch (type) {
      case 'sms': return 'SMS';
      case 'app': return 'Application d\'authentification';
      case 'email': return 'Email';
      case 'biometric': return 'Biométrie';
      case 'hardware_key': return 'Clé matérielle';
      default: return type;
    }
  };

  const getMethodDescription = (type: string) => {
    switch (type) {
      case 'sms': return 'Code de vérification envoyé par SMS';
      case 'app': return 'Google Authenticator, Authy, etc.';
      case 'email': return 'Code de vérification envoyé par email';
      case 'biometric': return 'Empreinte digitale ou reconnaissance faciale';
      case 'hardware_key': return 'YubiKey ou clé de sécurité FIDO2';
      default: return '';
    }
  };

  const enabledCount = methods.filter(m => m.is_enabled).length;
  const totalEnrolled = methods.reduce((sum, m) => sum + m.users_enrolled_count, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Configuration des Méthodes d'Authentification
          </DialogTitle>
          <DialogDescription>
            Gérez les méthodes 2FA disponibles pour vos utilisateurs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">{enabledCount} méthodes actives</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{totalEnrolled} utilisateurs inscrits</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Methods List */}
          <div className="space-y-3">
            {methods.map((method) => (
              <div 
                key={method.id} 
                className={`p-4 border rounded-lg ${method.is_enabled ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.is_enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getMethodIcon(method.method_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{getMethodName(method.method_type)}</h4>
                        {method.is_required_for_2fa && (
                          <Badge variant="secondary" className="text-xs">Requis</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getMethodDescription(method.method_type)}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={method.is_enabled}
                    onCheckedChange={(v) => onToggleMethod(method.id, v)}
                    disabled={isUpdating}
                  />
                </div>

                {method.is_enabled && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {method.users_enrolled_count} utilisateur(s) inscrit(s)
                    </span>
                    {method.last_used_at && (
                      <span className="text-muted-foreground">
                        Dernière utilisation: {new Date(method.last_used_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {methods.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Aucune méthode d'authentification configurée
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthMethodConfigDialog;
