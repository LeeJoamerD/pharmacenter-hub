import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';

interface PharmacyInfoFormProps {
  form: UseFormReturn<PharmacyRegistrationData>;
  onNext: () => void;
}

export const PharmacyInfoForm = ({ form, onNext }: PharmacyInfoFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informations de la Pharmacie
        </CardTitle>
        <CardDescription>
          Renseignez les informations principales de votre pharmacie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la Pharmacie *</Label>
            <Input
              id="name"
              {...form.register('name', { required: true })}
              placeholder="Pharmacie Centrale"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licence_number">Numéro Licence/Agrément *</Label>
            <Input
              id="licence_number"
              {...form.register('licence_number', { required: true })}
              placeholder="LIC001234"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse *</Label>
          <Input
            id="address"
            {...form.register('address', { required: true })}
            placeholder="123 Avenue Principale"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quartier">Quartier</Label>
            <Input
              id="quartier"
              {...form.register('quartier')}
              placeholder="Centre-ville"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrondissement">Arrondissement</Label>
            <Input
              id="arrondissement"
              {...form.register('arrondissement')}
              placeholder="1er Arrondissement"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departement">Département</Label>
            <Input
              id="departement"
              {...form.register('departement')}
              placeholder="Mfoundi"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ville *</Label>
            <Input
              id="city"
              {...form.register('city', { required: true })}
              placeholder="Yaoundé"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pays">Pays *</Label>
            <Select onValueChange={(value) => form.setValue('pays', value)} defaultValue="Cameroun">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cameroun">Cameroun</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Sénégal">Sénégal</SelectItem>
                <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                <SelectItem value="Gabon">Gabon</SelectItem>
                <SelectItem value="Mali">Mali</SelectItem>
                <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                <SelectItem value="Niger">Niger</SelectItem>
                <SelectItem value="Tchad">Tchad</SelectItem>
                <SelectItem value="République centrafricaine">République centrafricaine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select onValueChange={(value) => form.setValue('type', value)} defaultValue="standard">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Pharmacie Standard</SelectItem>
                <SelectItem value="hospital">Pharmacie Hospitalière</SelectItem>
                <SelectItem value="clinic">Pharmacie de Clinique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email', { required: true })}
              placeholder="contact@pharmacie.cm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone_appel">Téléphone Principal *</Label>
            <Input
              id="telephone_appel"
              {...form.register('telephone_appel', { required: true })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telephone_whatsapp">WhatsApp *</Label>
            <Input
              id="telephone_whatsapp"
              {...form.register('telephone_whatsapp', { required: true })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site web *</Label>
            <Input
              id="website"
              type="url"
              {...form.register('website', { required: true })}
              placeholder="https://www.votrepharmcie.com"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onNext}>
            Suivant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};