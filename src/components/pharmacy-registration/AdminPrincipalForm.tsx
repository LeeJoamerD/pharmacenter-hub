import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';
import { useEffect } from 'react';

interface AdminPrincipalFormProps {
  form: UseFormReturn<PharmacyRegistrationData>;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const AdminPrincipalForm = ({ form, onPrevious, onSubmit, isLoading }: AdminPrincipalFormProps) => {
  const watchFirstName = form.watch('admin_prenoms');
  const watchLastName = form.watch('admin_noms');
  const pharmacyName = form.watch('name');

  // Auto-generate reference agent
  useEffect(() => {
    if (watchFirstName && watchLastName) {
      const firstName = watchFirstName.trim().split(' ')[0]; // Premier prénom
      const lastNamePrefix = watchLastName.trim().substring(0, 3).toUpperCase(); // 3 premières lettres du nom
      const reference = `${firstName}_${lastNamePrefix}`;
      form.setValue('admin_reference', reference);
    }
  }, [watchFirstName, watchLastName, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Créer le Compte Administrateur Principal
        </CardTitle>
        <CardDescription>
          Créez le compte de l'administrateur principal pour votre pharmacie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nom de la pharmacie (non-éditable) */}
        <div className="space-y-2">
          <Label htmlFor="pharmacy_name">Pharmacie</Label>
          <Input
            id="pharmacy_name"
            value={pharmacyName || ''}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin_noms">Nom(s) *</Label>
            <Input
              id="admin_noms"
              {...form.register('admin_noms', { required: true })}
              placeholder="DIAMBOMBA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_prenoms">Prénom(s) *</Label>
            <Input
              id="admin_prenoms"
              {...form.register('admin_prenoms', { required: true })}
              placeholder="Joamer Lee"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_reference">Référence Agent</Label>
          <Input
            id="admin_reference"
            {...form.register('admin_reference')}
            disabled
            className="bg-muted"
            placeholder="Généré automatiquement"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_email">Email *</Label>
          <Input
            id="admin_email"
            type="email"
            {...form.register('admin_email', { required: true })}
            placeholder="admin@pharmacie.cm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin_telephone_principal">Téléphone Principal *</Label>
            <Input
              id="admin_telephone_principal"
              {...form.register('admin_telephone_principal', { required: true })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_whatsapp">WhatsApp *</Label>
            <Input
              id="admin_whatsapp"
              {...form.register('admin_whatsapp', { required: true })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_role">Rôle *</Label>
          <Select onValueChange={(value) => form.setValue('admin_role', value)} defaultValue="Administrateur Principal">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vendeur">Vendeur</SelectItem>
              <SelectItem value="Caissier">Caissier</SelectItem>
              <SelectItem value="Gestionnaire de stock">Gestionnaire de stock</SelectItem>
              <SelectItem value="Comptable">Comptable</SelectItem>
              <SelectItem value="Administrateur">Administrateur</SelectItem>
              <SelectItem value="Administrateur Principal">Administrateur Principal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_password">Mot de passe *</Label>
          <Input
            id="admin_password"
            type="password"
            {...form.register('admin_password', { required: true })}
            placeholder="Mot de passe sécurisé"
          />
        </div>

        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Création...' : 'Créer le Compte'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};