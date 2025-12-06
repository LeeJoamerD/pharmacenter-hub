import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Share2, Search } from 'lucide-react';
import type { SharedDocument } from '@/hooks/useCollaborativeProductivity';

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: SharedDocument | null;
  pharmacies: Array<{ id: string; name: string }>;
  onShare: (documentId: string, pharmacyIds: string[]) => Promise<void>;
  isSubmitting?: boolean;
}

export function ShareDocumentDialog({
  open,
  onOpenChange,
  document,
  pharmacies,
  onShare,
  isSubmitting = false
}: ShareDocumentDialogProps) {
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>(
    document?.shared_with_pharmacies || []
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Update selected when document changes
  React.useEffect(() => {
    if (document) {
      setSelectedPharmacies(document.shared_with_pharmacies || []);
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document) return;
    
    await onShare(document.id, selectedPharmacies);
    onOpenChange(false);
  };

  const togglePharmacy = (pharmacyId: string) => {
    setSelectedPharmacies(prev => 
      prev.includes(pharmacyId) 
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  const selectAll = () => {
    setSelectedPharmacies(pharmacies.map(p => p.id));
  };

  const selectNone = () => {
    setSelectedPharmacies([]);
  };

  const filteredPharmacies = pharmacies.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Partager le document
            </DialogTitle>
            <DialogDescription>
              Sélectionner les officines avec lesquelles partager "{document.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une officine..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Officines ({selectedPharmacies.length} sélectionnées)</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                  Tout
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={selectNone}>
                  Aucun
                </Button>
              </div>
            </div>

            <ScrollArea className="h-64 border rounded-md p-2">
              <div className="space-y-2">
                {filteredPharmacies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune officine trouvée
                  </p>
                ) : (
                  filteredPharmacies.map((pharmacy) => (
                    <div
                      key={pharmacy.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => togglePharmacy(pharmacy.id)}
                    >
                      <Checkbox
                        id={`share-${pharmacy.id}`}
                        checked={selectedPharmacies.includes(pharmacy.id)}
                        onCheckedChange={() => togglePharmacy(pharmacy.id)}
                      />
                      <label
                        htmlFor={`share-${pharmacy.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {pharmacy.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {selectedPharmacies.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Le document sera accessible par {selectedPharmacies.length} officine{selectedPharmacies.length > 1 ? 's' : ''} 
                du réseau.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Partage...' : 'Partager'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
