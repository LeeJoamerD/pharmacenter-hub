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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

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
                        {t('lastName')} <span className="text-destructive">*</span>
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
                        {t('firstName')} <span className="text-destructive">*</span>
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
                        {t('function')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectFunction')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pharmacien Titulaire">{t('pharmacistOwner')}</SelectItem>
                          <SelectItem value="Pharmacien Adjoint">{t('assistantPharmacist')}</SelectItem>
                          <SelectItem value="Préparateur">{t('preparer')}</SelectItem>
                          <SelectItem value="Technicien">{t('technician')}</SelectItem>
                          <SelectItem value="Caissier">{t('cashier')}</SelectItem>
                          <SelectItem value="Vendeur">{t('seller')}</SelectItem>
                          <SelectItem value="Gestionnaire de stock">{t('stockManager')}</SelectItem>
                          <SelectItem value="Comptable">{t('accountant')}</SelectItem>
                          <SelectItem value="Secrétaire">{t('secretary')}</SelectItem>
                          <SelectItem value="Livreur">{t('deliveryPerson')}</SelectItem>
                          <SelectItem value="Stagiaire">{t('intern')}</SelectItem>
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
                      <FormLabel>{t('profession')}</FormLabel>
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
                    <FormLabel>{t('addressOptional')}</FormLabel>
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
                        {t('phone')} <span className="text-destructive">*</span>
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
                      <FormLabel>{t('whatsapp')}</FormLabel>
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
                        {t('email')} <span className="text-destructive">*</span>
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
                        {t('nationalId')} <span className="text-destructive">*</span>
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
                        {t('birthDate')} <span className="text-destructive">*</span>
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
                        {t('hireDate')} <span className="text-destructive">*</span>
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
                        {t('familyStatus')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectFamilyStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Célibataire">{t('single')}</SelectItem>
                          <SelectItem value="Marié(e)">{t('married')}</SelectItem>
                          <SelectItem value="Divorcé(e)">{t('divorced')}</SelectItem>
                          <SelectItem value="Veuf(ve)">{t('widowed')}</SelectItem>
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
                      <FormLabel>{t('childrenCount')}</FormLabel>
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
                        {t('contractStatus')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectContractStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CDI">{t('cdi')}</SelectItem>
                          <SelectItem value="CDD">{t('cdd')}</SelectItem>
                          <SelectItem value="Stage">{t('internship')}</SelectItem>
                          <SelectItem value="Freelance">{t('freelance')}</SelectItem>
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
                      <FormLabel>{t('socialSecurityNumber')}</FormLabel>
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
                      <FormLabel>{t('baseSalary')}</FormLabel>
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
                        label={t('photo')}
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
                  {t('clientAccountInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ligne 1: Assureur + Taux remise */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assureur_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('insurerOptional')}</FormLabel>
                        <Select 
                          onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} 
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('noInsurer')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">{t('noInsurer')}</SelectItem>
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
                        <FormLabel>{t('autoDiscountRate')}</FormLabel>
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
                        <FormDescription>{t('autoDiscountDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ligne 2: Taux Agent + Taux Ayant Droit */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taux_agent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('agentRate')}</FormLabel>
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
                        <FormDescription>{t('agentCoverageDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taux_ayant_droit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('beneficiaryRate')}</FormLabel>
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
                        <FormDescription>{t('beneficiaryCoverageDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Ligne 3: Limite dette + Peut prendre bon */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="limite_dette"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('debtLimit')} ({getCurrencySymbol()})</FormLabel>
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
                        <FormDescription>{t('maxCreditAmount')}</FormDescription>
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
                          <FormLabel>{t('canTakeVoucher')}</FormLabel>
                          <FormDescription>
                            {t('allowVoucherDesc')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ligne 4: Taux ticket modérateur + Caution actuelle */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taux_ticket_moderateur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('moderatorTicketRate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>{t('moderatorTicketDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="caution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('deposit')} ({getCurrencySymbol()})</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step={getInputStep()}
                            placeholder={isNoDecimalCurrency() ? "0" : "0.00"}
                            {...field}
                            value={field.value || 0}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                          />
                        </FormControl>
                        <FormDescription>{t('depositDesc')}</FormDescription>
                        <FormMessage />
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
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading 
              ? t('processing') 
              : (isEdit ? t('modify') : t('create'))
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};