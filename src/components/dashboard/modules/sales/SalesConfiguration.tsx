import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  Receipt,
  CreditCard,
  Percent,
  Bell,
  Shield,
  Printer,
  Calculator,
  Smartphone,
  Banknote,
  Ticket
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SalesConfiguration = () => {
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    // Configuration générale
    general: {
      autoSaveTransactions: true,
      enableBarcodeScan: true,
      showStockLevels: true,
      requireCustomerInfo: false,
      enableQuickSale: true,
      defaultDiscountType: 'percentage',
      maxDiscountPercent: 20,
      enableNegativeStock: false
    },
    
    // Configuration TVA
    tax: {
      defaultTaxRate: 18,
      includeTaxInPrice: true,
      taxCalculationMethod: 'inclusive',
      exemptProducts: false,
      taxRoundingMethod: 'round'
    },
    
    // Modes de paiement
    payment: {
      cash: { enabled: true, requireChange: true },
      card: { enabled: true, minAmount: 0 },
      mobile: { enabled: true, providers: ['Orange Money', 'MTN Mobile Money', 'Moov Money'] },
      check: { enabled: false, requireVerification: true },
      credit: { enabled: true, maxAmount: 500000 },
      split: { enabled: true, maxMethods: 3 }
    },
    
    // Configuration impression
    printing: {
      autoprint: true,
      receiptTemplate: 'standard',
      includeBarcode: true,
      includeQRCode: false,
      printCustomerCopy: false,
      receiptFooter: 'Merci de votre visite !',
      printLogo: true,
      paperSize: 'thermal_80mm'
    },
    
    // Configuration caisses
    register: {
      requireOpeningAmount: true,
      defaultOpeningAmount: 50000,
      enableCashDrawer: true,
      alertLowCash: true,
      lowCashThreshold: 20000,
      enableMultipleUsers: true,
      sessionTimeout: 480 // minutes
    },
    
    // Alertes et notifications
    alerts: {
      lowStockAlert: true,
      expiredProductsAlert: true,
      dailyReportReminder: true,
      backupReminder: true,
      suspiciousActivityAlert: true,
      highValueTransactionAlert: true,
      highValueThreshold: 100000
    }
  });

  const handleConfigChange = (section: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handlePaymentMethodChange = (method: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [method]: {
          ...prev.payment[method as keyof typeof prev.payment],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres de vente ont été mis à jour.",
    });
  };

  const handleReset = () => {
    toast({
      title: "Configuration réinitialisée",
      description: "Les paramètres ont été remis aux valeurs par défaut.",
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuration Ventes</h2>
          <p className="text-muted-foreground">
            Paramètres et configuration du module de vente
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="tax">TVA</TabsTrigger>
          <TabsTrigger value="payment">Paiement</TabsTrigger>
          <TabsTrigger value="printing">Impression</TabsTrigger>
          <TabsTrigger value="register">Caisses</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        {/* Configuration Générale */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration Générale
              </CardTitle>
              <CardDescription>
                Paramètres généraux du système de vente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoSave">Sauvegarde automatique</Label>
                    <Switch
                      id="autoSave"
                      checked={config.general.autoSaveTransactions}
                      onCheckedChange={(checked) => handleConfigChange('general', 'autoSaveTransactions', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="barcodeScan">Scanner code-barres</Label>
                    <Switch
                      id="barcodeScan"
                      checked={config.general.enableBarcodeScan}
                      onCheckedChange={(checked) => handleConfigChange('general', 'enableBarcodeScan', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showStock">Afficher stock</Label>
                    <Switch
                      id="showStock"
                      checked={config.general.showStockLevels}
                      onCheckedChange={(checked) => handleConfigChange('general', 'showStockLevels', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireCustomer">Info client obligatoire</Label>
                    <Switch
                      id="requireCustomer"
                      checked={config.general.requireCustomerInfo}
                      onCheckedChange={(checked) => handleConfigChange('general', 'requireCustomerInfo', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Type de remise par défaut</Label>
                    <Select 
                      value={config.general.defaultDiscountType}
                      onValueChange={(value) => handleConfigChange('general', 'defaultDiscountType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                        <SelectItem value="fixed">Montant fixe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Remise maximum (%)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      value={config.general.maxDiscountPercent}
                      onChange={(e) => handleConfigChange('general', 'maxDiscountPercent', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="negativeStock">Autoriser stock négatif</Label>
                    <Switch
                      id="negativeStock"
                      checked={config.general.enableNegativeStock}
                      onCheckedChange={(checked) => handleConfigChange('general', 'enableNegativeStock', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration TVA */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Configuration TVA
              </CardTitle>
              <CardDescription>
                Paramètres de taxation et calculs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Taux TVA par défaut (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={config.tax.defaultTaxRate}
                      onChange={(e) => handleConfigChange('tax', 'defaultTaxRate', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxMethod">Méthode de calcul</Label>
                    <Select 
                      value={config.tax.taxCalculationMethod}
                      onValueChange={(value) => handleConfigChange('tax', 'taxCalculationMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inclusive">TVA incluse</SelectItem>
                        <SelectItem value="exclusive">TVA exclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rounding">Méthode d'arrondi</Label>
                    <Select 
                      value={config.tax.taxRoundingMethod}
                      onValueChange={(value) => handleConfigChange('tax', 'taxRoundingMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">Arrondi normal</SelectItem>
                        <SelectItem value="floor">Arrondi inférieur</SelectItem>
                        <SelectItem value="ceil">Arrondi supérieur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeTax">TVA incluse dans prix</Label>
                    <Switch
                      id="includeTax"
                      checked={config.tax.includeTaxInPrice}
                      onCheckedChange={(checked) => handleConfigChange('tax', 'includeTaxInPrice', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exemptProducts">Produits exonérés</Label>
                    <Switch
                      id="exemptProducts"
                      checked={config.tax.exemptProducts}
                      onCheckedChange={(checked) => handleConfigChange('tax', 'exemptProducts', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Paiement */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Modes de Paiement
              </CardTitle>
              <CardDescription>
                Configuration des moyens de paiement acceptés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Espèces */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  <Label className="text-base font-medium">Espèces</Label>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Activer</Label>
                    <Switch
                      checked={config.payment.cash.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('cash', 'enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exiger rendu monnaie</Label>
                    <Switch
                      checked={config.payment.cash.requireChange}
                      onCheckedChange={(checked) => handlePaymentMethodChange('cash', 'requireChange', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Carte */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <Label className="text-base font-medium">Carte Bancaire</Label>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Activer</Label>
                    <Switch
                      checked={config.payment.card.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('card', 'enabled', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant minimum</Label>
                    <Input
                      type="number"
                      value={config.payment.card.minAmount}
                      onChange={(e) => handlePaymentMethodChange('card', 'minAmount', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mobile Money */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <Label className="text-base font-medium">Mobile Money</Label>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Activer</Label>
                    <Switch
                      checked={config.payment.mobile.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('mobile', 'enabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Crédit */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  <Label className="text-base font-medium">Crédit Client</Label>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Activer</Label>
                    <Switch
                      checked={config.payment.credit.enabled}
                      onCheckedChange={(checked) => handlePaymentMethodChange('credit', 'enabled', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant maximum</Label>
                    <Input
                      type="number"
                      value={config.payment.credit.maxAmount}
                      onChange={(e) => handlePaymentMethodChange('credit', 'maxAmount', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Impression */}
        <TabsContent value="printing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Configuration Impression
              </CardTitle>
              <CardDescription>
                Paramètres d'impression des reçus et factures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoprint">Impression automatique</Label>
                    <Switch
                      id="autoprint"
                      checked={config.printing.autoprint}
                      onCheckedChange={(checked) => handleConfigChange('printing', 'autoprint', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="printLogo">Imprimer logo</Label>
                    <Switch
                      id="printLogo"
                      checked={config.printing.printLogo}
                      onCheckedChange={(checked) => handleConfigChange('printing', 'printLogo', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeBarcode">Code-barres sur reçu</Label>
                    <Switch
                      id="includeBarcode"
                      checked={config.printing.includeBarcode}
                      onCheckedChange={(checked) => handleConfigChange('printing', 'includeBarcode', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paperSize">Format papier</Label>
                    <Select 
                      value={config.printing.paperSize}
                      onValueChange={(value) => handleConfigChange('printing', 'paperSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thermal_80mm">Thermique 80mm</SelectItem>
                        <SelectItem value="thermal_58mm">Thermique 58mm</SelectItem>
                        <SelectItem value="a4">A4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">Pied de page reçu</Label>
                    <Textarea
                      id="receiptFooter"
                      value={config.printing.receiptFooter}
                      onChange={(e) => handleConfigChange('printing', 'receiptFooter', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receiptTemplate">Modèle de reçu</Label>
                    <Select 
                      value={config.printing.receiptTemplate}
                      onValueChange={(value) => handleConfigChange('printing', 'receiptTemplate', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="detailed">Détaillé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Caisses */}
        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Configuration Caisses
              </CardTitle>
              <CardDescription>
                Paramètres de gestion des caisses enregistreuses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireOpening">Fonds de caisse obligatoire</Label>
                    <Switch
                      id="requireOpening"
                      checked={config.register.requireOpeningAmount}
                      onCheckedChange={(checked) => handleConfigChange('register', 'requireOpeningAmount', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultOpening">Fonds par défaut</Label>
                    <Input
                      id="defaultOpening"
                      type="number"
                      value={config.register.defaultOpeningAmount}
                      onChange={(e) => handleConfigChange('register', 'defaultOpeningAmount', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cashDrawer">Tiroir-caisse automatique</Label>
                    <Switch
                      id="cashDrawer"
                      checked={config.register.enableCashDrawer}
                      onCheckedChange={(checked) => handleConfigChange('register', 'enableCashDrawer', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alertLowCash">Alerte liquidités faibles</Label>
                    <Switch
                      id="alertLowCash"
                      checked={config.register.alertLowCash}
                      onCheckedChange={(checked) => handleConfigChange('register', 'alertLowCash', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lowCashThreshold">Seuil alerte liquidités</Label>
                    <Input
                      id="lowCashThreshold"
                      type="number"
                      value={config.register.lowCashThreshold}
                      onChange={(e) => handleConfigChange('register', 'lowCashThreshold', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Timeout session (min)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={config.register.sessionTimeout}
                      onChange={(e) => handleConfigChange('register', 'sessionTimeout', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Alertes */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertes et Notifications
              </CardTitle>
              <CardDescription>
                Configuration des alertes système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowStock">Alerte stock faible</Label>
                    <Switch
                      id="lowStock"
                      checked={config.alerts.lowStockAlert}
                      onCheckedChange={(checked) => handleConfigChange('alerts', 'lowStockAlert', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expiredProducts">Produits expirés</Label>
                    <Switch
                      id="expiredProducts"
                      checked={config.alerts.expiredProductsAlert}
                      onCheckedChange={(checked) => handleConfigChange('alerts', 'expiredProductsAlert', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dailyReport">Rapport quotidien</Label>
                    <Switch
                      id="dailyReport"
                      checked={config.alerts.dailyReportReminder}
                      onCheckedChange={(checked) => handleConfigChange('alerts', 'dailyReportReminder', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="suspiciousActivity">Activité suspecte</Label>
                    <Switch
                      id="suspiciousActivity"
                      checked={config.alerts.suspiciousActivityAlert}
                      onCheckedChange={(checked) => handleConfigChange('alerts', 'suspiciousActivityAlert', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="highValueTransaction">Transaction élevée</Label>
                    <Switch
                      id="highValueTransaction"
                      checked={config.alerts.highValueTransactionAlert}
                      onCheckedChange={(checked) => handleConfigChange('alerts', 'highValueTransactionAlert', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="highValueThreshold">Seuil montant élevé</Label>
                    <Input
                      id="highValueThreshold"
                      type="number"
                      value={config.alerts.highValueThreshold}
                      onChange={(e) => handleConfigChange('alerts', 'highValueThreshold', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesConfiguration;