import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User2, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useAdvancedAuth } from '@/hooks/useAdvancedAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ROLES } from '@/types/permissions';

interface UserCreationFormProps {
  mode: 'admin' | 'public';
  showRoleSelector?: boolean;
  showActiveToggle?: boolean;
  defaultRole?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  noms: string;
  prenoms: string;
  email: string;
  telephone_appel: string;
  password: string;
  confirmPassword: string;
  role: string;
  is_active: boolean;
}

// Helper function to parse and translate error messages
const parseCreateUserError = (error: any, t: (key: string) => string): string => {
  const errorMessage = error?.message || error?.error || '';
  
  if (errorMessage.includes('already been registered') || 
      errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate key')) {
    return t('emailAlreadyExists');
  }
  
  if (errorMessage.includes('Missing required fields')) {
    return t('missingRequiredFields');
  }
  
  if (errorMessage.includes('Password must be at least') ||
      errorMessage.includes('password')) {
    return t('passwordMinLength');
  }
  
  if (errorMessage.includes('validate email') ||
      errorMessage.includes('invalid email')) {
    return t('invalidEmailFormat');
  }
  
  if (errorMessage.includes('Failed to create personnel')) {
    return t('personnelCreationError');
  }
  
  return t('genericCreationError');
};

export const UserCreationForm: React.FC<UserCreationFormProps> = ({
  mode,
  showRoleSelector = true,
  showActiveToggle = true,
  defaultRole = 'Vendeur',
  onSuccess,
  onCancel
}) => {
  const { t } = useLanguage();
  const { tenantId } = useTenant();
  const { validatePassword, getPasswordPolicy } = useAdvancedAuth();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    noms: '',
    prenoms: '',
    email: '',
    telephone_appel: '',
    password: '',
    confirmPassword: '',
    role: defaultRole,
    is_active: true
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; policy: any } | undefined>();
  const [passwordPolicy, setPasswordPolicy] = useState<any>(null);

  // Load password policy on mount
  useEffect(() => {
    if (tenantId) {
      getPasswordPolicy().then(setPasswordPolicy).catch(console.error);
    }
  }, [tenantId]);

  // Real-time password validation with debounce
  useEffect(() => {
    if (!formData.password) {
      setValidation(undefined);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const res = await validatePassword(formData.password);
        setValidation(res);
      } catch (error) {
        console.error('Password validation error:', error);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.password, tenantId]);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      toast.error(t('tenantIdNotAvailable'));
      return;
    }

    // Validate required fields
    if (!formData.noms || !formData.prenoms || !formData.email || !formData.password) {
      toast.error(t('missingRequiredFields'));
      return;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordsDoNotMatch') || 'Les mots de passe ne correspondent pas');
      return;
    }

    // Validate password strength
    if (validation && !validation.isValid) {
      const errorMessage = validation.errors && validation.errors.length > 0 
        ? `${t('passwordNotCompliant')}: ${validation.errors.join(', ')}`
        : t('passwordNotCompliant');
      toast.error(errorMessage);
      return;
    }

    // Minimum password length check
    if (formData.password.length < 8) {
      toast.error(t('passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-user-with-personnel', {
        body: {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          noms: formData.noms.trim(),
          prenoms: formData.prenoms.trim(),
          role: formData.role,
          telephone_appel: formData.telephone_appel.trim() || null,
          tenant_id: tenantId
        }
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      // Invalidate queries and notify success
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
      queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
      await queryClient.refetchQueries({ queryKey: ['auth-user'] });
      
      toast.success(t('userCreatedSuccess'));
      
      // Reset form
      setFormData({
        noms: '',
        prenoms: '',
        email: '',
        telephone_appel: '',
        password: '',
        confirmPassword: '',
        role: defaultRole,
        is_active: true
      });
      setValidation(undefined);
      
      onSuccess?.();
    } catch (error: any) {
      console.error('User creation error:', error);
      const translatedMessage = parseCreateUserError(error, t);
      toast.error(translatedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Names Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenoms">{t('firstNamesLabel')} *</Label>
          <div className="relative">
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="prenoms" 
              value={formData.prenoms} 
              onChange={(e) => updateField('prenoms', e.target.value)} 
              className="pl-9" 
              required 
              disabled={loading}
              placeholder={t('firstNamesPlaceholder') || 'Prénoms'}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="noms">{t('namesLabel')} *</Label>
          <div className="relative">
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="noms" 
              value={formData.noms} 
              onChange={(e) => updateField('noms', e.target.value)} 
              className="pl-9" 
              required 
              disabled={loading}
              placeholder={t('namesPlaceholder') || 'Noms'}
            />
          </div>
        </div>
      </div>

      {/* Email and Phone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('emailLabel')} *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email"
              value={formData.email} 
              onChange={(e) => updateField('email', e.target.value)} 
              className="pl-9" 
              required 
              disabled={loading}
              placeholder="exemple@email.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="telephone">{t('phoneLabel') || 'Téléphone'}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="telephone" 
              value={formData.telephone_appel} 
              onChange={(e) => updateField('telephone_appel', e.target.value)} 
              className="pl-9" 
              disabled={loading}
              placeholder="+242 06 xxx xxxx"
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')} *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            id="password" 
            type={showPassword ? "text" : "password"} 
            value={formData.password} 
            onChange={(e) => updateField('password', e.target.value)} 
            placeholder="••••••••" 
            className="pl-9 pr-10" 
            required 
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <PasswordStrengthIndicator password={formData.password} validation={validation} />
        
        {/* Password Policy Display */}
        {passwordPolicy && formData.password && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">{t('securityRequirements') || 'Exigences de sécurité'} :</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• Longueur: {passwordPolicy.min_length || 8}-{passwordPolicy.max_length || 128} caractères</div>
              {passwordPolicy.require_uppercase && <div>• Au moins une majuscule</div>}
              {passwordPolicy.require_lowercase && <div>• Au moins une minuscule</div>}
              {passwordPolicy.require_numbers && <div>• Au moins un chiffre</div>}
              {passwordPolicy.require_special_chars && <div>• Au moins un caractère spécial</div>}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPasswordLabel') || 'Confirmer le mot de passe'} *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            id="confirmPassword" 
            type={showConfirmPassword ? "text" : "password"} 
            value={formData.confirmPassword} 
            onChange={(e) => updateField('confirmPassword', e.target.value)} 
            placeholder="••••••••" 
            className="pl-9 pr-10" 
            required 
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? "Masquer" : "Afficher"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-sm text-destructive">{t('passwordsDoNotMatch') || 'Les mots de passe ne correspondent pas'}</p>
        )}
      </div>

      {/* Role Selector */}
      {showRoleSelector && (
        <div className="space-y-2">
          <Label htmlFor="role">{t('role')} *</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => updateField('role', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ROLES).map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Active Status Toggle */}
      {showActiveToggle && (
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => updateField('is_active', checked)}
            disabled={loading}
          />
          <Label htmlFor="is_active">{t('activeStatus')}</Label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading || !tenantId || (formData.password !== formData.confirmPassword)}
        >
          {loading ? (t('creating') || 'Création...') : (t('create'))}
        </Button>
      </div>
    </form>
  );
};

export default UserCreationForm;
