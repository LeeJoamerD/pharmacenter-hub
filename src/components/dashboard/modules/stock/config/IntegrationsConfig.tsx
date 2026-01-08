import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, History, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PharmaMLConfig from '../integrations/PharmaMLConfig';
import PharmaMLHistory from '../PharmaMLHistory';
import type { PharmaMLSupplierConfig } from '@/lib/pharmaml-config';

interface Supplier {
  id: string;
  nom: string;
  pharmaml_enabled?: boolean;
  pharmaml_url?: string | null;
  pharmaml_code_repartiteur?: string | null;
  pharmaml_id_repartiteur?: string | null;
  pharmaml_cle_secrete?: string | null;
  pharmaml_id_officine?: string | null;
  pharmaml_pays?: string | null;
}

const IntegrationsConfig: React.FC = () => {
  const { t } = useLanguage();
  const { pharmacy } = useAuth();
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!pharmacy?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('fournisseurs')
          .select('id, nom, pharmaml_enabled, pharmaml_url, pharmaml_code_repartiteur, pharmaml_id_repartiteur, pharmaml_cle_secrete, pharmaml_id_officine, pharmaml_pays')
          .eq('tenant_id', pharmacy.id)
          .eq('est_actif', true)
          .order('nom');
        
        if (error) throw error;
        setSuppliers((data as Supplier[]) || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        toast({
          title: t('error'),
          description: t('errorFetchingSuppliers'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [pharmacy?.id, t, toast]);

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      setSelectedSupplier(supplier || null);
    } else {
      setSelectedSupplier(null);
    }
  }, [selectedSupplierId, suppliers]);

  const handleSaveConfig = async (config: PharmaMLSupplierConfig) => {
    if (!selectedSupplierId || !pharmacy?.id) return;

    const { error } = await supabase
      .from('fournisseurs')
      .update({
        pharmaml_enabled: config.pharmaml_enabled,
        pharmaml_url: config.pharmaml_url,
        pharmaml_code_repartiteur: config.pharmaml_code_repartiteur,
        pharmaml_id_repartiteur: config.pharmaml_id_repartiteur,
        pharmaml_cle_secrete: config.pharmaml_cle_secrete,
        pharmaml_id_officine: config.pharmaml_id_officine,
        pharmaml_pays: config.pharmaml_pays,
      })
      .eq('id', selectedSupplierId)
      .eq('tenant_id', pharmacy.id);

    if (error) throw error;

    // Mettre à jour l'état local
    setSuppliers(prev => prev.map(s => 
      s.id === selectedSupplierId 
        ? { ...s, ...config }
        : s
    ));
  };

  const handleCancel = () => {
    setSelectedSupplierId('');
    setSelectedSupplier(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('loading')}...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t('integrationsConfig')}
          </CardTitle>
          <CardDescription>
            {t('integrationsConfigDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection du fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier-select">{t('selectIntegrationSupplier')}</Label>
            <Select
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
            >
              <SelectTrigger id="supplier-select" className="w-full max-w-md">
                <SelectValue placeholder={t('selectSupplierPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nom}
                    {supplier.pharmaml_enabled && (
                      <span className="ml-2 text-xs text-green-600">(PharmaML)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suppliers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('noSuppliersFound')}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedSupplier && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="config">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>{t('configuration')}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="history">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>{t('transmissionHistory')}</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="mt-4">
            <PharmaMLConfig
              supplierId={selectedSupplier.id}
              supplierName={selectedSupplier.nom}
              initialConfig={{
                pharmaml_enabled: selectedSupplier.pharmaml_enabled,
                pharmaml_url: selectedSupplier.pharmaml_url,
                pharmaml_code_repartiteur: selectedSupplier.pharmaml_code_repartiteur,
                pharmaml_id_repartiteur: selectedSupplier.pharmaml_id_repartiteur,
                pharmaml_cle_secrete: selectedSupplier.pharmaml_cle_secrete,
                pharmaml_id_officine: selectedSupplier.pharmaml_id_officine,
                pharmaml_pays: selectedSupplier.pharmaml_pays,
              }}
              onSave={handleSaveConfig}
              onCancel={handleCancel}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <PharmaMLHistory supplierId={selectedSupplier.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default IntegrationsConfig;
