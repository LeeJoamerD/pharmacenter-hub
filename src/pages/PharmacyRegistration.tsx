import React from 'react';
import { StepIndicator } from '@/components/pharmacy-registration/StepIndicator';
import { PharmacyInfoForm } from '@/components/pharmacy-registration/PharmacyInfoForm';
import { AdminPrincipalForm } from '@/components/pharmacy-registration/AdminPrincipalForm';
import { SuccessStep } from '@/components/pharmacy-registration/SuccessStep';
import { GoogleAuthStep } from '@/components/pharmacy-registration/GoogleAuthStep';
import { RegistrationFlowValidator } from '@/components/RegistrationFlowValidator';
import { usePharmacyRegistration } from '@/hooks/usePharmacyRegistration';

const PharmacyRegistration = () => {
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

        {!showGoogleAuth && <StepIndicator currentStep={step} />}

        {showGoogleAuth && (
          <GoogleAuthStep
            title={authType === 'pharmacy' ? 'Authentification Pharmacie' : 'Authentification Administrateur'}
            description={authType === 'pharmacy' 
              ? 'Connectez-vous avec Google pour sécuriser votre pharmacie'
              : 'Connectez-vous avec un compte Google différent pour l\'administrateur'
            }
            onSuccess={authType === 'pharmacy' ? handlePharmacyGoogleSuccess : handleAdminGoogleSuccess}
            onBack={handleGoogleAuthBack}
            stepType={authType}
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
            onNext={handleAdminFormNext}
            onSubmit={form.handleSubmit(onSubmit)}
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