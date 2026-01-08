import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  Globe, 
  Key, 
  Building, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  TestTube,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  PHARMAML_COUNTRIES, 
  PHARMAML_DEFAULT_SECRET_KEY,
  getPharmaMLCountryConfig,
  type PharmaMLSupplierConfig 
} from '@/lib/pharmaml-config';
import { supabase } from '@/integrations/supabase/client';

interface PharmaMLConfigProps {
  supplierId: string;
  supplierName: string;
  initialConfig: Partial<PharmaMLSupplierConfig>;
  onSave: (config: PharmaMLSupplierConfig) => Promise<void>;
  onCancel: () => void;
}

const PharmaMLConfig: React.FC<PharmaMLConfigProps> = ({
  supplierId,
  supplierName,
  initialConfig,
  onSave,
  onCancel,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<PharmaMLSupplierConfig>({
    pharmaml_enabled: initialConfig.pharmaml_enabled || false,
    pharmaml_url: initialConfig.pharmaml_url || null,
    pharmaml_code_repartiteur: initialConfig.pharmaml_code_repartiteur || null,
    pharmaml_id_repartiteur: initialConfig.pharmaml_id_repartiteur || null,
    pharmaml_cle_secrete: initialConfig.pharmaml_cle_secrete || PHARMAML_DEFAULT_SECRET_KEY,
    pharmaml_id_officine: initialConfig.pharmaml_id_officine || null,
    pharmaml_pays: initialConfig.pharmaml_pays || null,
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleCountryChange = (countryCode: string) => {
    const countryConfig = getPharmaMLCountryConfig(countryCode);
    if (countryConfig) {
      setConfig(prev => ({
        ...prev,
        pharmaml_pays: countryCode,
        pharmaml_url: countryConfig.url,
        pharmaml_code_repartiteur: countryConfig.codeRepartiteur,
      }));
    }
  };

  const handleTestConnection = async () => {
    if (!config.pharmaml_url) {
      toast({
        title: t('pharmamlConfigError'),
        description: t('pharmamlConfigUrlRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('pharmaml-test', {
        body: { pharmaml_url: config.pharmaml_url },
      });

      if (error) throw error;

      setTestResult({
        success: data.success,
        message: data.message,
      });

      toast({
        title: data.success ? t('pharmamlConfigTestSuccess') : t('pharmamlConfigTestFailed'),
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setTestResult({
        success: false,
        message: errorMessage,
      });
      toast({
        title: t('pharmamlConfigTestFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (config.pharmaml_enabled && (!config.pharmaml_url || !config.pharmaml_id_repartiteur || !config.pharmaml_id_officine)) {
      toast({
        title: t('pharmamlConfigError'),
        description: t('pharmamlConfigIncomplete'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(config);
      toast({
        title: t('pharmamlConfigSaved'),
        description: t('pharmamlConfigSavedDesc'),
      });
    } catch (error) {
      toast({
        title: t('pharmamlConfigError'),
        description: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          {t('pharmamlConfigTitle')}
        </CardTitle>
        <CardDescription>
          {t('pharmamlConfigDesc')} - {supplierName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Activation */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pharmaml-enabled">{t('pharmamlConfigEnable')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('pharmamlConfigEnableDesc')}
            </p>
          </div>
          <Switch
            id="pharmaml-enabled"
            checked={config.pharmaml_enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, pharmaml_enabled: checked }))}
          />
        </div>

        <Separator />

        {config.pharmaml_enabled && (
          <>
            {/* Sélection du pays */}
            <div className="space-y-2">
              <Label htmlFor="pharmaml-pays">
                <Globe className="h-4 w-4 inline mr-2" />
                {t('pharmamlConfigCountry')}
              </Label>
              <Select
                value={config.pharmaml_pays || ''}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger id="pharmaml-pays">
                  <SelectValue placeholder={t('pharmamlConfigSelectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PHARMAML_COUNTRIES).map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* URL du serveur */}
            <div className="space-y-2">
              <Label htmlFor="pharmaml-url">{t('pharmamlConfigUrl')}</Label>
              <Input
                id="pharmaml-url"
                value={config.pharmaml_url || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, pharmaml_url: e.target.value }))}
                placeholder="http://pharma-ml.ubipharm-congo.com/COOPHARCO"
              />
              <p className="text-xs text-muted-foreground">
                {t('pharmamlConfigUrlHint')}
              </p>
            </div>

            {/* Code répartiteur */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pharmaml-code">{t('pharmamlConfigCodeRepartiteur')}</Label>
                <Input
                  id="pharmaml-code"
                  value={config.pharmaml_code_repartiteur || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, pharmaml_code_repartiteur: e.target.value }))}
                  placeholder="28"
                />
              </div>

              {/* ID répartiteur */}
              <div className="space-y-2">
                <Label htmlFor="pharmaml-id-rep">{t('pharmamlConfigIdRepartiteur')}</Label>
                <Input
                  id="pharmaml-id-rep"
                  value={config.pharmaml_id_repartiteur || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, pharmaml_id_repartiteur: e.target.value }))}
                  placeholder="BZV04"
                />
              </div>
            </div>

            {/* Clé secrète */}
            <div className="space-y-2">
              <Label htmlFor="pharmaml-secret">
                <Key className="h-4 w-4 inline mr-2" />
                {t('pharmamlConfigSecretKey')}
              </Label>
              <div className="relative">
                <Input
                  id="pharmaml-secret"
                  type={showSecret ? 'text' : 'password'}
                  value={config.pharmaml_cle_secrete || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, pharmaml_cle_secrete: e.target.value }))}
                  placeholder="PHDA"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* ID Officine */}
            <div className="space-y-2">
              <Label htmlFor="pharmaml-officine">
                <Building className="h-4 w-4 inline mr-2" />
                {t('pharmamlConfigIdOfficine')}
              </Label>
              <Input
                id="pharmaml-officine"
                value={config.pharmaml_id_officine || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, pharmaml_id_officine: e.target.value }))}
                placeholder="201117"
              />
              <p className="text-xs text-muted-foreground">
                {t('pharmamlConfigIdOfficineHint')}
              </p>
            </div>

            <Separator />

            {/* Bouton de test */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !config.pharmaml_url}
                className="w-full"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                {t('pharmamlConfigTestConnection')}
              </Button>

              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('pharmamlConfigInfo')}
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmaMLConfig;
