-- =============================================
-- Productivité Collaborative - Tables complètes
-- =============================================

-- Table des tâches collaboratives
CREATE TABLE public.collaborative_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_pharmacy_id UUID REFERENCES public.pharmacies(id),
  assignee_user_id UUID REFERENCES public.personnel(id),
  creator_pharmacy_id UUID REFERENCES public.pharmacies(id),
  creator_user_id UUID REFERENCES public.personnel(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  channel_id UUID REFERENCES public.network_channels(id),
  workspace_id UUID,
  is_network_task BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des commentaires sur tâches
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.collaborative_tasks(id) ON DELETE CASCADE,
  author_pharmacy_id UUID REFERENCES public.pharmacies(id),
  author_user_id UUID REFERENCES public.personnel(id),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des événements collaboratifs
CREATE TABLE public.collaborative_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'training', 'event', 'deadline')),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_time TEXT,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_link TEXT,
  organizer_pharmacy_id UUID REFERENCES public.pharmacies(id),
  organizer_user_id UUID REFERENCES public.personnel(id),
  organizer_name TEXT,
  participants JSONB DEFAULT '[]',
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes INTEGER DEFAULT 30,
  is_network_event BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des espaces de travail collaboratifs
CREATE TABLE public.collaborative_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT 'primary',
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  owner_pharmacy_id UUID REFERENCES public.pharmacies(id),
  owner_user_id UUID REFERENCES public.personnel(id),
  is_network_workspace BOOLEAN DEFAULT false,
  goals JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter la référence workspace_id après création de la table
ALTER TABLE public.collaborative_tasks 
ADD CONSTRAINT collaborative_tasks_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES public.collaborative_workspaces(id) ON DELETE SET NULL;

-- Table des membres d'espace de travail
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.collaborative_workspaces(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES public.pharmacies(id),
  user_id UUID REFERENCES public.personnel(id),
  user_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'removed')),
  UNIQUE(workspace_id, pharmacy_id, user_id)
);

-- Table des documents partagés
CREATE TABLE public.shared_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT DEFAULT 0,
  category TEXT DEFAULT 'general',
  uploaded_by_pharmacy_id UUID REFERENCES public.pharmacies(id),
  uploaded_by_user_id UUID REFERENCES public.personnel(id),
  uploaded_by_name TEXT,
  workspace_id UUID REFERENCES public.collaborative_workspaces(id),
  channel_id UUID REFERENCES public.network_channels(id),
  shared_with_pharmacies UUID[] DEFAULT '{}',
  is_network_document BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- Indexes pour performance
-- =============================================

CREATE INDEX idx_collaborative_tasks_tenant ON public.collaborative_tasks(tenant_id);
CREATE INDEX idx_collaborative_tasks_status ON public.collaborative_tasks(status);
CREATE INDEX idx_collaborative_tasks_assignee_pharmacy ON public.collaborative_tasks(assignee_pharmacy_id);
CREATE INDEX idx_collaborative_tasks_due_date ON public.collaborative_tasks(due_date);
CREATE INDEX idx_collaborative_tasks_workspace ON public.collaborative_tasks(workspace_id);
CREATE INDEX idx_collaborative_tasks_is_network ON public.collaborative_tasks(is_network_task) WHERE is_network_task = true;

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

CREATE INDEX idx_collaborative_events_tenant ON public.collaborative_events(tenant_id);
CREATE INDEX idx_collaborative_events_date ON public.collaborative_events(event_date);
CREATE INDEX idx_collaborative_events_is_network ON public.collaborative_events(is_network_event) WHERE is_network_event = true;

CREATE INDEX idx_collaborative_workspaces_tenant ON public.collaborative_workspaces(tenant_id);
CREATE INDEX idx_collaborative_workspaces_status ON public.collaborative_workspaces(status);
CREATE INDEX idx_collaborative_workspaces_is_network ON public.collaborative_workspaces(is_network_workspace) WHERE is_network_workspace = true;

CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_pharmacy ON public.workspace_members(pharmacy_id);

CREATE INDEX idx_shared_documents_tenant ON public.shared_documents(tenant_id);
CREATE INDEX idx_shared_documents_workspace ON public.shared_documents(workspace_id);
CREATE INDEX idx_shared_documents_category ON public.shared_documents(category);
CREATE INDEX idx_shared_documents_is_network ON public.shared_documents(is_network_document) WHERE is_network_document = true;

-- =============================================
-- Enable RLS
-- =============================================

ALTER TABLE public.collaborative_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies - collaborative_tasks
-- =============================================

