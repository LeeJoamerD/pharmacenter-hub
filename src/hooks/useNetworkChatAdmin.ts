import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTenant } from '@/contexts/TenantContext';

// Types for Network Chat Administration
export interface NetworkPharmacy {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
  region?: string;
  country?: string;
  status: string;
  type?: string;
  user_count: number;
  admin_count: number;
  last_access?: string;
  created_at: string;
}

export interface NetworkChannel {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: string;
  is_system: boolean;
  is_private: boolean;
  is_public?: boolean;
  category?: string;
  member_count: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerAccount {
  id: string;
  tenant_id: string;
  partner_type: string;
  partner_id: string;
  display_name: string;
  email?: string;
  phone?: string;
  chat_enabled: boolean;
  can_initiate_conversation: boolean;
  allowed_channels?: string[];
  status: string;
  last_active_at?: string;
  created_at: string;
}

export interface ChatPermission {
  id: string;
  source_tenant_id: string;
  target_tenant_id: string;
  target_partner_id?: string;
  permission_type: 'chat' | 'channel_invite' | 'file_share' | 'video_call';
  is_granted: boolean;
  is_bidirectional: boolean;
  expires_at?: string;
  created_at: string;
  source_pharmacy?: { name: string };
  target_pharmacy?: { name: string };
}

export interface ChannelInvitation {
  id: string;
  channel_id: string;
  inviter_tenant_id: string;
  invitee_tenant_id?: string;
  invitee_partner_id?: string;
  invitee_type: string;
  invitee_email?: string;
  status: string;
  message?: string;
  role_in_channel: string;
  expires_at?: string;
  created_at: string;
  channel?: { name: string };
  inviter_pharmacy?: { name: string };
  invitee_pharmacy?: { name: string };
}

export interface NetworkAuditLog {
  id: string;
  tenant_id?: string;
  personnel_id?: string;
  user_id?: string;
  action_type: string;
  action_category: string;
  target_type?: string;
  target_name?: string;
  details: any;
  ip_address?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  is_reviewed: boolean;
  created_at: string;
  personnel?: { noms: string; prenoms: string };
}

export interface NetworkStats {
  total_pharmacies: number;
  active_pharmacies: number;
  total_channels: number;
  total_messages: number;
  total_partners: number;
  active_partners: number;
  pending_invitations: number;
  system_uptime: string;
  network_status: 'healthy' | 'warning' | 'critical';
}

export interface ChatConfig {
  key: string;
  value: string;
  type: string;
  category: string;
  description?: string;
}

export const useNetworkChatAdmin = () => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<NetworkPharmacy[]>([]);
  const [channels, setChannels] = useState<NetworkChannel[]>([]);
  const [partnerAccounts, setPartnerAccounts] = useState<PartnerAccount[]>([]);
  const [chatPermissions, setChatPermissions] = useState<ChatPermission[]>([]);
  const [channelInvitations, setChannelInvitations] = useState<ChannelInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<NetworkAuditLog[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfig[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    total_pharmacies: 0,
    active_pharmacies: 0,
    total_channels: 0,
    total_messages: 0,
    total_partners: 0,
    active_partners: 0,
    pending_invitations: 0,
    system_uptime: '99.9%',
    network_status: 'healthy'
  });

  // Load pharmacies with user counts
  const loadPharmacies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select(`
          id, name, code, email, telephone_appel, city, region, pays, status, type, created_at,
          personnel:personnel(id, role, is_active, updated_at)
        `)
        .order('name');

      if (error) throw error;

      const transformedPharmacies: NetworkPharmacy[] = (data || []).map((pharmacy: any) => {
        const personnel = pharmacy.personnel || [];
        const activePersonnel = personnel.filter((p: any) => p.is_active);
        const adminCount = activePersonnel.filter((p: any) => 
          ['Admin', 'Pharmacien Titulaire', 'Pharmacien Adjoint'].includes(p.role)
        ).length;
        const lastAccess = personnel.length > 0 
          ? Math.max(...personnel.map((p: any) => new Date(p.updated_at).getTime()))
          : null;

        return {
          id: pharmacy.id,
          name: pharmacy.name,
          code: pharmacy.code,
          email: pharmacy.email,
          phone: pharmacy.telephone_appel,
          city: pharmacy.city,
          region: pharmacy.region,
          country: pharmacy.pays,
          status: pharmacy.status || 'active',
          type: pharmacy.type,
          user_count: activePersonnel.length,
          admin_count: adminCount,
          last_access: lastAccess ? new Date(lastAccess).toISOString() : undefined,
          created_at: pharmacy.created_at
        };
      });

