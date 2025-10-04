import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LowStockItem } from "@/hooks/useLowStockData";

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
  const { toast } = useToast();
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

      // Créer les lignes de commande pour chaque produit critique
      const lignesCommande = criticalItems.map(item => ({
        tenant_id: personnel.tenant_id,
        commande_id: commande.id,
        produit_id: item.id,
        quantite_commandee: Math.max(item.seuilMinimum * 2 - item.quantiteActuelle, 0),
        prix_unitaire: item.prixUnitaire
      }));

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
        title: "Commande urgente créée",
        description: `Commande de ${criticalItems.length} produits critiques envoyée au fournisseur`
      });

      onOpenChange(false);
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
    acc + (item.seuilMinimum * 2 - item.quantiteActuelle), 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Commande Urgente Globale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">
                  {criticalItems.length} produits en stock critique
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
            <Label>Produits concernés</Label>
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
                        Stock: {item.quantiteActuelle}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        → {item.seuilMinimum * 2} unités
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
              placeholder="Ajouter des instructions spéciales..."
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
