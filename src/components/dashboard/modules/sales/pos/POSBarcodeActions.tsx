import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Keyboard, CheckCircle2, XCircle } from 'lucide-react';
import BarcodeScanner from '../../stock/BarcodeScanner';
import { setupBarcodeScanner } from '@/utils/barcodeScanner';
import { useToast } from '@/hooks/use-toast';

interface POSBarcodeActionsProps {
  onBarcodeScanned: (barcode: string) => void;
}

export default function POSBarcodeActions({
  onBarcodeScanned
}: POSBarcodeActionsProps) {
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isPhysicalScannerActive, setIsPhysicalScannerActive] = useState(true);
  const { toast } = useToast();

  const handleCameraScan = (barcode: string) => {
    onBarcodeScanned(barcode);
    setShowCameraScanner(false);
  };

  // Stable callback for physical scanner
  const handlePhysicalScan = useCallback((barcode: string) => {
    onBarcodeScanned(barcode);
    toast({
      title: "Code scanné",
      description: `Code-barres: ${barcode}`,
    });
  }, [onBarcodeScanned, toast]);

  // Setup physical barcode scanner
  useEffect(() => {
    if (!isPhysicalScannerActive) return;

    const cleanup = setupBarcodeScanner(handlePhysicalScan, {
      minLength: 7,
      maxLength: 20,
      timeout: 100,
    });

    return cleanup;
  }, [isPhysicalScannerActive, handlePhysicalScan]);

  const togglePhysicalScanner = () => {
    setIsPhysicalScannerActive(prev => {
      const newState = !prev;
      toast({
        title: newState ? "Scanner activé" : "Scanner désactivé",
        description: newState 
          ? "Le lecteur de codes-barres est maintenant actif" 
          : "Le lecteur de codes-barres est désactivé",
      });
      return newState;
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCameraScanner(true)}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Scanner (Caméra)
        </Button>
        <Button
          variant={isPhysicalScannerActive ? "default" : "outline"}
          size="sm"
          onClick={togglePhysicalScanner}
          className="gap-2"
          title={isPhysicalScannerActive 
            ? "Cliquez pour désactiver le lecteur de codes-barres" 
            : "Cliquez pour activer le lecteur de codes-barres"
          }
        >
          {isPhysicalScannerActive ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Scanner actif</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>Scanner inactif</span>
            </>
          )}
        </Button>
      </div>

      <BarcodeScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanResult={handleCameraScan}
        title="Scanner un produit"
      />
    </>
  );
}
