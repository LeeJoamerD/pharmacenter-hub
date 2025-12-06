import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface PharmacyMetrics {
  messages_sent: number;
  messages_received: number;
  active_channels: number;
  last_activity: string;
  response_time_avg: number;
}

export interface PharmacyWithMetrics {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  pays?: string;
  is_inter_tenant?: boolean;
  metrics: PharmacyMetrics;
}

export interface Collaboration {
  id: string;
  name: string;
  description: string;
  participants_count: number;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  created_at: string;
  last_activity: string;
  tenant_id: string;
  participants?: { pharmacy_id: string; pharmacy_name: string; role: string }[];
}

export interface NetworkStats {
  totalPharmacies: number;
  activePharmacies: number;
  totalMessages: number;
  todayMessages: number;
  regionsCount: number;
  networkAvailability: number;
  avgResponseTime: number;
}

export interface RegionStats {
  region: string;
  pharmacyCount: number;
  messageCount: number;
  pharmacies: PharmacyWithMetrics[];
}

export interface AnalyticsData {
  topPharmacies: { id: string; name: string; messages: number; channels: number }[];
  typeDistribution: { type: string; count: number; percentage: number }[];
  monthlyActivity: { month: string; messages: number; collaborations: number }[];
  regionHeatmap: { region: string; activity: number }[];
}

export interface SystemConfig {
  currency: string;
  dateFormat: string;
  timezone: string;
  messageLimitPerDay: number;
  maxFileSize: number;
  interTenantEnabled: boolean;
  retentionDays: number;
}

