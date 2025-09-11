import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { EmployeeFormData } from './types';
import { ImageUpload } from './ImageUpload';

interface EmployeeFormProps {
  form: UseFormReturn<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  isEdit?: boolean;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmployeeForm = ({ form, onSubmit, isEdit = false, onCancel, isLoading = false }: EmployeeFormProps) => (
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
                  <FormLabel>
                    Noms <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nom de famille" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
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
                  <FormLabel>
                    Prénoms <span className="text-destructive">*</span>
                  </FormLabel>
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
                  <FormLabel>
                    Fonction <span className="text-destructive">*</span>
                  </FormLabel>
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
                      <SelectItem value="Vendeur">Vendeur</SelectItem>
                      <SelectItem value="Caissier">Caissier</SelectItem>
                      <SelectItem value="Agent d'entretien">Agent d'entretien</SelectItem>
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
                  <FormLabel>Profession (optionnel)</FormLabel>
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
                <FormLabel>Adresse (optionnel)</FormLabel>
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
                  <FormLabel>
                    Téléphone d'appel <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+237 6XX XXX XXX ou 6XX XXX XXX" {...field} />
                  </FormControl>
                  <FormDescription>
                    Formats acceptés: +237 6XX XXX XXX, 237 6XX XXX XXX, 6XX XXX XXX
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telephone_whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="+237 6XX XXX XXX ou 6XX XXX XXX" {...field} />
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
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
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
                  <FormLabel>
                    NIU/CNI <span className="text-destructive">*</span>
                  </FormLabel>
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
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Date de naissance <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "dd/MM/yyyy")
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        captionLayout="dropdown-buttons"
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_recrutement"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Date de recrutement <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "dd/MM/yyyy")
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
                  <FormLabel>
                    Situation familiale <span className="text-destructive">*</span>
                  </FormLabel>
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
                  <FormLabel>
                    Statut contractuel <span className="text-destructive">*</span>
                  </FormLabel>
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
                  <FormLabel>Numéro CNSS (optionnel)</FormLabel>
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
                  <FormLabel>Salaire de base (optionnel)</FormLabel>
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
                  <ImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                    label="Photo d'identité"
                  />
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
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading 
            ? 'Enregistrement...' 
            : (isEdit ? 'Modifier' : 'Créer')
          }
        </Button>
      </div>
    </form>
  </Form>
);