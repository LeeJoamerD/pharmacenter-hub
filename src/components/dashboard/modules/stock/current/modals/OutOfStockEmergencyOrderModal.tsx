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
import { CurrentStockItem } from "@/hooks/useCurrentStock";

interface OutOfStockEmergencyOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criticalItems: CurrentStockItem[];
}

interface Supplier {
  id: string;
  nom: string;
}

export function OutOfStockEmergencyOrderModal({ open, onOpenChange, criticalItems }: OutOfStockEmergencyOrderModalProps) {
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
        title: "Fournisseur requis",
        description: "Veuillez sélectionner un fournisseur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: personnel } = await supabase
        .from("personnel")
        .select("id, tenant_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!personnel) throw new Error("Personnel non trouvé");

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

      // Créer les lignes de commande pour chaque produit en rupture
      const lignesCommande = criticalItems.map(item => {
        // Logique en cascade pour le seuil maximum
        const maximumStock = getStockThreshold('maximum', item.stock_limite, settings?.maximum_stock_threshold);
        return {
          tenant_id: personnel.tenant_id,
          commande_id: commande.id,
          produit_id: item.id,
          quantite_commandee: Math.max(maximumStock, 10), // Commander jusqu'au stock maximum
          prix_achat_unitaire_attendu: item.prix_achat
        };
      });

      const { error: lignesError } = await supabase
        .from("lignes_commande_fournisseur")
        .insert(lignesCommande);

      if (lignesError) throw lignesError;

      // Logger l'action
      await supabase.from("audit_logs").insert({
        tenant_id: personnel.tenant_id,
        user_id: user.id,
        personnel_id: personnel.id,
        action: "EMERGENCY_ORDER_OUT_OF_STOCK",
        table_name: "commandes_fournisseurs",
        record_id: commande.id,
        new_values: {
          products_count: criticalItems.length,
          supplier_id: selectedSupplier,
          notes: notes || "Commande urgente pour produits en rupture"
        }
      });

      toast({
        title: "Commande urgente créée",
        description: `Commande de ${criticalItems.length} produits en rupture envoyée au fournisseur`
      });

      onOpenChange(false);
      setSelectedSupplier("");
      setNotes("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEstimated = criticalItems.reduce((acc, item) => 
    acc + Math.max(item.stock_limite * 2, 10), 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Commande Urgente - Produits en Rupture
          </DialogTitle>
          <DialogDescription>
            Créer une commande d'urgence pour les produits en rupture de stock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">
                  {criticalItems.length} produits en rupture de stock
                </p>
                <p className="text-sm text-muted-foreground">
                  Quantité totale estimée à commander: {totalEstimated} unités
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fournisseur *</Label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Sélectionner un fournisseur" />
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
            <Label>Produits en rupture</Label>
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-4 space-y-2">
                {criticalItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{item.libelle_produit}</span>
                        <p className="text-xs text-muted-foreground">{item.code_cip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">
                        Stock: {item.stock_actuel}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        → {Math.max(item.stock_limite * 2, 10)} unités
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des instructions spéciales pour cette commande d'urgence..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleCreateEmergencyOrder} disabled={loading} variant="destructive">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer la commande urgente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}