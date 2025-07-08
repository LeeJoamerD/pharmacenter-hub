import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check } from 'lucide-react';

interface SuccessStepProps {
  pharmacyName: string;
}

export const SuccessStep = ({ pharmacyName }: SuccessStepProps) => {
  return (
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
            La pharmacie <strong>{pharmacyName}</strong> a été créée avec succès.
            L'administrateur principal peut maintenant se connecter au système.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-semibold">Prochaines étapes :</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>L'administrateur peut maintenant se connecter avec ses identifiants</li>
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
};