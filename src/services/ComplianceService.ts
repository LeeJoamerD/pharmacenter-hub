import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ComplianceRequirement = Database['public']['Tables']['compliance_requirements']['Row'];
export type ComplianceControl = Database['public']['Tables']['compliance_controls']['Row'];
export type ComplianceAction = Database['public']['Tables']['compliance_actions']['Row'];
export type ComplianceMetrics = Database['public']['Tables']['compliance_metrics_history']['Row'];

export interface ComplianceItem {
  id: string;
  categorie: string;
  exigence: string;
  description: string;
  statut: 'conforme' | 'non_conforme' | 'en_cours' | 'expire';
  dernierControle: Date;
  prochainControle: Date;
  responsable: string;
  urgence: 'basse' | 'moyenne' | 'haute' | 'critique';
  scoreConformite: number;
  actions: string[];
}

export interface ComplianceMetricsData {
  conformite: number;
  nonConformite: number;
  enCours: number;
  expire: number;
  scoreGlobal: number;
}

class ComplianceService {
  // Fetch all compliance requirements
  async getComplianceRequirements() {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Fetch compliance controls with related data
  async getComplianceControls() {
    const { data, error } = await supabase
      .from('compliance_controls')
      .select(`
        *,
        requirement:compliance_requirements(*),
        responsible_person:personnel(noms, prenoms),
        actions:compliance_actions(*)
      `)
      .order('next_control_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get formatted compliance items for the UI
  async getComplianceItems(): Promise<ComplianceItem[]> {
    const controls = await this.getComplianceControls();
    
    return controls.map(control => ({
      id: control.id,
      categorie: control.requirement?.category || 'Non défini',
      exigence: control.requirement?.title || 'Non défini',
      description: control.requirement?.description || 'Aucune description',
      statut: control.status as ComplianceItem['statut'],
      dernierControle: control.last_control_date ? new Date(control.last_control_date) : new Date(),
      prochainControle: control.next_control_date ? new Date(control.next_control_date) : new Date(),
      responsable: control.responsible_person 
        ? `${control.responsible_person.prenoms} ${control.responsible_person.noms}`
        : 'Non assigné',
      urgence: this.mapPriorityToUrgence(control.requirement?.priority_level || 'moyenne'),
      scoreConformite: Number(control.compliance_score) || 0,
      actions: control.actions?.map(action => action.action_description) || []
    }));
  }

  // Calculate compliance metrics
  async getComplianceMetrics(): Promise<ComplianceMetricsData> {
    // Fallback: calculate manually from controls
    const controls = await this.getComplianceControls();
    const conformite = controls.filter(c => c.status === 'conforme').length;
    const nonConformite = controls.filter(c => c.status === 'non_conforme').length;
    const enCours = controls.filter(c => c.status === 'en_cours').length;
    const expire = controls.filter(c => c.status === 'expire').length;
    const scoreGlobal = controls.length > 0 
      ? controls.reduce((sum, c) => sum + (Number(c.compliance_score) || 0), 0) / controls.length 
      : 0;

    return { conformite, nonConformite, enCours, expire, scoreGlobal };
  }

  // Create a new compliance requirement
  async createComplianceRequirement(requirement: Omit<ComplianceRequirement, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .insert({
        ...requirement,
        tenant_id: await this.getCurrentTenantId()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create a new compliance control
  async createComplianceControl(control: Omit<ComplianceControl, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('compliance_controls')
      .insert({
        ...control,
        tenant_id: await this.getCurrentTenantId()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update compliance control
  async updateComplianceControl(id: string, updates: Partial<ComplianceControl>) {
    const { data, error } = await supabase
      .from('compliance_controls')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create corrective action
  async createComplianceAction(action: Omit<ComplianceAction, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('compliance_actions')
      .insert({
        ...action,
        tenant_id: await this.getCurrentTenantId()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Export compliance report
  async exportComplianceReport(filters?: {
    category?: string;
    status?: string;
    urgency?: string;
    dateFrom?: Date;
  }) {
    const items = await this.getComplianceItems();
    
    // Apply filters
    let filteredItems = items;
    if (filters?.category && filters.category !== 'toutes') {
      filteredItems = filteredItems.filter(item => item.categorie === filters.category);
    }
    if (filters?.status && filters.status !== 'tous') {
      filteredItems = filteredItems.filter(item => item.statut === filters.status);
    }
    if (filters?.urgency && filters.urgency !== 'toutes') {
      filteredItems = filteredItems.filter(item => item.urgence === filters.urgency);
    }

    // Generate CSV content
    const headers = [
      'Exigence', 'Catégorie', 'Statut', 'Score', 'Urgence', 
      'Responsable', 'Dernier Contrôle', 'Prochain Contrôle', 'Actions'
    ];
    
    const csvContent = [
      headers.join(';'),
      ...filteredItems.map(item => [
        item.exigence,
        item.categorie,
        item.statut,
        item.scoreConformite,
        item.urgence,
        item.responsable,
        item.dernierControle.toLocaleDateString('fr-FR'),
        item.prochainControle.toLocaleDateString('fr-FR'),
        item.actions.join(' | ')
      ].join(';'))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-conformite-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate audit report
  async generateAuditReport() {
    const items = await this.getComplianceItems();
    const metrics = await this.getComplianceMetrics();
    
    const auditData = {
      date: new Date().toISOString(),
      metrics,
      total_items: items.length,
      critical_items: items.filter(item => item.urgence === 'critique').length,
      expired_items: items.filter(item => item.statut === 'expire').length,
      upcoming_controls: items.filter(item => {
        const daysDiff = Math.ceil((item.prochainControle.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return daysDiff <= 7 && daysDiff >= 0;
      }).length
    };

    const jsonContent = JSON.stringify(auditData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-conformite-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Get available categories
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;
    
    const categories = [...new Set(data?.map(item => item.category) || [])];
    return categories.sort();
  }

  // Helper methods
  private mapPriorityToUrgence(priority: string): ComplianceItem['urgence'] {
    const mapping = {
      'basse': 'basse' as const,
      'moyenne': 'moyenne' as const,
      'haute': 'haute' as const,
      'critique': 'critique' as const
    };
    return mapping[priority as keyof typeof mapping] || 'moyenne';
  }

  private async getCurrentTenantId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: personnel } = await supabase
      .from('personnel')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!personnel) throw new Error('Personnel not found');
    return personnel.tenant_id;
  }
}

export const complianceService = new ComplianceService();