      setPharmacies(transformedPharmacies);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    }
  }, []);

  // Load channels with stats
  const loadChannels = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('network_channels')
        .select(`
          *,
          participants:channel_participants(count),
          messages:network_messages(count)
        `)
        .order('name');

      if (error) throw error;

      const transformedChannels: NetworkChannel[] = (data || []).map((channel: any) => ({
        id: channel.id,
        tenant_id: channel.tenant_id,
        name: channel.name,
        description: channel.description || '',
        type: channel.type || 'team',
        is_system: channel.is_system || false,
        is_private: false,
        is_public: !channel.is_system,
        category: '',
        member_count: channel.participants?.[0]?.count || 0,
        message_count: channel.messages?.[0]?.count || 0,
        created_at: channel.created_at,
        updated_at: channel.updated_at
      }));

      setChannels(transformedChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  }, [tenantId]);

  // Load partner accounts
  const loadPartnerAccounts = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('network_partner_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_name');

      if (error) throw error;
      
      const transformed: PartnerAccount[] = (data || []).map((item: any) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        partner_type: item.partner_type,
        partner_id: item.partner_id,
        display_name: item.display_name,
        email: item.email,
        phone: item.phone,
        chat_enabled: item.chat_enabled,
        can_initiate_conversation: item.can_initiate_conversation,
        allowed_channels: item.allowed_channels || [],
        status: item.status,
        last_active_at: item.last_active_at,
        created_at: item.created_at
      }));
      
      setPartnerAccounts(transformed);
    } catch (error) {
      console.error('Error loading partner accounts:', error);
    }
  }, [tenantId]);

  // Load chat permissions
  const loadChatPermissions = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('network_chat_permissions')
        .select('*')
        .or(`source_tenant_id.eq.${tenantId},target_tenant_id.eq.${tenantId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformed: ChatPermission[] = (data || []).map((item: any) => ({
        id: item.id,
        source_tenant_id: item.source_tenant_id,
        target_tenant_id: item.target_tenant_id || item.source_tenant_id,
        target_partner_id: item.target_partner_id,
        permission_type: item.permission_type as 'chat' | 'channel_invite' | 'file_share' | 'video_call',
        is_granted: item.is_granted,
        is_bidirectional: item.is_bidirectional,
        expires_at: item.expires_at,
        created_at: item.created_at
      }));
      
      setChatPermissions(transformed);
    } catch (error) {
      console.error('Error loading chat permissions:', error);
    }
  }, [tenantId]);

  // Load channel invitations
  const loadChannelInvitations = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('network_channel_invitations')
        .select('*')
        .or(`inviter_tenant_id.eq.${tenantId},invitee_tenant_id.eq.${tenantId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformed: ChannelInvitation[] = (data || []).map((item: any) => ({
        id: item.id,
        channel_id: item.channel_id,
        inviter_tenant_id: item.inviter_tenant_id,
        invitee_tenant_id: item.invitee_tenant_id,
        invitee_partner_id: item.invitee_partner_id,
        invitee_type: item.invitee_type,
        invitee_email: item.invitee_email,
        status: item.status,
        message: item.message,
        role_in_channel: item.role_in_channel,
        expires_at: item.expires_at,
        created_at: item.created_at
      }));
      
      setChannelInvitations(transformed);
    } catch (error) {
      console.error('Error loading channel invitations:', error);
    }
  }, [tenantId]);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('network_audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const transformed: NetworkAuditLog[] = (data || []).map((item: any) => ({
        id: item.id,
        tenant_id: item.tenant_id,
        personnel_id: item.personnel_id,
        user_id: item.personnel_id,
        action_type: item.action_type,
        action_category: item.action_category,
        target_type: item.target_type,
        target_name: item.target_name,
        details: item.details,
        ip_address: item.ip_address ? String(item.ip_address) : undefined,
        severity: (item.severity || 'info') as 'info' | 'warning' | 'error' | 'critical',
        is_reviewed: item.is_reviewed,
        created_at: item.created_at
      }));
      
      setAuditLogs(transformed);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  }, [tenantId]);

  // Load chat config
  const loadChatConfig = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('network_chat_config')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const config: ChatConfig[] = (data || []).map((item: any) => ({
        key: item.config_key,
        value: item.config_value || '',
        type: item.config_type,
        category: item.category,
        description: item.description
      }));

      setChatConfig(config);
    } catch (error) {
      console.error('Error loading chat config:', error);
    }
  }, [tenantId]);

  // Load network stats
  const loadStats = useCallback(async () => {
    if (!tenantId) return;

    try {
      // Count pharmacies
      const { count: totalPharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true });

      const { count: activePharmacies } = await supabase
        .from('pharmacies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Count channels
      const { count: totalChannels } = await supabase
        .from('network_channels')
        .select('*', { count: 'exact', head: true });

      // Count messages
      const { count: totalMessages } = await supabase
        .from('network_messages')
        .select('*', { count: 'exact', head: true });

      // Count partners
      const { count: totalPartners } = await supabase
        .from('network_partner_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const { count: activePartners } = await supabase
        .from('network_partner_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      // Count pending invitations
      const { count: pendingInvitations } = await supabase
        .from('network_channel_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .or(`inviter_tenant_id.eq.${tenantId},invitee_tenant_id.eq.${tenantId}`);

      const healthRatio = (activePharmacies || 0) / (totalPharmacies || 1);

      setStats({
        total_pharmacies: totalPharmacies || 0,
        active_pharmacies: activePharmacies || 0,
        total_channels: totalChannels || 0,
        total_messages: totalMessages || 0,
        total_partners: totalPartners || 0,
        active_partners: activePartners || 0,
        pending_invitations: pendingInvitations || 0,
        system_uptime: '99.9%',
        network_status: healthRatio > 0.8 ? 'healthy' : healthRatio > 0.5 ? 'warning' : 'critical'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [tenantId]);

  // Load all network data
  const loadNetworkData = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadPharmacies(),
        loadChannels(),
        loadPartnerAccounts(),
        loadChatPermissions(),
        loadChannelInvitations(),
        loadAuditLogs(),
        loadChatConfig(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading network data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, loadPharmacies, loadChannels, loadPartnerAccounts, loadChatPermissions, loadChannelInvitations, loadAuditLogs, loadChatConfig, loadStats]);

  // Log audit action
  const logAuditAction = async (
    actionType: string, 
    category: string, 
    targetType?: string, 
    targetId?: string, 
    targetName?: string, 
    details?: any
  ) => {
    if (!tenantId) return;

    try {
      await supabase.from('network_audit_logs').insert({
        tenant_id: tenantId,
        action_type: actionType,
        action_category: category,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        details: details || {},
        severity: 'info'
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  // CRUD Operations

  // Create partner account
  const createPartnerAccount = async (partnerData: Partial<PartnerAccount>) => {
    if (!tenantId) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('network_partner_accounts')
        .insert({
          tenant_id: tenantId,
          partner_type: partnerData.partner_type,
          partner_id: partnerData.partner_id,
          display_name: partnerData.display_name,
          email: partnerData.email,
          phone: partnerData.phone,
          chat_enabled: partnerData.chat_enabled ?? true,
          can_initiate_conversation: partnerData.can_initiate_conversation ?? true,
          status: 'pending',
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditAction('partner_created', 'authorization', 'partner_account', data.id, partnerData.display_name);
      
      toast({
        title: "Partenaire créé",
        description: `Le compte partenaire ${partnerData.display_name} a été créé.`,
      });

      await loadPartnerAccounts();
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le partenaire.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update partner account
  const updatePartnerAccount = async (id: string, updates: Partial<PartnerAccount>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('network_partner_accounts')
        .update({ 
          display_name: updates.display_name,
          email: updates.email,
          phone: updates.phone,
          chat_enabled: updates.chat_enabled,
          can_initiate_conversation: updates.can_initiate_conversation,
          status: updates.status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      await logAuditAction('partner_updated', 'authorization', 'partner_account', id);
      
      toast({
        title: "Partenaire mis à jour",
        description: "Le compte partenaire a été mis à jour.",
      });

      await loadPartnerAccounts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le partenaire.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete partner account
  const deletePartnerAccount = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('network_partner_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAuditAction('partner_deleted', 'authorization', 'partner_account', id);
      
      toast({
        title: "Partenaire supprimé",
        description: "Le compte partenaire a été supprimé.",
      });

      await loadPartnerAccounts();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le partenaire.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create channel
  const createChannel = async (channelData: Partial<NetworkChannel>) => {
    if (!tenantId) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('network_channels')
        .insert({
          tenant_id: tenantId,
          name: channelData.name,
          description: channelData.description,
          type: channelData.type || 'public',
          is_system: false
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditAction('channel_created', 'channel_management', 'channel', data.id, channelData.name);
      
      toast({
        title: "Canal créé",
        description: `Le canal ${channelData.name} a été créé.`,
      });

      await loadChannels();
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le canal.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update channel
  const updateChannel = async (id: string, updates: Partial<NetworkChannel>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('network_channels')
        .update({ 
          name: updates.name,
          description: updates.description,
          type: updates.type,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      await logAuditAction('channel_updated', 'channel_management', 'channel', id);
      
      toast({
        title: "Canal mis à jour",
        description: "Le canal a été mis à jour.",
      });

      await loadChannels();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le canal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete channel
  const deleteChannel = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('network_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAuditAction('channel_deleted', 'channel_management', 'channel', id);
      
      toast({
        title: "Canal supprimé",
        description: "Le canal a été supprimé.",
      });

      await loadChannels();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le canal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create chat permission (inter-tenant)
  const createChatPermission = async (permissionData: Partial<ChatPermission>) => {
    if (!tenantId) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('network_chat_permissions')
        .insert({
          source_tenant_id: tenantId,
          target_tenant_id: permissionData.target_tenant_id,
          target_partner_id: permissionData.target_partner_id,
          permission_type: permissionData.permission_type || 'chat',
          is_granted: true,
          is_bidirectional: permissionData.is_bidirectional ?? true
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditAction('permission_granted', 'authorization', 'chat_permission', data.id);
      
      toast({
        title: "Permission accordée",
        description: "La permission de chat a été accordée.",
      });

      await loadChatPermissions();
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'accorder la permission.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update chat permission
  const updateChatPermission = async (id: string, updates: Partial<ChatPermission>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('network_chat_permissions')
        .update({
          is_granted: updates.is_granted,
          is_bidirectional: updates.is_bidirectional,
          permission_type: updates.permission_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await logAuditAction('permission_updated', 'authorization', 'chat_permission', id);
      
      toast({
        title: "Permission mise à jour",
        description: "La permission de chat a été mise à jour.",
      });

      await loadChatPermissions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la permission.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Revoke chat permission
  const revokeChatPermission = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('network_chat_permissions')
        .update({
          is_granted: false,
          revoked_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await logAuditAction('permission_revoked', 'authorization', 'chat_permission', id);
      
      toast({
        title: "Permission révoquée",
        description: "La permission de chat a été révoquée.",
      });

      await loadChatPermissions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de révoquer la permission.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create channel invitation
  const createChannelInvitation = async (invitationData: Partial<ChannelInvitation>) => {
    if (!tenantId) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('network_channel_invitations')
        .insert({
          tenant_id: tenantId,
          channel_id: invitationData.channel_id,
          inviter_tenant_id: tenantId,
          invitee_tenant_id: invitationData.invitee_tenant_id,
          invitee_partner_id: invitationData.invitee_partner_id,
          invitee_type: invitationData.invitee_type || 'pharmacy',
          invitee_email: invitationData.invitee_email,
          message: invitationData.message,
          role_in_channel: invitationData.role_in_channel || 'member',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      await logAuditAction('invitation_sent', 'channel_management', 'channel_invitation', data.id);
      
      toast({
        title: "Invitation envoyée",
        description: "L'invitation au canal a été envoyée.",
      });

      await loadChannelInvitations();
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'invitation.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Accept/Reject channel invitation
  const respondToInvitation = async (id: string, accept: boolean, reason?: string) => {
    try {
      setLoading(true);
      const updateData: any = {
        status: accept ? 'accepted' : 'rejected',
        [accept ? 'accepted_at' : 'rejected_at']: new Date().toISOString()
      };
      
      if (!accept && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('network_channel_invitations')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await logAuditAction(accept ? 'invitation_accepted' : 'invitation_rejected', 'channel_management', 'channel_invitation', id);
      
      toast({
        title: accept ? "Invitation acceptée" : "Invitation refusée",
        description: accept ? "Vous avez rejoint le canal." : "L'invitation a été refusée.",
      });

      await loadChannelInvitations();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter l'invitation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update chat config
  const updateChatConfig = async (key: string, value: string, category: string = 'general') => {
    if (!tenantId) return;

    try {
      setLoading(true);
      
      const { data: existing } = await supabase
        .from('network_chat_config')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('config_key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('network_chat_config')
          .update({ config_value: value, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('network_chat_config')
          .insert({
            tenant_id: tenantId,
            config_key: key,
            config_value: value,
            category
          });
        
        if (error) throw error;
      }

      await logAuditAction('config_updated', 'configuration', 'chat_config', undefined, key);
      
      toast({
        title: "Configuration mise à jour",
        description: "Le paramètre a été mis à jour.",
      });

      await loadChatConfig();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get config value
  const getConfigValue = (key: string, defaultValue: string = ''): string => {
    const config = chatConfig.find(c => c.key === key);
    return config?.value || defaultValue;
  };

  // Refresh all data
  const refreshData = () => {
    loadNetworkData();
  };

  // Get available partners for invitation (fournisseurs + laboratoires)
  const getAvailablePartners = async () => {
    if (!tenantId) return { fournisseurs: [] as any[], laboratoires: [] as any[] };

    try {
      const fournisseursQuery = supabase.from('fournisseurs').select('id, raison_sociale, email, telephone_appel');
      const { data: fournisseurs } = await fournisseursQuery.eq('tenant_id', tenantId);
      
      const laboratoiresQuery = supabase.from('laboratoires').select('id, nom_laboratoire, email, telephone');
      const { data: laboratoires } = await laboratoiresQuery.eq('tenant_id', tenantId);

      return {
        fournisseurs: fournisseurs || [],
        laboratoires: laboratoires || []
      };
    } catch (error) {
      console.error('Error loading available partners:', error);
      return { fournisseurs: [] as any[], laboratoires: [] as any[] };
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (tenantId) {
      loadNetworkData();
    }
  }, [tenantId, loadNetworkData]);

  // Channel Members Management
  const loadChannelMembers = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('channel_participants')
        .select(`
          id, pharmacy_id, role, joined_at, last_read_at,
          pharmacy:pharmacies(id, name, email)
        `)
        .eq('channel_id', channelId);

      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id,
        pharmacyId: m.pharmacy_id,
        pharmacyName: m.pharmacy?.name || m.pharmacy?.email || m.pharmacy_id?.slice(0, 8),
        role: m.role || 'member',
        joinedAt: m.joined_at
      }));
    } catch (error) {
      console.error('Error loading channel members:', error);
      return [];
    }
  };

  const addChannelMember = async (channelId: string, pharmacyId: string, role: string = 'member') => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('channel_participants')
        .insert({
          channel_id: channelId,
          pharmacy_id: pharmacyId,
          tenant_id: tenantId,
          role
        });
      if (error) throw error;
      await logAuditAction('member_added', 'channel_management', 'channel_participant', channelId);
      toast({ title: "Membre ajouté", description: "Le membre a été ajouté au canal." });
      await loadChannels();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const removeChannelMember = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('channel_participants')
        .delete()
        .eq('id', participantId);
      if (error) throw error;
      await logAuditAction('member_removed', 'channel_management', 'channel_participant', participantId);
      toast({ title: "Membre retiré", description: "Le membre a été retiré du canal." });
      await loadChannels();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const updateChannelMemberRole = async (participantId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('channel_participants')
        .update({ role })
        .eq('id', participantId);
      if (error) throw error;
      await logAuditAction('member_role_updated', 'channel_management', 'channel_participant', participantId);
      toast({ title: "Rôle mis à jour", description: "Le rôle du membre a été modifié." });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const markAlertAsReviewed = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('network_audit_logs')
        .update({ is_reviewed: true })
        .eq('id', alertId);
      if (error) throw error;
      await loadAuditLogs();
    } catch (error) {
      console.error('Error marking alert as reviewed:', error);
    }
  };

  const getMessageEvolution = async (days: number = 7) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data } = await supabase
        .from('network_messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const grouped: Record<string, number> = {};
      (data || []).forEach((m: any) => {
        const date = new Date(m.created_at).toLocaleDateString('fr-FR', { weekday: 'short' });
        grouped[date] = (grouped[date] || 0) + 1;
      });

      return Object.entries(grouped).map(([date, messages]) => ({ date, messages }));
    } catch (error) {
      return [];
    }
  };

  const getChannelDistribution = async () => {
    const types = ['team', 'function', 'supplier', 'system'];
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
    return types.map((type, i) => ({
      name: type,
      value: channels.filter(c => c.type === type).length,
      color: colors[i]
    }));
  };

  useEffect(() => {
    if (tenantId) {
      loadNetworkData();
    }
  }, [tenantId, loadNetworkData]);

  return {
    loading,
    pharmacies,
    channels,
    partnerAccounts,
    chatPermissions,
    channelInvitations,
    auditLogs,
    chatConfig,
    chatConfigs: chatConfig,
    stats,
    networkStats: stats,
    createPartnerAccount,
    updatePartnerAccount,
    deletePartnerAccount,
    createChannel,
    updateChannel,
    deleteChannel,
    createChatPermission,
    updateChatPermission,
    revokeChatPermission,
    createChannelInvitation,
    respondToInvitation,
    updateChatConfig,
    getConfigValue,
    refreshData,
    refetch: refreshData,
    getAvailablePartners,
    logAuditAction,
    loadChannelMembers,
    addChannelMember,
    removeChannelMember,
    updateChannelMemberRole,
    markAlertAsReviewed,
    getMessageEvolution,
    getChannelDistribution
  };
};
