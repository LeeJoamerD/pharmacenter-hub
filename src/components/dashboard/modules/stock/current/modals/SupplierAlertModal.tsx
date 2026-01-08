import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupplierAlerts } from "@/hooks/useSupplierAlerts";
import { CurrentStockItem } from "@/hooks/useCurrentStock";
import { useLanguage } from '@/contexts/LanguageContext';

interface SupplierAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: CurrentStockItem[];
}

interface Supplier {
  id: string;
  nom: string;
  email?: string;
  telephone_appel?: string;
  selected: boolean;
}

export function SupplierAlertModal({ open, onOpenChange, products }: SupplierAlertModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { sendMultipleSupplierAlerts } = useSupplierAlerts();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [message, setMessage] = useState("");
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [sendViaSMS, setSendViaSMS] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuppliers();
      generateDefaultMessage();
    }
  }, [open, products]);

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
        .select("id, nom, email, telephone_appel")
        .eq("tenant_id", personnel.tenant_id);

      if (error) throw error;
      
      setSuppliers((data || []).map(s => ({ ...s, selected: false })));
    } catch (error: any) {
      console.error("Erreur chargement fournisseurs:", error);
    }
  };

  const generateDefaultMessage = () => {
    const productsList = products
      .slice(0, 5)
      .map(p => `- ${p.libelle_produit} (${p.code_cip})`)
      .join('\n');
    
    const defaultMsg = `Bonjour,

Nous vous contactons concernant une situation urgente de rupture de stock sur les produits suivants :

${productsList}${products.length > 5 ? `\n... et ${products.length - 5} autres produits` : ''}

Nous aimerions passer une commande urgente pour réapprovisionner ces articles dans les plus brefs délais.

Pouvez-vous nous confirmer la disponibilité et les délais de livraison ?

Cordialement,
L'équipe pharmacie`;

    setMessage(defaultMsg);
  };

  const toggleSupplier = (supplierId: string) => {
    setSuppliers(prev =>
      prev.map(s => s.id === supplierId ? { ...s, selected: !s.selected } : s)
    );
  };

  const handleSendAlerts = async () => {
    const selectedSuppliers = suppliers.filter(s => s.selected);
    
    if (selectedSuppliers.length === 0) {
      toast({
        title: "Aucun fournisseur sélectionné",
        description: "Veuillez sélectionner au moins un fournisseur",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message requis",
        description: "Veuillez saisir un message",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const alertsToSend = selectedSuppliers.map(supplier => ({
        fournisseurId: supplier.id,
        produitsIds: products.map(p => p.id),
        typeAlerte: 'rupture_stock' as const,
        message,
        canalEnvoi: sendViaEmail ? 'email' as const : sendViaSMS ? 'sms' as const : 'plateforme' as const,
      }));

      const result = await sendMultipleSupplierAlerts(alertsToSend);

      toast({
        title: "Alertes envoyées",
        description: `${result.success} alerte(s) envoyée(s) avec succès${result.failed > 0 ? `, ${result.failed} échec(s)` : ''}`,
      });

      onOpenChange(false);
      setMessage("");
      setSuppliers(prev => prev.map(s => ({ ...s, selected: false })));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi des alertes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = suppliers.filter(s => s.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Alerter les Fournisseurs
          </DialogTitle>
          <DialogDescription>
            Envoyer une alerte de rupture de stock à vos fournisseurs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-orange-900">
                  {products.length} produit(s) en rupture de stock
                </p>
                <p className="text-sm text-orange-700">
                  Sélectionnez les fournisseurs à alerter
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fournisseurs ({selectedCount} sélectionné{selectedCount > 1 ? 's' : ''})</Label>
            <ScrollArea className="h-[180px] border rounded-lg">
              <div className="p-4 space-y-2">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={supplier.selected}
                        onCheckedChange={() => toggleSupplier(supplier.id)}
                      />
                      <div>
                        <p className="text-sm font-medium">{supplier.nom}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {supplier.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </span>
                          )}
                          {supplier.telephone_appel && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {supplier.telephone_appel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {supplier.selected && (
                      <Badge variant="secondary">Sélectionné</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label>Canal d'envoi</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sendViaEmail}
                  onCheckedChange={(checked) => {
                    setSendViaEmail(checked as boolean);
                    if (checked) setSendViaSMS(false);
                  }}
                />
                <Label className="font-normal cursor-pointer">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sendViaSMS}
                  onCheckedChange={(checked) => {
                    setSendViaSMS(checked as boolean);
                    if (checked) setSendViaEmail(false);
                  }}
                />
                <Label className="font-normal cursor-pointer">
                  <Phone className="h-4 w-4 inline mr-1" />
                  SMS
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Saisir le message à envoyer aux fournisseurs..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSendAlerts} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer les alertes ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}