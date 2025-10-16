import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAlertSettings } from "@/hooks/useAlertSettings";
import { Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStockThreshold } from "@/lib/utils";
import { OutOfStockItem } from '@/hooks/useOutOfStockDataPaginated';

interface OrderOutOfStockProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: OutOfStockItem | null;
}

interface Supplier {
  id: string;
  nom: string;
}

export function OrderOutOfStockProductModal({ open, onOpenChange, product }: OrderOutOfStockProductModalProps) {
  const { toast } = useToast();
  const { settings } = useAlertSettings();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && product) {
      fetchSuppliers();
      // Calculer la quantité suggérée avec logique en cascade
      const maximumStock = getStockThreshold('maximum', product.stock_limite, settings?.maximum_stock_threshold);
      // Pour les produits en rupture, on suggère le stock maximum
      setQuantity(Math.max(maximumStock, 10));
    }
  }, [open, product, settings]);

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

  const handleCreateOrder = async () => {
    if (!product || !selectedSupplier) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un fournisseur",
        variant: "destructive"
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Quantité invalide",
        description: "La quantité doit être supérieure à 0",
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

      // Créer la ligne de commande
      const { error: ligneError } = await supabase
        .from("lignes_commande_fournisseur")
        .insert({
          tenant_id: personnel.tenant_id,
          commande_id: commande.id,
          produit_id: product.id,
          quantite_commandee: quantity,
          prix_achat_unitaire_attendu: product.prix_achat
        });

      if (ligneError) throw ligneError;

      // Logger l'action
      await supabase.from("audit_logs").insert({
        tenant_id: personnel.tenant_id,
        user_id: user.id,
        personnel_id: personnel.id,
        action: "ORDER_OUT_OF_STOCK_PRODUCT",
        table_name: "commandes_fournisseurs",
        record_id: commande.id,
        new_values: {
          product_id: product.id,
          product_name: product.libelle_produit,
          quantity,
          supplier_id: selectedSupplier,
          notes
        }
      });

      toast({
        title: "Commande créée",
        description: `Commande de ${quantity} unités de ${product.libelle_produit} créée avec succès`
      });

      onOpenChange(false);
      setSelectedSupplier("");
      setQuantity(0);
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

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commander un Produit en Rupture
          </DialogTitle>
          <DialogDescription>
            Créer une commande urgente pour {product.libelle_produit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Produit</p>
                <p className="text-sm text-muted-foreground">{product.libelle_produit}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Code CIP</p>
                <p className="text-sm text-muted-foreground">{product.code_cip}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Stock actuel</p>
                <p className="text-sm text-destructive font-semibold">{product.stock_actuel} unités</p>
              </div>
              <div>
                <p className="text-sm font-medium">Seuil limite</p>
                <p className="text-sm text-muted-foreground">{product.stock_limite} unités</p>
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
            <Label htmlFor="quantity">Quantité à commander *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Entrer la quantité"
            />
            <p className="text-xs text-muted-foreground">
              Suggestion: {Math.max(product.stock_limite * 2, 10)} unités (double du seuil)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Instructions spéciales ou remarques..."
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
          <Button onClick={handleCreateOrder} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}