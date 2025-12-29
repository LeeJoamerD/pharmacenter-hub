import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

export interface InventorySession {
  id: string;
  nom: string;
  description: string;
  dateCreation: Date;
  dateDebut?: Date;
  dateFin?: Date;
  statut: "planifiee" | "en_cours" | "terminee" | "suspendue";
  type: "complet" | "partiel" | "cyclique";
  responsable: string;
  participants: string[];
  secteurs: string[];
  progression: number;
  produitsComptes: number;
  produitsTotal: number;
  ecarts: number;
  // Nouveaux champs de filtrage
  filtresRayon?: string[];
  filtresFournisseur?: string[];
  filtresEmplacement?: string[];
  filtresPeremptionJours?: number;
  cycliqueJours?: number;
}

export interface CreateSessionData {
  nom: string;
  description: string;
  type: string;
  responsable: string;
  participants: string[];
  secteurs?: string[];
  filtresRayon?: string[];
  filtresFournisseur?: string[];
  filtresEmplacement?: string[];
  filtresPeremptionJours?: number;
  cycliqueJours?: number;
}

export const useInventorySessions = () => {
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useTenant();

  // ✅ CORRECTION : Wrapper fetchSessions dans useCallback pour stabilité
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      if (!tenantId) {
        console.warn("Aucun tenant trouvé, impossible de charger les sessions d'inventaire");
        setSessions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("inventaire_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedSessions: InventorySession[] =
        data?.map((session) => ({
          id: session.id,
          nom: session.nom || "Session sans nom",
          description: session.description || "",
          dateCreation: new Date(session.created_at),
          dateDebut: session.date_debut ? new Date(session.date_debut) : undefined,
          dateFin: session.date_fin ? new Date(session.date_fin) : undefined,
          statut: (session.statut || "planifiee") as InventorySession["statut"],
          type: (session.type || "complet") as InventorySession["type"],
          responsable: session.responsable || "Non assigné",
          participants: session.participants || [],
          secteurs: session.secteurs || [],
          progression: session.progression || 0,
          produitsComptes: session.produits_comptes || 0,
          produitsTotal: session.produits_total || 0,
          ecarts: session.ecarts || 0,
          // Nouveaux champs de filtrage
          filtresRayon: (session as any).filtres_rayon || [],
          filtresFournisseur: (session as any).filtres_fournisseur || [],
          filtresEmplacement: (session as any).filtres_emplacement || [],
          filtresPeremptionJours: (session as any).filtres_peremption_jours,
          cycliqueJours: (session as any).cyclique_jours || 30,
        })) || [];

      setSessions(mappedSessions);
    } catch (error) {
      console.error("Erreur chargement sessions:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createSession = useCallback(
    async (sessionData: CreateSessionData) => {
      try {
        if (!tenantId) {
          toast.error("Aucun tenant trouvé");
          return;
        }

        // Get current user personnel
        const { data: personnelData, error: personnelError } = await supabase
          .from("personnel")
          .select("id")
          .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (personnelError || !personnelData) {
          toast.error("Utilisateur non trouvé");
          return;
        }

        // Créer la session d'inventaire avec les nouveaux filtres
        const insertData: any = {
          tenant_id: tenantId,
          nom: sessionData.nom,
          description: sessionData.description,
          type: sessionData.type,
          responsable: sessionData.responsable,
          participants: sessionData.participants,
          secteurs: sessionData.secteurs || [],
          agent_id: personnelData.id,
          statut: "planifiee",
          progression: 0,
          produits_comptes: 0,
          produits_total: 0,
          ecarts: 0,
        };

        // Ajouter les filtres selon le type
        if (sessionData.type === "partiel") {
          insertData.filtres_rayon = sessionData.filtresRayon || [];
          insertData.filtres_fournisseur = sessionData.filtresFournisseur || [];
          insertData.filtres_emplacement = sessionData.filtresEmplacement || [];
          insertData.filtres_peremption_jours = sessionData.filtresPeremptionJours || null;
        } else if (sessionData.type === "cyclique") {
          insertData.cyclique_jours = sessionData.cycliqueJours || 30;
        }

        const { data: sessionInserted, error } = await supabase
          .from("inventaire_sessions")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        toast.success("Session d'inventaire créée avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur création session:", error);
        toast.error("Erreur lors de la création de la session");
      }
    },
    [tenantId, fetchSessions],
  );

  const startSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error } = await supabase
          .from("inventaire_sessions")
          .update({
            statut: "en_cours",
            date_debut: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("tenant_id", tenantId);

        if (error) throw error;

        toast.success("Session démarrée avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur démarrage session:", error);
        toast.error("Erreur lors du démarrage");
      }
    },
    [tenantId, fetchSessions],
  );

  const stopSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error } = await supabase
          .from("inventaire_sessions")
          .update({
            statut: "terminee",
            date_fin: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("tenant_id", tenantId);

        if (error) throw error;

        toast.success("Session arrêtée avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur arrêt session:", error);
        toast.error("Erreur lors de l'arrêt");
      }
    },
    [tenantId, fetchSessions],
  );

  const suspendSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error } = await supabase
          .from("inventaire_sessions")
          .update({
            statut: "suspendue",
          })
          .eq("id", sessionId)
          .eq("tenant_id", tenantId);

        if (error) throw error;

        toast.success("Session suspendue avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur suspension session:", error);
        toast.error("Erreur lors de la suspension");
      }
    },
    [tenantId, fetchSessions],
  );

  const resumeSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error } = await supabase
          .from("inventaire_sessions")
          .update({
            statut: "en_cours",
          })
          .eq("id", sessionId)
          .eq("tenant_id", tenantId);

        if (error) throw error;

        toast.success("Session reprise avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur reprise session:", error);
        toast.error("Erreur lors de la reprise");
      }
    },
    [tenantId, fetchSessions],
  );

  const updateSession = useCallback(
    async (sessionId: string, sessionData: Partial<InventorySession>) => {
      try {
        const { error } = await supabase
          .from("inventaire_sessions")
          .update({
            nom: sessionData.nom,
            description: sessionData.description,
            type: sessionData.type,
            responsable: sessionData.responsable,
            participants: sessionData.participants,
            secteurs: sessionData.secteurs,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("tenant_id", tenantId);

        if (error) throw error;

        toast.success("Session modifiée avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur modification session:", error);
        toast.error("Erreur lors de la modification");
      }
    },
    [tenantId, fetchSessions],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        if (!tenantId) {
          toast.error("Aucun tenant trouvé");
          return;
        }

        const { error } = await supabase
          .from("inventaire_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("tenant_id", tenantId);

        if (error) throw error;

        toast.success("Session supprimée avec succès");
        await fetchSessions();
      } catch (error) {
        console.error("Erreur suppression session:", error);
        toast.error("Erreur lors de la suppression");
      }
    },
    [tenantId, fetchSessions],
  );

  // ✅ CORRECTION : Dépendre de fetchSessions stable
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    createSession,
    startSession,
    stopSession,
    suspendSession,
    resumeSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
};
