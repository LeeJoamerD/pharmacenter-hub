import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { TrainingFormData, trainingSchema, Employee } from './types';

interface TrainingFormProps {
  form: UseFormReturn<TrainingFormData>;
  onSubmit: (data: TrainingFormData) => void;
  isEdit: boolean;
  onCancel: () => void;
  employees: Employee[];
}

export const TrainingForm: React.FC<TrainingFormProps> = ({ 
  form, 
  onSubmit, 
  isEdit, 
  onCancel,
  employees 
}) => {
  const selectedEmployees = form.watch('employes') || [];

  const addEmployee = (employeeName: string) => {
    if (!selectedEmployees.includes(employeeName)) {
      form.setValue('employes', [...selectedEmployees, employeeName]);
    }
  };

  const removeEmployee = (employeeName: string) => {
    form.setValue('employes', selectedEmployees.filter(name => name !== employeeName));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la formation</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Formation Vaccinations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organisme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisme formateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ordre des Pharmaciens" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de la formation..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée (heures)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="8"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lieu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Salle de formation, En ligne" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût (optionnel)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="500.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Planifié">Planifié</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Terminé">Terminé</SelectItem>
                        <SelectItem value="Annulé">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificat_requis"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Certificat requis
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <Label>Participants</Label>
              <Select onValueChange={addEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Ajouter un employé..." />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(emp => !selectedEmployees.includes(`${emp.prenoms} ${emp.noms}`))
                    .map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={`${employee.prenoms} ${employee.noms}`}
                      >
                        {employee.prenoms} {employee.noms} - {employee.fonction}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              {selectedEmployees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEmployees.map((employeeName) => (
                    <Badge key={employeeName} variant="secondary" className="flex items-center gap-2">
                      {employeeName}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeEmployee(employeeName)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              {form.formState.errors.employes && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.employes.message}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {isEdit ? 'Modifier' : 'Créer'} la formation
          </Button>
        </div>
      </form>
    </Form>
  );
};