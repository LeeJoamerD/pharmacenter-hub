import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Shield,
  UserPlus
} from 'lucide-react';
import { useAdminCreation } from '@/hooks/useAdminCreation';
import { useVerification } from '@/hooks/useVerification';
import { VerificationDialog } from '@/components/verification/VerificationDialog';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

interface AdminCreationDialogProps {
  open: boolean;
  pharmacyId: string;
  pharmacyEmail: string;
  pharmacyName: string;
  onSuccess: () => void;
}

export function AdminCreationDialog({
  open,
  pharmacyId,
  pharmacyEmail,
  pharmacyName,
  onSuccess,
}: AdminCreationDialogProps) {
  const [formData, setFormData] = useState({
    prenoms: '',
    noms: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const { createAdmin, isCreating, validatePasswordBasic, validateAdminEmail } = useAdminCreation(
    pharmacyId,
    pharmacyEmail
  );

  const verification = useVerification({
    onEmailVerified: () => {
      setShowEmailDialog(false);
      // Déclencher automatiquement l'envoi du code SMS après vérification email
      setTimeout(() => {
        handleSendPhoneCode();
      }, 500);
    },
    onPhoneVerified: () => {
      setShowPhoneDialog(false);
      // Créer le compte admin automatiquement
      handleCreateAdmin();
    },
  });

  // Validation en temps réel de l'email différent
  useEffect(() => {
    if (formData.email) {
      const validation = validateAdminEmail(formData.email);
      setEmailError(validation.valid ? null : validation.error || null);
    } else {
      setEmailError(null);
    }
  }, [formData.email, validateAdminEmail]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset verification si l'email ou le téléphone change
    if (field === 'email' || field === 'phone') {
      verification.reset();
    }
  };

  const handleSendEmailCode = async () => {
    if (!formData.email) return;
    
    // Vérifier d'abord que l'email est différent de la pharmacie
    const validation = validateAdminEmail(formData.email);
    if (!validation.valid) {
      setEmailError(validation.error || null);
      return;
    }

    const result = await verification.sendEmailCode(formData.email, pharmacyName);
    if (result.success) {
      setShowEmailDialog(true);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!formData.phone) return;
    
    const result = await verification.sendPhoneCode(formData.email, formData.phone, pharmacyName);
    if (result.success) {
      setShowPhoneDialog(true);
    }
  };

  const handleCreateAdmin = async () => {
    // Vérifier les mots de passe
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    const result = await createAdmin({
      prenoms: formData.prenoms,
      noms: formData.noms,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    if (result.success) {
      onSuccess();
    }
  };

  const handleStartVerification = () => {
    // Valider tous les champs
    if (!formData.prenoms || !formData.noms || !formData.email || !formData.phone || !formData.password) {
      return;
    }

    // Vérifier les mots de passe
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    // Vérifier la validation du mot de passe
    const passwordValidation = validatePasswordBasic(formData.password);
    if (!passwordValidation.isValid) {
      return;
    }

    // Vérifier que l'email est différent de la pharmacie
    if (emailError) {
      return;
    }

    // Commencer par la vérification email
    handleSendEmailCode();
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(-4).padStart(phone.length, '*');
  };

  const isFormValid = 
    formData.prenoms && 
    formData.noms && 
    formData.email && 
    formData.phone && 
    formData.password && 
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    !emailError &&
    validatePasswordBasic(formData.password).isValid;

  const passwordValidation = validatePasswordBasic(formData.password);

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              Créer votre compte administrateur
            </DialogTitle>
            <DialogDescription className="text-center">
              Cette étape est obligatoire pour gérer votre pharmacie.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Important :</strong> L'email doit être différent de celui de la pharmacie 
              ({pharmacyEmail})
            </AlertDescription>
          </Alert>

          {/* Indicateur de progression */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                verification.emailVerified ? 'bg-green-500' : 'bg-muted'
              }`}>
                {verification.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Mail className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm ${verification.emailVerified ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                Email
              </span>
            </div>
            <div className="h-0.5 w-8 bg-muted" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                verification.phoneVerified ? 'bg-green-500' : 'bg-muted'
              }`}>
                {verification.phoneVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Phone className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm ${verification.phoneVerified ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                Téléphone
              </span>
            </div>
          </div>

          <div className="space-y-4 py-2">
            {/* Prénoms et Noms */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="admin-prenoms" className="text-sm font-medium">
                  Prénoms *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="admin-prenoms"
                    type="text"
                    placeholder="Jean"
                    value={formData.prenoms}
                    onChange={(e) => handleInputChange('prenoms', e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-noms" className="text-sm font-medium">
                  Noms *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="admin-noms"
                    type="text"
                    placeholder="Dupont"
                    value={formData.noms}
                    onChange={(e) => handleInputChange('noms', e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium flex items-center gap-2">
                Email *
                {verification.emailVerified && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 h-10 ${emailError ? 'border-destructive' : ''}`}
                  required
                  disabled={verification.emailVerified}
                />
              </div>
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="admin-phone" className="text-sm font-medium flex items-center gap-2">
                Téléphone *
                {verification.phoneVerified && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="admin-phone"
                  type="tel"
                  placeholder="+242 XX XXX XX XX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10 h-10"
                  required
                  disabled={verification.phoneVerified}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">
                  Mot de passe *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 h-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password" className="text-sm font-medium">
                  Confirmer *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 h-10 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? 'border-destructive' 
                        : ''
                    }`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
            )}

            {/* Indicateur de force du mot de passe */}
            {formData.password && (
              <PasswordStrengthIndicator 
                password={formData.password} 
                validation={passwordValidation}
              />
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-2 pt-2">
            {!verification.isAllVerified ? (
              <Button
                onClick={handleStartVerification}
                disabled={!isFormValid || verification.isSendingEmail || verification.isSendingPhone}
                className="w-full h-11"
              >
                {verification.isSendingEmail || verification.isSendingPhone ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Vérifier mon email
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCreateAdmin}
                disabled={isCreating}
                className="w-full h-11"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer mon compte
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs de vérification OTP */}
      <VerificationDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        type="email"
        target={formData.email}
        onVerify={(code) => verification.verifyEmailCode(formData.email, code)}
        onResend={() => verification.sendEmailCode(formData.email, pharmacyName)}
        isVerifying={verification.isVerifyingEmail}
        isSending={verification.isSendingEmail}
        expiresAt={verification.emailExpiresAt}
        isVerified={verification.emailVerified}
      />

      <VerificationDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        type="phone"
        target={maskPhone(formData.phone)}
        onVerify={(code) => verification.verifyPhoneCode(formData.email, code)}
        onResend={() => verification.sendPhoneCode(formData.email, formData.phone, pharmacyName)}
        isVerifying={verification.isVerifyingPhone}
        isSending={verification.isSendingPhone}
        expiresAt={verification.phoneExpiresAt}
        isVerified={verification.phoneVerified}
      />
    </>
  );
}
