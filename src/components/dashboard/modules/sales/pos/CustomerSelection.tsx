/**
 * Composant de sélection du type client et recherche client
 * Design compact avec dropdown pour changer de type
 * @version 2.0.0 - Refonte complète avec nouveaux types clients
 */
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  Building2, 
  UserCheck, 
  Users, 
  Percent, 
  ChevronDown,
  X,
  Wallet,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import ClientSearchField from './ClientSearchField';
import { CustomerType } from '@/types/pos';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerData {
  id?: string;
  type: CustomerType;
  name?: string;
  phone?: string;
  email?: string;
  assureur_id?: string;
  assureur_libelle?: string;
  taux_remise_automatique?: number;
  taux_agent?: number;
  taux_ayant_droit?: number;
  limite_credit?: number;
  peut_prendre_bon?: boolean;
  taux_ticket_moderateur?: number;
  caution?: number;
  utiliser_caution?: boolean;
  societe_id?: string;
  personnel_id?: string;
  discount_rate?: number; // Pour compatibilité
  discountRate?: number; // Alias pour compatibilité
}

interface CustomerSelectionProps {
  customer: CustomerData;
  onCustomerChange: (customer: CustomerData) => void;
}

const customerTypes: {
  id: CustomerType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'Ordinaire',
    label: 'Client Ordinaire',
    icon: User,
    description: 'Client non enregistré'
  },
  {
    id: 'Entreprise',
    label: 'Client Entreprise',
    icon: Building2,
    description: 'Société ou entreprise cliente'
  },
  {
    id: 'Conventionné',
    label: 'Client Conventionné',
    icon: UserCheck,
    description: 'Client avec convention spéciale'
  },
  {
    id: 'Personnel',
    label: 'Client Personnel',
    icon: Users,
    description: 'Employé de la pharmacie'
  }
];

const CustomerSelection = ({ customer, onCustomerChange }: CustomerSelectionProps) => {
  const { formatAmount } = useCurrencyFormatting();
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentType = customerTypes.find(t => t.id === customer.type) || customerTypes[0];
  const Icon = currentType.icon;

  const handleTypeChange = useCallback((type: CustomerType) => {
    // Reset customer data when type changes
    onCustomerChange({
      type,
      discount_rate: 0,
      discountRate: 0,
      utiliser_caution: false
    });
    setIsDropdownOpen(false);
  }, [onCustomerChange]);

  const handleClientSelect = useCallback((clientData: any) => {
    // Apply client data to customer with all relevant fields for future billing
    const discountRate = clientData.taux_remise_automatique ?? 0;
    const newCustomer: CustomerData = {
      id: clientData.id,
      type: clientData.type_client,
      name: clientData.nom_complet,
      phone: clientData.telephone,
      email: clientData.email,
      assureur_id: clientData.assureur_id,
      assureur_libelle: clientData.assureur_libelle,
      taux_remise_automatique: clientData.taux_remise_automatique ?? 0,
      taux_agent: clientData.taux_agent ?? 0,
      taux_ayant_droit: clientData.taux_ayant_droit ?? 0,
      limite_credit: clientData.limite_credit ?? 0,
      peut_prendre_bon: clientData.peut_prendre_bon ?? false,
      taux_ticket_moderateur: clientData.taux_ticket_moderateur ?? 0,
      caution: clientData.caution ?? 0,
      utiliser_caution: false, // Par défaut, ne pas utiliser la caution
      societe_id: clientData.societe_id,
      personnel_id: clientData.personnel_id,
      // Taux de remise pour compatibilité
      discount_rate: discountRate,
      discountRate: discountRate
    };
    
    onCustomerChange(newCustomer);
  }, [onCustomerChange]);

  const handleClearClient = useCallback(() => {
    onCustomerChange({
      type: customer.type,
      discount_rate: 0,
      discountRate: 0,
      utiliser_caution: false
    });
  }, [customer.type, onCustomerChange]);

  const handleToggleCaution = useCallback((checked: boolean) => {
    onCustomerChange({
      ...customer,
      utiliser_caution: checked
    });
  }, [customer, onCustomerChange]);

  return (
    <div className="space-y-3">
      {/* Type Client Card - Always visible */}
      <Card className="ring-2 ring-primary">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary text-primary-foreground">
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{currentType.label}</span>
                {(customer.discount_rate ?? customer.taux_remise_automatique ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Percent className="h-3 w-3 mr-1" />
                    -{customer.discount_rate ?? customer.taux_remise_automatique ?? 0}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentType.description}
              </p>
            </div>

            {/* Dropdown to change type */}
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {t('changeBtn')}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {customerTypes.map((type) => {
                  const TypeIcon = type.icon;
                  const isSelected = customer.type === type.id;
                  return (
                    <DropdownMenuItem
                      key={type.id}
                      onClick={() => handleTypeChange(type.id)}
                      className={isSelected ? 'bg-accent' : ''}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <TypeIcon className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                        {isSelected && <Badge variant="default" className="text-xs">{t('currentLabel')}</Badge>}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Client Search - Only for non-Ordinaire types */}
      {customer.type !== 'Ordinaire' && (
        <div className="space-y-3">
          {/* Search Field */}
          {!customer.id && (
            <ClientSearchField
              clientType={customer.type}
              onClientSelect={handleClientSelect}
              selectedClientId={customer.id}
            />
          )}

          {/* Selected Client Summary */}
          {customer.id && customer.name && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 space-y-3">
                {/* Header with name and clear button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleClearClient}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Client Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Assureur */}
                  {customer.assureur_libelle && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" />
                      <span className="truncate">{customer.assureur_libelle}</span>
                    </div>
                  )}

                  {/* Taux remise */}
                  {(customer.taux_remise_automatique ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        {t('discount')}: {customer.taux_remise_automatique}%
                      </span>
                    </div>
                  )}

                  {/* Limite crédit */}
                  {(customer.limite_credit ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      <span>{t('debtLimit')}: {formatAmount(customer.limite_credit ?? 0)}</span>
                    </div>
                  )}

                  {/* Peut prendre bon */}
                  {customer.peut_prendre_bon && (
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{t('canTakeVoucherLabel')}</span>
                    </div>
                  )}

                  {/* Taux agent */}
                  {(customer.taux_agent ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{t('agentRateLabel')}: {customer.taux_agent}%</span>
                    </div>
                  )}

                  {/* Taux ayant droit */}
                  {(customer.taux_ayant_droit ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{t('beneficiaryRateLabel')}: {customer.taux_ayant_droit}%</span>
                    </div>
                  )}

                  {/* Ticket modérateur */}
                  {(customer.taux_ticket_moderateur ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                      <span>{t('moderatorTicketRate')}: {customer.taux_ticket_moderateur}%</span>
                    </div>
                  )}
                </div>

                {/* Caution Section */}
                {(customer.caution ?? 0) > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-600">
                            {t('availableCaution')}: {formatAmount(customer.caution ?? 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="use-caution" className="text-xs">
                          {t('useLabel')}
                        </Label>
                        <Switch
                          id="use-caution"
                          checked={customer.utiliser_caution ?? false}
                          onCheckedChange={handleToggleCaution}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelection;
