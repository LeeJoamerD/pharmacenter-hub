import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientForm } from './ClientForm';
import { Client, ClientFormData } from './types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema } from './types';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export const ClientDialog = ({ 
  open, 
  onOpenChange, 
  client, 
  onSubmit, 
  onCancel 
}: ClientDialogProps) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      nom_complet: client?.nom_complet || '',
      telephone: client?.telephone || '',
      adresse: client?.adresse || '',
      taux_remise_automatique: client?.taux_remise_automatique || 0,
    }
  });

  React.useEffect(() => {
    if (client) {
      form.reset({
        nom_complet: client.nom_complet || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        taux_remise_automatique: client.taux_remise_automatique || 0,
      });
    } else {
      form.reset({
        nom_complet: '',
        telephone: '',
        adresse: '',
        taux_remise_automatique: 0,
      });
    }
  }, [client, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="client-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {client ? 'Modifier le client' : 'Créer un nouveau client'}
          </DialogTitle>
          <div id="client-form-description" className="sr-only">
            Formulaire pour {client ? 'modifier les informations d\'un' : 'créer un nouveau'} client.
            Tous les champs marqués d'un astérisque sont obligatoires.
          </div>
        </DialogHeader>
        <ClientForm
          form={form}
          onSubmit={onSubmit}
          isEdit={!!client}
          onCancel={onCancel}
          client={client}
        />
      </DialogContent>
    </Dialog>
  );
};