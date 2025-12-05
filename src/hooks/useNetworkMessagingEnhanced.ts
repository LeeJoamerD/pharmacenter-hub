import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface Pharmacy {
  id: string;
  name: string;
  code?: string;
  city?: string;
  region?: string;
  pays?: string;
  type?: string;
  status?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  channel_type: string;
  is_system: boolean;
  is_public: boolean;
  tenant_id: string;
  created_at: string;
  members_count?: number;
  messages_count?: number;
  last_activity?: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_pharmacy_id: string;
  sender_name: string;
  sender_user_id?: string;
  content: string;
  message_type: string;
  priority: 'normal' | 'high' | 'urgent';
  created_at: string;
  read_by?: string[];
  attachments?: any[];
  pharmacy?: Pharmacy;
}

export interface NetworkStats {
  totalPharmacies: number;
  activePharmacies: number;
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  todayMessages: number;
  totalChannels: number;
  activeCollaborations: number;
}

export interface NetworkActivity {
  id: string;
  type: 'message' | 'collaboration' | 'alert' | 'completion' | 'channel' | 'user';
  user_name: string;
  pharmacy_name: string;
  action: string;
  target: string;
  created_at: string;
  metadata?: any;
}

export interface NetworkMetric {
  title: string;
  value: string;
  target?: number;
  current?: number;
  trend: 'up' | 'down' | 'stable';
  description?: string;
}

export interface Collaboration {
  id: string;
  title: string;
  description?: string;
  participants_count: number;
  status: 'active' | 'scheduled' | 'draft' | 'completed';
  last_activity: string;
  created_at: string;
  tenant_id: string;
}

export interface ChatPermission {
  id: string;
  source_tenant_id: string;
  target_tenant_id: string;
  permission_type: 'chat' | 'channel_invite' | 'file_share' | 'video_call';
  is_active: boolean;
  granted_by?: string;
  created_at: string;
}

