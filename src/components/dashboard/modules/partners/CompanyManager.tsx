import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Building, Phone, MessageCircle, AtSign, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';

// Interface pour la structure des données d'une société
interface Societe {
  id: string;
  libelle_societe: string;
  adresse: string;
  telephone_appel: string;
  telephone_whatsapp: string;
  email: string;
  limite_dette: number;
  niu: string;
  assureur_id: string | null;
  taux_couverture_agent: number;
  taux_couverture_ayant_droit: number;
  taux_remise_automatique: number;
  peut_prendre_bon: boolean;
  taux_ticket_moderateur: number;
  caution: number;
  created_at: string;
}

// Interface pour les assureurs
interface Assureur {
  id: string;
  libelle_assureur: string;
}

// Composant principal pour la gestion des sociétés
const Societes = () => {
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { formatAmount, getCurrencySymbol, getInputStep, isNoDecimalCurrency } = useCurrencyFormatting();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSociete, setEditingSociete] = useState<Societe | null>(null);

  // Hook de formulaire pour la validation et la gestion des champs
  const form = useForm<Partial<Societe>>({
    defaultValues: {
      libelle_societe: '',
      niu: '',
      adresse: '',
      telephone_appel: '',
      telephone_whatsapp: '',
      email: '',
      limite_dette: 0,
      taux_couverture_agent: 0,
      taux_couverture_ayant_droit: 0,
      taux_remise_automatique: 0,
      peut_prendre_bon: true,
      assureur_id: null,
      taux_ticket_moderateur: 0,
      caution: 0,
    },
  });

  // Récupération des données des sociétés depuis la base de données
  const { data: societes = [], isLoading, error } = useTenantQueryWithCache(
    ['societes'],
    'societes',
    '*',
    {},
    { orderBy: { column: 'libelle_societe', ascending: true } }
  );

  // Récupération des assureurs
  const { data: assureurs = [] } = useTenantQueryWithCache(
    ['assureurs'],
    'assureurs',
    'id, libelle_assureur',
    {},
    { orderBy: { column: 'libelle_assureur', ascending: true } }
  );

  // Mutation pour créer une société
    const createSociete = useTenantMutation('societes', 'insert', {
        invalidateQueries: ['societes'],
    });

    // Mutation pour créer le client associé à la société
    const createClientForSociete = useTenantMutation('clients', 'insert', {
        invalidateQueries: ['clients'], // Invalider aussi les clients
    });


  // Mutation pour mettre à jour une société
  const updateSociete = useTenantMutation('societes', 'update', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
      toast({ title: t('success'), description: t('companyModified') });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
        toast({ title: t('error'), description: `${t('error')}: ${error.message}`, variant: "destructive" });
    }
  });

  // Mutation pour supprimer une société
  const deleteSociete = useTenantMutation('societes', 'delete', {
    invalidateQueries: ['societes'],
    onSuccess: () => {
        toast({ title: t('success'), description: t('companyDeleted') });
    },
    onError: (error: any) => {
        toast({ title: t('error'), description: `${t('error')}: ${error.message}`, variant: "destructive" });
    }
  });

  // Filtrage des sociétés en fonction de la recherche
  const filteredSocietes = societes.filter(s =>
    s.libelle_societe?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestion de la soumission du formulaire
  const onSubmit = (data: Partial<Societe>) => {
    const finalData = {
        libelle_societe: data.libelle_societe,
        niu: data.niu,
        adresse: data.adresse,
        telephone_appel: data.telephone_appel,
        telephone_whatsapp: data.telephone_whatsapp,
        email: data.email,
        limite_dette: data.limite_dette || 0,
        assureur_id: data.assureur_id || null,
        taux_couverture_agent: data.taux_couverture_agent || 0,
        taux_couverture_ayant_droit: data.taux_couverture_ayant_droit || 0,
        taux_remise_automatique: data.taux_remise_automatique || 0,
        peut_prendre_bon: data.peut_prendre_bon !== false,
        taux_ticket_moderateur: data.taux_ticket_moderateur || 0,
        caution: data.caution || 0,
    };

    if (editingSociete) {
        // Mise à jour
        updateSociete.mutate({ id: editingSociete.id, ...finalData });
    } else {
        // Création - le client sera créé automatiquement par le trigger de la DB
        createSociete.mutate(finalData, {
            onSuccess: () => {
                toast({ title: t('success'), description: t('companyAdded') });
                setIsDialogOpen(false);
                form.reset();
            },
            onError: (error: any) => {
                toast({ title: t('error'), description: `${t('error')}: ${error.message}`, variant: "destructive" });
            },
        });
    }
  };


  // Fonctions pour gérer l'ouverture et la fermeture du dialogue
  const handleAddNew = () => {
    setEditingSociete(null);
    form.reset({
        libelle_societe: '',
        niu: '',
        adresse: '',
        telephone_appel: '',
        telephone_whatsapp: '',
        email: '',
        limite_dette: 0,
        taux_couverture_agent: 0,
        taux_couverture_ayant_droit: 0,
        taux_remise_automatique: 0,
        peut_prendre_bon: true,
        assureur_id: null,
        taux_ticket_moderateur: 0,
        caution: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (societe: Societe) => {
    setEditingSociete(societe);
    form.reset({
      ...societe,
      assureur_id: societe.assureur_id || null,
      taux_remise_automatique: societe.taux_remise_automatique || 0,
      peut_prendre_bon: societe.peut_prendre_bon !== false,
      taux_ticket_moderateur: societe.taux_ticket_moderateur || 0,
      caution: societe.caution || 0,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t('companyManagement')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchCompany')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('newCompany')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSociete ? t('editCompany') : t('newCompany')}</DialogTitle>
                  <DialogDescription>
                    {t('fillCompanyInfo')}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="libelle_societe" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>{t('companyName')} *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={form.control} name="niu" render={({ field }) => (
                         <FormItem>
                           <FormLabel>{t('niu')}</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                      <FormField control={form.control} name="telephone_appel" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('phone')} *</FormLabel>
                          <FormControl><Input {...field} type="tel" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="telephone_whatsapp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('whatsapp')}</FormLabel>
                          <FormControl><Input {...field} type="tel" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('email')}</FormLabel>
                          <FormControl><Input {...field} type="email" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="adresse" render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>{t('address')}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
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
                          <FormField control={form.control} name="assureur_id" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('insurerOptional')}</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} 
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
                          )} />
                          <FormField control={form.control} name="taux_remise_automatique" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('autoDiscountRate')}</FormLabel>
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
                              <FormDescription>{t('autoDiscountDesc')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        {/* Ligne 2: Taux Agent + Taux Ayant Droit */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="taux_couverture_agent" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('agentRate')}</FormLabel>
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
                              <FormDescription>{t('agentCoverageDesc')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="taux_couverture_ayant_droit" render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('beneficiaryRate')}</FormLabel>
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
                              <FormDescription>{t('beneficiaryCoverageDesc')}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        {/* Ligne 3: Limite dette + Peut prendre bon */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="limite_dette" render={({ field }) => (
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
                          )} />
                          <FormField control={form.control} name="peut_prendre_bon" render={({ field }) => (
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
                          )} />
                        </div>

                        {/* Ligne 4: Taux ticket modérateur + Caution actuelle */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="taux_ticket_moderateur" render={({ field }) => (
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
                          )} />
                          <FormField control={form.control} name="caution" render={({ field }) => (
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
                          )} />
                        </div>
                      </CardContent>
                    </Card>

                     <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                        <Button type="submit">{editingSociete ? t('modify') : t('create')}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

            {isLoading ? (
                <div className="text-center">{t('loading')}</div>
            ) : error ? (
                <div className="text-center text-red-500">{t('error')}: {error.message}</div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>{t('companyName')}</TableHead>
                        <TableHead>{t('contacts')}</TableHead>
                        <TableHead>{t('address')}</TableHead>
                        <TableHead>{t('debtLimit')}</TableHead>
                        <TableHead>{t('discountRate')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredSocietes.map(societe => (
                        <TableRow key={societe.id}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium">{societe.libelle_societe}</div>
                              {societe.niu && (
                                <div className="text-sm text-muted-foreground">NIU: {societe.niu}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {societe.telephone_appel && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {societe.telephone_appel}
                              </div>
                            )}
                            {societe.telephone_whatsapp && (
                              <div className="flex items-center gap-1 text-green-600">
                                <MessageCircle className="h-3 w-3" />
                                {societe.telephone_whatsapp}
                              </div>
                            )}
                            {societe.email && (
                              <div className="flex items-center gap-1">
                                <AtSign className="h-3 w-3" />
                                {societe.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {societe.adresse || t('notProvided')}
                          </div>
                        </TableCell>
                        <TableCell>{formatAmount(societe.limite_dette || 0)}</TableCell>
                        <TableCell>{societe.taux_remise_automatique || 0}%</TableCell>
                        <TableCell>
                            <div className="flex space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(societe)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => deleteSociete.mutate({ id: societe.id })}
                              className="text-red-500 hover:text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            )}
            {filteredSocietes.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground mt-4">{t('noCompanyFound')}</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Societes;