CREATE POLICY "Users can view own tenant tasks"
ON public.collaborative_tasks FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view assigned network tasks"
ON public.collaborative_tasks FOR SELECT
USING (
  is_network_task = true 
  AND assignee_pharmacy_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can insert tasks in their tenant"
ON public.collaborative_tasks FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own tenant tasks"
ON public.collaborative_tasks FOR UPDATE
USING (tenant_id = get_current_user_tenant_id() OR assignee_pharmacy_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own tenant tasks"
ON public.collaborative_tasks FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =============================================
-- RLS Policies - task_comments
-- =============================================

CREATE POLICY "Users can view comments on accessible tasks"
ON public.task_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collaborative_tasks t
    WHERE t.id = task_id 
    AND (t.tenant_id = get_current_user_tenant_id() OR t.assignee_pharmacy_id = get_current_user_tenant_id())
  )
);

CREATE POLICY "Users can insert comments on accessible tasks"
ON public.task_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collaborative_tasks t
    WHERE t.id = task_id 
    AND (t.tenant_id = get_current_user_tenant_id() OR t.assignee_pharmacy_id = get_current_user_tenant_id())
  )
);

CREATE POLICY "Users can delete own comments"
ON public.task_comments FOR DELETE
USING (author_pharmacy_id = get_current_user_tenant_id());

-- =============================================
-- RLS Policies - collaborative_events
-- =============================================

CREATE POLICY "Users can view own tenant events"
ON public.collaborative_events FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view network events they participate in"
ON public.collaborative_events FOR SELECT
USING (
  is_network_event = true 
  AND participants::text LIKE '%' || get_current_user_tenant_id()::text || '%'
);

CREATE POLICY "Users can insert events in their tenant"
ON public.collaborative_events FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own tenant events"
ON public.collaborative_events FOR UPDATE
USING (tenant_id = get_current_user_tenant_id() OR organizer_pharmacy_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own tenant events"
ON public.collaborative_events FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =============================================
-- RLS Policies - collaborative_workspaces
-- =============================================

CREATE POLICY "Users can view own tenant workspaces"
ON public.collaborative_workspaces FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view network workspaces they are members of"
ON public.collaborative_workspaces FOR SELECT
USING (
  is_network_workspace = true 
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = id 
    AND wm.pharmacy_id = get_current_user_tenant_id()
    AND wm.status = 'active'
  )
);

CREATE POLICY "Users can insert workspaces in their tenant"
ON public.collaborative_workspaces FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own tenant workspaces"
ON public.collaborative_workspaces FOR UPDATE
USING (tenant_id = get_current_user_tenant_id() OR owner_pharmacy_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own tenant workspaces"
ON public.collaborative_workspaces FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =============================================
-- RLS Policies - workspace_members
-- =============================================

CREATE POLICY "Users can view members of accessible workspaces"
ON public.workspace_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.collaborative_workspaces w
    WHERE w.id = workspace_id 
    AND (w.tenant_id = get_current_user_tenant_id() OR w.owner_pharmacy_id = get_current_user_tenant_id())
  )
  OR pharmacy_id = get_current_user_tenant_id()
);

CREATE POLICY "Users can add members to own workspaces"
ON public.workspace_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collaborative_workspaces w
    WHERE w.id = workspace_id 
    AND (w.tenant_id = get_current_user_tenant_id() OR w.owner_pharmacy_id = get_current_user_tenant_id())
  )
);

CREATE POLICY "Users can update members in own workspaces"
ON public.workspace_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.collaborative_workspaces w
    WHERE w.id = workspace_id 
    AND (w.tenant_id = get_current_user_tenant_id() OR w.owner_pharmacy_id = get_current_user_tenant_id())
  )
);

CREATE POLICY "Users can remove members from own workspaces"
ON public.workspace_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.collaborative_workspaces w
    WHERE w.id = workspace_id 
    AND (w.tenant_id = get_current_user_tenant_id() OR w.owner_pharmacy_id = get_current_user_tenant_id())
  )
);

-- =============================================
-- RLS Policies - shared_documents
-- =============================================

CREATE POLICY "Users can view own tenant documents"
ON public.shared_documents FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view shared network documents"
ON public.shared_documents FOR SELECT
USING (
  is_network_document = true 
  AND get_current_user_tenant_id() = ANY(shared_with_pharmacies)
);

CREATE POLICY "Users can insert documents in their tenant"
ON public.shared_documents FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own tenant documents"
ON public.shared_documents FOR UPDATE
USING (tenant_id = get_current_user_tenant_id() OR uploaded_by_pharmacy_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own tenant documents"
ON public.shared_documents FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =============================================
-- Triggers pour updated_at
-- =============================================

CREATE TRIGGER update_collaborative_tasks_updated_at
  BEFORE UPDATE ON public.collaborative_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborative_events_updated_at
  BEFORE UPDATE ON public.collaborative_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborative_workspaces_updated_at
  BEFORE UPDATE ON public.collaborative_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_documents_updated_at
  BEFORE UPDATE ON public.shared_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();