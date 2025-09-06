import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Zap } from 'lucide-react';
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
  const { toast } = useToast();
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if BarcodeDetector is supported
      if (!('BarcodeDetector' in window)) {
        throw new Error('La détection de codes-barres n\'est pas supportée sur ce navigateur');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      startBarcodeDetection();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'accès à la caméra';
      setError(errorMessage);
      toast({
        title: "Erreur caméra",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const startBarcodeDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const barcodeDetector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code']
      });

      const detectBarcodes = async () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            onScanResult(barcode.rawValue);
            
            toast({
              title: "Code-barres détecté",
              description: `Code: ${barcode.rawValue}`,
            });
            
            // Stop scanning after successful detection
            stopCamera();
            onClose();
          }
        } catch (detectionError) {
          // Silent fail - continue scanning
        }
      };

      // Start detection loop
      scanIntervalRef.current = setInterval(detectBarcodes, 100);
      
    } catch (err) {
      setError('Erreur lors de l\'initialisation du détecteur de codes-barres');
    }
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
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Start camera when dialog opens
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

  // Cleanup on unmount
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
                  <div className="text-red-500">
                    <X className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-medium">Erreur de caméra</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white rounded-lg w-48 h-32 relative">
                    <div className="absolute inset-0 border border-dashed border-white animate-pulse"></div>
                  </div>
                </div>
              )}
              
              {/* Scanning indicator */}
              {isScanning && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Zap className="h-3 w-3" />
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
              Formats supportés: EAN-13, EAN-8, Code 128, Code 39, QR Code
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