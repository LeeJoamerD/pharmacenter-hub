import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  validation?: {
    isValid: boolean;
    errors: string[];
    policy: any;
  };
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  validation
}) => {
  const calculateStrength = () => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    Object.values(checks).forEach(check => {
      if (check) score += 20;
    });

    return { score, checks };
  };

  const { score, checks } = calculateStrength();

  const getStrengthLabel = () => {
    if (score < 40) return 'Très faible';
    if (score < 60) return 'Faible';
    if (score < 80) return 'Moyen';
    if (score < 100) return 'Fort';
    return 'Très fort';
  };

  const getStrengthColor = () => {
    if (score < 40) return 'bg-destructive';
    if (score < 60) return 'bg-orange-500';
    if (score < 80) return 'bg-yellow-500';
    if (score < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Force du mot de passe</span>
        <span className="text-sm text-muted-foreground">{getStrengthLabel()}</span>
      </div>
      
      <Progress value={score} className="h-2" />
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1 ${checks.length ? 'text-green-600' : 'text-red-600'}`}>
          {checks.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          Au moins 8 caractères
        </div>
        
        <div className={`flex items-center gap-1 ${checks.uppercase ? 'text-green-600' : 'text-red-600'}`}>
          {checks.uppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          Une majuscule
        </div>
        
        <div className={`flex items-center gap-1 ${checks.lowercase ? 'text-green-600' : 'text-red-600'}`}>
          {checks.lowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          Une minuscule
        </div>
        
        <div className={`flex items-center gap-1 ${checks.numbers ? 'text-green-600' : 'text-red-600'}`}>
          {checks.numbers ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          Un chiffre
        </div>
        
        <div className={`flex items-center gap-1 ${checks.special ? 'text-green-600' : 'text-red-600'}`}>
          {checks.special ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          Un caractère spécial
        </div>
      </div>

      {validation && validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-red-600">
              <XCircle className="h-3 w-3" />
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};