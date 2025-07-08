import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Pharmacy {
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  type: string;
  status: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: string;
  is_system: boolean;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_pharmacy_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  priority: string;
  created_at: string;
  pharmacy?: Pharmacy;
}

export const useNetworkMessaging = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [currentPharmacy, setCurrentPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Configuration temps réel pour les messages
  useEffect(() => {
    if (!activeChannel) return;

    const channel = supabase
      .channel('network-messages')
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel]);

  const loadInitialData = async () => {
    try {
      // Charger pharmacies
      const { data: pharmaciesData } = await supabase
        .from('pharmacies')
        .select('*')
        .order('name');

      // Charger canaux
      const { data: channelsData } = await supabase
        .from('network_channels')
        .select('*')
        .order('name');

      if (pharmaciesData) setPharmacies(pharmaciesData);
      if (channelsData) {
        setChannels(channelsData);
        // Sélectionner le canal général par défaut
        const generalChannel = channelsData.find(c => c.name === 'Général');
        if (generalChannel) setActiveChannel(generalChannel.id);
      }

      // Définir la pharmacie courante (première pour demo)
      if (pharmaciesData && pharmaciesData.length > 0) {
        setCurrentPharmacy(pharmaciesData[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const { data } = await supabase
        .from('network_messages')
        .select(`
          *,
          pharmacy:pharmacies!sender_pharmacy_id(id, name, code, type, city, region, status)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(50);

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

  const sendMessage = async (content: string, priority: 'normal' | 'high' | 'urgent' = 'normal') => {
    if (!currentPharmacy || !activeChannel || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('network_messages')
        .insert({
          channel_id: activeChannel,
          sender_pharmacy_id: currentPharmacy.id,
          sender_name: currentPharmacy.name,
          content: content.trim(),
          priority,
          tenant_id: currentPharmacy.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    }
  };

  const selectChannel = (channelId: string) => {
    setActiveChannel(channelId);
    loadMessages(channelId);
  };

  const selectPharmacy = (pharmacy: Pharmacy) => {
    setCurrentPharmacy(pharmacy);
  };

  return {
    pharmacies,
    channels,
    messages,
    activeChannel,
    currentPharmacy,
    loading,
    sendMessage,
    selectChannel,
    selectPharmacy
  };
};