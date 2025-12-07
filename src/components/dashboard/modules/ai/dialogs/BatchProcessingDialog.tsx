import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Zap, X, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface BatchProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartBatch: (files: File[], batchName: string) => Promise<string | null>;
  isProcessing: boolean;
}

export default function BatchProcessingDialog({
  open,
  onOpenChange,
  onStartBatch,
  isProcessing
}: BatchProcessingDialogProps) {
  const [batchName, setBatchName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStart = async () => {
    if (!batchName.trim() || files.length === 0) return;
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 100));
    }, 500);

    await onStartBatch(files, batchName);
    
    clearInterval(interval);
    setProgress(100);
    
    // Reset after short delay
    setTimeout(() => {
      setBatchName('');
      setFiles([]);
      setProgress(0);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Nouveau Traitement par Lot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Nom du lot</Label>
            <Input
              id="batch-name"
              placeholder="ex: Inventaire Matin 05/01"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* File drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
              disabled={isProcessing}
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cliquez pour sélectionner ou glissez-déposez vos images
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG jusqu'à 10MB chacun
            </p>
          </div>

          {/* Selected files list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <Label>Fichiers sélectionnés ({files.length})</Label>
              {files.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {!isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Traitement en cours...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {progress === 100 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Traitement terminé avec succès !</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Annuler
          </Button>
          <Button 
            onClick={handleStart}
            disabled={!batchName.trim() || files.length === 0 || isProcessing}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isProcessing ? 'Traitement...' : `Démarrer (${files.length} images)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
