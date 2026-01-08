import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAlertSettings } from "@/hooks/useAlertSettings";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStockThreshold } from "@/lib/utils";
import { LowStockItem } from "@/hooks/useLowStockData";
import { useLanguage } from '@/contexts/LanguageContext';

interface EmergencyOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criticalItems: LowStockItem[];
}

interface Supplier {
  id: string;
  nom: string;
}

export function EmergencyOrderModal({ open, onOpenChange, criticalItems }: EmergencyOrderModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { settings } = useAlertSettings();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  const fetchSuppliers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: personnel } = await supabase
        .from("personnel")
        .select("tenant_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!personnel) return;

      const { data, error } = await supabase
        .from("fournisseurs")
        .select("id, nom")
        .eq("tenant_id", personnel.tenant_id);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error("Erreur chargement fournisseurs:", error);
    }
  };

  const handleCreateEmergencyOrder = async () => {
    if (!selectedSupplier) {
      toast({
        title: t('modalSupplierRequired'),
        description: t('pleaseSelectSupplier'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const { data: personnel } = await supabase
        .from("personnel")
        .select("id, tenant_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!personnel) throw new Error(t('personnelNotFound'));

      // Créer la commande fournisseur
      const { data: commande, error: commandeError } = await supabase
        .from("commandes_fournisseurs")
        .insert({
          tenant_id: personnel.tenant_id,
          fournisseur_id: selectedSupplier,
          agent_id: personnel.id,
          statut: "En cours",
          date_commande: new Date().toISOString()
        })
        .select()
        .single();

      if (commandeError) throw commandeError;

      // Créer les lignes de commande pour chaque produit critique
      const lignesCommande = criticalItems.map(item => {
        // Logique en cascade pour le seuil maximum
        const maximumStock = getStockThreshold('maximum', item.seuilMinimum * 2, settings?.maximum_stock_threshold);
        return {
          tenant_id: personnel.tenant_id,
          commande_id: commande.id,
          produit_id: item.id,
          quantite_commandee: Math.max(maximumStock - item.quantiteActuelle, 0),
          prix_achat_unitaire_attendu: item.prixUnitaire
        };
      });

      const { error: lignesError } = await supabase
        .from("lignes_commande_fournisseur")
        .insert(lignesCommande);

      if (lignesError) throw lignesError;

      // Logger l'action pour chaque produit
      const logPromises = criticalItems.map(item => 
        supabase.from("low_stock_actions_log").insert({
          tenant_id: personnel.tenant_id,
          action_type: "emergency",
          produit_id: item.id,
          executed_by: personnel.id,
          result_status: "completed",
          action_details: {
            quantity: item.seuilMinimum * 2 - item.quantiteActuelle,
            notes: notes || "Commande urgente automatique",
            supplier_id: selectedSupplier
          }
        })
      );
      await Promise.all(logPromises);

      toast({
        title: t('emergencyOrderCreated'),
        description: t('emergencyOrderDescription').replace('{count}', String(criticalItems.length))
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEstimated = criticalItems.reduce((acc, item) => 
    acc + (item.seuilMinimum * 2 - item.quantiteActuelle), 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('globalEmergencyOrder')}
          </DialogTitle>
          <DialogDescription>
            {t('createEmergencyOrderFor')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">
                  {criticalItems.length} {t('criticalStockProducts')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('estimatedQuantityToOrder')} {totalEstimated} {t('unitsToOrder')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">{t('selectSupplierRequired')}</Label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder={t('dialogSelectSupplier')} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('affectedProducts')}</Label>
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-4 space-y-2">
                {criticalItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.nomProduit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">
                        {t('stock')}: {item.quantiteActuelle}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        → {item.seuilMinimum * 2} {t('unitsToOrder')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('optionalNotes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('addSpecialInstructions')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button onClick={handleCreateEmergencyOrder} disabled={loading} variant="destructive">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('createEmergencyOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