export const useMultiPharmacyManagement = () => {
  const { currentTenant, currentUser } = useTenant();
  const tenantId = currentTenant?.id;

  const [pharmacies, setPharmacies] = useState<PharmacyWithMetrics[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalPharmacies: 0,
    activePharmacies: 0,
    totalMessages: 0,
    todayMessages: 0,
    regionsCount: 0,
    networkAvailability: 98,
    avgResponseTime: 45
  });
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    topPharmacies: [],
    typeDistribution: [],
    monthlyActivity: [],
    regionHeatmap: []
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    currency: 'XAF',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Africa/Douala',
    messageLimitPerDay: 100,
    maxFileSize: 10,
    interTenantEnabled: true,
    retentionDays: 365
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Charger toutes les données
  const loadAllData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      await Promise.all([
        loadPharmaciesWithMetrics(),
        loadCollaborations(),
        loadNetworkStats(),
        loadSystemConfig(),
        loadRecentActivities()
      ]);
      await loadAnalyticsData();
    } catch (error) {
      console.error('Erreur chargement données multi-officines:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Charger les pharmacies avec métriques
  const loadPharmaciesWithMetrics = async () => {
    try {
      const { data: pharmaciesData } = await supabase
        .from('pharmacies')
        .select('id, name, code, city, region, pays, type, status, email, phone, address')
        .order('name');

      if (!pharmaciesData) return;

      // Charger les métriques en batch
      const pharmaciesWithMetrics: PharmacyWithMetrics[] = await Promise.all(
        pharmaciesData.map(async (pharmacy) => {
          // Messages envoyés
          const { count: messagesSent } = await supabase
            .from('network_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_pharmacy_id', pharmacy.id);

          // Messages reçus via channel_participants
          const { data: participations } = await supabase
            .from('channel_participants')
            .select('channel_id')
            .eq('pharmacy_id', pharmacy.id);

          const channelIds = (participations || []).map(p => p.channel_id);
          let messagesReceived = 0;
          if (channelIds.length > 0) {
            const { count } = await supabase
              .from('network_messages')
              .select('*', { count: 'exact', head: true })
              .in('channel_id', channelIds)
              .neq('sender_pharmacy_id', pharmacy.id);
            messagesReceived = count || 0;
          }

          // Dernière activité
          const { data: lastMessage } = await supabase
            .from('network_messages')
            .select('created_at')
            .eq('sender_pharmacy_id', pharmacy.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: pharmacy.id,
            name: pharmacy.name || '',
            code: pharmacy.code || '',
            address: pharmacy.address || '',
            city: pharmacy.city || '',
            region: pharmacy.region || '',
            type: pharmacy.type || '',
            status: pharmacy.status || 'active',
            phone: pharmacy.phone || '',
            email: pharmacy.email || '',
            pays: pharmacy.pays || '',
            is_inter_tenant: pharmacy.id !== tenantId,
            metrics: {
              messages_sent: messagesSent || 0,
              messages_received: messagesReceived,
              active_channels: channelIds.length,
              last_activity: lastMessage?.created_at || new Date().toISOString(),
              response_time_avg: Math.random() * 100 + 20 // Mock pour l'instant
            }
          };
        })
      );

      setPharmacies(pharmaciesWithMetrics);

      // Calculer les stats par région
      const regionsMap = new Map<string, PharmacyWithMetrics[]>();
      pharmaciesWithMetrics.forEach(p => {
        if (p.region) {
          const existing = regionsMap.get(p.region) || [];
          regionsMap.set(p.region, [...existing, p]);
        }
      });

      const regionStatsArray: RegionStats[] = Array.from(regionsMap.entries()).map(([region, pharmaciesList]) => ({
        region,
        pharmacyCount: pharmaciesList.length,
        messageCount: pharmaciesList.reduce((sum, p) => sum + p.metrics.messages_sent, 0),
        pharmacies: pharmaciesList
      }));

      setRegionStats(regionStatsArray);
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
    }
  };

  // Charger les collaborations
  const loadCollaborations = async () => {
    try {
      const { data } = await supabase
        .from('network_channels')
        .select('id, name, description, created_at, tenant_id')
        .eq('type', 'collaboration')
        .order('created_at', { ascending: false }) as { data: any[] | null };

      const collabs = await Promise.all(
        (data || []).map(async (ch) => {
          // Compter les participants
          const { count } = await supabase
            .from('channel_participants')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', ch.id);

          // Charger les détails des participants
          const { data: participantsData } = await supabase
            .from('channel_participants')
            .select('pharmacy_id, role')
            .eq('channel_id', ch.id);

          // Obtenir les noms des pharmacies
          const pharmacyIds = (participantsData || []).map(p => p.pharmacy_id);
          let participants: { pharmacy_id: string; pharmacy_name: string; role: string }[] = [];
          
          if (pharmacyIds.length > 0) {
            const { data: pharmaciesData } = await supabase
              .from('pharmacies')
              .select('id, name')
              .in('id', pharmacyIds);
            
            participants = (participantsData || []).map(p => {
              const pharmacy = (pharmaciesData || []).find(ph => ph.id === p.pharmacy_id);
              return {
                pharmacy_id: p.pharmacy_id,
                pharmacy_name: pharmacy?.name || 'Inconnu',
                role: p.role || 'member'
              };
            });
          }

          // Dernière activité
          const { data: lastMsg } = await supabase
            .from('network_messages')
            .select('created_at')
            .eq('channel_id', ch.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: ch.id,
            name: ch.name,
            description: ch.description || '',
            participants_count: count || 0,
            status: 'active' as const,
            created_at: ch.created_at,
            last_activity: lastMsg?.created_at || ch.created_at,
            tenant_id: ch.tenant_id,
            participants
          };
        })
      );

      setCollaborations(collabs);
    } catch (error) {
      console.error('Erreur chargement collaborations:', error);
    }
  };

  // Charger les stats réseau
  const loadNetworkStats = async () => {
    try {
      const { count: totalPharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true });

      const { count: activePharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalMessages } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayMessages } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { data: regionsData } = await supabase
        .from('pharmacies')
        .select('region')
        .not('region', 'is', null);

      const uniqueRegions = new Set((regionsData || []).map(r => r.region).filter(Boolean));

      // Stats d'activité
      const { data: activityStats } = await supabase
        .from('network_activity_stats')
        .select('avg_response_time_ms')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setNetworkStats({
        totalPharmacies: totalPharmacies || 0,
        activePharmacies: activePharmacies || 0,
        totalMessages: totalMessages || 0,
        todayMessages: todayMessages || 0,
        regionsCount: uniqueRegions.size,
        networkAvailability: 98.5,
        avgResponseTime: activityStats?.avg_response_time_ms || 45
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Charger la configuration système
  const loadSystemConfig = async () => {
    try {
      const { data: params } = await supabase
        .from('parametres_systeme')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const { data: chatConfig } = await supabase
        .from('network_chat_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (params || chatConfig) {
        setSystemConfig({
          currency: (params as any)?.default_currency || 'XAF',
          dateFormat: (params as any)?.default_date_format || 'DD/MM/YYYY',
          timezone: (params as any)?.default_timezone || 'Africa/Douala',
          messageLimitPerDay: (chatConfig as any)?.message_limit_per_day || 100,
          maxFileSize: (chatConfig as any)?.max_file_size_mb || 10,
          interTenantEnabled: (chatConfig as any)?.inter_tenant_enabled ?? true,
          retentionDays: (chatConfig as any)?.message_retention_days || 365
        });
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  };

  // Charger les activités récentes
  const loadRecentActivities = async () => {
    try {
      const { data: messages } = await supabase
        .from('network_messages')
        .select('id, sender_name, sender_pharmacy_id, content, created_at, channel_id')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: auditLogs } = await supabase
        .from('network_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = [
        ...(messages || []).map(m => ({
          id: m.id,
          type: 'message',
          description: `${m.sender_name} a envoyé un message`,
          created_at: m.created_at
        })),
        ...(auditLogs || []).map(log => {
          const details = (log.details as any) || {};
          return {
            id: log.id,
            type: log.action_type,
            description: details.action_description || log.action_type,
            created_at: log.created_at
          };
        })
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 10);

      setRecentActivities(activities);
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    }
  };

  // Charger les données analytics
  const loadAnalyticsData = async () => {
    try {
      // Top pharmacies
      const topPharmacies = pharmacies
        .sort((a, b) => b.metrics.messages_sent - a.metrics.messages_sent)
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          name: p.name,
          messages: p.metrics.messages_sent,
          channels: p.metrics.active_channels
        }));

      // Distribution par type
      const typeCounts = new Map<string, number>();
      pharmacies.forEach(p => {
        if (p.type) {
          typeCounts.set(p.type, (typeCounts.get(p.type) || 0) + 1);
        }
      });
      const typeDistribution = Array.from(typeCounts.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / pharmacies.length) * 100)
      }));

      // Activité mensuelle (6 derniers mois)
      const monthlyActivity: { month: string; messages: number; collaborations: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { count: messages } = await supabase
          .from('network_messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        monthlyActivity.push({
          month: startOfMonth.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          messages: messages || 0,
          collaborations: Math.floor(Math.random() * 5) // Mock pour l'instant
        });
      }

      // Heatmap régionale
      const regionHeatmap = regionStats.map(r => ({
        region: r.region,
        activity: r.messageCount
      }));

      setAnalyticsData({
        topPharmacies,
        typeDistribution,
        monthlyActivity,
        regionHeatmap
      });
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    }
  };

  // CRUD Collaborations
  const createCollaboration = async (title: string, description: string, participantIds: string[]) => {
    try {
      const { data: channel, error } = await supabase
        .from('network_channels')
        .insert({
          name: title,
          description,
          type: 'collaboration',
          tenant_id: tenantId
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter les participants
      const allParticipants = [tenantId, ...participantIds].filter(Boolean);
      const participantsInsert = allParticipants.map(pharmacyId => ({
        channel_id: channel.id,
        pharmacy_id: pharmacyId,
        tenant_id: tenantId,
        role: pharmacyId === tenantId ? 'admin' : 'member'
      }));

      await supabase.from('channel_participants').insert(participantsInsert);

      toast.success('Collaboration créée avec succès');
      await loadCollaborations();
      return channel;
    } catch (error) {
      console.error('Erreur création collaboration:', error);
      toast.error('Erreur lors de la création');
      throw error;
    }
  };

  const updateCollaboration = async (id: string, updates: { name?: string; description?: string; status?: string }) => {
    try {
      const { error } = await supabase
        .from('network_channels')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Collaboration mise à jour');
      await loadCollaborations();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteCollaboration = async (id: string) => {
    try {
      // Supprimer les participants d'abord
      await supabase.from('channel_participants').delete().eq('channel_id', id);
      // Supprimer les messages
      await supabase.from('network_messages').delete().eq('channel_id', id);
      // Supprimer le canal
      const { error } = await supabase.from('network_channels').delete().eq('id', id);

      if (error) throw error;

      toast.success('Collaboration supprimée');
      await loadCollaborations();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  const inviteToCollaboration = async (collaborationId: string, pharmacyId: string) => {
    try {
      const { error } = await supabase.from('channel_participants').insert({
        channel_id: collaborationId,
        pharmacy_id: pharmacyId,
        tenant_id: tenantId,
        role: 'member'
      });

      if (error) throw error;

      toast.success('Invitation envoyée');
      await loadCollaborations();
    } catch (error) {
      console.error('Erreur invitation:', error);
      toast.error('Erreur lors de l\'invitation');
      throw error;
    }
  };

  const leaveCollaboration = async (collaborationId: string) => {
    try {
      const { error } = await supabase
        .from('channel_participants')
        .delete()
        .eq('channel_id', collaborationId)
        .eq('pharmacy_id', tenantId);

      if (error) throw error;

      toast.success('Vous avez quitté la collaboration');
      await loadCollaborations();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur');
      throw error;
    }
  };

  // Actions pharmacies
  const startConversationWith = async (pharmacyId: string) => {
    try {
      // Vérifier si un canal direct existe déjà avec cette pharmacie
      const { data: existingParticipations } = await supabase
        .from('channel_participants')
        .select('channel_id')
        .eq('pharmacy_id', pharmacyId);
      
      const existingChannelIds = (existingParticipations || []).map(p => p.channel_id);
      
      let existingDirectChannel = null;
      if (existingChannelIds.length > 0) {
        const { data: directChannels } = await supabase
          .from('network_channels')
          .select('id')
          .eq('type', 'direct')
          .in('id', existingChannelIds) as { data: { id: string }[] | null };
        
        existingDirectChannel = directChannels?.[0] || null;
      }
      
      if (existingDirectChannel) {
        toast.info('Une conversation existe déjà avec cette officine');
        return existingDirectChannel;
      }

      // Pour simplifier, créer un nouveau canal
      const targetPharmacy = pharmacies.find(p => p.id === pharmacyId);
      const { data: channel, error } = await supabase
        .from('network_channels')
        .insert({
          name: `Chat avec ${targetPharmacy?.name || 'Officine'}`,
          type: 'direct',
          tenant_id: tenantId
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter les deux participants
      await supabase.from('channel_participants').insert([
        { channel_id: channel.id, pharmacy_id: tenantId, tenant_id: tenantId, role: 'admin' },
        { channel_id: channel.id, pharmacy_id: pharmacyId, tenant_id: tenantId, role: 'member' }
      ]);

      toast.success(`Conversation avec ${targetPharmacy?.name} créée`);
      return channel;
    } catch (error) {
      console.error('Erreur création conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
      throw error;
    }
  };

  const getPharmacyDetails = async (pharmacyId: string) => {
    const pharmacy = pharmacies.find(p => p.id === pharmacyId);
    if (!pharmacy) return null;

    // Charger plus de détails si nécessaire
    const { data: channels } = await supabase
      .from('channel_participants')
      .select('channel_id')
      .eq('pharmacy_id', pharmacyId);

    const { data: recentMessages } = await supabase
      .from('network_messages')
      .select('id, content, created_at')
      .eq('sender_pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      ...pharmacy,
      channels: channels || [],
      recentMessages: recentMessages || []
    };
  };

  return {
    // Data
    pharmacies,
    collaborations,
    loading,
    networkStats,
    regionStats,
    analyticsData,
    systemConfig,
    recentActivities,
    tenantId,
    currentUser,
    
    // Actions
    loadAllData,
    createCollaboration,
    updateCollaboration,
    deleteCollaboration,
    inviteToCollaboration,
    leaveCollaboration,
    startConversationWith,
    getPharmacyDetails
  };
};
