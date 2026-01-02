import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { EmployeeFormData } from './types';
import { ImageUpload } from './ImageUpload';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { CreditCard } from 'lucide-react';

interface EmployeeFormProps {
  form: UseFormReturn<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  isEdit?: boolean;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Assureur {
  id: string;
  libelle_assureur: string;
}

export const EmployeeForm = ({ form, onSubmit, isEdit = false, onCancel, isLoading = false }: EmployeeFormProps) => {
  const { useTenantQueryWithCache } = useTenantQuery();
  const { formatAmount, getCurrencySymbol, getInputStep, isNoDecimalCurrency } = useCurrencyFormatting();

  // Récupération des assureurs
  const { data: assureurs = [] } = useTenantQueryWithCache(
    ['assureurs'],
    'assureurs',
    'id, libelle_assureur',
    {},
    { orderBy: { column: 'libelle_assureur', ascending: true } }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Informations personnelles */}
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une fonction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pharmacien Titulaire">Pharmacien Titulaire</SelectItem>
                          <SelectItem value="Pharmacien Adjoint">Pharmacien Adjoint</SelectItem>
                          <SelectItem value="Préparateur">Préparateur</SelectItem>
                          <SelectItem value="Technicien">Technicien</SelectItem>
                          <SelectItem value="Caissier">Caissier</SelectItem>
                          <SelectItem value="Vendeur">Vendeur</SelectItem>
                          <SelectItem value="Gestionnaire de stock">Gestionnaire de stock</SelectItem>
                          <SelectItem value="Comptable">Comptable</SelectItem>
                          <SelectItem value="Secrétaire">Secrétaire</SelectItem>
                          <SelectItem value="Livreur">Livreur</SelectItem>
                          <SelectItem value="Stagiaire">Stagiaire</SelectItem>
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
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                        />
                      </FormControl>
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
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
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
                  name="situation_familiale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Situation familiale <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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

            {/* Bloc Infos Compte Client */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Infos Compte Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assureur_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assureur (optionnel)</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Aucun assureur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Aucun assureur</SelectItem>
                            {assureurs.map((assureur: Assureur) => (
                              <SelectItem key={assureur.id} value={assureur.id}>
                                {assureur.libelle_assureur}
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
                    name="taux_remise_automatique"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de remise automatique (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Remise appliquée automatiquement au point de vente</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="limite_dette"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de dette ({getCurrencySymbol()})</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            step={getInputStep()}
                            placeholder={isNoDecimalCurrency() ? "0" : "0.00"}
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Montant maximum de crédit autorisé</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="peut_prendre_bon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value !== false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Peut prendre des produits en bon</FormLabel>
                          <FormDescription>
                            Autoriser les achats à crédit au point de vente
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
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
};