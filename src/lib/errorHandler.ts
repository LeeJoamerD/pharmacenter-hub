import { toast } from 'sonner';

export const handleError = (error: unknown, userMessage: string) => {
  // Log en développement uniquement
  if (import.meta.env.DEV) {
    console.error('Dev Error:', error);
  }
  
  // Message générique pour l'utilisateur
  toast.error(userMessage);
};

export const handleSuccess = (message: string) => {
  toast.success(message);
};
