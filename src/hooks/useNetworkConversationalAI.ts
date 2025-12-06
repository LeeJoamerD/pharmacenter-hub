import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export interface AIConversation {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'completed';
  ai_model_id: string | null;
  context: string;
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sender_pharmacy_id: string | null;
  sender_name: string | null;
  confidence: number | null;
  suggestions: string[];
  created_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  model_identifier: string;
  capabilities: string[];
  specialization: string;
  status: 'active' | 'maintenance' | 'inactive';
  max_tokens: number;
  temperature: number;
  is_default: boolean;
  is_system: boolean;
  system_prompt: string | null;
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'trend' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  pharmacies_affected: string[];
  confidence: number;
  is_read: boolean;
  is_applied: boolean;
  applied_at: string | null;
  created_at: string;
}

export interface AISettings {
  voice_enabled: boolean;
  speech_recognition: boolean;
  auto_suggestions: boolean;
  default_model_id: string | null;
  encryption_enabled: boolean;
  audit_enabled: boolean;
  anonymized_data: boolean;
  data_retention_days: number;
}

export const useNetworkConversationalAI = () => {
  const { tenantId, currentTenant } = useTenant();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [settings, setSettings] = useState<AISettings>({
    voice_enabled: false,
    speech_recognition: false,
    auto_suggestions: true,
    default_model_id: null,
    encryption_enabled: true,
    audit_enabled: true,
    anonymized_data: true,
    data_retention_days: 30,
  });
  
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations((data || []).map(c => ({
        ...c,
        status: c.status as 'active' | 'paused' | 'completed',
        participants: Array.isArray(c.participants) ? c.participants as string[] : [],
      })));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
        .from('ai_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({
        ...m,
        role: m.role as 'user' | 'assistant' | 'system',
        suggestions: Array.isArray(m.suggestions) ? m.suggestions as string[] : [],
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (
    title: string,
    context: string,
    modelId: string | null,
    participants: string[] = []
  ) => {
    if (!tenantId) return null;
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          tenant_id: tenantId,
          title,
          context,
          ai_model_id: modelId,
          participants: participants.length > 0 ? participants : [tenantId],
          created_by: tenantId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add system message
      await supabase.from('ai_conversation_messages').insert({
        tenant_id: tenantId,
        conversation_id: data.id,
        role: 'system',
        content: `Conversation "${title}" démarrée. Contexte: ${context}`,
      });

      toast({ title: 'Conversation créée', description: title });
      await loadConversations();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer la conversation', variant: 'destructive' });
      return null;
    }
  }, [tenantId, loadConversations, toast]);

  // Update conversation
  const updateConversation = useCallback(async (id: string, updates: Partial<AIConversation>) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadConversations();
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }, [loadConversations]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Conversation supprimée' });
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  }, [loadConversations, toast]);

  // Send message with streaming
  const sendMessage = useCallback(async (conversationId: string, content: string, modelId?: string) => {
    if (!tenantId || !content.trim()) return;
    
    setStreaming(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/network-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: content,
            model_id: modelId,
            tenant_id: tenantId,
            pharmacy_id: tenantId,
            pharmacy_name: (currentTenant as any)?.nom_pharmacie || currentTenant?.name || 'Pharmacie',
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              fullContent += deltaContent;
              setStreamingContent(fullContent);
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }

      // Reload messages after streaming
      await loadMessages(conversationId);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        toast({
          title: 'Erreur',
          description: (error as Error).message || 'Impossible d\'envoyer le message',
          variant: 'destructive',
        });
      }
    } finally {
      setStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [tenantId, currentTenant, loadMessages, toast]);

  // Cancel streaming
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Load AI models
  const loadAIModels = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAIModels((data || []).map(m => ({
        ...m,
        status: m.status as 'active' | 'maintenance' | 'inactive',
        capabilities: Array.isArray(m.capabilities) ? m.capabilities as string[] : [],
      })));
    } catch (error) {
      console.error('Error loading AI models:', error);
    }
  }, [tenantId]);

  // Create AI model
  const createAIModel = useCallback(async (model: Partial<AIModel>) => {
    if (!tenantId) return null;
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          tenant_id: tenantId,
          name: model.name || 'Nouveau modèle',
          description: model.description,
          provider: model.provider || 'lovable',
          model_identifier: model.model_identifier || 'google/gemini-2.5-flash',
          capabilities: model.capabilities || [],
          specialization: model.specialization || 'general',
          status: model.status || 'active',
          max_tokens: model.max_tokens || 2048,
          temperature: model.temperature || 0.7,
          is_default: model.is_default || false,
          is_system: false,
          system_prompt: model.system_prompt,
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Modèle créé', description: model.name });
      await loadAIModels();
      return data;
    } catch (error) {
      console.error('Error creating model:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer le modèle', variant: 'destructive' });
      return null;
    }
  }, [tenantId, loadAIModels, toast]);

  // Update AI model
  const updateAIModel = useCallback(async (id: string, updates: Partial<AIModel>) => {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Modèle mis à jour' });
      await loadAIModels();
    } catch (error) {
      console.error('Error updating model:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' });
    }
  }, [loadAIModels, toast]);

  // Toggle model status
  const toggleModelStatus = useCallback(async (id: string, status: AIModel['status']) => {
    await updateAIModel(id, { status });
  }, [updateAIModel]);

  // Set default model
  const setDefaultModel = useCallback(async (id: string) => {
    if (!tenantId) return;
    try {
      // Unset all defaults first
      await supabase
        .from('ai_models')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);

      // Set new default
      await supabase
        .from('ai_models')
        .update({ is_default: true })
        .eq('id', id);

      toast({ title: 'Modèle par défaut défini' });
      await loadAIModels();
    } catch (error) {
      console.error('Error setting default model:', error);
    }
  }, [tenantId, loadAIModels, toast]);

  // Test AI model
  const testAIModel = useCallback(async (modelId: string, testPrompt: string) => {
    if (!tenantId) return null;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/network-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: testPrompt,
            model_id: modelId,
            tenant_id: tenantId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) result += content;
              } catch {
                // Ignore
              }
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error testing model:', error);
      throw error;
    }
  }, [tenantId]);

  // Load insights
  const loadInsights = useCallback(async (filters?: {
    type?: string;
    impact?: string;
    isRead?: boolean;
  }) => {
    if (!tenantId) return;
    try {
      let query = supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.impact) {
        query = query.eq('impact', filters.impact);
      }
      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setInsights((data || []).map(i => ({
        ...i,
        type: i.type as 'recommendation' | 'alert' | 'trend' | 'optimization',
        impact: i.impact as 'low' | 'medium' | 'high' | 'critical',
        pharmacies_affected: Array.isArray(i.pharmacies_affected) ? i.pharmacies_affected as string[] : [],
      })));
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }, [tenantId]);

  // Mark insight as read
  const markInsightAsRead = useCallback(async (id: string) => {
    try {
      await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', id);
      await loadInsights();
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  }, [loadInsights]);

  // Apply insight
  const applyInsight = useCallback(async (id: string) => {
    if (!tenantId) return;
    try {
      await supabase
        .from('ai_insights')
        .update({
          is_applied: true,
          applied_at: new Date().toISOString(),
          applied_by: tenantId,
        })
        .eq('id', id);
      toast({ title: 'Insight appliqué' });
      await loadInsights();
    } catch (error) {
      console.error('Error applying insight:', error);
    }
  }, [tenantId, loadInsights, toast]);

  // Dismiss insight
  const dismissInsight = useCallback(async (id: string) => {
    try {
      await supabase
        .from('ai_insights')
        .delete()
        .eq('id', id);
      toast({ title: 'Insight ignoré' });
      await loadInsights();
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  }, [loadInsights, toast]);

  // Load settings from network_admin_settings
  const loadSettings = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data } = await supabase
        .from('network_admin_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('setting_category', 'ai');

      if (data && data.length > 0) {
        const settingsObj: any = {};
        data.forEach(row => {
          try {
            settingsObj[row.setting_key] = JSON.parse(row.setting_value);
          } catch {
            settingsObj[row.setting_key] = row.setting_value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  }, [tenantId]);

  // Save settings
  const saveSettings = useCallback(async (newSettings: Partial<AISettings>) => {
    if (!tenantId) return;
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Save each setting as a separate row
      const upsertPromises = Object.entries(updatedSettings).map(([key, value]) =>
        supabase
          .from('network_admin_settings')
          .upsert({
            tenant_id: tenantId,
            setting_category: 'ai',
            setting_key: key,
            setting_value: JSON.stringify(value),
          })
      );
      
      await Promise.all(upsertPromises);
      setSettings(updatedSettings);
      toast({ title: 'Paramètres sauvegardés' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  }, [tenantId, settings, toast]);

  // Get statistics
  const getStats = useCallback(() => {
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const activeModels = aiModels.filter(m => m.status === 'active').length;
    const recentInsights = insights.filter(i => {
      const createdAt = new Date(i.created_at);
      const now = new Date();
      return (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
    }).length;
    
    const totalMessages = messages.filter(m => m.role === 'assistant' && m.confidence);
    const avgConfidence = totalMessages.length > 0
      ? totalMessages.reduce((acc, m) => acc + (m.confidence || 0), 0) / totalMessages.length
      : 0.94;

    return {
      activeConversations,
      totalConversations: conversations.length,
      activeModels,
      recentInsights,
      avgConfidence: Math.round(avgConfidence * 100),
    };
  }, [conversations, aiModels, insights, messages]);

  return {
    // State
    conversations,
    messages,
    aiModels,
    insights,
    settings,
    loading,
    streaming,
    streamingContent,
    
    // Conversation methods
    loadConversations,
    loadMessages,
    createConversation,
    updateConversation,
    deleteConversation,
    sendMessage,
    cancelStreaming,
    
    // Model methods
    loadAIModels,
    createAIModel,
    updateAIModel,
    toggleModelStatus,
    setDefaultModel,
    testAIModel,
    
    // Insight methods
    loadInsights,
    markInsightAsRead,
    applyInsight,
    dismissInsight,
    
    // Settings methods
    loadSettings,
    saveSettings,
    
    // Stats
    getStats,
  };
};
