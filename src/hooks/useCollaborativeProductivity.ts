import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface CollaborativeTask {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  assignee_pharmacy_id: string | null;
  assignee_user_id: string | null;
  assignee_name?: string;
  creator_pharmacy_id: string | null;
  creator_user_id: string | null;
  creator_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  tags: string[];
  channel_id: string | null;
  workspace_id: string | null;
  is_network_task: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  comments_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_pharmacy_id: string | null;
  author_user_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface SharedDocument {
  id: string;
  tenant_id: string;
  document_id: string | null;
  name: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number;
  category: string;
  uploaded_by_pharmacy_id: string | null;
  uploaded_by_user_id: string | null;
  uploaded_by_name: string | null;
  workspace_id: string | null;
  channel_id: string | null;
  shared_with_pharmacies: string[];
  is_network_document: boolean;
  version: number;
  tags: string[];
  download_count: number;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborativeEvent {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  event_type: 'meeting' | 'training' | 'event' | 'deadline';
  event_date: string;
  event_time: string | null;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  meeting_link: string | null;
  organizer_pharmacy_id: string | null;
  organizer_user_id: string | null;
  organizer_name: string | null;
  participants: Array<{ pharmacy_id: string; user_id?: string; status: string; name?: string }>;
  reminder_enabled: boolean;
  reminder_minutes: number;
  is_network_event: boolean;
  recurrence_rule: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CollaborativeWorkspace {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  progress_percent: number;
  status: 'active' | 'archived' | 'completed';
  owner_pharmacy_id: string | null;
  owner_user_id: string | null;
  is_network_workspace: boolean;
  goals: Array<{ id: string; title: string; completed: boolean }>;
  milestones: Array<{ id: string; title: string; date: string; completed: boolean }>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  members_count?: number;
  tasks_count?: number;
  documents_count?: number;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  pharmacy_id: string | null;
  user_id: string | null;
  user_name: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  invited_by: string | null;
  status: 'active' | 'pending' | 'removed';
  pharmacy_name?: string;
}

export interface CollaborativeMetrics {
  activeTasks: number;
  completedTasks: number;
  sharedDocuments: number;
  upcomingEvents: number;
  activeWorkspaces: number;
  collaboratingPharmacies: number;
}

interface TaskFilters {
  status?: string;
  priority?: string;
  pharmacy_id?: string;
  workspace_id?: string;
  search?: string;
}

interface DocumentFilters {
  category?: string;
  pharmacy_id?: string;
  workspace_id?: string;
  search?: string;
}

interface EventFilters {
  type?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export function useCollaborativeProductivity() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [tasks, setTasks] = useState<CollaborativeTask[]>([]);
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [events, setEvents] = useState<CollaborativeEvent[]>([]);
  const [workspaces, setWorkspaces] = useState<CollaborativeWorkspace[]>([]);
  const [pharmacies, setPharmacies] = useState<Array<{ id: string; name: string }>>([]);
  
  // Metrics
  const [metrics, setMetrics] = useState<CollaborativeMetrics>({
    activeTasks: 0,
    completedTasks: 0,
    sharedDocuments: 0,
    upcomingEvents: 0,
    activeWorkspaces: 0,
    collaboratingPharmacies: 0
  });

  // Load pharmacies for selection
  const loadPharmacies = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id, nom_pharmacie')
        .order('nom_pharmacie');
      
      if (error) throw error;
      setPharmacies((data as any[])?.map(p => ({ id: p.id, name: p.nom_pharmacie })) || []);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
    }
  }, [tenantId]);

  // ===== TASKS CRUD =====
  const loadTasks = useCallback(async (filters?: TaskFilters) => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('collaborative_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.pharmacy_id && filters.pharmacy_id !== 'all') {
        query = query.eq('assignee_pharmacy_id', filters.pharmacy_id);
      }
      if (filters?.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Enrich with pharmacy names
      const enrichedTasks = (data || []).map(task => ({
        ...task,
        priority: task.priority as CollaborativeTask['priority'],
        status: task.status as CollaborativeTask['status'],
        tags: task.tags || [],
        metadata: (task.metadata as Record<string, unknown>) || {},
        assignee_name: pharmacies.find(p => p.id === task.assignee_pharmacy_id)?.name
      }));
      
      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
    }
  }, [tenantId, pharmacies]);

  const createTask = useCallback(async (task: Partial<CollaborativeTask>) => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_tasks')
        .insert({
          tenant_id: tenantId,
          title: task.title,
          description: task.description,
          assignee_pharmacy_id: task.assignee_pharmacy_id,
          assignee_user_id: task.assignee_user_id,
          creator_pharmacy_id: tenantId,
          priority: task.priority || 'medium',
          status: 'pending',
          due_date: task.due_date,
          tags: task.tags || [],
          workspace_id: task.workspace_id,
          is_network_task: task.is_network_task || false,
          metadata: (task.metadata || {}) as any
        } as any);
      
      if (error) throw error;
      
      toast.success('Tâche créée avec succès');
      await loadTasks();
      await refreshMetrics();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erreur lors de la création de la tâche');
    } finally {
      setSaving(false);
    }
  }, [tenantId, loadTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<CollaborativeTask>) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('collaborative_tasks')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Tâche mise à jour');
      await loadTasks();
      await refreshMetrics();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }, [loadTasks]);

  const deleteTask = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Tâche supprimée');
      await loadTasks();
      await refreshMetrics();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  }, [loadTasks]);

  const completeTask = useCallback(async (id: string) => {
    await updateTask(id, { status: 'completed' });
  }, [updateTask]);

  // Task comments
  const loadTaskComments = useCallback(async (taskId: string): Promise<TaskComment[]> => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }, []);

  const addTaskComment = useCallback(async (taskId: string, content: string) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_pharmacy_id: tenantId,
          content
        });
      
      if (error) throw error;
      toast.success('Commentaire ajouté');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  }, [tenantId]);

  // ===== DOCUMENTS CRUD =====
  const loadDocuments = useCallback(async (filters?: DocumentFilters) => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('shared_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setDocuments((data || []).map(doc => ({
        ...doc,
        tags: doc.tags || [],
        shared_with_pharmacies: doc.shared_with_pharmacies || []
      })));
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Erreur lors du chargement des documents');
    }
  }, [tenantId]);

  const uploadDocument = useCallback(async (
    name: string,
    metadata: { 
      description?: string; 
      category?: string; 
      file_type?: string;
      file_size?: number;
      file_url?: string;
      workspace_id?: string;
      is_network_document?: boolean;
      shared_with_pharmacies?: string[];
      tags?: string[];
    }
  ) => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shared_documents')
        .insert({
          tenant_id: tenantId,
          name,
          description: metadata.description,
          category: metadata.category || 'general',
          file_type: metadata.file_type,
          file_size: metadata.file_size || 0,
          file_url: metadata.file_url,
          uploaded_by_pharmacy_id: tenantId,
          workspace_id: metadata.workspace_id,
          is_network_document: metadata.is_network_document || false,
          shared_with_pharmacies: metadata.shared_with_pharmacies || [],
          tags: metadata.tags || []
        });
      
      if (error) throw error;
      
      toast.success('Document ajouté avec succès');
      await loadDocuments();
      await refreshMetrics();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erreur lors de l\'ajout du document');
    } finally {
      setSaving(false);
    }
  }, [tenantId, loadDocuments]);

  const shareDocument = useCallback(async (documentId: string, pharmacyIds: string[]) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shared_documents')
        .update({
          shared_with_pharmacies: pharmacyIds,
          is_network_document: pharmacyIds.length > 0
        })
        .eq('id', documentId);
      
      if (error) throw error;
      
      toast.success('Document partagé avec succès');
      await loadDocuments();
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Erreur lors du partage');
    } finally {
      setSaving(false);
    }
  }, [loadDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shared_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Document supprimé');
      await loadDocuments();
      await refreshMetrics();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  }, [loadDocuments]);

  const incrementDownloadCount = useCallback(async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return;
      
      await supabase
        .from('shared_documents')
        .update({
          download_count: (doc.download_count || 0) + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }, [documents]);

  // ===== EVENTS CRUD =====
  const loadEvents = useCallback(async (filters?: EventFilters) => {
    if (!tenantId) return;
    
    try {
      let query = supabase
        .from('collaborative_events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('event_type', filters.type);
      }
      if (filters?.from_date) {
        query = query.gte('event_date', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('event_date', filters.to_date);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setEvents((data || []).map(event => ({
        ...event,
        event_type: event.event_type as CollaborativeEvent['event_type'],
        participants: (event.participants as CollaborativeEvent['participants']) || [],
        metadata: (event.metadata as Record<string, unknown>) || {}
      })));
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erreur lors du chargement des événements');
    }
  }, [tenantId]);

  const createEvent = useCallback(async (event: Partial<CollaborativeEvent>) => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_events')
        .insert({
          tenant_id: tenantId,
          title: event.title,
          description: event.description,
          event_type: event.event_type || 'meeting',
          event_date: event.event_date,
          event_time: event.event_time,
          end_date: event.end_date,
          location: event.location,
          is_virtual: event.is_virtual || false,
          meeting_link: event.meeting_link,
          organizer_pharmacy_id: tenantId,
          participants: (event.participants || []) as any,
          reminder_enabled: event.reminder_enabled ?? true,
          reminder_minutes: event.reminder_minutes || 30,
          is_network_event: event.is_network_event || false,
          recurrence_rule: event.recurrence_rule,
          metadata: (event.metadata || {}) as any
        } as any);
      
      if (error) throw error;
      
      toast.success('Événement créé avec succès');
      await loadEvents();
      await refreshMetrics();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Erreur lors de la création de l\'événement');
    } finally {
      setSaving(false);
    }
  }, [tenantId, loadEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CollaborativeEvent>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_events')
        .update(updates as any)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Événement mis à jour');
      await loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }, [loadEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Événement supprimé');
      await loadEvents();
      await refreshMetrics();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  }, [loadEvents]);

  const respondToEvent = useCallback(async (
    eventId: string, 
    status: 'accepted' | 'declined' | 'tentative'
  ) => {
    if (!tenantId) return;
    
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const updatedParticipants = event.participants.map(p => 
      p.pharmacy_id === tenantId ? { ...p, status } : p
    );
    
    // If not already a participant, add
    if (!updatedParticipants.find(p => p.pharmacy_id === tenantId)) {
      updatedParticipants.push({ pharmacy_id: tenantId, status });
    }
    
    await updateEvent(eventId, { participants: updatedParticipants });
  }, [tenantId, events, updateEvent]);

  // ===== WORKSPACES CRUD =====
  const loadWorkspaces = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('collaborative_workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Enrich with counts
      const enrichedWorkspaces = await Promise.all((data || []).map(async (ws) => {
        const [membersResult, tasksResult, docsResult] = await Promise.all([
          supabase.from('workspace_members').select('id', { count: 'exact' }).eq('workspace_id', ws.id).eq('status', 'active'),
          supabase.from('collaborative_tasks').select('id', { count: 'exact' }).eq('workspace_id', ws.id),
          supabase.from('shared_documents').select('id', { count: 'exact' }).eq('workspace_id', ws.id)
        ]);
        
        return {
          ...ws,
          status: ws.status as CollaborativeWorkspace['status'],
          goals: (ws.goals as CollaborativeWorkspace['goals']) || [],
          milestones: (ws.milestones as CollaborativeWorkspace['milestones']) || [],
          settings: (ws.settings as Record<string, unknown>) || {},
          members_count: membersResult.count || 0,
          tasks_count: tasksResult.count || 0,
          documents_count: docsResult.count || 0
        };
      }));
      
      setWorkspaces(enrichedWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      toast.error('Erreur lors du chargement des espaces');
    }
  }, [tenantId]);

  const createWorkspace = useCallback(async (workspace: Partial<CollaborativeWorkspace>) => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('collaborative_workspaces')
        .insert({
          tenant_id: tenantId,
          name: workspace.name,
          description: workspace.description,
          icon: workspace.icon || 'folder',
          color: workspace.color || 'primary',
          owner_pharmacy_id: tenantId,
          is_network_workspace: workspace.is_network_workspace || false,
          goals: (workspace.goals || []) as any,
          milestones: (workspace.milestones || []) as any,
          settings: (workspace.settings || {}) as any
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add creator as owner member
      if (data) {
        await supabase
          .from('workspace_members')
          .insert({
            workspace_id: data.id,
            pharmacy_id: tenantId,
            role: 'owner',
            status: 'active'
          });
      }
      
      toast.success('Espace de travail créé');
      await loadWorkspaces();
      await refreshMetrics();
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }, [tenantId, loadWorkspaces]);

  const updateWorkspace = useCallback(async (id: string, updates: Partial<CollaborativeWorkspace>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_workspaces')
        .update(updates as any)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Espace mis à jour');
      await loadWorkspaces();
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }, [loadWorkspaces]);

  const deleteWorkspace = useCallback(async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('collaborative_workspaces')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Espace supprimé');
      await loadWorkspaces();
      await refreshMetrics();
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  }, [loadWorkspaces]);

  const updateWorkspaceProgress = useCallback(async (workspaceId: string, progress: number) => {
    await updateWorkspace(workspaceId, { progress_percent: Math.max(0, Math.min(100, progress)) });
  }, [updateWorkspace]);

  // Workspace members
  const loadWorkspaceMembers = useCallback(async (workspaceId: string): Promise<WorkspaceMember[]> => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('joined_at');
      
      if (error) throw error;
      
      // Enrich with pharmacy names
      return (data || []).map(member => ({
        ...member,
        role: member.role as WorkspaceMember['role'],
        status: member.status as WorkspaceMember['status'],
        pharmacy_name: pharmacies.find(p => p.id === member.pharmacy_id)?.name
      }));
    } catch (error) {
      console.error('Error loading members:', error);
      return [];
    }
  }, [pharmacies]);

  const addWorkspaceMember = useCallback(async (
    workspaceId: string, 
    pharmacyId: string, 
    role: string = 'member'
  ) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          pharmacy_id: pharmacyId,
          role,
          invited_by: tenantId,
          status: 'active'
        });
      
      if (error) throw error;
      
      toast.success('Membre ajouté');
      await loadWorkspaces();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Erreur lors de l\'ajout du membre');
    }
  }, [tenantId, loadWorkspaces]);

  const removeWorkspaceMember = useCallback(async (workspaceId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ status: 'removed' })
        .eq('id', memberId);
      
      if (error) throw error;
      
      toast.success('Membre retiré');
      await loadWorkspaces();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erreur lors du retrait du membre');
    }
  }, [loadWorkspaces]);

  // ===== METRICS =====
  const refreshMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const [
        activeTasksResult,
        completedTasksResult,
        documentsResult,
        upcomingEventsResult,
        workspacesResult
      ] = await Promise.all([
        supabase.from('collaborative_tasks').select('id', { count: 'exact' }).neq('status', 'completed').neq('status', 'cancelled'),
        supabase.from('collaborative_tasks').select('id', { count: 'exact' }).eq('status', 'completed'),
        supabase.from('shared_documents').select('id', { count: 'exact' }),
        supabase.from('collaborative_events').select('id', { count: 'exact' }).gte('event_date', new Date().toISOString()),
        supabase.from('collaborative_workspaces').select('id', { count: 'exact' }).eq('status', 'active')
      ]);
      
      // Count unique pharmacies in collaboration
      const { data: collabPharmacies } = await supabase
        .from('workspace_members')
        .select('pharmacy_id')
        .eq('status', 'active');
      
      const uniquePharmacies = new Set(collabPharmacies?.map(m => m.pharmacy_id) || []);
      
      setMetrics({
        activeTasks: activeTasksResult.count || 0,
        completedTasks: completedTasksResult.count || 0,
        sharedDocuments: documentsResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0,
        activeWorkspaces: workspacesResult.count || 0,
        collaboratingPharmacies: uniquePharmacies.size
      });
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  }, [tenantId]);

  // ===== INITIAL LOAD =====
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await loadPharmacies();
      await Promise.all([
        loadTasks(),
        loadDocuments(),
        loadEvents(),
        loadWorkspaces(),
        refreshMetrics()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadPharmacies, loadTasks, loadDocuments, loadEvents, loadWorkspaces, refreshMetrics]);

  useEffect(() => {
    if (tenantId) {
      loadAll();
    }
  }, [tenantId, loadAll]);

  return {
    // State
    loading,
    saving,
    
    // Data
    tasks,
    documents,
    events,
    workspaces,
    pharmacies,
    metrics,
    
    // Tasks
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    loadTaskComments,
    addTaskComment,
    
    // Documents
    loadDocuments,
    uploadDocument,
    shareDocument,
    deleteDocument,
    incrementDownloadCount,
    
    // Events
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    respondToEvent,
    
    // Workspaces
    loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    updateWorkspaceProgress,
    loadWorkspaceMembers,
    addWorkspaceMember,
    removeWorkspaceMember,
    
    // Utils
    refreshMetrics,
    loadAll
  };
}
