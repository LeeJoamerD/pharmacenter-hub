import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Package, Bell, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActionLog {
  id: string;
  action_type: string;
  produit_name: string;
  result_status: string | null;
  action_details: any;
  created_at: string;
  executed_by_name?: string;
}

const actionIcons = {
  order: Package,
  alert: Bell,
  adjustment: TrendingUp,
  emergency: AlertTriangle
};

const actionLabels = {
  order: "Commande",
  alert: "Alerte créée",
  adjustment: "Ajustement",
  emergency: "Commande urgente"
};

const statusColors = {
  pending: "secondary",
  completed: "default",
  failed: "destructive"
} as const;

const statusLabels = {
  pending: "En attente",
  completed: "Complété",
  failed: "Échoué"
};

export function ActionHistoryModal({ open, onOpenChange }: ActionHistoryModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<ActionLog[]>([]);

  useEffect(() => {
    if (open) {
      fetchActionHistory();
    }
  }, [open]);

  const fetchActionHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: personnel } = await supabase
        .from("personnel")
        .select("tenant_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!personnel) throw new Error("Personnel non trouvé");

      const { data, error } = await supabase
        .from("low_stock_actions_log")
        .select(`
          id,
          action_type,
          result_status,
          action_details,
          created_at,
          produits!low_stock_actions_log_produit_id_fkey(libelle_produit),
          executed_by:personnel!low_stock_actions_log_executed_by_fkey(noms, prenoms)
        `)
        .eq("tenant_id", personnel.tenant_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        action_type: item.action_type,
        produit_name: item.produits?.libelle_produit || "Produit inconnu",
        result_status: item.result_status,
        action_details: item.action_details,
        created_at: item.created_at,
        executed_by_name: item.executed_by 
          ? `${item.executed_by.prenoms} ${item.executed_by.noms}`
          : "Système"
      })) || [];

      setActions(formattedData);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historique des Actions sur Stock Faible</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {actions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun historique disponible
                </p>
              ) : (
                actions.map((action) => {
                  const Icon = actionIcons[action.action_type as keyof typeof actionIcons] || Package;
                  const quantity = action.action_details?.quantity;
                  const notes = action.action_details?.notes;

                  return (
                    <div key={action.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {actionLabels[action.action_type as keyof typeof actionLabels] || action.action_type}
                              </span>
                              {action.result_status && (
                                <Badge variant={statusColors[action.result_status as keyof typeof statusColors] || "secondary"}>
                                  {statusLabels[action.result_status as keyof typeof statusLabels] || action.result_status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {action.produit_name}
                              {quantity && ` - Quantité: ${quantity}`}
                            </p>
                            {notes && (
                              <p className="text-sm text-muted-foreground italic">
                                {notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Par {action.executed_by_name} • {format(new Date(action.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
