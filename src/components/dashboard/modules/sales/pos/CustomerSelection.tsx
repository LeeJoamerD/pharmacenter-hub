import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, Star, Building2, Percent, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

type CustomerType = 'ordinaire' | 'assure' | 'particulier';

interface CustomerSelectionProps {
  customer: any;
  onCustomerChange: (customer: any) => void;
}

const CustomerSelection = ({ customer, onCustomerChange }: CustomerSelectionProps) => {
  const { tenantId } = useTenant();
  const [showDetails, setShowDetails] = useState(customer.type !== 'ordinaire');
  const [insuranceCompaniesData, setInsuranceCompaniesData] = useState<string[]>([]);

  // Récupérer les assureurs depuis la DB
  useEffect(() => {
    const fetchInsurers = async () => {
      if (!tenantId) return;
      
      try {
        const result = await (supabase as any)
          .from('assureurs')
          .select('libelle_assureur')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('libelle_assureur');
        
        if (result.data) {
          setInsuranceCompaniesData(result.data.map((a: any) => a.libelle_assureur));
        }
      } catch (error) {
        console.error('Error fetching insurers:', error);
      }
    };

    fetchInsurers();
  }, [tenantId]);

  const customerTypes = [
    {
      id: 'ordinaire' as const,
      label: 'Client Ordinaire',
      icon: User,
      description: 'Client sans assurance',
      discountRate: 0
    },
    {
      id: 'assure' as const,
      label: 'Client Assuré',
      icon: Building2,
      description: 'Client avec assurance',
      discountRate: 0
    },
    {
      id: 'particulier' as const,
      label: 'Client Particulier',
      icon: Users,
      description: 'Client avec remise spéciale',
      discountRate: 10
    }
  ];

  // Utiliser les assureurs de la DB ou fallback
  const insuranceCompanies = insuranceCompaniesData && insuranceCompaniesData.length > 0
    ? insuranceCompaniesData
    : [
        'NSIA Assurance',
        'SUNU Assurance',
        'SONAR',
        'ATLANTIQUE Assurance',
        'AXA Assurance',
        'ALLIANZ',
        'GAN Assurances'
      ];

  const handleTypeChange = (type: CustomerType) => {
    const selectedType = customerTypes.find(t => t.id === type);
    
    const newCustomer: any = {
      type,
      discountRate: selectedType?.discountRate || 0
    };

    if (type === 'ordinaire') {
      setShowDetails(false);
    } else {
      setShowDetails(true);
    }

    onCustomerChange(newCustomer);
  };

  const handleDetailChange = (field: string, value: string) => {
    onCustomerChange({
      ...customer,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Customer Type Selection */}
      <div className="grid grid-cols-1 gap-3">
        {customerTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = customer.type === type.id;
          
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleTypeChange(type.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{type.label}</span>
                      {type.discountRate > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          -{type.discountRate}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Customer Details */}
      {showDetails && (
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nom du Client</Label>
            <Input
              id="customerName"
              placeholder="Nom complet du client"
              value={customer.name || ''}
              onChange={(e) => handleDetailChange('name', e.target.value)}
            />
          </div>

          {customer.type === 'assure' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="insuranceCompany">Compagnie d'Assurance</Label>
                <Select 
                  value={customer.insuranceCompany || ''} 
                  onValueChange={(value) => handleDetailChange('insuranceCompany', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la compagnie" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceCompanies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceNumber">Numéro d'Assurance</Label>
                <Input
                  id="insuranceNumber"
                  placeholder="Numéro de carte d'assurance"
                  value={customer.insuranceNumber || ''}
                  onChange={(e) => handleDetailChange('insuranceNumber', e.target.value)}
                />
              </div>
            </>
          )}

          {customer.type === 'particulier' && (
            <div className="space-y-2">
              <Label htmlFor="discountRate">Taux de Remise (%)</Label>
              <Input
                id="discountRate"
                type="number"
                min="0"
                max="50"
                placeholder="10"
                value={customer.discountRate || ''}
                onChange={(e) => handleDetailChange('discountRate', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Current Customer Summary */}
      {customer.name && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-primary/10 rounded">
              <User className="h-3 w-3 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{customer.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{customerTypes.find(t => t.id === customer.type)?.label}</span>
                {customer.discountRate && customer.discountRate > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    -{customer.discountRate}% remise
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSelection;
