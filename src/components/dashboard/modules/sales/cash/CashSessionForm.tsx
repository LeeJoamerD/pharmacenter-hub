import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, User, FileText } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTenant } from '@/contexts/TenantContext';
import { useSalesSettings } from '@/hooks/useSalesSettings';
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  noms: string;
  prenoms: string;
  role: string;
}

interface CashSessionFormProps {
  sessionId?: string;
  onClose: () => void;
  onSubmit: (agentId: string, amount: number, notes?: string) => Promise<any>;
  loading: boolean;
  isClosing?: boolean;
}

const CashSessionForm = ({ sessionId, onClose, onSubmit, loading, isClosing = false }: CashSessionFormProps) => {
  const [formData, setFormData] = useState({
    agentId: '',
    amount: '',
    notes: ''
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  const { formatPrice } = useCurrency();
  const { currentTenant } = useTenant();
  const { settings } = useSalesSettings();

  // Charger les agents disponibles
  const loadAgents = async () => {
    if (!currentTenant?.id) return;

    setLoadingAgents(true);
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('id, noms, prenoms, role')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .in('role', ['Admin', 'Caissier', 'Vendeur'])
        .order('noms', { ascending: true });

      if (error) throw error;

      setAgents(data || []);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    loadAgents();
    
    // Pré-remplir le montant d'ouverture par défaut si ce n'est pas une fermeture
    if (!isClosing && settings?.register?.defaultOpeningAmount) {
      setFormData(prev => ({
        ...prev,
        amount: settings.register.defaultOpeningAmount.toString()
      }));
    }
  }, [currentTenant?.id, isClosing, settings?.register?.defaultOpeningAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isClosing) {
        await onSubmit('', parseFloat(formData.amount), formData.notes);
      } else {
        await onSubmit(
          formData.agentId,
          parseFloat(formData.amount),
          formData.notes
        );
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {isClosing ? 'Fermer la Session de Caisse' : 'Ouvrir une Session de Caisse'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isClosing && (
            <div className="space-y-2">
              <Label htmlFor="agent" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Agent / Caissier
              </Label>
              <Select 
                value={formData.agentId} 
                onValueChange={(value) => handleInputChange('agentId', value)}
                disabled={loadingAgents}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAgents ? "Chargement..." : "Sélectionner un agent"} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.prenoms} {agent.noms} ({agent.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {agents.length === 0 && !loadingAgents && (
                <p className="text-xs text-muted-foreground text-orange-600">
                  Aucun agent disponible. Vérifiez les permissions.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isClosing ? 'Montant de Fermeture' : 'Montant d\'Ouverture'}
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                FCFA
              </span>
            </div>
            {isClosing && (
              <p className="text-xs text-muted-foreground">
                Entrez le montant réellement comptabilisé en caisse
              </p>
            )}
            {!isClosing && settings?.register?.defaultOpeningAmount && (
              <p className="text-xs text-muted-foreground">
                Montant par défaut: {formatPrice(settings.register.defaultOpeningAmount)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder={isClosing ? "Observations sur la session..." : "Notes d'ouverture..."}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.amount || (!isClosing && !formData.agentId)}
              variant={isClosing ? "destructive" : "default"}
            >
              {loading ? 'Traitement...' : (isClosing ? 'Fermer la Session' : 'Ouvrir la Session')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashSessionForm;