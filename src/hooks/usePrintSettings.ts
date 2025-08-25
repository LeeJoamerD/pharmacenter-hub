import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePharmaciesQuery } from '@/hooks/useTenantQuery';

interface PrintSettings {
  defaultPrinter: string;
  paperSize: string;
  orientation: string;
  margin: number;
  quality: string;
  colorMode: string;
  enableWatermark: boolean;
  watermarkText: string;
  headerEnabled: boolean;
  footerEnabled: boolean;
  headerText: string;
  footerText: string;
  logoEnabled: boolean;
  logoPosition: string;
  fontSize: number;
  fontFamily: string;
}

interface ReceiptSettings {
  receiptPrinter:string;
  receiptWidth: number;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  autoOpenCashDrawer: boolean;
  printCopies: number;
  headerLines: string;
  footerLines: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
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
};

const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  receiptPrinter: 'Thermal_Printer_01',
  receiptWidth: 80,
  showLogo: true,
  showAddress: true,
  showPhone: true,
  autoOpenCashDrawer: true,
  printCopies: 1,
  headerLines: 'PharmaSoft SARL\nAbidjan, Cocody Riviera\nTél: +225 0123456789',
  footerLines: 'Merci de votre visite!\nÀ bientôt chez PharmaSoft'
};

// Mapping des propriétés UI vers les clés de la base de données
const PRINT_SETTINGS_MAPPING = {
  defaultPrinter: 'print_default_printer',
  paperSize: 'print_paper_size',
  orientation: 'print_orientation',
  margin: 'print_margin_mm',
  quality: 'print_quality',
  colorMode: 'print_color_mode',
  enableWatermark: 'print_watermark_enabled',
  watermarkText: 'print_watermark_text',
  headerEnabled: 'print_header_enabled',
  footerEnabled: 'print_footer_enabled',
  headerText: 'print_header_text',
  footerText: 'print_footer_text',
  logoEnabled: 'print_logo_enabled',
  logoPosition: 'print_logo_position',
  fontSize: 'print_font_size',
  fontFamily: 'print_font_family'
} as const;

const RECEIPT_SETTINGS_MAPPING = {
  receiptPrinter: 'receipt_printer',
  receiptWidth: 'receipt_paper_width_mm',
  showLogo: 'receipt_show_logo',
  showAddress: 'receipt_show_address',
  showPhone: 'receipt_show_phone',
  autoOpenCashDrawer: 'receipt_auto_open_drawer',
  printCopies: 'receipt_print_copies',
  headerLines: 'receipt_header_lines',
  footerLines: 'receipt_footer_lines'
} as const;

