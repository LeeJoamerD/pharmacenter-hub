import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Keyboard } from 'lucide-react';
import BarcodeScanner from '../../stock/BarcodeScanner';
import { POSProduct } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

interface POSBarcodeActionsProps {
  products: POSProduct[];
  onProductScanned: (product: POSProduct) => void;
}

export default function POSBarcodeActions({
  products,
  onProductScanned
}: POSBarcodeActionsProps) {
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const { toast } = useToast();

  const handleCameraScan = (barcode: string) => {
    const product = products.find(
      p => p.code_cip === barcode || p.id === barcode
    );
    
    if (product) {
      onProductScanned(product);
      toast({
        title: "Produit scanné",
        description: product.name
      });
    } else {
      toast({
        title: "Produit non trouvé",
        description: barcode,
        variant: "destructive"
      });
    }
    
    setShowCameraScanner(false);
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
          variant="outline"
          size="sm"
          className="gap-2"
          title="Scanner avec lecteur de codes-barres connecté"
        >
          <Keyboard className="h-4 w-4" />
          Scanner activé
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
