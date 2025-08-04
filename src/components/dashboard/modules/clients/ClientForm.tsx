import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ClientFormData } from './types';

interface ClientFormProps {
  form: UseFormReturn<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  isEdit: boolean;
  onCancel: () => void;
  client?: any; // Pour accéder au type de client
}

export const ClientForm = ({ form, onSubmit, isEdit, onCancel, client }: ClientFormProps) => {
  const isReadOnly = client && client.type_client !== 'Ordinaire';
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isReadOnly && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Ce client est de type "{client.type_client}". Pour modifier ses informations, 
              utilisez le module {client.type_client === 'Personnel' ? 'Personnel' : 
                                client.type_client === 'Assuré' ? 'Sociétés' : 'Conventionnés'}.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nom_complet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Jean Baptiste KOUAME" disabled={isReadOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+225 0123456789" disabled={isReadOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taux_remise_automatique"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taux de remise (%)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isReadOnly}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="adresse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Adresse complète du client..."
                  className="min-h-[80px]"
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          {!isReadOnly && (
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Modifier' : 'Créer'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};