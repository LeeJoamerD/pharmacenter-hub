import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';

interface AdminInfoFormProps {
  form: UseFormReturn<PharmacyRegistrationData>;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const AdminInfoForm = ({ form, onPrevious, onSubmit, isLoading }: AdminInfoFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Administrateur Principal
        </CardTitle>
        <CardDescription>
          Créez le compte administrateur de la pharmacie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin_noms">Nom(s) *</Label>
            <Input
              id="admin_noms"
              {...form.register('admin_noms', { required: true })}
              placeholder="Dupont"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_prenoms">Prénom(s) *</Label>
            <Input
              id="admin_prenoms"
              {...form.register('admin_prenoms', { required: true })}
              placeholder="Marie"
            />
          </div>
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
            <Label htmlFor="admin_telephone">Téléphone *</Label>
            <Input
              id="admin_telephone"
              {...form.register('admin_telephone', { required: true })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_reference">Référence Agent *</Label>
            <Input
              id="admin_reference"
              {...form.register('admin_reference', { required: true })}
              placeholder="ADM001"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_password">Mot de passe *</Label>
          <Input
            id="admin_password"
            type="password"
            {...form.register('admin_password', { required: true, minLength: 6 })}
            placeholder="Minimum 6 caractères"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            Précédent
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Création...' : 'Créer la Pharmacie'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};