import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UseFormReturn } from 'react-hook-form';
import { EmployeeFormData } from './types';

interface EmployeeFormProps {
  form: UseFormReturn<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  isEdit?: boolean;
  onCancel: () => void;
}

export const EmployeeForm = ({ form, onSubmit, isEdit = false, onCancel }: EmployeeFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="noms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Noms</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de famille" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prenoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénoms</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénoms" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fonction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonction</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fonction" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pharmacien titulaire">Pharmacien titulaire</SelectItem>
                      <SelectItem value="Pharmacien adjoint">Pharmacien adjoint</SelectItem>
                      <SelectItem value="Préparateur">Préparateur</SelectItem>
                      <SelectItem value="Étudiant en pharmacie">Étudiant en pharmacie</SelectItem>
                      <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                      <SelectItem value="Comptable">Comptable</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <FormControl>
                    <Input placeholder="Profession" {...field} />
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
                    placeholder="Adresse complète"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="telephone_appel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone d'appel</FormLabel>
                  <FormControl>
                    <Input placeholder="01.23.45.67.89" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telephone_whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="01.23.45.67.89" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemple.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="niu_cni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIU/CNI</FormLabel>
                  <FormControl>
                    <Input placeholder="Numéro d'identification unique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date_naissance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de naissance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_recrutement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de recrutement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="situation_familiale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situation familiale</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la situation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Célibataire">Célibataire</SelectItem>
                      <SelectItem value="Marié(e)">Marié(e)</SelectItem>
                      <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
                      <SelectItem value="Veuf(ve)">Veuf(ve)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombre_enfants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre d'enfants</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="statut_contractuel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut contractuel</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="Stage">Stage</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero_cnss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro CNSS</FormLabel>
                  <FormControl>
                    <Input placeholder="Numéro CNSS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="salaire_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salaire de base</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo_identite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo d'identité</FormLabel>
                  <FormControl>
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file.name);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </ScrollArea>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {isEdit ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  </Form>
);