
import React from 'react';
import { StepIndicator } from '@/components/pharmacy-registration/StepIndicator';
import { PharmacyInfoForm } from '@/components/pharmacy-registration/PharmacyInfoForm';
import { AdminPrincipalForm } from '@/components/pharmacy-registration/AdminPrincipalForm';
import { SuccessStep } from '@/components/pharmacy-registration/SuccessStep';
import { GoogleAuthStep } from '@/components/pharmacy-registration/GoogleAuthStep';
import { RegistrationFlowValidator } from '@/components/RegistrationFlowValidator';
import { usePharmacyRegistration } from '@/hooks/usePharmacyRegistration';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const PharmacyRegistration = () => {
  const { user } = useAuth();
  const { 
    form, 
    step, 
    setStep, 
    isLoading, 
    onSubmit,
    showGoogleAuth,
    authType,
    handlePharmacyNext,
    handlePharmacyGoogleSuccess,
    handleAdminFormNext,
    handleAdminGoogleSuccess,
    handleGoogleAuthBack
  } = usePharmacyRegistration();

  // Vérifier si l'utilisateur est déjà authentifié à l'arrivée
  useEffect(() => {
    console.log('REGISTRATION: Vérification de l\'utilisateur à l\'arrivée:', !!user);
    
    if (user) {
      console.log('REGISTRATION: Utilisateur déjà authentifié, pré-remplissage des données...');
      
      // Pré-remplir les données admin avec les informations Google
      if (user.user_metadata?.given_name) {
        form.setValue('admin_prenoms', user.user_metadata.given_name);
      }
      if (user.user_metadata?.family_name) {
        form.setValue('admin_noms', user.user_metadata.family_name);
      }
      form.setValue('admin_email', user.email || '');
      if (user.user_metadata?.phone) {
        form.setValue('admin_telephone_principal', user.user_metadata.phone);
      }
      
      // Générer un mot de passe sécurisé automatiquement
      const securePassword = generateSecurePassword();
      form.setValue('admin_password', securePassword);
    }
  }, [user, form]);

  const generateSecurePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Si l'utilisateur n'est pas authentifié, afficher l'étape d'authentification
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Connecter votre pharmacie
            </h1>
            <p className="text-muted-foreground">
              Rejoignez notre réseau de pharmacies connectées
            </p>
          </div>

          <GoogleAuthStep
            title="Authentification requise"
            description="Authentifiez-vous avec Google pour commencer l'inscription de votre pharmacie"
            onSuccess={(user) => {
              console.log('REGISTRATION: Authentification réussie:', user.email);
              // L'utilisateur sera automatiquement mis à jour via useAuth
            }}
            onBack={() => window.location.href = '/'}
            stepType="pharmacy"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Connecter votre pharmacie
          </h1>
          <p className="text-muted-foreground">
            Rejoignez notre réseau de pharmacies connectées
          </p>
          <div className="mt-2 text-sm text-green-600">
            ✅ Authentifié en tant que: {user.email}
          </div>
        </div>

        {!showGoogleAuth && <StepIndicator currentStep={step} />}

        {showGoogleAuth && (
          <GoogleAuthStep
            title="Authentification requise"
            description="Authentifiez-vous avec Google pour finaliser l'inscription de votre pharmacie"
            onSuccess={handleAdminGoogleSuccess}
            onBack={handleGoogleAuthBack}
            stepType="admin"
          />
        )}

        {!showGoogleAuth && step === 1 && (
          <PharmacyInfoForm 
            form={form} 
            onNext={handlePharmacyNext}
          />
        )}
        {!showGoogleAuth && step === 2 && (
          <AdminPrincipalForm 
            form={form}
            onPrevious={() => setStep(1)}
            onSubmit={handleAdminFormNext}
            isLoading={isLoading}
          />
        )}
        {!showGoogleAuth && step === 3 && (
          <SuccessStep pharmacyName={form.getValues('name')} />
        )}

        {/* Validation en temps réel (développement uniquement) */}
        <RegistrationFlowValidator 
          data={form.getValues()} 
          currentStep={step} 
        />
      </div>
    </div>
  );
};

export default PharmacyRegistration;
