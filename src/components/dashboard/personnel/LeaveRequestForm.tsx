import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LeaveRequestFormData } from './types';

interface LeaveRequestFormProps {
  form: UseFormReturn<LeaveRequestFormData>;
  onSubmit: (data: LeaveRequestFormData) => void;
  isEdit: boolean;
  onCancel: () => void;
  employees: Array<{ id: string; noms: string; prenoms: string; }>;
}

export const LeaveRequestForm = ({ form, onSubmit, isEdit, onCancel, employees }: LeaveRequestFormProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employe_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employé</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.prenoms} {employee.noms}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type_conge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de congé</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Congés payés">Congés payés</SelectItem>
                    <SelectItem value="Congé maladie">Congé maladie</SelectItem>
                    <SelectItem value="Congé maternité">Congé maternité</SelectItem>
                    <SelectItem value="Congé paternité">Congé paternité</SelectItem>
                    <SelectItem value="Congé sans solde">Congé sans solde</SelectItem>
                    <SelectItem value="Formation">Formation</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_debut"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
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
                          format(new Date(field.value), "PPP", { locale: fr })
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
                      onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_fin"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin</FormLabel>
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
                          format(new Date(field.value), "PPP", { locale: fr })
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
                      onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      disabled={(date) => {
                        const startDate = form.getValues('date_debut');
                        return date < new Date() || (startDate && date < new Date(startDate));
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="motif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motif</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Décrivez le motif de la demande de congé..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commentaires"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commentaires</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Commentaires additionnels..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
          <FormField
            control={form.control}
            name="statut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut de la demande" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Approuvé">Approuvé</SelectItem>
                    <SelectItem value="Rejeté">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {isEdit ? 'Modifier' : 'Créer'} la demande
          </Button>
        </div>
      </form>
    </Form>
  );
};