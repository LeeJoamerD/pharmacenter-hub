import React, { useRef, useEffect, useState } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (barcode: string) => void;
  title?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
  title = "Scanner de Code-Barres"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setLastScannedCode(null);

      // Initialize barcode detector with polyfill
      barcodeDetectorRef.current = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
      });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsScanning(true);
      startBarcodeDetection();
      
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Erreur d\'accès à la caméra';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'Aucune caméra trouvée sur cet appareil.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'La caméra est utilisée par une autre application.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Erreur caméra",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const startBarcodeDetection = () => {
    if (!videoRef.current || !canvasRef.current || !barcodeDetectorRef.current) return;

    const detectBarcodes = async () => {
      if (!videoRef.current || !canvasRef.current || !barcodeDetectorRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const barcodes = await barcodeDetectorRef.current.detect(canvas);
        
        if (barcodes.length > 0) {
          const barcode = barcodes[0];
          const scannedValue = barcode.rawValue;
          
          // Avoid duplicate scans
          if (scannedValue && scannedValue !== lastScannedCode) {
            setLastScannedCode(scannedValue);
            onScanResult(scannedValue);
            
            toast({
              title: "Code-barres détecté",
              description: `Code: ${scannedValue}`,
            });
            
            stopCamera();
            onClose();
          }
        }
      } catch (detectionError) {
        // Silent fail - continue scanning
        console.debug('Detection cycle error:', detectionError);
      }
    };

    scanIntervalRef.current = setInterval(detectBarcodes, 150);
  };

  const stopCamera = () => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    barcodeDetectorRef.current = null;
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Dirigez la caméra vers un code-barres pour le scanner automatiquement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="text-destructive">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-medium">Erreur de caméra</p>
                    <p className="text-sm text-muted-foreground mt-2">{error}</p>
                  </div>
                  <Button onClick={startCamera} variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                autoPlay
                muted
                playsInline
              />
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary rounded-lg w-48 h-32 relative">
                    <div className="absolute inset-0 border border-dashed border-primary/50 animate-pulse"></div>
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                  </div>
                </div>
              )}
              
              {/* Scanning indicator */}
              {isScanning && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Zap className="h-3 w-3 animate-pulse" />
                  Scanning...
                </div>
              )}
              
              {/* Hidden canvas for barcode detection */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Formats: EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E, QR
            </p>
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
