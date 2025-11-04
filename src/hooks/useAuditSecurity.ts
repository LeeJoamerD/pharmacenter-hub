import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  personnel_id: string;
  table_name: string;
  action: string;
  record_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  status: string;
  error_message: string;
  created_at: string;
}

export interface SecurityAlert {
  id: string;
  tenant_id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: string;
  resolved: boolean;
  resolved_by: string;
  resolved_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface SecurityControl {
  id: string;
  tenant_id: string;
  control_name: string;
  control_type: string;
  description: string;
  is_enabled: boolean;
  compliance_score: number;
  last_check_date: string;
  next_check_date: string;
  check_frequency: string;
  status: 'pending' | 'compliant' | 'non_compliant' | 'partial';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ComplianceCheck {
  id: string;
  tenant_id: string;
  requirement_name: string;
  requirement_code: string;
  category: string;
  country_code: string;
  regulatory_body: string;
  description: string;
  compliance_status: 'compliant' | 'non_compliant' | 'partial' | 'pending' | 'in_progress';
  compliance_score: number;
  last_evaluation_date: string;
  next_evaluation_date: string;
  evaluation_frequency: string;
  evidence_documents: string[];
  corrective_actions: any[];
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface BackupLog {
  id: string;
  tenant_id: string;
  backup_type: 'manual' | 'automatic' | 'scheduled';
  backup_scope: 'full' | 'incremental' | 'differential';
  backup_location: string;
  backup_size_mb: number;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  is_encrypted: boolean;
  encryption_algorithm: string;
  initiated_by: string;
  error_message: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface AuditReport {
  id: string;
  tenant_id: string;
  report_type: 'audit_complet' | 'connexions' | 'conformite' | 'risques';
  report_name: string;
  report_format: 'pdf' | 'excel' | 'csv';
  period_start: string;
  period_end: string;
  generated_by: string;
  generated_at: string;
  file_url: string;
  file_size_kb: number;
  status: 'generating' | 'generated' | 'sent' | 'failed';
  recipients: string[];
  scheduled: boolean;
  schedule_frequency: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface RegionalAuditParams {
  id: string;
  pays: string;
  libelle_pays: string;
  code_devise: string;
  referentiel_comptable: string;
  organisme_normalisation: string;
  duree_conservation_ans: number;
  exigences_obligatoires: string[];
  labels_interface: Record<string, string>;
  format_date: string;
  format_heure: string;
  timezone: string;
  exige_rgpd: boolean;
  exige_signature_electronique: boolean;
  mentions_legales: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  tenant_id: string;
  personnel_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  last_activity: string;
  expires_at: string;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface AuditMetrics {
  actionsToday: number;
  activeUsers: number;
  unresolvedAlerts: number;
  averageSecurityScore: number;
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useAuditSecurity(selectedTimeRange: TimeRange = '30d') {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getDateFromTimeRange = (timeRange: TimeRange): string => {
    const now = new Date();
    switch (timeRange) {
      case '24h': return subDays(now, 1).toISOString();
      case '7d': return subDays(now, 7).toISOString();
      case '30d': return subDays(now, 30).toISOString();
      case '90d': return subDays(now, 90).toISOString();
      case 'all': return new Date(0).toISOString();
      default: return subDays(now, 30).toISOString();
    }
  };

  // ============================================================================
  // QUERIES - AUDIT LOGS
  // ============================================================================

  const { data: auditLogs = [], isLoading: loadingAuditLogs } = useQuery({
    queryKey: ['audit-logs', tenantId, selectedTimeRange],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const startDate = getDateFromTimeRange(selectedTimeRange);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // QUERIES - SECURITY ALERTS
  // ============================================================================

  const { data: securityAlerts = [], isLoading: loadingSecurityAlerts } = useQuery({
    queryKey: ['security-alerts', tenantId, selectedTimeRange],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const startDate = getDateFromTimeRange(selectedTimeRange);
      
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SecurityAlert[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // QUERIES - SECURITY CONTROLS
  // ============================================================================

  const { data: securityControls = [], isLoading: loadingSecurityControls } = useQuery({
    queryKey: ['security-controls', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('security_controls')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('control_name');

      if (error) throw error;
      return data as SecurityControl[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // QUERIES - COMPLIANCE CHECKS
  // ============================================================================

  const { data: complianceChecks = [], isLoading: loadingComplianceChecks } = useQuery({
    queryKey: ['compliance-checks', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('requirement_name');

      if (error) throw error;
      return data as ComplianceCheck[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // QUERIES - BACKUP LOGS
  // ============================================================================

  const { data: backupLogs = [], isLoading: loadingBackupLogs } = useQuery({
    queryKey: ['backup-logs', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BackupLog[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // QUERIES - AUDIT REPORTS
  // ============================================================================

  const { data: auditReports = [], isLoading: loadingAuditReports } = useQuery({
    queryKey: ['audit-reports', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('generated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditReport[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // QUERIES - REGIONAL PARAMETERS
  // ============================================================================

  const { data: regionalParams = [], isLoading: loadingRegionalParams } = useQuery({
    queryKey: ['regional-audit-params'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametres_audit_regionaux')
        .select('*')
        .order('pays');

      if (error) throw error;
      return data as RegionalAuditParams[];
    },
  });

  // ============================================================================
  // QUERIES - USER SESSIONS
  // ============================================================================

  const { data: userSessions = [], isLoading: loadingUserSessions } = useQuery({
    queryKey: ['user-sessions', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data as UserSession[];
    },
    enabled: !!tenantId,
  });

  // ============================================================================
  // COMPUTED METRICS
  // ============================================================================

  const metrics: AuditMetrics = {
    actionsToday: auditLogs.filter(log => {
      const today = new Date().toISOString().split('T')[0];
      return log.created_at.startsWith(today);
    }).length,
    
    activeUsers: new Set(
      auditLogs
        .filter(log => {
          const today = new Date().toISOString().split('T')[0];
          return log.created_at.startsWith(today);
        })
        .map(log => log.personnel_id)
    ).size,
    
    unresolvedAlerts: securityAlerts.filter(alert => !alert.resolved).length,
    
    averageSecurityScore: securityControls.length > 0
      ? securityControls.reduce((sum, ctrl) => sum + ctrl.compliance_score, 0) / securityControls.length
      : 0,
  };

  // ============================================================================
  // MUTATIONS - RESOLVE ALERT
  // ============================================================================

  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, userId }: { alertId: string; userId: string }) => {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          status: 'resolved',
        })
        .eq('id', alertId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts', tenantId] });
      toast.success('Alerte résolue avec succès');
    },
    onError: (error) => {
      console.error('Error resolving alert:', error);
      toast.error('Erreur lors de la résolution de l\'alerte');
    },
  });

  // ============================================================================
  // MUTATIONS - UPDATE SECURITY CONTROL
  // ============================================================================

  const updateSecurityControlMutation = useMutation({
    mutationFn: async (control: Partial<SecurityControl> & { id: string }) => {
      const { error } = await supabase
        .from('security_controls')
        .update(control)
        .eq('id', control.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-controls', tenantId] });
      toast.success('Contrôle de sécurité mis à jour');
    },
    onError: (error) => {
      console.error('Error updating security control:', error);
      toast.error('Erreur lors de la mise à jour du contrôle');
    },
  });

  // ============================================================================
  // MUTATIONS - UPDATE COMPLIANCE CHECK
  // ============================================================================

  const updateComplianceCheckMutation = useMutation({
    mutationFn: async (check: Partial<ComplianceCheck> & { id: string }) => {
      const { error } = await supabase
        .from('compliance_checks')
        .update(check)
        .eq('id', check.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks', tenantId] });
      toast.success('Exigence de conformité mise à jour');
    },
    onError: (error) => {
      console.error('Error updating compliance check:', error);
      toast.error('Erreur lors de la mise à jour de l\'exigence');
    },
  });

  // ============================================================================
  // MUTATIONS - CREATE BACKUP
  // ============================================================================

  const createBackupMutation = useMutation({
    mutationFn: async ({ initiatedBy }: { initiatedBy: string }) => {
      const { data, error } = await supabase
        .from('backup_logs')
        .insert({
          tenant_id: tenantId,
          backup_type: 'manual',
          backup_scope: 'full',
          status: 'in_progress',
          is_encrypted: true,
          encryption_algorithm: 'AES-256',
          initiated_by: initiatedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-logs', tenantId] });
      toast.success('Sauvegarde lancée avec succès');
    },
    onError: (error) => {
      console.error('Error creating backup:', error);
      toast.error('Erreur lors du lancement de la sauvegarde');
    },
  });

  // ============================================================================
  // MUTATIONS - DISCONNECT SESSION
  // ============================================================================

  const disconnectSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          last_activity: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', tenantId] });
      toast.success('Session déconnectée avec succès');
    },
    onError: (error) => {
      console.error('Error disconnecting session:', error);
      toast.error('Erreur lors de la déconnexion de la session');
    },
  });

  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================

  const exportToCSV = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Données exportées avec succès');
  };

  const exportToPDF = (data: any[], columns: string[], filename: string) => {
    const doc = new jsPDF();
    const tableData = data.map(row => columns.map(col => row[col] || ''));
    
    (doc as any).autoTable({
      head: [columns],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
    });

    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Rapport PDF généré avec succès');
  };

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  const generateAuditReportMutation = useMutation({
    mutationFn: async ({
      reportType,
      reportName,
      reportFormat,
      periodStart,
      periodEnd,
      generatedBy,
      recipients,
    }: {
      reportType: 'audit_complet' | 'connexions' | 'conformite' | 'risques';
      reportName: string;
      reportFormat: 'pdf' | 'excel' | 'csv';
      periodStart: string;
      periodEnd: string;
      generatedBy: string;
      recipients?: string[];
    }) => {
      const { data, error } = await supabase
        .from('audit_reports')
        .insert({
          tenant_id: tenantId,
          report_type: reportType,
          report_name: reportName,
          report_format: reportFormat,
          period_start: periodStart,
          period_end: periodEnd,
          generated_by: generatedBy,
          status: 'generated',
          recipients: recipients || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-reports', tenantId] });
      toast.success('Rapport d\'audit généré avec succès');
    },
    onError: (error) => {
      console.error('Error generating audit report:', error);
      toast.error('Erreur lors de la génération du rapport');
    },
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    auditLogs,
    securityAlerts,
    securityControls,
    complianceChecks,
    backupLogs,
    auditReports,
    regionalParams,
    userSessions,
    metrics,

    // Loading states
    loadingAuditLogs,
    loadingSecurityAlerts,
    loadingSecurityControls,
    loadingComplianceChecks,
    loadingBackupLogs,
    loadingAuditReports,
    loadingRegionalParams,
    loadingUserSessions,

    // Mutations
    resolveAlert: resolveAlertMutation.mutateAsync,
    updateSecurityControl: updateSecurityControlMutation.mutateAsync,
    updateComplianceCheck: updateComplianceCheckMutation.mutateAsync,
    createBackup: createBackupMutation.mutateAsync,
    disconnectSession: disconnectSessionMutation.mutateAsync,
    generateAuditReport: generateAuditReportMutation.mutateAsync,

    // Export functions
    exportToCSV,
    exportToPDF,

    // Helper
    getDateFromTimeRange,
  };
}
