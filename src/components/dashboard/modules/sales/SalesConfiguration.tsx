import React from 'react';
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
  Ticket,
  Loader2
} from 'lucide-react';
import { useSalesSettings } from '@/hooks/useSalesSettings';

const SalesConfiguration = () => {
  const { 
    settings, 
    loading, 
    saving, 
    saveSettings, 
    resetSettings, 
    updateSettings, 
    updatePaymentMethod 
  } = useSalesSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres...</span>
      </div>
    );
  }

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
          <Button variant="outline" onClick={resetSettings} disabled={saving}>
            Réinitialiser
          </Button>
          <Button onClick={() => saveSettings()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder'
            )}
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
                      checked={settings.general.autoSaveTransactions}
                      onCheckedChange={(checked) => updateSettings('general', 'autoSaveTransactions', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="barcodeScan">Scanner code-barres</Label>
                    <Switch
                      id="barcodeScan"
                      checked={settings.general.enableBarcodeScan}
                      onCheckedChange={(checked) => updateSettings('general', 'enableBarcodeScan', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showStock">Afficher stock</Label>
                    <Switch
                      id="showStock"
                      checked={settings.general.showStockLevels}
                      onCheckedChange={(checked) => updateSettings('general', 'showStockLevels', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requireCustomer">Info client obligatoire</Label>
                    <Switch
                      id="requireCustomer"
                      checked={settings.general.requireCustomerInfo}
                      onCheckedChange={(checked) => updateSettings('general', 'requireCustomerInfo', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Type de remise par défaut</Label>
                    <Select 
                      value={settings.general.defaultDiscountType}
                      onValueChange={(value) => updateSettings('general', 'defaultDiscountType', value)}
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
                      value={settings.general.maxDiscountPercent}
                      onChange={(e) => updateSettings('general', 'maxDiscountPercent', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="negativeStock">Autoriser stock négatif</Label>
                    <Switch
                      id="negativeStock"
                      checked={settings.general.enableNegativeStock}
                      onCheckedChange={(checked) => updateSettings('general', 'enableNegativeStock', checked)}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="separateSaleAndCash" className="text-base font-medium">
                          Séparer Vente et Caisse
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Activer pour utiliser deux interfaces distinctes : une pour la vente (sans encaissement) et une pour l'encaissement.
                        </p>
                      </div>
                      <Switch
                        id="separateSaleAndCash"
                        checked={settings.general.separateSaleAndCash}
                        onCheckedChange={(checked) => updateSettings('general', 'separateSaleAndCash', checked)}
                      />
                    </div>
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
                      value={settings.tax.defaultTaxRate}
                      onChange={(e) => updateSettings('tax', 'defaultTaxRate', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxMethod">Méthode de calcul</Label>
                    <Select 
                      value={settings.tax.taxCalculationMethod}
                      onValueChange={(value) => updateSettings('tax', 'taxCalculationMethod', value)}
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
                      value={settings.tax.taxRoundingMethod}
                      onValueChange={(value) => updateSettings('tax', 'taxRoundingMethod', value)}
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
                      checked={settings.tax.includeTaxInPrice}
                      onCheckedChange={(checked) => updateSettings('tax', 'includeTaxInPrice', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exemptProducts">Produits exonérés</Label>
                    <Switch
                      id="exemptProducts"
                      checked={settings.tax.exemptProducts}
                      onCheckedChange={(checked) => updateSettings('tax', 'exemptProducts', checked)}
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
                      checked={settings.payment.cash.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('cash', 'enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exiger rendu monnaie</Label>
                    <Switch
                      checked={settings.payment.cash.requireChange}
                      onCheckedChange={(checked) => updatePaymentMethod('cash', 'requireChange', checked)}
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
                      checked={settings.payment.card.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('card', 'enabled', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant minimum</Label>
                    <Input
                      type="number"
                      value={settings.payment.card.minAmount}
                      onChange={(e) => updatePaymentMethod('card', 'minAmount', Number(e.target.value))}
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
                      checked={settings.payment.mobile.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('mobile', 'enabled', checked)}
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
                      checked={settings.payment.credit.enabled}
                      onCheckedChange={(checked) => updatePaymentMethod('credit', 'enabled', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant maximum</Label>
                    <Input
                      type="number"
                      value={settings.payment.credit.maxAmount}
                      onChange={(e) => updatePaymentMethod('credit', 'maxAmount', Number(e.target.value))}
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
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoprint">Impression directe (sans aperçu)</Label>
                      <Switch
                        id="autoprint"
                        checked={settings.printing.autoprint}
                        onCheckedChange={(checked) => updateSettings('printing', 'autoprint', checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Désactivé : le reçu s'ouvre en aperçu. Activé : le reçu est envoyé directement à l'imprimante.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="printLogo">Imprimer logo</Label>
                    <Switch
                      id="printLogo"
                      checked={settings.printing.printLogo}
                      onCheckedChange={(checked) => updateSettings('printing', 'printLogo', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeBarcode">Code-barres sur reçu</Label>
                    <Switch
                      id="includeBarcode"
                      checked={settings.printing.includeBarcode}
                      onCheckedChange={(checked) => updateSettings('printing', 'includeBarcode', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paperSize">Format papier</Label>
                    <Select 
                      value={settings.printing.paperSize}
                      onValueChange={(value) => updateSettings('printing', 'paperSize', value)}
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
                      value={settings.printing.receiptFooter}
                      onChange={(e) => updateSettings('printing', 'receiptFooter', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receiptTemplate">Modèle de reçu</Label>
                    <Select 
                      value={settings.printing.receiptTemplate}
                      onValueChange={(value) => updateSettings('printing', 'receiptTemplate', value)}
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
                      checked={settings.register.requireOpeningAmount}
                      onCheckedChange={(checked) => updateSettings('register', 'requireOpeningAmount', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultOpening">Fonds par défaut</Label>
                    <Input
                      id="defaultOpening"
                      type="number"
                      value={settings.register.defaultOpeningAmount}
                      onChange={(e) => updateSettings('register', 'defaultOpeningAmount', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cashDrawer">Tiroir-caisse automatique</Label>
                    <Switch
                      id="cashDrawer"
                      checked={settings.register.enableCashDrawer}
                      onCheckedChange={(checked) => updateSettings('register', 'enableCashDrawer', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alertLowCash">Alerte liquidités faibles</Label>
                    <Switch
                      id="alertLowCash"
                      checked={settings.register.alertLowCash}
                      onCheckedChange={(checked) => updateSettings('register', 'alertLowCash', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lowCashThreshold">Seuil alerte liquidités</Label>
                    <Input
                      id="lowCashThreshold"
                      type="number"
                      value={settings.register.lowCashThreshold}
                      onChange={(e) => updateSettings('register', 'lowCashThreshold', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Timeout session (min)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.register.sessionTimeout}
                      onChange={(e) => updateSettings('register', 'sessionTimeout', Number(e.target.value))}
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
                      checked={settings.alerts.lowStockAlert}
                      onCheckedChange={(checked) => updateSettings('alerts', 'lowStockAlert', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expiredProducts">Produits expirés</Label>
                    <Switch
                      id="expiredProducts"
                      checked={settings.alerts.expiredProductsAlert}
                      onCheckedChange={(checked) => updateSettings('alerts', 'expiredProductsAlert', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dailyReport">Rapport quotidien</Label>
                    <Switch
                      id="dailyReport"
                      checked={settings.alerts.dailyReportReminder}
                      onCheckedChange={(checked) => updateSettings('alerts', 'dailyReportReminder', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="suspiciousActivity">Activité suspecte</Label>
                    <Switch
                      id="suspiciousActivity"
                      checked={settings.alerts.suspiciousActivityAlert}
                      onCheckedChange={(checked) => updateSettings('alerts', 'suspiciousActivityAlert', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="highValueTransaction">Transaction élevée</Label>
                    <Switch
                      id="highValueTransaction"
                      checked={settings.alerts.highValueTransactionAlert}
                      onCheckedChange={(checked) => updateSettings('alerts', 'highValueTransactionAlert', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="highValueThreshold">Seuil montant élevé</Label>
                    <Input
                      id="highValueThreshold"
                      type="number"
                      value={settings.alerts.highValueThreshold}
                      onChange={(e) => updateSettings('alerts', 'highValueThreshold', Number(e.target.value))}
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