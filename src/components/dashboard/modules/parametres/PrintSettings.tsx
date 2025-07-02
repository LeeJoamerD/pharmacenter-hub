import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Printer, FileText, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PrintSettings = () => {
  const { toast } = useToast();
  
  const [printSettings, setPrintSettings] = useState({
    defaultPrinter: 'HP_LaserJet_Pro',
    paperSize: 'A4',
    orientation: 'portrait',
    margin: 10,
    quality: 'high',
    colorMode: 'color',
    enableWatermark: false,
    watermarkText: 'PharmaSoft',
    headerEnabled: true,
    footerEnabled: true,
    headerText: 'PharmaSoft SARL - Système de Gestion Pharmaceutique',
    footerText: 'Confidentiel - Usage interne uniquement',
    logoEnabled: true,
    logoPosition: 'top-left',
    fontSize: 12,
    fontFamily: 'Arial'
  });

  const [receiptSettings, setReceiptSettings] = useState({
    receiptPrinter: 'Thermal_Printer_01',
    receiptWidth: 80,
    showLogo: true,
    showAddress: true,
    showPhone: true,
    autoOpenCashDrawer: true,
    printCopies: 1,
    headerLines: 'PharmaSoft SARL\nAbidjan, Cocody Riviera\nTél: +225 0123456789',
    footerLines: 'Merci de votre visite!\nÀ bientôt chez PharmaSoft'
  });

  const handleSavePrintSettings = () => {
    toast({
      title: "Paramètres d'impression sauvegardés",
      description: "La configuration d'impression a été mise à jour.",
    });
  };

  const handlePrintTest = () => {
    toast({
      title: "Test d'impression lancé",
      description: "Une page de test est en cours d'impression.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
            <CardDescription>
              Configuration générale des impressions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPrinter">Imprimante par défaut</Label>
              <Select 
                value={printSettings.defaultPrinter} 
                onValueChange={(value) => setPrintSettings(prev => ({ ...prev, defaultPrinter: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HP_LaserJet_Pro">HP LaserJet Pro</SelectItem>
                  <SelectItem value="Canon_PIXMA">Canon PIXMA</SelectItem>
                  <SelectItem value="Epson_WorkForce">Epson WorkForce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paperSize">Format papier</Label>
                <Select 
                  value={printSettings.paperSize} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, paperSize: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select 
                  value={printSettings.orientation} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quality">Qualité</Label>
                <Select 
                  value={printSettings.quality} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, quality: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="colorMode">Mode couleur</Label>
                <Select 
                  value={printSettings.colorMode} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, colorMode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Couleur</SelectItem>
                    <SelectItem value="grayscale">Niveaux de gris</SelectItem>
                    <SelectItem value="blackwhite">Noir et blanc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="margin">Marges (mm): {printSettings.margin}</Label>
              <input
                type="range"
                id="margin"
                min="5"
                max="50"
                value={printSettings.margin}
                onChange={(e) => setPrintSettings(prev => ({ ...prev, margin: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              En-tête et Pied de Page
            </CardTitle>
            <CardDescription>
              Configuration des en-têtes et pieds de page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="logoEnabled">Logo entreprise</Label>
              <Switch
                id="logoEnabled"
                checked={printSettings.logoEnabled}
                onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, logoEnabled: checked }))}
              />
            </div>
            
            {printSettings.logoEnabled && (
              <div className="space-y-2">
                <Label htmlFor="logoPosition">Position du logo</Label>
                <Select 
                  value={printSettings.logoPosition} 
                  onValueChange={(value) => setPrintSettings(prev => ({ ...prev, logoPosition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Haut gauche</SelectItem>
                    <SelectItem value="top-center">Haut centre</SelectItem>
                    <SelectItem value="top-right">Haut droite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="headerEnabled">En-tête activé</Label>
              <Switch
                id="headerEnabled"
                checked={printSettings.headerEnabled}
                onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, headerEnabled: checked }))}
              />
            </div>
            
            {printSettings.headerEnabled && (
              <div className="space-y-2">
                <Label htmlFor="headerText">Texte de l'en-tête</Label>
                <Input
                  id="headerText"
                  value={printSettings.headerText}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, headerText: e.target.value }))}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor="footerEnabled">Pied de page activé</Label>
              <Switch
                id="footerEnabled"
                checked={printSettings.footerEnabled}
                onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, footerEnabled: checked }))}
              />
            </div>
            
            {printSettings.footerEnabled && (
              <div className="space-y-2">
                <Label htmlFor="footerText">Texte du pied de page</Label>
                <Input
                  id="footerText"
                  value={printSettings.footerText}
                  onChange={(e) => setPrintSettings(prev => ({ ...prev, footerText: e.target.value }))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de Reçus
          </CardTitle>
          <CardDescription>
            Configuration spécifique pour les reçus et tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receiptPrinter">Imprimante de reçus</Label>
              <Select 
                value={receiptSettings.receiptPrinter} 
                onValueChange={(value) => setReceiptSettings(prev => ({ ...prev, receiptPrinter: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thermal_Printer_01">Imprimante Thermique 01</SelectItem>
                  <SelectItem value="POS_Printer_02">Imprimante POS 02</SelectItem>
                  <SelectItem value="Receipt_Printer_03">Imprimante Reçu 03</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiptWidth">Largeur papier (mm)</Label>
              <Select 
                value={receiptSettings.receiptWidth.toString()} 
                onValueChange={(value) => setReceiptSettings(prev => ({ ...prev, receiptWidth: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                  <SelectItem value="110">110mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo">Logo sur reçu</Label>
              <Switch
                id="showLogo"
                checked={receiptSettings.showLogo}
                onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showLogo: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showAddress">Adresse sur reçu</Label>
              <Switch
                id="showAddress"
                checked={receiptSettings.showAddress}
                onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showAddress: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoOpenCashDrawer">Ouvrir tiroir-caisse</Label>
              <Switch
                id="autoOpenCashDrawer"
                checked={receiptSettings.autoOpenCashDrawer}
                onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, autoOpenCashDrawer: checked }))}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headerLines">Lignes d'en-tête</Label>
              <Textarea
                id="headerLines"
                value={receiptSettings.headerLines}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, headerLines: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footerLines">Lignes de pied</Label>
              <Textarea
                id="footerLines"
                value={receiptSettings.footerLines}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, footerLines: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrintTest}>
          Test d'impression
        </Button>
        <Button onClick={handleSavePrintSettings}>
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
};

export default PrintSettings;