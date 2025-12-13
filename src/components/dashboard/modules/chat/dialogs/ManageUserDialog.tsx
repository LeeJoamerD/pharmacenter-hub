import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, User, Phone, Mail } from 'lucide-react';

interface PharmacyUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

interface ManageUserDialogProps {
  user: PharmacyUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, userData: any) => Promise<void>;
  loading?: boolean;
}

export const ManageUserDialog: React.FC<ManageUserDialogProps> = ({
  user,
  open,
  onOpenChange,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    role: '',
    is_active: true,
    phone: '',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role || '',
        is_active: user.is_active ?? true,
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      await onSave(user.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        role: user.role || '',
        is_active: user.is_active ?? true,
        phone: user.phone || '',
        email: user.email || ''
      });
    }
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Gérer l'utilisateur
          </DialogTitle>
          <DialogDescription>
            Modifier les informations de {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={loading || isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Pharmacien Titulaire">Pharmacien Titulaire</SelectItem>
                <SelectItem value="Pharmacien Adjoint">Pharmacien Adjoint</SelectItem>
                <SelectItem value="Préparateur">Préparateur</SelectItem>
                <SelectItem value="Technicien">Technicien</SelectItem>
                <SelectItem value="Caissier">Caissier</SelectItem>
                <SelectItem value="Vendeur">Vendeur</SelectItem>
                <SelectItem value="Gestionnaire de stock">Gestionnaire de stock</SelectItem>
                <SelectItem value="Comptable">Comptable</SelectItem>
                <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                <SelectItem value="Livreur">Livreur</SelectItem>
                <SelectItem value="Stagiaire">Stagiaire</SelectItem>
                <SelectItem value="Invité">Invité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Compte actif</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={loading || isSaving}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading || isSaving}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading || isSaving}
            />
          </div>

          {/* User Info */}
          <div className="pt-4 border-t">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Créé le : {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
              <p>Dernière connexion : {new Date(user.last_login).toLocaleDateString('fr-FR')} à {new Date(user.last_login).toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading || isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};