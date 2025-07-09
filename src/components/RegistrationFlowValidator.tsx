import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PharmacyRegistrationData } from '@/types/pharmacy-registration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationResult {
  field: string;
  isValid: boolean;
  message: string;
  severity: 'error' | 'warning' | 'success';
}

interface RegistrationFlowValidatorProps {
  data: PharmacyRegistrationData;
  currentStep: number;
}

export const RegistrationFlowValidator = ({ data, currentStep }: RegistrationFlowValidatorProps) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [showValidator, setShowValidator] = useState(false);

  // Ne pas afficher en production
  if (process.env.NODE_ENV === 'production') return null;

  useEffect(() => {
    const validateData = () => {
      const results: ValidationResult[] = [];

      // Validation Étape 1 - Pharmacie
      if (currentStep >= 1) {
        // Nom pharmacie
        if (data.name) {
          results.push({
            field: 'name',
            isValid: data.name.length >= 3,
            message: data.name.length >= 3 ? 'Nom valide' : 'Nom trop court (min 3 caractères)',
            severity: data.name.length >= 3 ? 'success' : 'error'
          });
        }

        // Licence
        if (data.licence_number) {
          const licenceValid = /^[A-Z0-9]{3,20}$/.test(data.licence_number);
          results.push({
            field: 'licence_number',
            isValid: licenceValid,
            message: licenceValid ? 'Numéro de licence valide' : 'Format de licence invalide',
            severity: licenceValid ? 'success' : 'error'
          });
        }

        // Email pharmacie
        if (data.email) {
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
          results.push({
            field: 'email',
            isValid: emailValid,
            message: emailValid ? 'Email valide' : 'Format email invalide',
            severity: emailValid ? 'success' : 'error'
          });
        }

        // Téléphone
        if (data.telephone_appel) {
          const phoneValid = /^\+?[0-9\s-]{8,}$/.test(data.telephone_appel);
          results.push({
            field: 'telephone_appel',
            isValid: phoneValid,
            message: phoneValid ? 'Téléphone valide' : 'Format téléphone invalide',
            severity: phoneValid ? 'success' : 'warning'
          });
        }
      }

      // Validation Étape 2 - Administrateur
      if (currentStep >= 2) {
        // Email admin
        if (data.admin_email) {
          const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.admin_email);
          const differentFromPharmacy = data.admin_email !== data.email;
          
          results.push({
            field: 'admin_email',
            isValid: emailValid,
            message: emailValid ? 'Email admin valide' : 'Format email admin invalide',
            severity: emailValid ? 'success' : 'error'
          });

          if (emailValid) {
            results.push({
              field: 'admin_email_unique',
              isValid: differentFromPharmacy,
              message: differentFromPharmacy ? 'Email admin différent' : 'Email admin identique à la pharmacie',
              severity: differentFromPharmacy ? 'success' : 'warning'
            });
          }
        }

        // Mot de passe
        if (data.admin_password) {
          const passwordStrong = data.admin_password.length >= 8;
          const hasNumbers = /\d/.test(data.admin_password);
          const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(data.admin_password);
          
          results.push({
            field: 'admin_password',
            isValid: passwordStrong,
            message: passwordStrong ? 'Mot de passe suffisant' : 'Mot de passe trop court (min 8 caractères)',
            severity: passwordStrong ? 'success' : 'error'
          });

          if (passwordStrong) {
            results.push({
              field: 'admin_password_strength',
              isValid: hasNumbers && hasSpecialChars,
              message: hasNumbers && hasSpecialChars ? 'Mot de passe sécurisé' : 'Ajoutez des chiffres et caractères spéciaux',
              severity: hasNumbers && hasSpecialChars ? 'success' : 'warning'
            });
          }
        }

        // Référence agent
        if (data.admin_reference) {
          const refValid = data.admin_reference.length >= 3;
          results.push({
            field: 'admin_reference',
            isValid: refValid,
            message: refValid ? 'Référence agent valide' : 'Référence trop courte',
            severity: refValid ? 'success' : 'warning'
          });
        }
      }

      setValidations(results);
    };

    validateData();
  }, [data, currentStep]);

  const errors = validations.filter(v => v.severity === 'error');
  const warnings = validations.filter(v => v.severity === 'warning');
  const successes = validations.filter(v => v.severity === 'success');

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowValidator(!showValidator)}
        className="mb-2"
      >
        Validation: {successes.length}/{validations.length}
        {errors.length > 0 && ` (${errors.length} erreurs)`}
      </Button>

      {showValidator && validations.length > 0 && (
        <Alert className="bg-background/95 backdrop-blur">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Validation Formulaire</div>
              {validations.map((validation, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {validation.severity === 'success' && <CheckCircle className="h-3 w-3 text-green-500 mt-1" />}
                  {validation.severity === 'error' && <XCircle className="h-3 w-3 text-red-500 mt-1" />}
                  {validation.severity === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500 mt-1" />}
                  <div>
                    <div className="font-medium capitalize">{validation.field.replace('_', ' ')}</div>
                    <div className="text-muted-foreground text-xs">{validation.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};