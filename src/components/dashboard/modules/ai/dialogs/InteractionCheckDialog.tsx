import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DrugInteraction } from '@/hooks/usePharmaceuticalExpert';

interface InteractionCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheck: (drug1: string, drug2: string) => Promise<DrugInteraction[]>;
}

const InteractionCheckDialog: React.FC<InteractionCheckDialogProps> = ({
  open,
  onOpenChange,
  onCheck
}) => {
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<DrugInteraction[] | null>(null);

  const handleCheck = async () => {
    if (!drug1.trim() || !drug2.trim()) return;
    
    setChecking(true);
    try {
      const interactions = await onCheck(drug1.trim(), drug2.trim());
      setResults(interactions);
    } finally {
      setChecking(false);
    }
  };

  const handleClose = () => {
    setDrug1('');
    setDrug2('');
    setResults(null);
    onOpenChange(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return 'bg-red-100 text-red-800 border-red-200';
      case 'major': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return 'Contre-indiquée';
      case 'major': return 'Majeure';
      case 'moderate': return 'Modérée';
      default: return 'Mineure';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vérifier une Interaction
          </DialogTitle>
          <DialogDescription>
            Entrez les noms des deux médicaments pour vérifier les interactions potentielles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drug1">Médicament 1</Label>
              <Input
                id="drug1"
                placeholder="Ex: Warfarine"
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drug2">Médicament 2</Label>
              <Input
                id="drug2"
                placeholder="Ex: Aspirine"
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleCheck} 
            disabled={!drug1.trim() || !drug2.trim() || checking}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {checking ? 'Recherche...' : 'Vérifier l\'interaction'}
          </Button>

          {results !== null && (
            <div className="space-y-4 pt-4 border-t">
              {results.length === 0 ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Aucune interaction connue entre {drug1} et {drug2}
                  </AlertDescription>
                </Alert>
              ) : (
                results.map((interaction, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${getSeverityColor(interaction.severity)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getSeverityColor(interaction.severity)}>
                        {getSeverityLabel(interaction.severity)}
                      </Badge>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    
                    <h4 className="font-semibold mb-2">
                      {interaction.drug1_name} + {interaction.drug2_name}
                    </h4>
                    
                    {interaction.clinical_effect && (
                      <p className="text-sm mb-2">{interaction.clinical_effect}</p>
                    )}
                    
                    {interaction.mechanism && (
                      <p className="text-xs opacity-75 mb-2">
                        Mécanisme: {interaction.mechanism}
                      </p>
                    )}
                    
                    {interaction.management && (
                      <div className="mt-3 p-2 bg-white/50 rounded">
                        <span className="font-medium text-sm">Conduite à tenir: </span>
                        <span className="text-sm">{interaction.management}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InteractionCheckDialog;
