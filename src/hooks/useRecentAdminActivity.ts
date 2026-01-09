import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  UserPlus, Edit, Trash2, Upload, Download, 
  Package, Users, Building, FileText, Settings,
  ShoppingCart, Truck, CreditCard, ClipboardList,
  Box, Bell, Shield, Key
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

      // Requête sur audit_logs avec jointure personnel
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          table_name,
          new_values,
          old_values,
          created_at,
          user_id
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }
      
      if (!auditLogs || auditLogs.length === 0) return [];

      // Récupérer les infos utilisateurs en batch
      const userIds = [...new Set(auditLogs.map(log => log.user_id).filter(Boolean))];
      let usersMap: Record<string, { noms: string; prenoms: string }> = {};
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('personnel')
          .select('auth_user_id, noms, prenoms')
          .in('auth_user_id', userIds);
        
        if (users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.auth_user_id] = { noms: user.noms, prenoms: user.prenoms };
            return acc;
          }, {} as Record<string, { noms: string; prenoms: string }>);
        }
      }

      // Transformer les logs en activités lisibles
      return auditLogs.map(log => {
        const user = log.user_id && usersMap[log.user_id];
        const userName = user ? `${user.prenoms || ''} ${user.noms || ''}`.trim() : 'Utilisateur Inconnu';
        const initials = user 
          ? `${(user.prenoms || 'U')[0]}${(user.noms || 'I')[0]}`.toUpperCase()
          : 'UI';

        const entityName = getEntityName(log.table_name, log.new_values || log.old_values);
        const tableLabel = getTableLabel(log.table_name);
        const actionLabel = getActionLabel(log.action);

        return {
          id: log.id,
          user: {
            name: userName,
            role: 'user',
            initials
          },
          action: actionLabel,
          details: entityName ? `${tableLabel} - ${entityName}` : tableLabel,
          time: formatTimeAgo(log.created_at),
          icon: getActivityIcon(log.action, log.table_name),
          iconColor: getActionColor(log.action),
          metadata: { table_name: log.table_name, action: log.action }
        };
      });
    },
    enabled: !!tenantId,
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

// Labels des actions en français
const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    INSERT: 'a ajouté',
    UPDATE: 'a modifié',
    DELETE: 'a supprimé'
  };
  return labels[action] || 'a effectué une action sur';
};

// Labels des tables en français
const getTableLabel = (tableName: string) => {
  const labels: Record<string, string> = {
    produits: 'un produit',
    personnel: 'un membre du personnel',
    fournisseurs: 'un fournisseur',
    clients: 'un client',
    lots: 'un lot',
    ventes: 'une vente',
    lignes_ventes: 'une ligne de vente',
    receptions_fournisseurs: 'une réception',
    commandes_fournisseurs: 'une commande',
    lignes_commandes_fournisseurs: 'une ligne de commande',
    factures: 'une facture',
    paiements: 'un paiement',
    mouvements_stock: 'un mouvement de stock',
    inventaires: 'un inventaire',
    parametres_systeme: 'les paramètres système',
    pharmacies: 'une pharmacie',
    security_alerts: 'une alerte de sécurité',
    user_sessions: 'une session utilisateur',
    comptes_comptables: 'un compte comptable',
    ecritures_comptables: 'une écriture comptable',
    avoirs: 'un avoir'
  };
  return labels[tableName] || `un élément (${tableName})`;
};

// Extraction du nom de l'entité depuis new_values/old_values
const getEntityName = (tableName: string, values: any): string | null => {
  if (!values) return null;
  
  try {
    const data = typeof values === 'string' ? JSON.parse(values) : values;
    
    // Ordre de priorité pour trouver un nom significatif
    return data.libelle_produit 
        || data.nom_complet 
        || data.noms
        || data.nom_fournisseur
        || data.nom
        || data.titre
        || data.libelle
        || data.numero_lot
        || data.numero_facture
        || data.numero_commande
        || data.numero_reception
        || data.code_cip
        || null;
  } catch (e) {
    return null;
  }
};

// Icône par type de table et action
const getActivityIcon = (action: string, tableName: string) => {
  const tableIcons: Record<string, any> = {
    produits: Package,
    personnel: UserPlus,
    fournisseurs: Building,
    clients: Users,
    lots: Box,
    ventes: ShoppingCart,
    lignes_ventes: ShoppingCart,
    receptions_fournisseurs: Truck,
    commandes_fournisseurs: ClipboardList,
    factures: FileText,
    paiements: CreditCard,
    parametres_systeme: Settings,
    security_alerts: Bell,
    user_sessions: Shield,
    comptes_comptables: FileText,
    ecritures_comptables: FileText
  };

  const actionIcons: Record<string, any> = {
    INSERT: UserPlus,
    UPDATE: Edit,
    DELETE: Trash2,
    UPLOAD: Upload,
    DOWNLOAD: Download
  };

  return tableIcons[tableName] || actionIcons[action] || Edit;
};

// Couleur par type d'action
const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    INSERT: 'text-green-500',
    UPDATE: 'text-blue-500',
    DELETE: 'text-red-500'
  };
  return colors[action] || 'text-muted-foreground';
};

// Formatage du temps écoulé
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `Il y a ${diffInDays}j`;
};
