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
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if ((!isDragging && !isResizing) || !imageRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / imageRect.width;
    const scaleY = imageRef.current.naturalHeight / imageRect.height;

    const deltaX = (e.clientX - dragStart.x) * scaleX;
    const deltaY = (e.clientY - dragStart.y) * scaleY;

    if (isDragging) {
      setCropDimensions(prev => {
        const newX = Math.max(0, Math.min(prev.x + deltaX, imageRef.current!.naturalWidth - prev.width));
        const newY = Math.max(0, Math.min(prev.y + deltaY, imageRef.current!.naturalHeight - prev.height));
        return { ...prev, x: newX, y: newY };
      });
    } else if (isResizing) {
      setCropDimensions(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = prev.x;
        let newY = prev.y;

        if (resizeHandle.includes('e')) {
          newWidth = Math.min(prev.width + deltaX, imageRef.current!.naturalWidth - prev.x);
        }
        if (resizeHandle.includes('w')) {
          const widthChange = Math.min(deltaX, prev.x);
          newWidth = prev.width - widthChange;
          newX = prev.x + widthChange;
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.min(prev.height + deltaY, imageRef.current!.naturalHeight - prev.y);
        }
        if (resizeHandle.includes('n')) {
          const heightChange = Math.min(deltaY, prev.y);
          newHeight = prev.height - heightChange;
          newY = prev.y + heightChange;
        }

        // Maintenir une taille minimale
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        return { x: newX, y: newY, width: newWidth, height: newHeight };
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, isResizing, dragStart, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recadrer l'image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImage && (
              <div ref={containerRef} className="relative select-none">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Aperçu"
                  className="max-w-full h-auto"
                  draggable={false}
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
                  className="absolute border-2 border-primary bg-primary/20 cursor-move touch-none"
                  style={{
                    left: `${(cropDimensions.x / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    top: `${(cropDimensions.y / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                    width: `${(cropDimensions.width / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    height: `${(cropDimensions.height / (imageRef.current?.naturalHeight || 1)) * 100}%`
                  }}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).dataset.resize) return;
                    setIsDragging(true);
                    setDragStart({ x: e.clientX, y: e.clientY });
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="absolute inset-0 border border-white/50"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs font-medium">
                    Glisser pour déplacer
                  </div>
                  
                  {/* Poignées de redimensionnement */}
                  <div 
                    data-resize="nw"
                    className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white cursor-nw-resize"
                    onMouseDown={(e) => {
                      setIsResizing(true);
                      setResizeHandle('nw');
                      setDragStart({ x: e.clientX, y: e.clientY });
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <div 
                    data-resize="ne"
                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white cursor-ne-resize"
                    onMouseDown={(e) => {
                      setIsResizing(true);
                      setResizeHandle('ne');
                      setDragStart({ x: e.clientX, y: e.clientY });
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <div 
                    data-resize="sw"
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white cursor-sw-resize"
                    onMouseDown={(e) => {
                      setIsResizing(true);
                      setResizeHandle('sw');
                      setDragStart({ x: e.clientX, y: e.clientY });
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <div 
                    data-resize="se"
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white cursor-se-resize"
                    onMouseDown={(e) => {
                      setIsResizing(true);
                      setResizeHandle('se');
                      setDragStart({ x: e.clientX, y: e.clientY });
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                </div>
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