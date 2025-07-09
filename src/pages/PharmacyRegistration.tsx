import React from 'react';
import { StepIndicator } from '@/components/pharmacy-registration/StepIndicator';
import { PharmacyInfoForm } from '@/components/pharmacy-registration/PharmacyInfoForm';
import { AdminPrincipalForm } from '@/components/pharmacy-registration/AdminPrincipalForm';
import { SuccessStep } from '@/components/pharmacy-registration/SuccessStep';
import { usePharmacyRegistration } from '@/hooks/usePharmacyRegistration';

const PharmacyRegistration = () => {
  const { form, step, setStep, isLoading, onSubmit } = usePharmacyRegistration();

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

        <StepIndicator currentStep={step} />

        {step === 1 && (
          <PharmacyInfoForm 
            form={form} 
            onNext={() => setStep(2)} 
          />
        )}
        {step === 2 && (
          <AdminPrincipalForm 
            form={form}
            onPrevious={() => setStep(1)}
            onSubmit={form.handleSubmit(onSubmit)}
            isLoading={isLoading}
          />
        )}
        {step === 3 && (
          <SuccessStep pharmacyName={form.getValues('name')} />
        )}
      </div>
    </div>
  );
};

export default PharmacyRegistration;