export const usePrintSettings = () => {
  const { toast } = useToast();
  const { data: pharmacy, isLoading: pharmacyLoading } = usePharmaciesQuery();
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Convertir les valeurs de la DB vers les types UI
  const parseDbValue = (value: string, type: 'boolean' | 'number' | 'string'): any => {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return Number(value);
      case 'string':
      default:
        return value;
    }
  };

  // Convertir les valeurs UI vers le format DB (string)
  const formatDbValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  };

  // Charger les paramètres depuis la base de données
  const loadSettings = useCallback(async () => {
    if (!pharmacy?.id || pharmacyLoading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parametres_systeme')
        .select('cle_parametre, valeur_parametre')
        .eq('tenant_id', pharmacy.id)
        .eq('categorie', 'print');

      if (error) {
        console.error('Erreur lors du chargement des paramètres d\'impression:', error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de charger les paramètres d'impression."
        });
        return;
      }

      if (data?.length > 0) {
        const dbSettings: Record<string, string> = {};
        data.forEach(item => {
          dbSettings[item.cle_parametre] = item.valeur_parametre;
        });

        // Appliquer les paramètres généraux
        const newPrintSettings = { ...DEFAULT_PRINT_SETTINGS };
        Object.entries(PRINT_SETTINGS_MAPPING).forEach(([uiKey, dbKey]) => {
          if (dbSettings[dbKey] !== undefined) {
            const type = typeof DEFAULT_PRINT_SETTINGS[uiKey as keyof PrintSettings];
            (newPrintSettings as any)[uiKey] = parseDbValue(dbSettings[dbKey], type as any);
          }
        });
        setPrintSettings(newPrintSettings);

        // Appliquer les paramètres de reçus
        const newReceiptSettings = { ...DEFAULT_RECEIPT_SETTINGS };
        Object.entries(RECEIPT_SETTINGS_MAPPING).forEach(([uiKey, dbKey]) => {
          if (dbSettings[dbKey] !== undefined) {
            const type = typeof DEFAULT_RECEIPT_SETTINGS[uiKey as keyof ReceiptSettings];
            (newReceiptSettings as any)[uiKey] = parseDbValue(dbSettings[dbKey], type as any);
          }
        });
        setReceiptSettings(newReceiptSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement."
      });
    } finally {
      setLoading(false);
    }
  }, [pharmacy?.id, pharmacyLoading, toast]);

  // Sauvegarder les paramètres
  const saveSettings = useCallback(async () => {
    if (!pharmacy?.id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune pharmacie sélectionnée."
      });
      return;
    }

    setSaving(true);
    try {
      const upsertData: Array<{ 
        tenant_id: string;
        categorie: string;
        cle_parametre: string; 
        valeur_parametre: string;
        type_parametre: string;
      }> = [];

      // Préparer les paramètres généraux
      Object.entries(PRINT_SETTINGS_MAPPING).forEach(([uiKey, dbKey]) => {
        upsertData.push({
          tenant_id: pharmacy.id,
          categorie: 'print',
          cle_parametre: dbKey,
          valeur_parametre: formatDbValue((printSettings as any)[uiKey]),
          type_parametre: 'string'
        });
      });

      // Préparer les paramètres de reçus
      Object.entries(RECEIPT_SETTINGS_MAPPING).forEach(([uiKey, dbKey]) => {
        upsertData.push({
          tenant_id: pharmacy.id,
          categorie: 'print',
          cle_parametre: dbKey,
          valeur_parametre: formatDbValue((receiptSettings as any)[uiKey]),
          type_parametre: 'string'
        });
      });

      const { error } = await supabase
        .from('parametres_systeme')
        .upsert(upsertData, {
          onConflict: 'tenant_id,cle_parametre'
        });

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast({
          variant: "destructive",
          title: "Erreur de sauvegarde",
          description: "Impossible de sauvegarder les paramètres d'impression."
        });
        return;
      }

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres d'impression ont été sauvegardés avec succès."
      });

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde."
      });
    } finally {
      setSaving(false);
    }
  }, [pharmacy?.id, printSettings, receiptSettings, toast]);

  // Test d'impression
  const handlePrintTest = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ouvrir la fenêtre d'impression."
      });
      return;
    }

    const testContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test d'impression - PharmaSoft</title>
          <style>
            @page {
              size: ${printSettings.paperSize};
              orientation: ${printSettings.orientation};
              margin: ${printSettings.margin}mm;
            }
            body {
              font-family: ${printSettings.fontFamily};
              font-size: ${printSettings.fontSize}px;
              color: ${printSettings.colorMode === 'blackwhite' ? '#000' : printSettings.colorMode === 'grayscale' ? '#666' : '#333'};
              ${printSettings.enableWatermark ? `
                background-image: url("data:image/svg+xml,${encodeURIComponent(`
                  <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'>
                    <text x='150' y='150' font-family='Arial' font-size='24' text-anchor='middle' opacity='0.1' transform='rotate(-45 150 150)'>${printSettings.watermarkText}</text>
                  </svg>
                `)}");
                background-repeat: repeat;
              ` : ''}
            }
            .header {
              text-align: ${printSettings.logoPosition.includes('center') ? 'center' : printSettings.logoPosition.includes('right') ? 'right' : 'left'};
              margin-bottom: 20px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
              font-size: ${printSettings.fontSize - 2}px;
            }
            .content {
              margin: 20px 0;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          ${printSettings.headerEnabled ? `
            <div class="header">
              ${printSettings.logoEnabled ? '<div>[LOGO ENTREPRISE]</div>' : ''}
              <h2>${printSettings.headerText}</h2>
            </div>
          ` : ''}
          
          <div class="content">
            <h1>Test d'impression - PharmaSoft</h1>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure:</strong> ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p><strong>Paramètres appliqués:</strong></p>
            <ul>
              <li>Format papier: ${printSettings.paperSize}</li>
              <li>Orientation: ${printSettings.orientation}</li>
              <li>Qualité: ${printSettings.quality}</li>
              <li>Mode couleur: ${printSettings.colorMode}</li>
              <li>Marges: ${printSettings.margin}mm</li>
              <li>Police: ${printSettings.fontFamily}, ${printSettings.fontSize}px</li>
            </ul>
            
            <h3>Test de reçu (${receiptSettings.receiptWidth}mm):</h3>
            <div style="border: 1px dashed #ccc; padding: 10px; width: ${receiptSettings.receiptWidth * 2}px; font-family: monospace; font-size: 10px;">
              ${receiptSettings.showLogo ? '[LOGO]<br>' : ''}
              ${receiptSettings.headerLines.split('\n').map(line => line + '<br>').join('')}
              <br>
              ================================
              <br>
              ARTICLE TEST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 15.00€
              <br>
              ================================
              <br>
              TOTAL: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 15.00€
              <br><br>
              ${receiptSettings.footerLines.split('\n').map(line => line + '<br>').join('')}
            </div>
          </div>
          
          ${printSettings.footerEnabled ? `
            <div class="footer">
              ${printSettings.footerText}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(testContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      toast({
        title: "Test d'impression lancé",
        description: "La page de test a été envoyée à l'imprimante."
      });
    }, 500);
  }, [printSettings, receiptSettings, toast]);

  // Charger les paramètres au montage du composant et quand la pharmacie change
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    printSettings,
    setPrintSettings,
    receiptSettings,
    setReceiptSettings,
    loading,
    saving,
    saveSettings,
    handlePrintTest,
    refetch: loadSettings
  };
};