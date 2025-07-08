import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {currentStep > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 mx-2 ${
              currentStep > s ? 'bg-primary' : 'bg-muted'
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
  );
};