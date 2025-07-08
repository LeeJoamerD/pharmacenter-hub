import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, MapPin, Phone, Mail, User, Check } from 'lucide-react';

interface PharmacyRegistrationData {
  name: string;
  code: string;
  address: string;
  quartier: string;
  arrondissement: string;
  city: string;
  region: string;
  pays: string;
  email: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  departement: string;
  type: string;
  
  // Administrateur principal
  admin_noms: string;
  admin_prenoms: string;
  admin_email: string;
  admin_telephone: string;
  admin_reference: string;
}

const PharmacyRegistration = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PharmacyRegistrationData>({
    defaultValues: {
      pays: 'Cameroun',
      type: 'standard'
    }
  });

  const onSubmit = async (data: PharmacyRegistrationData) => {
    setIsLoading(true);
    
    try {
      // 1. Créer la pharmacie directement avec Supabase (pas de tenant requis)
      const pharmacyData = {
        name: data.name,
        code: data.code,
        address: data.address,
        quartier: data.quartier,
        arrondissement: data.arrondissement,
        city: data.city,
        region: data.region,
        pays: data.pays,
        email: data.email,
        telephone_appel: data.telephone_appel,
        telephone_whatsapp: data.telephone_whatsapp,
        departement: data.departement,
        type: data.type,
        status: 'active'
      };

      const { data: pharmacyResult, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert(pharmacyData)
        .select()
        .single();

      if (pharmacyError) throw pharmacyError;

      // 2. Créer l'administrateur principal
      const adminData = {
        tenant_id: pharmacyResult.id,
        noms: data.admin_noms,
        prenoms: data.admin_prenoms,
        email: data.admin_email,
        telephone_appel: data.admin_telephone,
        reference_agent: data.admin_reference,
        role: 'Admin'
      };

      const { error: adminError } = await supabase
        .from('personnel')
        .insert(adminData);

      if (adminError) throw adminError;

      toast({ title: 'Pharmacie créée avec succès' });
      setStep(3);
      
    } catch (error: any) {
      toast({
        title: 'Erreur lors de la création',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
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
            <Label htmlFor="code">Code Pharmacie *</Label>
            <Input
              id="code"
              {...form.register('code', { required: true })}
              placeholder="PC001"
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
            <Label htmlFor="region">Région *</Label>
            <Select onValueChange={(value) => form.setValue('region', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Adamaoua">Adamaoua</SelectItem>
                <SelectItem value="Centre">Centre</SelectItem>
                <SelectItem value="Est">Est</SelectItem>
                <SelectItem value="Extrême-Nord">Extrême-Nord</SelectItem>
                <SelectItem value="Littoral">Littoral</SelectItem>
                <SelectItem value="Nord">Nord</SelectItem>
                <SelectItem value="Nord-Ouest">Nord-Ouest</SelectItem>
                <SelectItem value="Ouest">Ouest</SelectItem>
                <SelectItem value="Sud">Sud</SelectItem>
                <SelectItem value="Sud-Ouest">Sud-Ouest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select onValueChange={(value) => form.setValue('type', value)} defaultValue="standard">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hospitalière">Hospitalière</SelectItem>
                <SelectItem value="rurale">Rurale</SelectItem>
                <SelectItem value="clinique">Clinique</SelectItem>
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

        <div className="space-y-2">
          <Label htmlFor="telephone_whatsapp">WhatsApp</Label>
          <Input
            id="telephone_whatsapp"
            {...form.register('telephone_whatsapp')}
            placeholder="+237 6XX XXX XXX"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setStep(2)}>
            Suivant
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
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

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            Précédent
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Création...' : 'Créer la Pharmacie'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          Pharmacie Créée avec Succès !
        </CardTitle>
        <CardDescription>
          Votre pharmacie a été enregistrée dans le système
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            La pharmacie <strong>{form.getValues('name')}</strong> a été créée avec succès.
            L'administrateur principal peut maintenant se connecter au système.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-semibold">Prochaines étapes :</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>L'administrateur doit créer son compte via la page d'inscription</li>
            <li>Configurer les paramètres de la pharmacie</li>
            <li>Ajouter le personnel et leurs rôles</li>
            <li>Configurer le stock initial</li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => window.location.href = '/auth'}>
            Aller à la Connexion
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Inscription Pharmacie PharmaSoft
          </h1>
          <p className="text-muted-foreground">
            Rejoignez notre réseau de pharmacies connectées
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 mx-2 ${
                  step > s ? 'bg-primary' : 'bg-muted'
                }`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-16">
            <span className="text-sm">Pharmacie</span>
            <span className="text-sm">Admin</span>
            <span className="text-sm">Confirmation</span>
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default PharmacyRegistration;