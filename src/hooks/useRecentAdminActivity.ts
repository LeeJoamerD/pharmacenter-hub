import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  UserPlus, Edit, Trash2, Upload, Download, 
  Package, Users, Building, FileText, Settings 
} from 'lucide-react';

/**
 * Hook pour récupérer l'activité administrative récente depuis audit_logs
 * Affiche les actions réelles en temps réel avec isolation multi-tenant
 */
export const useRecentAdminActivity = (limit = 10) => {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ['admin-recent-activity', tenantId, limit],
    queryFn: async () => {
      if (!tenantId) return [];

      // Utiliser security_alerts comme proxy pour l'activité récente
      // Comme audit_logs n'est pas disponible dans le schéma actuel
      const { data: recentAlerts, error } = await supabase
        .from('security_alerts')
        .select('id, alert_type, title, description, created_at, severity')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
      
      if (!recentAlerts || recentAlerts.length === 0) return [];

      // Transformer les alertes en activités lisibles
      return recentAlerts.map(alert => ({
        id: alert.id,
        user: {
          name: 'Système',
          role: 'system',
          initials: 'SY'
        },
        action: 'a généré une alerte',
        details: `${alert.title} - ${alert.description || 'Aucun détail'}`,
        time: formatTimeAgo(alert.created_at),
        icon: UserPlus, // Icône par défaut
        iconColor: alert.severity === 'critical' ? 'text-red-500' : 'text-blue-500',
        metadata: { alert_type: alert.alert_type, severity: alert.severity }
      }));
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Recharger toutes les minutes
    staleTime: 30000,
  });
};

// Fonctions utilitaires
const getActionLabel = (action: string, entity: string) => {
  const labels: Record<string, string> = {
    INSERT: 'a ajouté',
    UPDATE: 'a modifié',
    DELETE: 'a supprimé'
  };
  return labels[action] || 'a effectué une action sur';
};

const getActivityDetails = (log: any) => {
  const entityLabels: Record<string, string> = {
    personnel: 'un membre du personnel',
    fournisseurs: 'un fournisseur',
    produits: 'un produit',
    documents: 'un document',
    parametres_systeme: 'les paramètres système',
    clients: 'un client',
    laboratoires: 'un laboratoire'
  };

  // Essayer d'extraire un nom du metadata ou new_values
  if (log.new_values) {
    try {
      const data = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values;
      if (data.nom) return `${entityLabels[log.entity_type]} - ${data.nom}`;
      if (data.nom_complet) return `${entityLabels[log.entity_type]} - ${data.nom_complet}`;
      if (data.libelle) return `${entityLabels[log.entity_type]} - ${data.libelle}`;
      if (data.titre) return `${entityLabels[log.entity_type]} - ${data.titre}`;
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }

  return entityLabels[log.entity_type] || 'un élément';
};

const getActivityIcon = (action: string, entity: string) => {
  // Icône par type d'entité
  const entityIcons: Record<string, any> = {
    personnel: UserPlus,
    fournisseurs: Building,
    produits: Package,
    documents: FileText,
    parametres_systeme: Settings,
    clients: Users,
    laboratoires: Building
  };

  // Icône par action
  const actionIcons: Record<string, any> = {
    INSERT: UserPlus,
    UPDATE: Edit,
    DELETE: Trash2,
    UPLOAD: Upload,
    DOWNLOAD: Download
  };

  return entityIcons[entity] || actionIcons[action] || Edit;
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    INSERT: 'text-green-500',
    UPDATE: 'text-blue-500',
    DELETE: 'text-red-500',
    UPLOAD: 'text-purple-500',
    DOWNLOAD: 'text-gray-500'
  };
  return colors[action] || 'text-blue-500';
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
};
