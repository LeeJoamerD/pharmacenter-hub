-- Add missing columns to workflows and workflow_templates tables

-- Add category column to workflows table
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Général';

-- Add created_by column to workflow_templates table
ALTER TABLE public.workflow_templates 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_workflows_category 
ON public.workflows(category);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_created_by 
ON public.workflow_templates(created_by);