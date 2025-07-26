import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, Crop, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
}

export const ImageUpload = ({ value, onChange, label }: ImageUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropDimensions, setCropDimensions] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
          setIsOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Veuillez sélectionner un fichier image');
      }
    }
  }, []);

  const handleCrop = useCallback(() => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Set canvas size to crop dimensions
    canvas.width = cropDimensions.width;
    canvas.height = cropDimensions.height;

    // Draw cropped image
    ctx.drawImage(
      img,
      cropDimensions.x,
      cropDimensions.y,
      cropDimensions.width,
      cropDimensions.height,
      0,
      0,
      cropDimensions.width,
      cropDimensions.height
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onChange(url);
        setIsOpen(false);
        setSelectedImage(null);
        toast.success('Image mise à jour');
      }
    }, 'image/jpeg', 0.8);
  }, [selectedImage, cropDimensions, onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      
      {value && (
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Photo d'identité" 
            className="w-32 h-32 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {value ? 'Changer' : 'Choisir'} une image
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recadrer l'image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImage && (
              <div className="relative">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Aperçu"
                  className="max-w-full h-auto"
                  onLoad={() => {
                    if (imageRef.current) {
                      const { naturalWidth, naturalHeight } = imageRef.current;
                      const size = Math.min(naturalWidth, naturalHeight, 200);
                      setCropDimensions({
                        x: (naturalWidth - size) / 2,
                        y: (naturalHeight - size) / 2,
                        width: size,
                        height: size
                      });
                    }
                  }}
                />
                <div 
                  className="absolute border-2 border-primary bg-primary/20"
                  style={{
                    left: `${(cropDimensions.x / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    top: `${(cropDimensions.y / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                    width: `${(cropDimensions.width / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    height: `${(cropDimensions.height / (imageRef.current?.naturalHeight || 1)) * 100}%`
                  }}
                />
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCrop}>
                <Crop className="h-4 w-4 mr-2" />
                Recadrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};