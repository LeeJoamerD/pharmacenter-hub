import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Phone, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'email' | 'phone';
  target: string; // email ou numéro masqué
  onVerify: (code: string) => Promise<{ success: boolean }>;
  onResend: () => Promise<{ success: boolean }>;
  isVerifying: boolean;
  isSending: boolean;
  expiresAt: Date | null;
  isVerified: boolean;
}

export function VerificationDialog({
  open,
  onOpenChange,
  type,
  target,
  onVerify,
  onResend,
  isVerifying,
  isSending,
  expiresAt,
  isVerified,
}: VerificationDialogProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pour expiration
  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setCountdown(diff);
      if (diff === 0) setCanResend(true);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Resend timer (60 secondes minimum entre chaque envoi)
  useEffect(() => {
    if (open) {
      setCanResend(false);
      const timer = setTimeout(() => setCanResend(true), 60000);
      return () => clearTimeout(timer);
    }
  }, [open, isSending]);

  // Reset le code quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  // Focus sur le prochain input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quand le code est complet
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      onVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setCode(newCode);
      if (pastedData.length === 6) {
        onVerify(pastedData);
      }
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    await onResend();
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const Icon = type === 'email' ? Mail : Phone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {isVerified ? (
              <Check className="h-8 w-8 text-green-600" />
            ) : (
              <Icon className="h-8 w-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {isVerified 
              ? (type === 'email' ? 'Email vérifié !' : 'Téléphone vérifié !')
              : (type === 'email' ? 'Vérifiez votre email' : 'Vérifiez votre téléphone')
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            {isVerified ? (
              <span className="text-green-600">Vérification réussie</span>
            ) : (
              <>
                Un code à 6 chiffres a été envoyé à<br />
                <span className="font-medium text-foreground">{target}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isVerified && (
          <div className="space-y-6 py-4">
            {/* Code inputs */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  disabled={isVerifying}
                  className={cn(
                    "h-14 w-12 text-center text-2xl font-bold",
                    "focus:ring-2 focus:ring-primary",
                    digit && "border-primary"
                  )}
                />
              ))}
            </div>

            {/* Countdown */}
            {countdown > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Le code expire dans <span className="font-medium">{formatCountdown(countdown)}</span>
              </p>
            )}

            {/* Boutons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => onVerify(code.join(''))}
                disabled={code.some(c => !c) || isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Vérifier'
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleResend}
                disabled={!canResend || isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renvoyer le code
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="py-4">
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full"
            >
              Continuer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