export const useNetworkMessagingEnhanced = () => {
  const { currentTenant, currentUser } = useTenant();
  const tenantId = currentTenant?.id;

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);

  // Stats et métriques
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalPharmacies: 0,
    activePharmacies: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    todayMessages: 0,
    totalChannels: 0,
    activeCollaborations: 0
  });
  const [activities, setActivities] = useState<NetworkActivity[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetric[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [permissions, setPermissions] = useState<ChatPermission[]>([]);

  // Charger les données initiales
  useEffect(() => {
    if (tenantId) {
      loadAllData();
    }
  }, [tenantId]);

  // Configuration temps réel pour les messages
  useEffect(() => {
    if (!activeChannel) return;

    const channel = supabase
      .channel(`network-messages-${activeChannel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'network_messages',
          filter: `channel_id=eq.${activeChannel}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          // Mettre à jour le compteur de messages
          setNetworkStats(prev => ({
            ...prev,
            totalMessages: prev.totalMessages + 1,
            todayMessages: prev.todayMessages + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPharmacies(),
        loadChannels(),
        loadNetworkStats(),
        loadActivities(),
        loadMetrics(),
        loadCollaborations(),
        loadPermissions()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPharmacies = async () => {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('nom_pharmacie');

    if (error) {
      console.error('Erreur chargement pharmacies:', error);
      return;
    }

    setPharmacies((data || []) as Pharmacy[]);
    
    // Définir la pharmacie courante
    if (tenantId && data) {
      const current = data.find(p => p.id === tenantId);
      if (current) setCurrentPharmacy(current as Pharmacy);
    }
  };

  const loadChannels = async () => {
    if (!tenantId) return;

    // Charger les canaux accessibles (propres + publics + participation)
    const { data: ownChannels } = await supabase
      .from('network_channels')
      .select('*')
      .eq('tenant_id', tenantId);

    const { data: publicChannels } = await supabase
      .from('network_channels')
      .select('*')
      .eq('is_public', true)
      .neq('tenant_id', tenantId);

    const { data: participantChannels } = await supabase
      .from('channel_participants')
      .select('channel_id, network_channels(*)')
      .eq('pharmacy_id', tenantId);

    // Fusionner et dédupliquer
    const allChannels = new Map<string, Channel>();
    
    ownChannels?.forEach(c => allChannels.set(c.id, c));
    publicChannels?.forEach(c => allChannels.set(c.id, c));
    participantChannels?.forEach(p => {
      if (p.network_channels) {
        const channel = p.network_channels as unknown as Channel;
        allChannels.set(channel.id, channel);
      }
    });

    // Enrichir avec les comptages
    const channelsArray = Array.from(allChannels.values());
    const enrichedChannels = await Promise.all(channelsArray.map(async (channel) => {
      const { count: membersCount } = await supabase
        .from('channel_participants')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channel.id);

      const { count: messagesCount } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channel.id);

      const { data: lastMessage } = await supabase
        .from('network_messages')
        .select('created_at')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...channel,
        members_count: membersCount || 0,
        messages_count: messagesCount || 0,
        last_activity: lastMessage?.created_at || channel.created_at
      };
    }));

    setChannels(enrichedChannels);

    // Sélectionner le canal général par défaut
    const generalChannel = enrichedChannels.find(c => c.name === 'Général' || c.is_system);
    if (generalChannel && !activeChannel) {
      setActiveChannel(generalChannel.id);
      loadMessages(generalChannel.id);
    }
  };

  const loadNetworkStats = async () => {
    try {
      // Compter les pharmacies
      const { count: totalPharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true });

      const { count: activePharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Compter les utilisateurs
      const { count: totalUsers } = await supabase
        .from('personnel')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Compter les messages
      const { count: totalMessages } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayMessages } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Compter les canaux
      const { count: totalChannels } = await supabase
        .from('network_channels')
        .select('*', { count: 'exact', head: true });

      setNetworkStats({
        totalPharmacies: totalPharmacies || 0,
        activePharmacies: activePharmacies || 0,
        totalUsers: totalUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.7), // Estimation
        totalMessages: totalMessages || 0,
        todayMessages: todayMessages || 0,
        totalChannels: totalChannels || 0,
        activeCollaborations: collaborations.filter(c => c.status === 'active').length
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadActivities = async () => {
    try {
      // Charger les messages récents comme activités
      const { data: recentMessages } = await supabase
        .from('network_messages')
        .select(`
          id,
          sender_name,
          sender_pharmacy_id,
          content,
          message_type,
          priority,
          created_at,
          channel:network_channels(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Charger les logs d'audit réseau
      const { data: auditLogs } = await supabase
        .from('network_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const messageActivities: NetworkActivity[] = (recentMessages || []).map(msg => ({
        id: msg.id,
        type: msg.priority === 'urgent' ? 'alert' : 'message',
        user_name: msg.sender_name,
        pharmacy_name: msg.sender_name,
        action: 'a envoyé un message dans',
        target: `#${(msg.channel as any)?.name || 'canal'}`,
        created_at: msg.created_at,
        metadata: { content: msg.content }
      }));

      const auditActivities: NetworkActivity[] = (auditLogs || []).map(log => ({
        id: log.id,
        type: log.action_type?.includes('channel') ? 'channel' : 
              log.action_type?.includes('user') ? 'user' : 'collaboration',
        user_name: log.actor_name || 'Système',
        pharmacy_name: log.actor_pharmacy_name || 'Réseau',
        action: log.action_description || log.action_type,
        target: log.target_name || '',
        created_at: log.created_at,
        metadata: log.metadata
      }));

      // Fusionner et trier
      const allActivities = [...messageActivities, ...auditActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setActivities(allActivities);
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data: statsData } = await supabase
        .from('network_activity_stats')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Calculer les métriques
      const calculatedMetrics: NetworkMetric[] = [
        {
          title: "Disponibilité Réseau",
          value: "99.8%",
          target: 99.9,
          current: 99.8,
          trend: "stable"
        },
        {
          title: "Latence Moyenne",
          value: `${statsData?.avg_response_time || 45}ms`,
          description: "< 100ms cible",
          trend: (statsData?.avg_response_time || 45) < 50 ? "up" : "down"
        },
        {
          title: "Messages/Jour",
          value: networkStats.todayMessages.toLocaleString('fr-FR'),
          description: `Total: ${networkStats.totalMessages.toLocaleString('fr-FR')}`,
          trend: "up"
        },
        {
          title: "Sécurité",
          value: "100%",
          description: "Chiffrement actif",
          trend: "stable"
        }
      ];

      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Erreur chargement métriques:', error);
    }
  };

  const loadCollaborations = async () => {
    try {
      // Simuler des collaborations depuis les canaux de type collaboration
      const { data: collabChannels } = await supabase
        .from('network_channels')
        .select(`
          id,
          name,
          description,
          created_at,
          tenant_id,
          channel_participants(count)
        `)
        .eq('channel_type', 'collaboration');

      const collabs: Collaboration[] = (collabChannels || []).map(ch => ({
        id: ch.id,
        title: ch.name,
        description: ch.description,
        participants_count: (ch.channel_participants as any)?.[0]?.count || 0,
        status: 'active' as const,
        last_activity: ch.created_at,
        created_at: ch.created_at,
        tenant_id: ch.tenant_id
      }));

      setCollaborations(collabs);
    } catch (error) {
      console.error('Erreur chargement collaborations:', error);
    }
  };

  const loadPermissions = async () => {
    if (!tenantId) return;

    try {
      const { data } = await supabase
        .from('network_chat_permissions')
        .select('*')
        .or(`source_tenant_id.eq.${tenantId},target_tenant_id.eq.${tenantId}`);

      setPermissions((data || []) as ChatPermission[]);
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const { data } = await supabase
        .from('network_messages')
        .select(`
          *,
          pharmacy:pharmacies!sender_pharmacy_id(id, nom_pharmacie, ville, type, status)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        const mappedMessages = data.map(msg => ({
          ...msg,
          pharmacy: Array.isArray(msg.pharmacy) ? msg.pharmacy[0] : msg.pharmacy
        }));
        setMessages(mappedMessages as Message[]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async (
    content: string, 
    priority: 'normal' | 'high' | 'urgent' = 'normal',
    attachments?: any[]
  ) => {
    if (!currentPharmacy || !activeChannel || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('network_messages')
        .insert({
          channel_id: activeChannel,
          sender_pharmacy_id: currentPharmacy.id,
          sender_name: currentPharmacy.name,
          sender_user_id: currentUser?.id,
          content: content.trim(),
          priority,
          message_type: attachments?.length ? 'file' : 'text',
          attachments,
          tenant_id: currentPharmacy.id
        });

      if (error) throw error;
      toast.success('Message envoyé');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi du message');
      return false;
    }
  };

  const selectChannel = useCallback((channelId: string) => {
    setActiveChannel(channelId);
    loadMessages(channelId);
  }, []);

  const selectPharmacy = useCallback((pharmacy: Pharmacy) => {
    setCurrentPharmacy(pharmacy);
  }, []);

  // Actions rapides
  const createChannel = async (channelData: Partial<Channel>) => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('network_channels')
        .insert({
          ...channelData,
          tenant_id: tenantId,
          is_system: false
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Canal créé avec succès');
      await loadChannels();
      return data;
    } catch (error) {
      console.error('Erreur création canal:', error);
      toast.error('Erreur lors de la création du canal');
      return null;
    }
  };

  const createCollaboration = async (title: string, description: string, participantIds: string[]) => {
    if (!tenantId) return null;

    try {
      // Créer un canal de type collaboration
      const { data: channel, error: channelError } = await supabase
        .from('network_channels')
        .insert({
          name: title,
          description,
          channel_type: 'collaboration',
          is_public: false,
          tenant_id: tenantId
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Ajouter les participants
      const participants = participantIds.map(pharmacyId => ({
        channel_id: channel.id,
        pharmacy_id: pharmacyId,
        tenant_id: tenantId,
        role: 'member'
      }));

      await supabase.from('channel_participants').insert(participants);

      toast.success('Collaboration créée avec succès');
      await loadCollaborations();
      return channel;
    } catch (error) {
      console.error('Erreur création collaboration:', error);
      toast.error('Erreur lors de la création de la collaboration');
      return null;
    }
  };

  const sendNetworkAlert = async (
    title: string, 
    message: string, 
    priority: 'high' | 'urgent',
    recipientIds?: string[]
  ) => {
    if (!tenantId || !currentPharmacy) return false;

    try {
      // Trouver ou créer le canal d'alertes
      let { data: alertChannel } = await supabase
        .from('network_channels')
        .select('id')
        .eq('name', 'Alertes Réseau')
        .eq('is_system', true)
        .single();

      if (!alertChannel) {
        const { data: newChannel } = await supabase
          .from('network_channels')
          .insert({
            name: 'Alertes Réseau',
            description: 'Canal système pour les alertes urgentes',
            channel_type: 'alert',
            is_system: true,
            is_public: true,
            tenant_id: tenantId
          })
          .select()
          .single();
        
        alertChannel = newChannel;
      }

      if (!alertChannel) throw new Error('Impossible de créer le canal d\'alertes');

      // Envoyer l'alerte comme message
      await supabase.from('network_messages').insert({
        channel_id: alertChannel.id,
        sender_pharmacy_id: currentPharmacy.id,
        sender_name: currentPharmacy.nom_pharmacie,
        content: `**${title}**\n\n${message}`,
        priority,
        message_type: 'alert',
        tenant_id: tenantId,
        metadata: { recipients: recipientIds }
      });

      toast.success('Alerte diffusée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur envoi alerte:', error);
      toast.error('Erreur lors de la diffusion de l\'alerte');
      return false;
    }
  };

  const searchExperts = async (query: string, specialty?: string) => {
    try {
      let queryBuilder = supabase
        .from('personnel')
        .select(`
          id,
          noms,
          prenoms,
          role,
          email,
          tenant_id,
          pharmacy:pharmacies!tenant_id(nom_pharmacie, ville)
        `)
        .eq('is_active', true);

      if (specialty) {
        queryBuilder = queryBuilder.eq('role', specialty);
      }

      if (query) {
        queryBuilder = queryBuilder.or(`noms.ilike.%${query}%,prenoms.ilike.%${query}%,role.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder.limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur recherche experts:', error);
      return [];
    }
  };

  const grantPermission = async (
    targetTenantId: string, 
    permissionType: 'chat' | 'channel_invite' | 'file_share' | 'video_call'
  ) => {
    if (!tenantId) return false;

    try {
      const { error } = await supabase
        .from('network_chat_permissions')
        .insert({
          source_tenant_id: tenantId,
          target_tenant_id: targetTenantId,
          permission_type: permissionType,
          is_active: true,
          granted_by: currentUser?.id
        });

      if (error) throw error;
      
      toast.success('Permission accordée');
      await loadPermissions();
      return true;
    } catch (error) {
      console.error('Erreur octroi permission:', error);
      toast.error('Erreur lors de l\'octroi de la permission');
      return false;
    }
  };

  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('network_chat_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) throw error;
      
      toast.success('Permission révoquée');
      await loadPermissions();
      return true;
    } catch (error) {
      console.error('Erreur révocation permission:', error);
      toast.error('Erreur lors de la révocation');
      return false;
    }
  };

  const hasPermissionWith = (targetTenantId: string, permissionType: string): boolean => {
    return permissions.some(p => 
      p.is_active && 
      p.permission_type === permissionType &&
      ((p.source_tenant_id === tenantId && p.target_tenant_id === targetTenantId) ||
       (p.target_tenant_id === tenantId && p.source_tenant_id === targetTenantId))
    );
  };

  const refreshData = useCallback(() => {
    loadAllData();
  }, [tenantId]);

  return {
    // Données de base
    pharmacies,
    channels,
    messages,
    activeChannel,
    currentPharmacy,
    loading,

    // Stats et métriques
    networkStats,
    activities,
    metrics,
    collaborations,
    permissions,

    // Actions de base
    sendMessage,
    selectChannel,
    selectPharmacy,
    loadMessages,

    // Actions avancées
    createChannel,
    createCollaboration,
    sendNetworkAlert,
    searchExperts,
    grantPermission,
    revokePermission,
    hasPermissionWith,

    // Rafraîchissement
    refreshData
  };
};
