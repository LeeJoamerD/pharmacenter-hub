export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounting_currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_base_currency: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_base_currency?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_base_currency?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_default_accounts: {
        Row: {
          compte_credit_numero: string
          compte_debit_numero: string
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          is_active: boolean | null
          journal_code: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          compte_credit_numero: string
          compte_debit_numero: string
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          journal_code: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          compte_credit_numero?: string
          compte_debit_numero?: string
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          journal_code?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_default_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_default_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_exchange_rates: {
        Row: {
          auto_update_enabled: boolean
          created_at: string
          currency_id: string
          id: string
          rate: number
          rate_date: string
          tenant_id: string
          update_frequency: string
          updated_at: string
        }
        Insert: {
          auto_update_enabled?: boolean
          created_at?: string
          currency_id: string
          id?: string
          rate: number
          rate_date?: string
          tenant_id: string
          update_frequency?: string
          updated_at?: string
        }
        Update: {
          auto_update_enabled?: boolean
          created_at?: string
          currency_id?: string
          id?: string
          rate?: number
          rate_date?: string
          tenant_id?: string
          update_frequency?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_exchange_rates_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "accounting_currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_general_config: {
        Row: {
          auto_calcul_tva: boolean
          auto_lettrage: boolean
          controle_equilibre: boolean
          created_at: string
          decimal_places: number
          id: string
          periodicite_tva: string
          plan_comptable: string
          regime_tva: string
          saisie_analytique: boolean
          taux_tva_normal: number
          taux_tva_reduit: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_calcul_tva?: boolean
          auto_lettrage?: boolean
          controle_equilibre?: boolean
          created_at?: string
          decimal_places?: number
          id?: string
          periodicite_tva?: string
          plan_comptable?: string
          regime_tva?: string
          saisie_analytique?: boolean
          taux_tva_normal?: number
          taux_tva_reduit?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_calcul_tva?: boolean
          auto_lettrage?: boolean
          controle_equilibre?: boolean
          created_at?: string
          decimal_places?: number
          id?: string
          periodicite_tva?: string
          plan_comptable?: string
          regime_tva?: string
          saisie_analytique?: boolean
          taux_tva_normal?: number
          taux_tva_reduit?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_journals: {
        Row: {
          auto_generation: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          prefixe: string | null
          sequence_courante: number | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          auto_generation?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prefixe?: string | null
          sequence_courante?: number | null
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          auto_generation?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prefixe?: string | null
          sequence_courante?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_numbering_rules: {
        Row: {
          created_at: string
          current_number: number
          format_pattern: string
          id: string
          last_reset_date: string | null
          reset_frequency: string
          rule_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_number?: number
          format_pattern: string
          id?: string
          last_reset_date?: string | null
          reset_frequency?: string
          rule_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_number?: number
          format_pattern?: string
          id?: string
          last_reset_date?: string | null
          reset_frequency?: string
          rule_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_accounting_anomalies: {
        Row: {
          affected_accounts: string[] | null
          affected_entries: string[] | null
          anomaly_type: string
          correction_steps: Json | null
          created_at: string
          description: string
          detected_at: string
          detected_by: string | null
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          suggested_correction: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_accounts?: string[] | null
          affected_entries?: string[] | null
          anomaly_type: string
          correction_steps?: Json | null
          created_at?: string
          description: string
          detected_at?: string
          detected_by?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          suggested_correction?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_accounts?: string[] | null
          affected_entries?: string[] | null
          anomaly_type?: string
          correction_steps?: Json | null
          created_at?: string
          description?: string
          detected_at?: string
          detected_by?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          suggested_correction?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_accounting_anomalies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_accounting_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_accounting_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_accounting_consultations: {
        Row: {
          ai_response: string | null
          confidence: number | null
          consultation_type: string | null
          context_data: Json | null
          created_at: string
          created_by: string | null
          feedback: string | null
          id: string
          is_useful: boolean | null
          question: string
          related_accounts: string[] | null
          related_entries: string[] | null
          tenant_id: string
        }
        Insert: {
          ai_response?: string | null
          confidence?: number | null
          consultation_type?: string | null
          context_data?: Json | null
          created_at?: string
          created_by?: string | null
          feedback?: string | null
          id?: string
          is_useful?: boolean | null
          question: string
          related_accounts?: string[] | null
          related_entries?: string[] | null
          tenant_id: string
        }
        Update: {
          ai_response?: string | null
          confidence?: number | null
          consultation_type?: string | null
          context_data?: Json | null
          created_at?: string
          created_by?: string | null
          feedback?: string | null
          id?: string
          is_useful?: boolean | null
          question?: string
          related_accounts?: string[] | null
          related_entries?: string[] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_accounting_consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_accounting_consultations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_accounting_consultations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_accounting_expert_config: {
        Row: {
          accounting_system: string | null
          anomaly_detection_frequency: string | null
          auto_reconciliation: boolean | null
          created_at: string
          enable_auto_anomaly_detection: boolean | null
          enable_fiscal_reminders: boolean | null
          enable_tax_optimization_suggestions: boolean | null
          fiscal_year_start_month: number | null
          id: string
          min_anomaly_severity: string | null
          notification_settings: Json | null
          optimization_check_frequency: string | null
          reminder_days_before: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accounting_system?: string | null
          anomaly_detection_frequency?: string | null
          auto_reconciliation?: boolean | null
          created_at?: string
          enable_auto_anomaly_detection?: boolean | null
          enable_fiscal_reminders?: boolean | null
          enable_tax_optimization_suggestions?: boolean | null
          fiscal_year_start_month?: number | null
          id?: string
          min_anomaly_severity?: string | null
          notification_settings?: Json | null
          optimization_check_frequency?: string | null
          reminder_days_before?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accounting_system?: string | null
          anomaly_detection_frequency?: string | null
          auto_reconciliation?: boolean | null
          created_at?: string
          enable_auto_anomaly_detection?: boolean | null
          enable_fiscal_reminders?: boolean | null
          enable_tax_optimization_suggestions?: boolean | null
          fiscal_year_start_month?: number | null
          id?: string
          min_anomaly_severity?: string | null
          notification_settings?: Json | null
          optimization_check_frequency?: string | null
          reminder_days_before?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_accounting_expert_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_accounting_expert_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_anomalies: {
        Row: {
          confidence: number
          created_at: string | null
          description: string
          detected_at: string | null
          diagnostic_session_id: string | null
          id: string
          impact: string
          investigated_at: string | null
          investigated_by: string | null
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          suggestions: Json | null
          tenant_id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          confidence?: number
          created_at?: string | null
          description: string
          detected_at?: string | null
          diagnostic_session_id?: string | null
          id?: string
          impact?: string
          investigated_at?: string | null
          investigated_by?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggestions?: Json | null
          tenant_id: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          description?: string
          detected_at?: string | null
          diagnostic_session_id?: string | null
          id?: string
          impact?: string
          investigated_at?: string | null
          investigated_by?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggestions?: Json | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_anomalies_diagnostic_session_id_fkey"
            columns: ["diagnostic_session_id"]
            isOneToOne: false
            referencedRelation: "ai_diagnostic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_anomalies_investigated_by_fkey"
            columns: ["investigated_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_anomalies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_automation_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          execution_log: Json | null
          id: string
          result: Json | null
          started_at: string | null
          status: string
          tenant_id: string
          trigger_context: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          tenant_id: string
          trigger_context?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          trigger_context?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_automation_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_automation_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_automation_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_automation_templates: {
        Row: {
          actions: Json | null
          category: string
          conditions: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          tenant_id: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          category?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          tenant_id: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          category?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          tenant_id?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_automation_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_automation_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_automation_workflows: {
        Row: {
          actions: Json | null
          avg_execution_time_ms: number | null
          category: string
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_execution_at: string | null
          name: string
          next_execution_at: string | null
          priority: number | null
          schedule_config: Json | null
          success_count: number | null
          template_id: string | null
          tenant_id: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          avg_execution_time_ms?: number | null
          category?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_execution_at?: string | null
          name: string
          next_execution_at?: string | null
          priority?: number | null
          schedule_config?: Json | null
          success_count?: number | null
          template_id?: string | null
          tenant_id: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          avg_execution_time_ms?: number | null
          category?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_execution_at?: string | null
          name?: string
          next_execution_at?: string | null
          priority?: number | null
          schedule_config?: Json | null
          success_count?: number | null
          template_id?: string | null
          tenant_id?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_automation_workflows_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_automation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_automation_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_automation_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_batch_recognitions: {
        Row: {
          accuracy: number | null
          batch_name: string
          completed_at: string | null
          duplicates_count: number | null
          failed_count: number | null
          id: string
          items: Json | null
          new_products_count: number | null
          processing_time_ms: number | null
          recognized_count: number | null
          started_at: string
          started_by: string | null
          status: string | null
          tenant_id: string
          total_items: number | null
        }
        Insert: {
          accuracy?: number | null
          batch_name: string
          completed_at?: string | null
          duplicates_count?: number | null
          failed_count?: number | null
          id?: string
          items?: Json | null
          new_products_count?: number | null
          processing_time_ms?: number | null
          recognized_count?: number | null
          started_at?: string
          started_by?: string | null
          status?: string | null
          tenant_id: string
          total_items?: number | null
        }
        Update: {
          accuracy?: number | null
          batch_name?: string
          completed_at?: string | null
          duplicates_count?: number | null
          failed_count?: number | null
          id?: string
          items?: Json | null
          new_products_count?: number | null
          processing_time_ms?: number | null
          recognized_count?: number | null
          started_at?: string
          started_by?: string | null
          status?: string | null
          tenant_id?: string
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_batch_recognitions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_batch_recognitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_batch_recognitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bi_config: {
        Row: {
          analysis_frequency: string | null
          auto_analysis_enabled: boolean | null
          created_at: string
          data_retention_days: number | null
          enable_auto_segmentation: boolean | null
          enable_pattern_discovery: boolean | null
          id: string
          model_preferences: Json | null
          notification_thresholds: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          analysis_frequency?: string | null
          auto_analysis_enabled?: boolean | null
          created_at?: string
          data_retention_days?: number | null
          enable_auto_segmentation?: boolean | null
          enable_pattern_discovery?: boolean | null
          id?: string
          model_preferences?: Json | null
          notification_thresholds?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          analysis_frequency?: string | null
          auto_analysis_enabled?: boolean | null
          created_at?: string
          data_retention_days?: number | null
          enable_auto_segmentation?: boolean | null
          enable_pattern_discovery?: boolean | null
          id?: string
          model_preferences?: Json | null
          notification_thresholds?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_bi_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bi_patterns: {
        Row: {
          confidence: number | null
          created_at: string
          data_source: Json | null
          description: string | null
          discovery_method: string | null
          expires_at: string | null
          exploited_at: string | null
          exploited_by: string | null
          frequency: string | null
          id: string
          impact: string | null
          is_actionable: boolean | null
          is_exploited: boolean | null
          pattern_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          data_source?: Json | null
          description?: string | null
          discovery_method?: string | null
          expires_at?: string | null
          exploited_at?: string | null
          exploited_by?: string | null
          frequency?: string | null
          id?: string
          impact?: string | null
          is_actionable?: boolean | null
          is_exploited?: boolean | null
          pattern_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          data_source?: Json | null
          description?: string | null
          discovery_method?: string | null
          expires_at?: string | null
          exploited_at?: string | null
          exploited_by?: string | null
          frequency?: string | null
          id?: string
          impact?: string | null
          is_actionable?: boolean | null
          is_exploited?: boolean | null
          pattern_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_bi_patterns_exploited_by_fkey"
            columns: ["exploited_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_patterns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_patterns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bi_predictions: {
        Row: {
          applied_at: string | null
          client_id: string | null
          confidence: number | null
          created_at: string
          factors: Json | null
          id: string
          is_applied: boolean | null
          model_version: string | null
          predicted_value: number | null
          prediction_type: string
          risk_level: string | null
          segment: string | null
          tenant_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          applied_at?: string | null
          client_id?: string | null
          confidence?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          is_applied?: boolean | null
          model_version?: string | null
          predicted_value?: number | null
          prediction_type: string
          risk_level?: string | null
          segment?: string | null
          tenant_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          applied_at?: string | null
          client_id?: string | null
          confidence?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          is_applied?: boolean | null
          model_version?: string | null
          predicted_value?: number | null
          prediction_type?: string
          risk_level?: string | null
          segment?: string | null
          tenant_id?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bi_predictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_predictions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_predictions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bi_process_optimizations: {
        Row: {
          created_at: string
          current_time_minutes: number | null
          difficulty: string | null
          id: string
          implementation_notes: string | null
          implemented_at: string | null
          implemented_by: string | null
          improvement_percentage: number | null
          optimized_time_minutes: number | null
          process_name: string
          roi: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_time_minutes?: number | null
          difficulty?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          implemented_by?: string | null
          improvement_percentage?: number | null
          optimized_time_minutes?: number | null
          process_name: string
          roi?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_time_minutes?: number | null
          difficulty?: string | null
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          implemented_by?: string | null
          improvement_percentage?: number | null
          optimized_time_minutes?: number | null
          process_name?: string
          roi?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_bi_process_optimizations_implemented_by_fkey"
            columns: ["implemented_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_process_optimizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_process_optimizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bi_segments: {
        Row: {
          characteristics: Json | null
          clv: number | null
          color: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_auto_generated: boolean | null
          next_action: string | null
          segment_name: string
          size: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          characteristics?: Json | null
          clv?: number | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_auto_generated?: boolean | null
          next_action?: string | null
          segment_name: string
          size?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          characteristics?: Json | null
          clv?: number | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_auto_generated?: boolean | null
          next_action?: string | null
          segment_name?: string
          size?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_bi_segments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bi_segments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bottlenecks: {
        Row: {
          action_plan: string | null
          action_planned_at: string | null
          action_planned_by: string | null
          area: string
          created_at: string | null
          description: string
          diagnostic_session_id: string | null
          id: string
          impact: string
          priority: number | null
          recommended_solution: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          action_plan?: string | null
          action_planned_at?: string | null
          action_planned_by?: string | null
          area: string
          created_at?: string | null
          description: string
          diagnostic_session_id?: string | null
          id?: string
          impact: string
          priority?: number | null
          recommended_solution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          action_plan?: string | null
          action_planned_at?: string | null
          action_planned_by?: string | null
          area?: string
          created_at?: string | null
          description?: string
          diagnostic_session_id?: string | null
          id?: string
          impact?: string
          priority?: number | null
          recommended_solution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bottlenecks_action_planned_by_fkey"
            columns: ["action_planned_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bottlenecks_diagnostic_session_id_fkey"
            columns: ["diagnostic_session_id"]
            isOneToOne: false
            referencedRelation: "ai_diagnostic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bottlenecks_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bottlenecks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bottlenecks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_configurations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string | null
          provider: string | null
          settings: Json | null
          temperature: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          provider?: string | null
          settings?: Json | null
          temperature?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string | null
          provider?: string | null
          settings?: Json | null
          temperature?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_conversation_messages: {
        Row: {
          confidence: number | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          sender_name: string | null
          sender_pharmacy_id: string | null
          suggestions: Json | null
          tenant_id: string
        }
        Insert: {
          confidence?: number | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          sender_name?: string | null
          sender_pharmacy_id?: string | null
          suggestions?: Json | null
          tenant_id: string
        }
        Update: {
          confidence?: number | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          sender_name?: string | null
          sender_pharmacy_id?: string | null
          suggestions?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_messages_sender_pharmacy_id_fkey"
            columns: ["sender_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_messages_sender_pharmacy_id_fkey"
            columns: ["sender_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          ai_model_id: string | null
          context: string | null
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          participants: Json | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_model_id?: string | null
          context?: string | null
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          participants?: Json | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_model_id?: string | null
          context?: string | null
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          participants?: Json | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_data_sources: {
        Row: {
          created_at: string
          created_by: string | null
          data_size_mb: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_encrypted: boolean | null
          last_sync_at: string | null
          next_sync_at: string | null
          records_count: number | null
          retention_days: number | null
          source_config: Json | null
          source_name: string
          source_type: string
          sync_error_message: string | null
          sync_frequency: string | null
          sync_status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_size_mb?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          records_count?: number | null
          retention_days?: number | null
          source_config?: Json | null
          source_name: string
          source_type?: string
          sync_error_message?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_size_mb?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          records_count?: number | null
          retention_days?: number | null
          source_config?: Json | null
          source_name?: string
          source_type?: string
          sync_error_message?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_data_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_data_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_data_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_diagnostic_sessions: {
        Row: {
          ai_model_used: string | null
          attention_points: Json | null
          created_at: string | null
          created_by: string | null
          customer_details: string | null
          customer_score: number | null
          customer_status: string | null
          customer_trend: string | null
          duration_ms: number | null
          global_score: number
          id: string
          improvement_potential: number | null
          margin_details: string | null
          margin_score: number | null
          margin_status: string | null
          margin_trend: string | null
          positive_trends: Json | null
          sales_details: string | null
          sales_score: number | null
          sales_status: string | null
          sales_trend: string | null
          status_level: string | null
          stock_details: string | null
          stock_score: number | null
          stock_status: string | null
          stock_trend: string | null
          tenant_id: string
        }
        Insert: {
          ai_model_used?: string | null
          attention_points?: Json | null
          created_at?: string | null
          created_by?: string | null
          customer_details?: string | null
          customer_score?: number | null
          customer_status?: string | null
          customer_trend?: string | null
          duration_ms?: number | null
          global_score?: number
          id?: string
          improvement_potential?: number | null
          margin_details?: string | null
          margin_score?: number | null
          margin_status?: string | null
          margin_trend?: string | null
          positive_trends?: Json | null
          sales_details?: string | null
          sales_score?: number | null
          sales_status?: string | null
          sales_trend?: string | null
          status_level?: string | null
          stock_details?: string | null
          stock_score?: number | null
          stock_status?: string | null
          stock_trend?: string | null
          tenant_id: string
        }
        Update: {
          ai_model_used?: string | null
          attention_points?: Json | null
          created_at?: string | null
          created_by?: string | null
          customer_details?: string | null
          customer_score?: number | null
          customer_status?: string | null
          customer_trend?: string | null
          duration_ms?: number | null
          global_score?: number
          id?: string
          improvement_potential?: number | null
          margin_details?: string | null
          margin_score?: number | null
          margin_status?: string | null
          margin_trend?: string | null
          positive_trends?: Json | null
          sales_details?: string | null
          sales_score?: number | null
          sales_status?: string | null
          sales_trend?: string | null
          status_level?: string | null
          stock_details?: string | null
          stock_score?: number | null
          stock_status?: string | null
          stock_trend?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_diagnostic_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_diagnostic_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_diagnostic_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_forecast_models: {
        Row: {
          accuracy: number | null
          best_for: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_used_at: string | null
          model_code: string
          parameters: Json | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          accuracy?: number | null
          best_for?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          model_code: string
          parameters?: Json | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          accuracy?: number | null
          best_for?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          model_code?: string
          parameters?: Json | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_forecast_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_forecast_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          forecast_data: Json
          forecast_type: string
          id: string
          model_used: string
          period_days: number | null
          status: string | null
          summary_metrics: Json | null
          tenant_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          forecast_data?: Json
          forecast_type: string
          id?: string
          model_used?: string
          period_days?: number | null
          status?: string | null
          summary_metrics?: Json | null
          tenant_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          forecast_data?: Json
          forecast_type?: string
          id?: string
          model_used?: string
          period_days?: number | null
          status?: string | null
          summary_metrics?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_forecasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_forecasts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_forecasts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_influential_factors: {
        Row: {
          created_at: string | null
          data_source: string | null
          description: string | null
          factor_name: string
          id: string
          influence_score: number | null
          is_active: boolean | null
          metadata: Json | null
          tenant_id: string
          trend_type: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          factor_name: string
          id?: string
          influence_score?: number | null
          is_active?: boolean | null
          metadata?: Json | null
          tenant_id: string
          trend_type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          factor_name?: string
          id?: string
          influence_score?: number | null
          is_active?: boolean | null
          metadata?: Json | null
          tenant_id?: string
          trend_type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_influential_factors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_influential_factors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          confidence: number | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          impact: string
          is_applied: boolean | null
          is_read: boolean | null
          metadata: Json | null
          pharmacies_affected: Json | null
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          impact?: string
          is_applied?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          pharmacies_affected?: Json | null
          tenant_id: string
          title: string
          type: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          impact?: string
          is_applied?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          pharmacies_affected?: Json | null
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_feedback: {
        Row: {
          accuracy_after: number | null
          accuracy_before: number | null
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          impact_analysis: Json | null
          impact_applied: boolean | null
          impact_applied_at: string | null
          metadata: Json | null
          model_id: string | null
          model_name: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          accuracy_after?: number | null
          accuracy_before?: number | null
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          impact_analysis?: Json | null
          impact_applied?: boolean | null
          impact_applied_at?: string | null
          metadata?: Json | null
          model_id?: string | null
          model_name?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          accuracy_after?: number | null
          accuracy_before?: number | null
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          impact_analysis?: Json | null
          impact_applied?: boolean | null
          impact_applied_at?: string | null
          metadata?: Json | null
          model_id?: string | null
          model_name?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_feedback_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_models: {
        Row: {
          accuracy: number | null
          config: Json | null
          created_at: string
          created_by: string | null
          current_epoch: number | null
          data_points: number | null
          description: string | null
          epochs: number | null
          hyperparameters: Json | null
          id: string
          is_active: boolean | null
          last_training_at: string | null
          model_type: string
          name: string
          next_training_at: string | null
          progress: number | null
          status: string
          tenant_id: string
          training_frequency: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          accuracy?: number | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          current_epoch?: number | null
          data_points?: number | null
          description?: string | null
          epochs?: number | null
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean | null
          last_training_at?: string | null
          model_type?: string
          name: string
          next_training_at?: string | null
          progress?: number | null
          status?: string
          tenant_id: string
          training_frequency?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          accuracy?: number | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          current_epoch?: number | null
          data_points?: number | null
          description?: string | null
          epochs?: number | null
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean | null
          last_training_at?: string | null
          model_type?: string
          name?: string
          next_training_at?: string | null
          progress?: number | null
          status?: string
          tenant_id?: string
          training_frequency?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          accuracy: number | null
          capabilities: Json | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          is_system: boolean | null
          max_tokens: number | null
          model_identifier: string
          name: string
          provider: string
          specialization: string | null
          status: string
          system_prompt: string | null
          temperature: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          capabilities?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          max_tokens?: number | null
          model_identifier?: string
          name: string
          provider?: string
          specialization?: string | null
          status?: string
          system_prompt?: string | null
          temperature?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          capabilities?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          max_tokens?: number | null
          model_identifier?: string
          name?: string
          provider?: string
          specialization?: string | null
          status?: string
          system_prompt?: string | null
          temperature?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pharma_compliance_checks: {
        Row: {
          audit_notes: string | null
          category: string
          created_at: string
          id: string
          issues_count: number | null
          issues_details: Json | null
          items_count: number | null
          last_check_at: string | null
          last_check_by: string | null
          next_audit_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audit_notes?: string | null
          category: string
          created_at?: string
          id?: string
          issues_count?: number | null
          issues_details?: Json | null
          items_count?: number | null
          last_check_at?: string | null
          last_check_by?: string | null
          next_audit_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audit_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          issues_count?: number | null
          issues_details?: Json | null
          items_count?: number | null
          last_check_at?: string | null
          last_check_by?: string | null
          next_audit_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_pharma_compliance_checks_last_check_by_fkey"
            columns: ["last_check_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pharma_compliance_checks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pharma_compliance_checks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pharma_consultations: {
        Row: {
          ai_response: string | null
          confidence: number | null
          consultation_type: string | null
          created_at: string
          created_by: string | null
          feedback: string | null
          id: string
          is_useful: boolean | null
          question: string
          related_drugs: string[] | null
          tenant_id: string
        }
        Insert: {
          ai_response?: string | null
          confidence?: number | null
          consultation_type?: string | null
          created_at?: string
          created_by?: string | null
          feedback?: string | null
          id?: string
          is_useful?: boolean | null
          question: string
          related_drugs?: string[] | null
          tenant_id: string
        }
        Update: {
          ai_response?: string | null
          confidence?: number | null
          consultation_type?: string | null
          created_at?: string
          created_by?: string | null
          feedback?: string | null
          id?: string
          is_useful?: boolean | null
          question?: string
          related_drugs?: string[] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_pharma_consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pharma_consultations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pharma_consultations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pharma_expert_config: {
        Row: {
          auto_interaction_check: boolean | null
          compliance_check_frequency: string | null
          created_at: string
          enable_ai_consultation: boolean | null
          enable_compliance_alerts: boolean | null
          id: string
          interaction_alert_level: string | null
          pharmacovigilance_sources: string[] | null
          tenant_id: string
          therapeutic_guidelines_version: string | null
          updated_at: string
        }
        Insert: {
          auto_interaction_check?: boolean | null
          compliance_check_frequency?: string | null
          created_at?: string
          enable_ai_consultation?: boolean | null
          enable_compliance_alerts?: boolean | null
          id?: string
          interaction_alert_level?: string | null
          pharmacovigilance_sources?: string[] | null
          tenant_id: string
          therapeutic_guidelines_version?: string | null
          updated_at?: string
        }
        Update: {
          auto_interaction_check?: boolean | null
          compliance_check_frequency?: string | null
          created_at?: string
          enable_ai_consultation?: boolean | null
          enable_compliance_alerts?: boolean | null
          id?: string
          interaction_alert_level?: string | null
          pharmacovigilance_sources?: string[] | null
          tenant_id?: string
          therapeutic_guidelines_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_pharma_expert_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pharma_expert_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_provider_connections: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          avg_latency_ms: number | null
          config: Json | null
          created_at: string
          error_message: string | null
          failed_calls: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_connection_at: string | null
          max_tokens: number | null
          model_name: string | null
          provider_name: string
          provider_type: string
          status: string | null
          success_calls: number | null
          temperature: number | null
          tenant_id: string
          total_calls: number | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          avg_latency_ms?: number | null
          config?: Json | null
          created_at?: string
          error_message?: string | null
          failed_calls?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_connection_at?: string | null
          max_tokens?: number | null
          model_name?: string | null
          provider_name: string
          provider_type?: string
          status?: string | null
          success_calls?: number | null
          temperature?: number | null
          tenant_id: string
          total_calls?: number | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          avg_latency_ms?: number | null
          config?: Json | null
          created_at?: string
          error_message?: string | null
          failed_calls?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_connection_at?: string | null
          max_tokens?: number | null
          model_name?: string | null
          provider_name?: string
          provider_type?: string
          status?: string | null
          success_calls?: number | null
          temperature?: number | null
          tenant_id?: string
          total_calls?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_provider_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_provider_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quality_controls: {
        Row: {
          accuracy: number | null
          alerts_generated: number | null
          checked_at: string
          checked_by: string | null
          checked_items: number | null
          control_type: string
          details: Json | null
          id: string
          image_url: string | null
          lot_id: string | null
          product_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          accuracy?: number | null
          alerts_generated?: number | null
          checked_at?: string
          checked_by?: string | null
          checked_items?: number | null
          control_type: string
          details?: Json | null
          id?: string
          image_url?: string | null
          lot_id?: string | null
          product_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          accuracy?: number | null
          alerts_generated?: number | null
          checked_at?: string
          checked_by?: string | null
          checked_items?: number | null
          control_type?: string
          details?: Json | null
          id?: string
          image_url?: string | null
          lot_id?: string | null
          product_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_quality_controls_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_controls_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_controls_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_controls_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_controls_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_controls_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "ai_quality_controls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_controls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sentiment_analyses: {
        Row: {
          analysis_metadata: Json | null
          category: string | null
          client_id: string | null
          created_at: string
          emotions: Json | null
          id: string
          keywords: Json | null
          score: number
          sentiment: string
          source: string | null
          tenant_id: string
          text: string
          updated_at: string
        }
        Insert: {
          analysis_metadata?: Json | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          emotions?: Json | null
          id?: string
          keywords?: Json | null
          score: number
          sentiment: string
          source?: string | null
          tenant_id: string
          text: string
          updated_at?: string
        }
        Update: {
          analysis_metadata?: Json | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          emotions?: Json | null
          id?: string
          keywords?: Json | null
          score?: number
          sentiment?: string
          source?: string | null
          tenant_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sentiment_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sentiment_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sentiment_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sentiment_keywords: {
        Row: {
          created_at: string
          frequency: number | null
          id: string
          impact: string | null
          last_detected_at: string | null
          sentiment: string
          tenant_id: string
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          frequency?: number | null
          id?: string
          impact?: string | null
          last_detected_at?: string | null
          sentiment: string
          tenant_id: string
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          frequency?: number | null
          id?: string
          impact?: string | null
          last_detected_at?: string | null
          sentiment?: string
          tenant_id?: string
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sentiment_keywords_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sentiment_keywords_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sentiment_settings: {
        Row: {
          auto_analysis_enabled: boolean | null
          categories: Json | null
          created_at: string
          default_model: string | null
          id: string
          notification_threshold: number | null
          retention_days: number | null
          sources: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_analysis_enabled?: boolean | null
          categories?: Json | null
          created_at?: string
          default_model?: string | null
          id?: string
          notification_threshold?: number | null
          retention_days?: number | null
          sources?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_analysis_enabled?: boolean | null
          categories?: Json | null
          created_at?: string
          default_model?: string | null
          id?: string
          notification_threshold?: number | null
          retention_days?: number | null
          sources?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sentiment_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sentiment_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_shelf_analyses: {
        Row: {
          compliance_score: number | null
          id: string
          image_url: string | null
          issues: Json | null
          misplacements_detected: number | null
          rayon_id: string | null
          scanned_at: string
          scanned_by: string | null
          shelf_location: string | null
          shelf_name: string
          stockouts_detected: number | null
          tenant_id: string
          total_products: number | null
        }
        Insert: {
          compliance_score?: number | null
          id?: string
          image_url?: string | null
          issues?: Json | null
          misplacements_detected?: number | null
          rayon_id?: string | null
          scanned_at?: string
          scanned_by?: string | null
          shelf_location?: string | null
          shelf_name: string
          stockouts_detected?: number | null
          tenant_id: string
          total_products?: number | null
        }
        Update: {
          compliance_score?: number | null
          id?: string
          image_url?: string | null
          issues?: Json | null
          misplacements_detected?: number | null
          rayon_id?: string | null
          scanned_at?: string
          scanned_by?: string | null
          shelf_location?: string | null
          shelf_name?: string
          stockouts_detected?: number | null
          tenant_id?: string
          total_products?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_shelf_analyses_rayon_id_fkey"
            columns: ["rayon_id"]
            isOneToOne: false
            referencedRelation: "rayons_produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_shelf_analyses_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_shelf_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_shelf_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_stock_optimization_config: {
        Row: {
          auto_optimization_enabled: boolean | null
          confidence_threshold: number | null
          created_at: string | null
          critical_alert_days: number | null
          enable_fifo_alerts: boolean | null
          enable_rotation_analysis: boolean | null
          id: string
          notification_settings: Json | null
          prediction_horizon_days: number | null
          promotion_expiry_threshold_days: number | null
          reorder_lead_time_days: number | null
          safety_stock_multiplier: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_optimization_enabled?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          critical_alert_days?: number | null
          enable_fifo_alerts?: boolean | null
          enable_rotation_analysis?: boolean | null
          id?: string
          notification_settings?: Json | null
          prediction_horizon_days?: number | null
          promotion_expiry_threshold_days?: number | null
          reorder_lead_time_days?: number | null
          safety_stock_multiplier?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_optimization_enabled?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          critical_alert_days?: number | null
          enable_fifo_alerts?: boolean | null
          enable_rotation_analysis?: boolean | null
          id?: string
          notification_settings?: Json | null
          prediction_horizon_days?: number | null
          promotion_expiry_threshold_days?: number | null
          reorder_lead_time_days?: number | null
          safety_stock_multiplier?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_stock_optimization_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_optimization_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_stock_predictions: {
        Row: {
          confidence: number | null
          created_at: string | null
          current_stock: number
          days_until_stockout: number | null
          dismissed: boolean | null
          forecast_id: string | null
          id: string
          lot_id: string | null
          order_created: boolean | null
          order_id: string | null
          predicted_demand_daily: number | null
          priority: string | null
          product_code: string | null
          product_name: string | null
          produit_id: string | null
          recommended_order_qty: number | null
          tenant_id: string
          trend: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          current_stock?: number
          days_until_stockout?: number | null
          dismissed?: boolean | null
          forecast_id?: string | null
          id?: string
          lot_id?: string | null
          order_created?: boolean | null
          order_id?: string | null
          predicted_demand_daily?: number | null
          priority?: string | null
          product_code?: string | null
          product_name?: string | null
          produit_id?: string | null
          recommended_order_qty?: number | null
          tenant_id: string
          trend?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          current_stock?: number
          days_until_stockout?: number | null
          dismissed?: boolean | null
          forecast_id?: string | null
          id?: string
          lot_id?: string | null
          order_created?: boolean | null
          order_id?: string | null
          predicted_demand_daily?: number | null
          priority?: string | null
          product_code?: string | null
          product_name?: string | null
          produit_id?: string | null
          recommended_order_qty?: number | null
          tenant_id?: string
          trend?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_stock_predictions_forecast_id_fkey"
            columns: ["forecast_id"]
            isOneToOne: false
            referencedRelation: "ai_forecasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_stock_predictions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_strategic_recommendations: {
        Row: {
          actions: Json | null
          ai_model_used: string | null
          category: string
          confidence: number
          created_at: string | null
          description: string
          effort: string | null
          estimated_roi: string | null
          expires_at: string | null
          factors: Json | null
          generated_by: string | null
          id: string
          impact: string
          implemented_at: string | null
          implemented_by: string | null
          metadata: Json | null
          priority: number
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          scheduled_date: string | null
          status: string | null
          tenant_id: string
          timeframe: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          ai_model_used?: string | null
          category: string
          confidence?: number
          created_at?: string | null
          description: string
          effort?: string | null
          estimated_roi?: string | null
          expires_at?: string | null
          factors?: Json | null
          generated_by?: string | null
          id?: string
          impact?: string
          implemented_at?: string | null
          implemented_by?: string | null
          metadata?: Json | null
          priority?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          status?: string | null
          tenant_id: string
          timeframe?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          ai_model_used?: string | null
          category?: string
          confidence?: number
          created_at?: string | null
          description?: string
          effort?: string | null
          estimated_roi?: string | null
          expires_at?: string | null
          factors?: Json | null
          generated_by?: string | null
          id?: string
          impact?: string
          implemented_at?: string | null
          implemented_by?: string | null
          metadata?: Json | null
          priority?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          status?: string | null
          tenant_id?: string
          timeframe?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_strategic_recommendations_implemented_by_fkey"
            columns: ["implemented_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_strategic_recommendations_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_strategic_recommendations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_strategic_recommendations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tax_optimizations: {
        Row: {
          ai_model_used: string | null
          applicable_period: string | null
          category: string
          confidence: number | null
          created_at: string
          deadline: string | null
          description: string
          estimated_savings: number | null
          id: string
          implementation_steps: Json | null
          implemented_at: string | null
          implemented_by: string | null
          legal_references: string[] | null
          metadata: Json | null
          optimization_type: string
          priority: number | null
          rejected_reason: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_model_used?: string | null
          applicable_period?: string | null
          category?: string
          confidence?: number | null
          created_at?: string
          deadline?: string | null
          description: string
          estimated_savings?: number | null
          id?: string
          implementation_steps?: Json | null
          implemented_at?: string | null
          implemented_by?: string | null
          legal_references?: string[] | null
          metadata?: Json | null
          optimization_type: string
          priority?: number | null
          rejected_reason?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_model_used?: string | null
          applicable_period?: string | null
          category?: string
          confidence?: number | null
          created_at?: string
          deadline?: string | null
          description?: string
          estimated_savings?: number | null
          id?: string
          implementation_steps?: Json | null
          implemented_at?: string | null
          implemented_by?: string | null
          legal_references?: string[] | null
          metadata?: Json | null
          optimization_type?: string
          priority?: number | null
          rejected_reason?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tax_optimizations_implemented_by_fkey"
            columns: ["implemented_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tax_optimizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tax_optimizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          prompt_template: string
          tenant_id: string
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          prompt_template: string
          tenant_id: string
          type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          prompt_template?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_therapeutic_recommendations: {
        Row: {
          alternative_treatments: Json | null
          condition_category: string | null
          condition_name: string
          contraindications: string | null
          created_at: string
          created_by: string | null
          duration: string | null
          evidence_level: string | null
          first_line_treatments: Json | null
          id: string
          is_active: boolean | null
          monitoring: string | null
          source_guidelines: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alternative_treatments?: Json | null
          condition_category?: string | null
          condition_name: string
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          duration?: string | null
          evidence_level?: string | null
          first_line_treatments?: Json | null
          id?: string
          is_active?: boolean | null
          monitoring?: string | null
          source_guidelines?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alternative_treatments?: Json | null
          condition_category?: string | null
          condition_name?: string
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          duration?: string | null
          evidence_level?: string | null
          first_line_treatments?: Json | null
          id?: string
          is_active?: boolean | null
          monitoring?: string | null
          source_guidelines?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_therapeutic_recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_therapeutic_recommendations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_therapeutic_recommendations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_datasets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_encrypted: boolean | null
          last_sync_at: string | null
          name: string
          next_sync_at: string | null
          quality_score: number | null
          records_count: number | null
          retention_days: number | null
          source_config: Json | null
          source_name: string | null
          source_type: string | null
          sync_error_message: string | null
          sync_frequency: string | null
          sync_status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          last_sync_at?: string | null
          name: string
          next_sync_at?: string | null
          quality_score?: number | null
          records_count?: number | null
          retention_days?: number | null
          source_config?: Json | null
          source_name?: string | null
          source_type?: string | null
          sync_error_message?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_encrypted?: boolean | null
          last_sync_at?: string | null
          name?: string
          next_sync_at?: string | null
          quality_score?: number | null
          records_count?: number | null
          retention_days?: number | null
          source_config?: Json | null
          source_name?: string | null
          source_type?: string | null
          sync_error_message?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_datasets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_datasets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_datasets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_sessions: {
        Row: {
          accuracy_gain: number | null
          completed_at: string | null
          created_at: string
          data_points_used: number | null
          epochs_completed: number | null
          epochs_total: number | null
          error_message: string | null
          final_accuracy: number | null
          hyperparameters_used: Json | null
          id: string
          initial_accuracy: number | null
          logs: Json | null
          metrics: Json | null
          model_id: string
          started_at: string | null
          started_by: string | null
          status: string
          tenant_id: string
          training_time_seconds: number | null
          updated_at: string
        }
        Insert: {
          accuracy_gain?: number | null
          completed_at?: string | null
          created_at?: string
          data_points_used?: number | null
          epochs_completed?: number | null
          epochs_total?: number | null
          error_message?: string | null
          final_accuracy?: number | null
          hyperparameters_used?: Json | null
          id?: string
          initial_accuracy?: number | null
          logs?: Json | null
          metrics?: Json | null
          model_id: string
          started_at?: string | null
          started_by?: string | null
          status?: string
          tenant_id: string
          training_time_seconds?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_gain?: number | null
          completed_at?: string | null
          created_at?: string
          data_points_used?: number | null
          epochs_completed?: number | null
          epochs_total?: number | null
          error_message?: string | null
          final_accuracy?: number | null
          hyperparameters_used?: Json | null
          id?: string
          initial_accuracy?: number | null
          logs?: Json | null
          metrics?: Json | null
          model_id?: string
          started_at?: string | null
          started_by?: string | null
          status?: string
          tenant_id?: string
          training_time_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_sessions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_learning_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_vision_config: {
        Row: {
          auto_detection_enabled: boolean | null
          created_at: string
          enable_shelf_monitoring: boolean | null
          id: string
          min_confidence_threshold: number | null
          notification_settings: Json | null
          quality_control_types: Json | null
          save_processed_images: boolean | null
          shelf_scan_interval_hours: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_detection_enabled?: boolean | null
          created_at?: string
          enable_shelf_monitoring?: boolean | null
          id?: string
          min_confidence_threshold?: number | null
          notification_settings?: Json | null
          quality_control_types?: Json | null
          save_processed_images?: boolean | null
          shelf_scan_interval_hours?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_detection_enabled?: boolean | null
          created_at?: string
          enable_shelf_monitoring?: boolean | null
          id?: string
          min_confidence_threshold?: number | null
          notification_settings?: Json | null
          quality_control_types?: Json | null
          save_processed_images?: boolean | null
          shelf_scan_interval_hours?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_vision_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_vision_detections: {
        Row: {
          confidence: number
          created_at: string
          detected_barcode: string | null
          detected_expiry_date: string | null
          detected_name: string
          detected_price: number | null
          detected_stock: number | null
          id: string
          image_url: string | null
          metadata: Json | null
          packaging_status: string | null
          processing_time_ms: number | null
          product_id: string | null
          status: string | null
          tenant_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence: number
          created_at?: string
          detected_barcode?: string | null
          detected_expiry_date?: string | null
          detected_name: string
          detected_price?: number | null
          detected_stock?: number | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          packaging_status?: string | null
          processing_time_ms?: number | null
          product_id?: string | null
          status?: string | null
          tenant_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          detected_barcode?: string | null
          detected_expiry_date?: string | null
          detected_name?: string
          detected_price?: number | null
          detected_stock?: number | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          packaging_status?: string | null
          processing_time_ms?: number | null
          product_id?: string | null
          status?: string | null
          tenant_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_vision_detections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_detections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_detections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_detections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "ai_vision_detections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_detections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vision_detections_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_webhook_events: {
        Row: {
          created_at: string
          direction: string | null
          error_message: string | null
          event_type: string
          id: string
          latency_ms: number | null
          payload: Json | null
          processed_at: string | null
          response: Json | null
          source: string
          source_id: string | null
          status: string | null
          status_code: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          direction?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          processed_at?: string | null
          response?: Json | null
          source: string
          source_id?: string | null
          status?: string | null
          status_code?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          direction?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          latency_ms?: number | null
          payload?: Json | null
          processed_at?: string | null
          response?: Json | null
          source?: string
          source_id?: string | null
          status?: string | null
          status_code?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          notification_channels: Json
          priority: string
          recipient_emails: string[] | null
          recipient_phones: string[] | null
          rule_type: string
          schedule_config: Json | null
          tenant_id: string
          threshold_operator: string | null
          threshold_value: number | null
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notification_channels?: Json
          priority?: string
          recipient_emails?: string[] | null
          recipient_phones?: string[] | null
          rule_type: string
          schedule_config?: Json | null
          tenant_id: string
          threshold_operator?: string | null
          threshold_value?: number | null
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notification_channels?: Json
          priority?: string
          recipient_emails?: string[] | null
          recipient_phones?: string[] | null
          rule_type?: string
          schedule_config?: Json | null
          tenant_id?: string
          threshold_operator?: string | null
          threshold_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      alert_settings: {
        Row: {
          alert_end_time: string | null
          alert_frequency: string | null
          alert_start_time: string | null
          business_days_only: boolean | null
          created_at: string
          critical_stock_threshold: number | null
          dashboard_notifications: boolean | null
          email_notifications: boolean | null
          expiration_alert_days: number | null
          id: string
          low_stock_enabled: boolean | null
          low_stock_threshold: number | null
          maximum_stock_threshold: number | null
          near_expiration_days: number | null
          overdue_inventory_days: number | null
          slow_moving_days: number | null
          sms_notifications: boolean | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_end_time?: string | null
          alert_frequency?: string | null
          alert_start_time?: string | null
          business_days_only?: boolean | null
          created_at?: string
          critical_stock_threshold?: number | null
          dashboard_notifications?: boolean | null
          email_notifications?: boolean | null
          expiration_alert_days?: number | null
          id?: string
          low_stock_enabled?: boolean | null
          low_stock_threshold?: number | null
          maximum_stock_threshold?: number | null
          near_expiration_days?: number | null
          overdue_inventory_days?: number | null
          slow_moving_days?: number | null
          sms_notifications?: boolean | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_end_time?: string | null
          alert_frequency?: string | null
          alert_start_time?: string | null
          business_days_only?: boolean | null
          created_at?: string
          critical_stock_threshold?: number | null
          dashboard_notifications?: boolean | null
          email_notifications?: boolean | null
          expiration_alert_days?: number | null
          id?: string
          low_stock_enabled?: boolean | null
          low_stock_threshold?: number | null
          maximum_stock_threshold?: number | null
          near_expiration_days?: number | null
          overdue_inventory_days?: number | null
          slow_moving_days?: number | null
          sms_notifications?: boolean | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      alert_thresholds_by_category: {
        Row: {
          category: string
          created_at: string
          enabled: boolean | null
          id: string
          tenant_id: string
          threshold: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          tenant_id: string
          threshold?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          tenant_id?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      alertes_fournisseurs: {
        Row: {
          canal_envoi: string
          created_at: string | null
          created_by: string | null
          date_envoi: string | null
          date_reponse: string | null
          fournisseur_id: string
          id: string
          message: string
          metadata: Json | null
          produits_ids: string[]
          reponse_fournisseur: string | null
          statut: string
          tenant_id: string
          type_alerte: string
          updated_at: string | null
        }
        Insert: {
          canal_envoi?: string
          created_at?: string | null
          created_by?: string | null
          date_envoi?: string | null
          date_reponse?: string | null
          fournisseur_id: string
          id?: string
          message: string
          metadata?: Json | null
          produits_ids: string[]
          reponse_fournisseur?: string | null
          statut?: string
          tenant_id: string
          type_alerte: string
          updated_at?: string | null
        }
        Update: {
          canal_envoi?: string
          created_at?: string | null
          created_by?: string | null
          date_envoi?: string | null
          date_reponse?: string | null
          fournisseur_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          produits_ids?: string[]
          reponse_fournisseur?: string | null
          statut?: string
          tenant_id?: string
          type_alerte?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertes_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      alertes_peremption: {
        Row: {
          actions_recommandees: string[] | null
          created_at: string | null
          date_alerte: string | null
          date_traitement: string | null
          id: string
          jours_restants: number | null
          lot_id: string
          niveau_urgence: string
          notes: string | null
          produit_id: string
          quantite_concernee: number
          statut: string | null
          tenant_id: string
          traite_par_id: string | null
          type_alerte: string
          updated_at: string | null
        }
        Insert: {
          actions_recommandees?: string[] | null
          created_at?: string | null
          date_alerte?: string | null
          date_traitement?: string | null
          id?: string
          jours_restants?: number | null
          lot_id: string
          niveau_urgence?: string
          notes?: string | null
          produit_id: string
          quantite_concernee: number
          statut?: string | null
          tenant_id: string
          traite_par_id?: string | null
          type_alerte: string
          updated_at?: string | null
        }
        Update: {
          actions_recommandees?: string[] | null
          created_at?: string | null
          date_alerte?: string | null
          date_traitement?: string | null
          id?: string
          jours_restants?: number | null
          lot_id?: string
          niveau_urgence?: string
          notes?: string | null
          produit_id?: string
          quantite_concernee?: number
          statut?: string | null
          tenant_id?: string
          traite_par_id?: string | null
          type_alerte?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertes_peremption_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_peremption_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_peremption_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_peremption_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_peremption_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "alertes_peremption_traite_par_id_fkey"
            columns: ["traite_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_peremption_traitee_par_fkey"
            columns: ["traite_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      alertes_tresorerie: {
        Row: {
          compte_bancaire_id: string | null
          created_at: string
          date_alerte: string
          description: string
          id: string
          notes: string | null
          resolu_le: string | null
          resolu_par_id: string | null
          seuil_montant_xaf: number | null
          severite: string
          statut: string
          tenant_id: string
          titre: string
          type_alerte: string
          updated_at: string
        }
        Insert: {
          compte_bancaire_id?: string | null
          created_at?: string
          date_alerte?: string
          description: string
          id?: string
          notes?: string | null
          resolu_le?: string | null
          resolu_par_id?: string | null
          seuil_montant_xaf?: number | null
          severite?: string
          statut?: string
          tenant_id: string
          titre: string
          type_alerte: string
          updated_at?: string
        }
        Update: {
          compte_bancaire_id?: string | null
          created_at?: string
          date_alerte?: string
          description?: string
          id?: string
          notes?: string | null
          resolu_le?: string | null
          resolu_par_id?: string | null
          seuil_montant_xaf?: number | null
          severite?: string
          statut?: string
          tenant_id?: string
          titre?: string
          type_alerte?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertes_tresorerie_compte_bancaire_id_fkey"
            columns: ["compte_bancaire_id"]
            isOneToOne: false
            referencedRelation: "comptes_bancaires"
            referencedColumns: ["id"]
          },
        ]
      }
      analytiques_pos: {
        Row: {
          agent_id: string | null
          articles_vendus: number | null
          caisse_id: string | null
          clients_fidelite: number | null
          created_at: string | null
          date: string
          heure: number | null
          id: string
          metadata: Json | null
          montant_moyen_transaction: number | null
          montant_total_ventes: number | null
          nombre_transactions: number | null
          nouveaux_clients: number | null
          panier_moyen_articles: number | null
          points_distribues: number | null
          retours: number | null
          temps_attente_moyen: unknown
          temps_moyen_transaction: unknown
          tenant_id: string
          updated_at: string | null
          ventes_assurance: number | null
          ventes_carte: number | null
          ventes_especes: number | null
          ventes_mobile: number | null
        }
        Insert: {
          agent_id?: string | null
          articles_vendus?: number | null
          caisse_id?: string | null
          clients_fidelite?: number | null
          created_at?: string | null
          date?: string
          heure?: number | null
          id?: string
          metadata?: Json | null
          montant_moyen_transaction?: number | null
          montant_total_ventes?: number | null
          nombre_transactions?: number | null
          nouveaux_clients?: number | null
          panier_moyen_articles?: number | null
          points_distribues?: number | null
          retours?: number | null
          temps_attente_moyen?: unknown
          temps_moyen_transaction?: unknown
          tenant_id: string
          updated_at?: string | null
          ventes_assurance?: number | null
          ventes_carte?: number | null
          ventes_especes?: number | null
          ventes_mobile?: number | null
        }
        Update: {
          agent_id?: string | null
          articles_vendus?: number | null
          caisse_id?: string | null
          clients_fidelite?: number | null
          created_at?: string | null
          date?: string
          heure?: number | null
          id?: string
          metadata?: Json | null
          montant_moyen_transaction?: number | null
          montant_total_ventes?: number | null
          nombre_transactions?: number | null
          nouveaux_clients?: number | null
          panier_moyen_articles?: number | null
          points_distribues?: number | null
          retours?: number | null
          temps_attente_moyen?: unknown
          temps_moyen_transaction?: unknown
          tenant_id?: string
          updated_at?: string | null
          ventes_assurance?: number | null
          ventes_carte?: number | null
          ventes_especes?: number | null
          ventes_mobile?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytiques_pos_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytiques_pos_caisse_id_fkey"
            columns: ["caisse_id"]
            isOneToOne: false
            referencedRelation: "caisses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytiques_pos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytiques_pos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      api_scheduled_tasks: {
        Row: {
          config: Json | null
          created_at: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_status: string | null
          next_run_at: string | null
          schedule_time: string | null
          task_name: string
          task_type: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          schedule_time?: string | null
          task_name: string
          task_type?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          schedule_time?: string | null
          task_name?: string
          task_type?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_scheduled_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_scheduled_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      archives_fiscales: {
        Row: {
          created_at: string
          date_archivage: string
          date_expiration: string | null
          fichier_url: string | null
          id: string
          periode: string
          reference_document: string
          statut_archivage: string
          taille_fichier_ko: number | null
          tenant_id: string
          type_document: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_archivage?: string
          date_expiration?: string | null
          fichier_url?: string | null
          id?: string
          periode: string
          reference_document: string
          statut_archivage?: string
          taille_fichier_ko?: number | null
          tenant_id: string
          type_document: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_archivage?: string
          date_expiration?: string | null
          fichier_url?: string | null
          id?: string
          periode?: string
          reference_document?: string
          statut_archivage?: string
          taille_fichier_ko?: number | null
          tenant_id?: string
          type_document?: string
          updated_at?: string
        }
        Relationships: []
      }
      assureurs: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          libelle_assureur: string
          limite_dette: number | null
          niu: string | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          libelle_assureur: string
          limite_dette?: number | null
          niu?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          libelle_assureur?: string
          limite_dette?: number | null
          niu?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assureurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assureurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          personnel_id: string | null
          record_id: string | null
          status: string | null
          table_name: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          personnel_id?: string | null
          record_id?: string | null
          status?: string | null
          table_name: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          personnel_id?: string | null
          record_id?: string | null
          status?: string | null
          table_name?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          created_at: string
          file_size_kb: number | null
          file_url: string | null
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          recipients: Json | null
          report_format: string
          report_name: string
          report_type: string
          schedule_frequency: string | null
          scheduled: boolean
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_size_kb?: number | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          recipients?: Json | null
          report_format?: string
          report_name: string
          report_type: string
          schedule_frequency?: string | null
          scheduled?: boolean
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_size_kb?: number | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          recipients?: Json | null
          report_format?: string
          report_name?: string
          report_type?: string
          schedule_frequency?: string | null
          scheduled?: boolean
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      avoirs: {
        Row: {
          created_at: string
          created_by_id: string | null
          date_emission: string
          facture_origine_id: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          motif: string
          numero: string
          statut: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          date_emission?: string
          facture_origine_id: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          motif: string
          numero: string
          statut?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          date_emission?: string
          facture_origine_id?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          motif?: string
          numero?: string
          statut?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avoirs_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avoirs_facture_origine_id_fkey"
            columns: ["facture_origine_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avoirs_facture_origine_id_fkey"
            columns: ["facture_origine_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_location: string | null
          backup_scope: string
          backup_size_mb: number | null
          backup_type: string
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          encryption_algorithm: string | null
          error_message: string | null
          id: string
          initiated_by: string | null
          is_encrypted: boolean
          metadata: Json | null
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          backup_location?: string | null
          backup_scope?: string
          backup_size_mb?: number | null
          backup_type: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          encryption_algorithm?: string | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          is_encrypted?: boolean
          metadata?: Json | null
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          backup_location?: string | null
          backup_scope?: string
          backup_size_mb?: number | null
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          encryption_algorithm?: string | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          is_encrypted?: boolean
          metadata?: Json | null
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      balances: {
        Row: {
          compte_id: string
          created_at: string
          exercice_id: string
          id: string
          periode: string
          solde_credit: number | null
          solde_debit: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          compte_id: string
          created_at?: string
          exercice_id: string
          id?: string
          periode: string
          solde_credit?: number | null
          solde_debit?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          compte_id?: string
          created_at?: string
          exercice_id?: string
          id?: string
          periode?: string
          solde_credit?: number | null
          solde_debit?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balances_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balances_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balances_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          annee: number
          centre_cout_id: string | null
          commentaire_ecart: string | null
          compte_id: string | null
          created_at: string
          created_by_id: string | null
          date_debut: string
          date_fin: string
          date_validation: string | null
          ecart_montant: number | null
          ecart_pourcentage: number | null
          exercice_comptable_id: string | null
          id: string
          libelle: string
          mois: number | null
          montant_engage: number
          montant_prevu: number
          montant_realise: number
          notes: string | null
          statut: string
          tenant_id: string
          trimestre: number | null
          type_periode: string
          updated_at: string
          valide_par_id: string | null
        }
        Insert: {
          annee: number
          centre_cout_id?: string | null
          commentaire_ecart?: string | null
          compte_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_debut: string
          date_fin: string
          date_validation?: string | null
          ecart_montant?: number | null
          ecart_pourcentage?: number | null
          exercice_comptable_id?: string | null
          id?: string
          libelle: string
          mois?: number | null
          montant_engage?: number
          montant_prevu?: number
          montant_realise?: number
          notes?: string | null
          statut?: string
          tenant_id: string
          trimestre?: number | null
          type_periode: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Update: {
          annee?: number
          centre_cout_id?: string | null
          commentaire_ecart?: string | null
          compte_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_debut?: string
          date_fin?: string
          date_validation?: string | null
          ecart_montant?: number | null
          ecart_pourcentage?: number | null
          exercice_comptable_id?: string | null
          id?: string
          libelle?: string
          mois?: number | null
          montant_engage?: number
          montant_prevu?: number
          montant_realise?: number
          notes?: string | null
          statut?: string
          tenant_id?: string
          trimestre?: number | null
          type_periode?: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "v_performance_centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_exercice_comptable_id_fkey"
            columns: ["exercice_comptable_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_valide_par_id_fkey"
            columns: ["valide_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      caisses: {
        Row: {
          code_caisse: string
          created_at: string | null
          description: string | null
          emplacement: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          nom_caisse: string
          tenant_id: string
          type_caisse: string | null
          updated_at: string | null
        }
        Insert: {
          code_caisse: string
          created_at?: string | null
          description?: string | null
          emplacement?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          nom_caisse: string
          tenant_id: string
          type_caisse?: string | null
          updated_at?: string | null
        }
        Update: {
          code_caisse?: string
          created_at?: string | null
          description?: string | null
          emplacement?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          nom_caisse?: string
          tenant_id?: string
          type_caisse?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      catalogue_global_produits: {
        Row: {
          ancien_code_cip: string | null
          code_cip: string
          created_at: string | null
          created_by: string | null
          id: string
          libelle_categorie_tarification: string | null
          libelle_classe_therapeutique: string | null
          libelle_dci: string | null
          libelle_famille: string | null
          libelle_forme: string | null
          libelle_laboratoire: string | null
          libelle_produit: string
          libelle_rayon: string | null
          libelle_statut: string | null
          prix_achat_reference: number | null
          prix_achat_reference_pnr: number | null
          prix_vente_reference: number | null
          prix_vente_reference_pnr: number | null
          tva: boolean
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ancien_code_cip?: string | null
          code_cip: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          libelle_categorie_tarification?: string | null
          libelle_classe_therapeutique?: string | null
          libelle_dci?: string | null
          libelle_famille?: string | null
          libelle_forme?: string | null
          libelle_laboratoire?: string | null
          libelle_produit: string
          libelle_rayon?: string | null
          libelle_statut?: string | null
          prix_achat_reference?: number | null
          prix_achat_reference_pnr?: number | null
          prix_vente_reference?: number | null
          prix_vente_reference_pnr?: number | null
          tva?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ancien_code_cip?: string | null
          code_cip?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          libelle_categorie_tarification?: string | null
          libelle_classe_therapeutique?: string | null
          libelle_dci?: string | null
          libelle_famille?: string | null
          libelle_forme?: string | null
          libelle_laboratoire?: string | null
          libelle_produit?: string
          libelle_rayon?: string | null
          libelle_statut?: string | null
          prix_achat_reference?: number | null
          prix_achat_reference_pnr?: number | null
          prix_vente_reference?: number | null
          prix_vente_reference_pnr?: number | null
          tva?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_global_produits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogue_global_produits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      categorie_tarification: {
        Row: {
          coefficient_prix_vente: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          libelle_categorie: string
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          coefficient_prix_vente?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_categorie: string
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          coefficient_prix_vente?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_categorie?: string
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorie_tarification_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorie_tarification_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      centres_couts: {
        Row: {
          centre_parent_id: string | null
          code: string
          compte_analytique_id: string | null
          created_at: string
          created_by_id: string | null
          date_fermeture: string | null
          date_ouverture: string
          description: string | null
          est_actif: boolean
          id: string
          niveau: number
          nom: string
          notes: string | null
          objectif_marge_min: number | null
          objectif_rotation_stock: number | null
          responsable_id: string | null
          tenant_id: string
          type_centre: string
          updated_at: string
        }
        Insert: {
          centre_parent_id?: string | null
          code: string
          compte_analytique_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_fermeture?: string | null
          date_ouverture?: string
          description?: string | null
          est_actif?: boolean
          id?: string
          niveau?: number
          nom: string
          notes?: string | null
          objectif_marge_min?: number | null
          objectif_rotation_stock?: number | null
          responsable_id?: string | null
          tenant_id: string
          type_centre: string
          updated_at?: string
        }
        Update: {
          centre_parent_id?: string | null
          code?: string
          compte_analytique_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_fermeture?: string | null
          date_ouverture?: string
          description?: string | null
          est_actif?: boolean
          id?: string
          niveau?: number
          nom?: string
          notes?: string | null
          objectif_marge_min?: number | null
          objectif_rotation_stock?: number | null
          responsable_id?: string | null
          tenant_id?: string
          type_centre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centres_couts_centre_parent_id_fkey"
            columns: ["centre_parent_id"]
            isOneToOne: false
            referencedRelation: "centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centres_couts_centre_parent_id_fkey"
            columns: ["centre_parent_id"]
            isOneToOne: false
            referencedRelation: "v_performance_centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centres_couts_compte_analytique_id_fkey"
            columns: ["compte_analytique_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centres_couts_compte_analytique_id_fkey"
            columns: ["compte_analytique_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centres_couts_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centres_couts_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_keyword_alerts: {
        Row: {
          alert_type: string
          channel_ids: string[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          keyword: string
          last_triggered_at: string | null
          recipients: string[] | null
          tenant_id: string
          trigger_count: number | null
          updated_at: string
        }
        Insert: {
          alert_type?: string
          channel_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          last_triggered_at?: string | null
          recipients?: string[] | null
          tenant_id: string
          trigger_count?: number | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          channel_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          last_triggered_at?: string | null
          recipients?: string[] | null
          tenant_id?: string
          trigger_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      channel_participants: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          pharmacy_id: string
          role: string | null
          tenant_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          pharmacy_id: string
          role?: string | null
          tenant_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          pharmacy_id?: string
          role?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_participants_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "network_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_participants_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_participants_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_permissions: {
        Row: {
          channel_id: string
          created_at: string
          granted_by: string | null
          id: string
          permission_level: string
          pharmacy_id: string | null
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_level?: string
          pharmacy_id?: string | null
          role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_level?: string
          pharmacy_id?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes_comptables_globales: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          nom: string
          numero: number
          plan_comptable_id: string
          type_bilan: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          nom: string
          numero: number
          plan_comptable_id: string
          type_bilan?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          nom?: string
          numero?: number
          plan_comptable_id?: string
          type_bilan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_comptables_globales_plan_comptable_id_fkey"
            columns: ["plan_comptable_id"]
            isOneToOne: false
            referencedRelation: "plans_comptables_globaux"
            referencedColumns: ["id"]
          },
        ]
      }
      classes_therapeutiques: {
        Row: {
          created_at: string
          description: string | null
          id: string
          libelle_classe: string
          systeme_anatomique: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_classe: string
          systeme_anatomique: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_classe?: string
          systeme_anatomique?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cles_repartition: {
        Row: {
          code: string
          created_at: string
          description: string | null
          est_active: boolean
          formule: Json | null
          id: string
          libelle: string
          methode_calcul: string | null
          tenant_id: string
          type_cle: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          est_active?: boolean
          formule?: Json | null
          id?: string
          libelle: string
          methode_calcul?: string | null
          tenant_id: string
          type_cle: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          est_active?: boolean
          formule?: Json | null
          id?: string
          libelle?: string
          methode_calcul?: string | null
          tenant_id?: string
          type_cle?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          allergies: Json | null
          assureur_id: string | null
          caution: number | null
          chronic_conditions: Json | null
          contact_email: string | null
          contact_fonction: string | null
          contact_nom: string | null
          contact_telephone: string | null
          conventionne_id: string | null
          created_at: string
          credit_actuel: number | null
          date_adhesion: string | null
          date_expiration_police: string | null
          date_naissance: string | null
          email: string | null
          id: string
          last_visit_at: string | null
          limite_credit: number | null
          metadata: Json | null
          niu: string | null
          nom_complet: string
          notes: string | null
          numero_cni: string | null
          numero_police: string | null
          numero_registre_commerce: string | null
          personnel_id: string | null
          peut_prendre_bon: boolean | null
          plafond_annuel: number | null
          plafond_mensuel: number | null
          raison_sociale: string | null
          secteur_activite: string | null
          societe_id: string | null
          statut: Database["public"]["Enums"]["statut_client"] | null
          taux_agent: number | null
          taux_ayant_droit: number | null
          taux_couverture: number | null
          taux_remise_automatique: number | null
          taux_ticket_moderateur: number | null
          telephone: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          type_client: Database["public"]["Enums"]["type_client"]
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          allergies?: Json | null
          assureur_id?: string | null
          caution?: number | null
          chronic_conditions?: Json | null
          contact_email?: string | null
          contact_fonction?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          conventionne_id?: string | null
          created_at?: string
          credit_actuel?: number | null
          date_adhesion?: string | null
          date_expiration_police?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          last_visit_at?: string | null
          limite_credit?: number | null
          metadata?: Json | null
          niu?: string | null
          nom_complet: string
          notes?: string | null
          numero_cni?: string | null
          numero_police?: string | null
          numero_registre_commerce?: string | null
          personnel_id?: string | null
          peut_prendre_bon?: boolean | null
          plafond_annuel?: number | null
          plafond_mensuel?: number | null
          raison_sociale?: string | null
          secteur_activite?: string | null
          societe_id?: string | null
          statut?: Database["public"]["Enums"]["statut_client"] | null
          taux_agent?: number | null
          taux_ayant_droit?: number | null
          taux_couverture?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          type_client?: Database["public"]["Enums"]["type_client"]
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          allergies?: Json | null
          assureur_id?: string | null
          caution?: number | null
          chronic_conditions?: Json | null
          contact_email?: string | null
          contact_fonction?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          conventionne_id?: string | null
          created_at?: string
          credit_actuel?: number | null
          date_adhesion?: string | null
          date_expiration_police?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          last_visit_at?: string | null
          limite_credit?: number | null
          metadata?: Json | null
          niu?: string | null
          nom_complet?: string
          notes?: string | null
          numero_cni?: string | null
          numero_police?: string | null
          numero_registre_commerce?: string | null
          personnel_id?: string | null
          peut_prendre_bon?: boolean | null
          plafond_annuel?: number | null
          plafond_mensuel?: number | null
          raison_sociale?: string | null
          secteur_activite?: string | null
          societe_id?: string | null
          statut?: Database["public"]["Enums"]["statut_client"] | null
          taux_agent?: number | null
          taux_ayant_droit?: number | null
          taux_couverture?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          type_client?: Database["public"]["Enums"]["type_client"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assureur_id_fkey"
            columns: ["assureur_id"]
            isOneToOne: false
            referencedRelation: "assureurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_conventionne_id_fkey"
            columns: ["conventionne_id"]
            isOneToOne: false
            referencedRelation: "conventionnes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_societe_id_fkey"
            columns: ["societe_id"]
            isOneToOne: false
            referencedRelation: "societes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actions_required: string[] | null
          affected_drugs: string[] | null
          affected_product_ids: string[] | null
          alert_type: string
          created_at: string | null
          date_issued: string | null
          description: string | null
          expiry_date: string | null
          id: string
          is_acknowledged: boolean | null
          is_network_alert: boolean | null
          metadata: Json | null
          severity: string
          source: string | null
          target_pharmacies: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actions_required?: string[] | null
          affected_drugs?: string[] | null
          affected_product_ids?: string[] | null
          alert_type: string
          created_at?: string | null
          date_issued?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_network_alert?: boolean | null
          metadata?: Json | null
          severity?: string
          source?: string | null
          target_pharmacies?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actions_required?: string[] | null
          affected_drugs?: string[] | null
          affected_product_ids?: string[] | null
          alert_type?: string
          created_at?: string | null
          date_issued?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_network_alert?: boolean | null
          metadata?: Json | null
          severity?: string
          source?: string | null
          target_pharmacies?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coefficients_repartition: {
        Row: {
          centre_cout_id: string
          cle_repartition_id: string
          coefficient: number
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          notes: string | null
          tenant_id: string
          updated_at: string
          valeur_base: number | null
        }
        Insert: {
          centre_cout_id: string
          cle_repartition_id: string
          coefficient: number
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
          valeur_base?: number | null
        }
        Update: {
          centre_cout_id?: string
          cle_repartition_id?: string
          coefficient?: number
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          valeur_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coefficients_repartition_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coefficients_repartition_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "v_performance_centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coefficients_repartition_cle_repartition_id_fkey"
            columns: ["cle_repartition_id"]
            isOneToOne: false
            referencedRelation: "cles_repartition"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          is_network_event: boolean | null
          is_virtual: boolean | null
          location: string | null
          meeting_link: string | null
          metadata: Json | null
          organizer_name: string | null
          organizer_pharmacy_id: string | null
          organizer_user_id: string | null
          participants: Json | null
          recurrence_rule: string | null
          reminder_enabled: boolean | null
          reminder_minutes: number | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          is_network_event?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          meeting_link?: string | null
          metadata?: Json | null
          organizer_name?: string | null
          organizer_pharmacy_id?: string | null
          organizer_user_id?: string | null
          participants?: Json | null
          recurrence_rule?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes?: number | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          is_network_event?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          meeting_link?: string | null
          metadata?: Json | null
          organizer_name?: string | null
          organizer_pharmacy_id?: string | null
          organizer_user_id?: string | null
          participants?: Json | null
          recurrence_rule?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes?: number | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_events_organizer_pharmacy_id_fkey"
            columns: ["organizer_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_events_organizer_pharmacy_id_fkey"
            columns: ["organizer_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_events_organizer_user_id_fkey"
            columns: ["organizer_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_tasks: {
        Row: {
          assignee_pharmacy_id: string | null
          assignee_user_id: string | null
          channel_id: string | null
          completed_at: string | null
          created_at: string
          creator_pharmacy_id: string | null
          creator_user_id: string | null
          description: string | null
          due_date: string | null
          id: string
          is_network_task: boolean | null
          metadata: Json | null
          priority: string
          status: string
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          assignee_pharmacy_id?: string | null
          assignee_user_id?: string | null
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_pharmacy_id?: string | null
          creator_user_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_network_task?: boolean | null
          metadata?: Json | null
          priority?: string
          status?: string
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          assignee_pharmacy_id?: string | null
          assignee_user_id?: string | null
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_pharmacy_id?: string | null
          creator_user_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_network_task?: boolean | null
          metadata?: Json | null
          priority?: string
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_tasks_assignee_pharmacy_id_fkey"
            columns: ["assignee_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_assignee_pharmacy_id_fkey"
            columns: ["assignee_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "network_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_creator_pharmacy_id_fkey"
            columns: ["creator_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_creator_pharmacy_id_fkey"
            columns: ["creator_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "collaborative_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborative_workspaces: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          goals: Json | null
          icon: string | null
          id: string
          is_network_workspace: boolean | null
          milestones: Json | null
          name: string
          owner_pharmacy_id: string | null
          owner_user_id: string | null
          progress_percent: number | null
          settings: Json | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          goals?: Json | null
          icon?: string | null
          id?: string
          is_network_workspace?: boolean | null
          milestones?: Json | null
          name: string
          owner_pharmacy_id?: string | null
          owner_user_id?: string | null
          progress_percent?: number | null
          settings?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          goals?: Json | null
          icon?: string | null
          id?: string
          is_network_workspace?: boolean | null
          milestones?: Json | null
          name?: string
          owner_pharmacy_id?: string | null
          owner_user_id?: string | null
          progress_percent?: number | null
          settings?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborative_workspaces_owner_pharmacy_id_fkey"
            columns: ["owner_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workspaces_owner_pharmacy_id_fkey"
            columns: ["owner_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workspaces_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workspaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborative_workspaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      commandes_fournisseurs: {
        Row: {
          agent_id: string | null
          created_at: string
          date_commande: string | null
          fournisseur_id: string
          id: string
          montant_asdi: number | null
          montant_centime_additionnel: number | null
          montant_ht: number | null
          montant_ttc: number | null
          montant_tva: number | null
          statut: string | null
          tenant_id: string
          updated_at: string
          valide_par_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          date_commande?: string | null
          fournisseur_id: string
          id?: string
          montant_asdi?: number | null
          montant_centime_additionnel?: number | null
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          statut?: string | null
          tenant_id: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          date_commande?: string | null
          fournisseur_id?: string
          id?: string
          montant_asdi?: number | null
          montant_centime_additionnel?: number | null
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          statut?: string | null
          tenant_id?: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commandes_fournisseurs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_fournisseurs_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_fournisseurs_valide_par_id_fkey"
            columns: ["valide_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_actions: {
        Row: {
          action_description: string
          action_type: string
          assigned_to: string | null
          completion_date: string | null
          control_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_description: string
          action_type?: string
          assigned_to?: string | null
          completion_date?: string | null
          control_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_description?: string
          action_type?: string
          assigned_to?: string | null
          completion_date?: string | null
          control_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_actions_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "compliance_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          assigned_to: string | null
          category: string
          compliance_score: number | null
          compliance_status: string
          corrective_actions: Json | null
          country_code: string
          created_at: string
          description: string | null
          evaluation_frequency: string | null
          evidence_documents: Json | null
          id: string
          last_evaluation_date: string | null
          metadata: Json | null
          next_evaluation_date: string | null
          priority: string | null
          regulatory_body: string | null
          requirement_code: string
          requirement_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          compliance_score?: number | null
          compliance_status?: string
          corrective_actions?: Json | null
          country_code?: string
          created_at?: string
          description?: string | null
          evaluation_frequency?: string | null
          evidence_documents?: Json | null
          id?: string
          last_evaluation_date?: string | null
          metadata?: Json | null
          next_evaluation_date?: string | null
          priority?: string | null
          regulatory_body?: string | null
          requirement_code: string
          requirement_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          compliance_score?: number | null
          compliance_status?: string
          corrective_actions?: Json | null
          country_code?: string
          created_at?: string
          description?: string | null
          evaluation_frequency?: string | null
          evidence_documents?: Json | null
          id?: string
          last_evaluation_date?: string | null
          metadata?: Json | null
          next_evaluation_date?: string | null
          priority?: string | null
          regulatory_body?: string | null
          requirement_code?: string
          requirement_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_controls: {
        Row: {
          compliance_score: number | null
          control_frequency: string
          control_notes: string | null
          control_type: string
          created_at: string
          id: string
          last_control_date: string | null
          next_control_date: string | null
          requirement_id: string
          responsible_person_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          compliance_score?: number | null
          control_frequency?: string
          control_notes?: string | null
          control_type?: string
          created_at?: string
          id?: string
          last_control_date?: string | null
          next_control_date?: string | null
          requirement_id: string
          responsible_person_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          compliance_score?: number | null
          control_frequency?: string
          control_notes?: string | null
          control_type?: string
          created_at?: string
          id?: string
          last_control_date?: string | null
          next_control_date?: string | null
          requirement_id?: string
          responsible_person_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_controls_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_controls_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_metrics_history: {
        Row: {
          category_scores: Json | null
          compliant_count: number
          created_at: string
          expired_count: number
          global_score: number
          id: string
          in_progress_count: number
          metric_date: string
          non_compliant_count: number
          tenant_id: string
          total_requirements: number
        }
        Insert: {
          category_scores?: Json | null
          compliant_count?: number
          created_at?: string
          expired_count?: number
          global_score?: number
          id?: string
          in_progress_count?: number
          metric_date?: string
          non_compliant_count?: number
          tenant_id: string
          total_requirements?: number
        }
        Update: {
          category_scores?: Json | null
          compliant_count?: number
          created_at?: string
          expired_count?: number
          global_score?: number
          id?: string
          in_progress_count?: number
          metric_date?: string
          non_compliant_count?: number
          tenant_id?: string
          total_requirements?: number
        }
        Relationships: []
      }
      compliance_product_requirements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          product_family_id: string | null
          product_id: string | null
          requirement_id: string
          specific_rules: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_family_id?: string | null
          product_id?: string | null
          requirement_id: string
          specific_rules?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_family_id?: string | null
          product_id?: string | null
          requirement_id?: string
          specific_rules?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_product_requirements_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_product_requirements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_product_requirements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_product_requirements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_product_requirements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "compliance_product_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          priority_level: string
          regulation_reference: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority_level?: string
          regulation_reference?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority_level?: string
          regulation_reference?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      compte_depenses: {
        Row: {
          created_at: string
          id: string
          libelle_compte: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          libelle_compte: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          libelle_compte?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compte_depenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compte_depenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_bancaires: {
        Row: {
          autoriser_decouvert: boolean
          banque: string
          cle_rib: string | null
          code_banque: string | null
          code_guichet: string | null
          contact_banque: string | null
          created_at: string
          created_by_id: string | null
          dernier_releve: string | null
          devise: string
          email_banque: string | null
          est_actif: boolean
          frequence_releve: string | null
          iban: string | null
          id: string
          limite_decouvert: number | null
          nom_compte: string
          notes: string | null
          numero_compte: string
          releve_auto: boolean
          solde_actuel: number
          solde_initial: number
          solde_rapproche: number
          swift_bic: string | null
          telephone_banque: string | null
          tenant_id: string
          type_compte: string
          updated_at: string
        }
        Insert: {
          autoriser_decouvert?: boolean
          banque: string
          cle_rib?: string | null
          code_banque?: string | null
          code_guichet?: string | null
          contact_banque?: string | null
          created_at?: string
          created_by_id?: string | null
          dernier_releve?: string | null
          devise?: string
          email_banque?: string | null
          est_actif?: boolean
          frequence_releve?: string | null
          iban?: string | null
          id?: string
          limite_decouvert?: number | null
          nom_compte: string
          notes?: string | null
          numero_compte: string
          releve_auto?: boolean
          solde_actuel?: number
          solde_initial?: number
          solde_rapproche?: number
          swift_bic?: string | null
          telephone_banque?: string | null
          tenant_id: string
          type_compte: string
          updated_at?: string
        }
        Update: {
          autoriser_decouvert?: boolean
          banque?: string
          cle_rib?: string | null
          code_banque?: string | null
          code_guichet?: string | null
          contact_banque?: string | null
          created_at?: string
          created_by_id?: string | null
          dernier_releve?: string | null
          devise?: string
          email_banque?: string | null
          est_actif?: boolean
          frequence_releve?: string | null
          iban?: string | null
          id?: string
          limite_decouvert?: number | null
          nom_compte?: string
          notes?: string | null
          numero_compte?: string
          releve_auto?: boolean
          solde_actuel?: number
          solde_initial?: number
          solde_rapproche?: number
          swift_bic?: string | null
          telephone_banque?: string | null
          tenant_id?: string
          type_compte?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comptes_bancaires_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_comptables: {
        Row: {
          classe: string
          compte_parent_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_imputable: boolean | null
          libelle_compte: string
          numero_compte: string
          solde_credit: number | null
          solde_debit: number | null
          tenant_id: string
          type_compte: string
          updated_at: string | null
        }
        Insert: {
          classe: string
          compte_parent_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_imputable?: boolean | null
          libelle_compte: string
          numero_compte: string
          solde_credit?: number | null
          solde_debit?: number | null
          tenant_id: string
          type_compte?: string
          updated_at?: string | null
        }
        Update: {
          classe?: string
          compte_parent_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_imputable?: boolean | null
          libelle_compte?: string
          numero_compte?: string
          solde_credit?: number | null
          solde_debit?: number | null
          tenant_id?: string
          type_compte?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comptes_comptables_compte_parent_id_fkey"
            columns: ["compte_parent_id"]
            isOneToOne: false
            referencedRelation: "comptes_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comptes_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comptes_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_globaux: {
        Row: {
          classe: number
          compte_parent_numero: string | null
          created_at: string
          description: string | null
          est_compte_flux_tresorerie: boolean | null
          est_modifie_syscohada: boolean | null
          est_nouveau_syscohada: boolean | null
          id: string
          is_active: boolean
          libelle_compte: string
          niveau: number
          notes: string | null
          numero_compte: string
          plan_comptable_id: string
          type_compte: string | null
          updated_at: string
        }
        Insert: {
          classe: number
          compte_parent_numero?: string | null
          created_at?: string
          description?: string | null
          est_compte_flux_tresorerie?: boolean | null
          est_modifie_syscohada?: boolean | null
          est_nouveau_syscohada?: boolean | null
          id?: string
          is_active?: boolean
          libelle_compte: string
          niveau?: number
          notes?: string | null
          numero_compte: string
          plan_comptable_id: string
          type_compte?: string | null
          updated_at?: string
        }
        Update: {
          classe?: number
          compte_parent_numero?: string | null
          created_at?: string
          description?: string | null
          est_compte_flux_tresorerie?: boolean | null
          est_modifie_syscohada?: boolean | null
          est_nouveau_syscohada?: boolean | null
          id?: string
          is_active?: boolean
          libelle_compte?: string
          niveau?: number
          notes?: string | null
          numero_compte?: string
          plan_comptable_id?: string
          type_compte?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comptes_globaux_plan_comptable_id_fkey"
            columns: ["plan_comptable_id"]
            isOneToOne: false
            referencedRelation: "plans_comptables_globaux"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations_fifo: {
        Row: {
          actif: boolean | null
          action_automatique: string | null
          created_at: string | null
          delai_alerte_jours: number | null
          famille_produit_id: string | null
          id: string
          priorite_fifo: number | null
          produit_id: string | null
          tenant_id: string
          tolerance_ecart_prix: number | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          action_automatique?: string | null
          created_at?: string | null
          delai_alerte_jours?: number | null
          famille_produit_id?: string | null
          id?: string
          priorite_fifo?: number | null
          produit_id?: string | null
          tenant_id: string
          tolerance_ecart_prix?: number | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          action_automatique?: string | null
          created_at?: string | null
          delai_alerte_jours?: number | null
          famille_produit_id?: string | null
          id?: string
          priorite_fifo?: number | null
          produit_id?: string | null
          tenant_id?: string
          tolerance_ecart_prix?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configurations_fifo_famille_produit_id_fkey"
            columns: ["famille_produit_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configurations_fifo_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configurations_fifo_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configurations_fifo_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configurations_fifo_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
        ]
      }
      conformite_fiscale: {
        Row: {
          created_at: string
          derniere_verification: string | null
          description: string | null
          element_controle: string
          id: string
          prochaine_verification: string | null
          recommandations: string | null
          score_conformite: number | null
          statut_conformite: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          derniere_verification?: string | null
          description?: string | null
          element_controle: string
          id?: string
          prochaine_verification?: string | null
          recommandations?: string | null
          score_conformite?: number | null
          statut_conformite?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          derniere_verification?: string | null
          description?: string | null
          element_controle?: string
          id?: string
          prochaine_verification?: string | null
          recommandations?: string | null
          score_conformite?: number | null
          statut_conformite?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      conges_employes: {
        Row: {
          approuve_par: string | null
          commentaires: string | null
          created_at: string
          date_approbation: string | null
          date_debut: string
          date_fin: string
          employe_id: string
          id: string
          motif: string
          statut: string
          tenant_id: string
          type_conge: string
          updated_at: string
        }
        Insert: {
          approuve_par?: string | null
          commentaires?: string | null
          created_at?: string
          date_approbation?: string | null
          date_debut: string
          date_fin: string
          employe_id: string
          id?: string
          motif: string
          statut?: string
          tenant_id: string
          type_conge: string
          updated_at?: string
        }
        Update: {
          approuve_par?: string | null
          commentaires?: string | null
          created_at?: string
          date_approbation?: string | null
          date_debut?: string
          date_fin?: string
          employe_id?: string
          id?: string
          motif?: string
          statut?: string
          tenant_id?: string
          type_conge?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conges_employes_approuve_par_fkey"
            columns: ["approuve_par"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conges_employes_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conges_employes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conges_employes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conventionnes: {
        Row: {
          adresse: string | null
          assureur_id: string | null
          caution: number | null
          created_at: string
          email: string | null
          id: string
          limite_dette: number | null
          niu: string | null
          noms: string
          peut_prendre_bon: boolean | null
          taux_couverture_agent: number | null
          taux_couverture_ayant_droit: number | null
          taux_remise_automatique: number | null
          taux_ticket_moderateur: number | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          assureur_id?: string | null
          caution?: number | null
          created_at?: string
          email?: string | null
          id?: string
          limite_dette?: number | null
          niu?: string | null
          noms: string
          peut_prendre_bon?: boolean | null
          taux_couverture_agent?: number | null
          taux_couverture_ayant_droit?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          assureur_id?: string | null
          caution?: number | null
          created_at?: string
          email?: string | null
          id?: string
          limite_dette?: number | null
          niu?: string | null
          noms?: string
          peut_prendre_bon?: boolean | null
          taux_couverture_agent?: number | null
          taux_couverture_ayant_droit?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conventionnes_assureur_id_fkey"
            columns: ["assureur_id"]
            isOneToOne: false
            referencedRelation: "assureurs"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_tenant_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          permission_type: string
          resource_id: string | null
          resource_type: string | null
          source_tenant_id: string
          target_tenant_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          permission_type: string
          resource_id?: string | null
          resource_type?: string | null
          source_tenant_id: string
          target_tenant_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          permission_type?: string
          resource_id?: string | null
          resource_type?: string | null
          source_tenant_id?: string
          target_tenant_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cross_tenant_permissions_granted_by"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_source"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_source"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_target"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_target"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dci: {
        Row: {
          classe_therapeutique_id: string | null
          contre_indications: string | null
          created_at: string
          description: string | null
          effets_secondaires: string | null
          id: string
          nom_dci: string
          posologie: string | null
          produits_associes: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          classe_therapeutique_id?: string | null
          contre_indications?: string | null
          created_at?: string
          description?: string | null
          effets_secondaires?: string | null
          id?: string
          nom_dci: string
          posologie?: string | null
          produits_associes?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          classe_therapeutique_id?: string | null
          contre_indications?: string | null
          created_at?: string
          description?: string | null
          effets_secondaires?: string | null
          id?: string
          nom_dci?: string
          posologie?: string | null
          produits_associes?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dci_classe_therapeutique"
            columns: ["classe_therapeutique_id"]
            isOneToOne: false
            referencedRelation: "classes_therapeutiques"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_produits_clients: {
        Row: {
          created_at: string
          created_by: string | null
          derniere_demande: string | null
          id: string
          nombre_demandes: number
          notes: string | null
          produit_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          derniere_demande?: string | null
          id?: string
          nombre_demandes?: number
          notes?: string | null
          produit_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          derniere_demande?: string | null
          id?: string
          nombre_demandes?: number
          notes?: string | null
          produit_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_produits_clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_produits_clients_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_produits_clients_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_produits_clients_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_produits_clients_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "demandes_produits_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_produits_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_generated: boolean | null
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          description: string | null
          document_type: string
          due_date: string | null
          email_from: string | null
          email_subject: string | null
          email_to: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          name: string
          original_filename: string | null
          priority: string | null
          recipient: string | null
          sender: string | null
          status: string | null
          tags: string[] | null
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          due_date?: string | null
          email_from?: string | null
          email_subject?: string | null
          email_to?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          original_filename?: string | null
          priority?: string | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          due_date?: string | null
          email_from?: string | null
          email_subject?: string | null
          email_to?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          original_filename?: string | null
          priority?: string | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_interactions: {
        Row: {
          clinical_effect: string | null
          created_at: string | null
          dci1_id: string | null
          dci2_id: string | null
          drug1_id: string | null
          drug1_name: string
          drug2_id: string | null
          drug2_name: string
          id: string
          is_network_shared: boolean | null
          management: string | null
          mechanism: string | null
          severity: string
          shared_by_pharmacy_id: string | null
          source_references: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          clinical_effect?: string | null
          created_at?: string | null
          dci1_id?: string | null
          dci2_id?: string | null
          drug1_id?: string | null
          drug1_name: string
          drug2_id?: string | null
          drug2_name: string
          id?: string
          is_network_shared?: boolean | null
          management?: string | null
          mechanism?: string | null
          severity?: string
          shared_by_pharmacy_id?: string | null
          source_references?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          clinical_effect?: string | null
          created_at?: string | null
          dci1_id?: string | null
          dci2_id?: string | null
          drug1_id?: string | null
          drug1_name?: string
          drug2_id?: string | null
          drug2_name?: string
          id?: string
          is_network_shared?: boolean | null
          management?: string | null
          mechanism?: string | null
          severity?: string
          shared_by_pharmacy_id?: string | null
          source_references?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_interactions_dci1_id_fkey"
            columns: ["dci1_id"]
            isOneToOne: false
            referencedRelation: "dci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_dci2_id_fkey"
            columns: ["dci2_id"]
            isOneToOne: false
            referencedRelation: "dci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug1_id_fkey"
            columns: ["drug1_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug1_id_fkey"
            columns: ["drug1_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug1_id_fkey"
            columns: ["drug1_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug1_id_fkey"
            columns: ["drug1_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "drug_interactions_drug2_id_fkey"
            columns: ["drug2_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug2_id_fkey"
            columns: ["drug2_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug2_id_fkey"
            columns: ["drug2_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_drug2_id_fkey"
            columns: ["drug2_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "drug_interactions_shared_by_pharmacy_id_fkey"
            columns: ["shared_by_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_shared_by_pharmacy_id_fkey"
            columns: ["shared_by_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      echeanciers_paiements: {
        Row: {
          alerte_avant_echeance: number | null
          client_id: string | null
          created_at: string
          created_by_id: string | null
          date_derniere_echeance: string | null
          date_emission: string
          date_premiere_echeance: string
          derniere_alerte: string | null
          description: string | null
          facture_id: string | null
          fournisseur_id: string | null
          id: string
          libelle: string
          montant_paye: number
          montant_restant: number
          montant_total: number
          nombre_echeances: number
          notes: string | null
          periodicite: string | null
          statut: string
          tenant_id: string
          tiers_nom: string | null
          type_echeancier: string
          updated_at: string
        }
        Insert: {
          alerte_avant_echeance?: number | null
          client_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_derniere_echeance?: string | null
          date_emission: string
          date_premiere_echeance: string
          derniere_alerte?: string | null
          description?: string | null
          facture_id?: string | null
          fournisseur_id?: string | null
          id?: string
          libelle: string
          montant_paye?: number
          montant_restant: number
          montant_total: number
          nombre_echeances?: number
          notes?: string | null
          periodicite?: string | null
          statut?: string
          tenant_id: string
          tiers_nom?: string | null
          type_echeancier: string
          updated_at?: string
        }
        Update: {
          alerte_avant_echeance?: number | null
          client_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_derniere_echeance?: string | null
          date_emission?: string
          date_premiere_echeance?: string
          derniere_alerte?: string | null
          description?: string | null
          facture_id?: string | null
          fournisseur_id?: string | null
          id?: string
          libelle?: string
          montant_paye?: number
          montant_restant?: number
          montant_total?: number
          nombre_echeances?: number
          notes?: string | null
          periodicite?: string | null
          statut?: string
          tenant_id?: string
          tiers_nom?: string | null
          type_echeancier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echeanciers_paiements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echeanciers_paiements_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echeanciers_paiements_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echeanciers_paiements_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echeanciers_paiements_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      ecritures_comptables: {
        Row: {
          created_at: string
          created_by_id: string | null
          date_ecriture: string
          exercice_id: string
          id: string
          is_auto_generated: boolean | null
          journal_id: string
          libelle: string
          locked_at: string | null
          locked_by_id: string | null
          montant_total: number | null
          numero_piece: string
          reference_id: string | null
          reference_type: string | null
          statut: string | null
          tenant_id: string
          total_credit: number | null
          total_debit: number | null
          updated_at: string
          validated_at: string | null
          validated_by_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          date_ecriture: string
          exercice_id: string
          id?: string
          is_auto_generated?: boolean | null
          journal_id: string
          libelle: string
          locked_at?: string | null
          locked_by_id?: string | null
          montant_total?: number | null
          numero_piece: string
          reference_id?: string | null
          reference_type?: string | null
          statut?: string | null
          tenant_id: string
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          date_ecriture?: string
          exercice_id?: string
          id?: string
          is_auto_generated?: boolean | null
          journal_id?: string
          libelle?: string
          locked_at?: string | null
          locked_by_id?: string | null
          montant_total?: number | null
          numero_piece?: string
          reference_id?: string | null
          reference_type?: string | null
          statut?: string | null
          tenant_id?: string
          total_credit?: number | null
          total_debit?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecritures_comptables_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journaux_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_locked_by_id_fkey"
            columns: ["locked_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_validated_by_id_fkey"
            columns: ["validated_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          classification: string | null
          content: string | null
          created_at: string | null
          document_id: string | null
          from_email: string | null
          id: string
          priority: string | null
          processed: boolean | null
          received_at: string | null
          subject: string | null
          suggested_response: string | null
          summary: string | null
          tenant_id: string
          to_email: string | null
          updated_at: string | null
        }
        Insert: {
          classification?: string | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          from_email?: string | null
          id?: string
          priority?: string | null
          processed?: boolean | null
          received_at?: string | null
          subject?: string | null
          suggested_response?: string | null
          summary?: string | null
          tenant_id: string
          to_email?: string | null
          updated_at?: string | null
        }
        Update: {
          classification?: string | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          from_email?: string | null
          id?: string
          priority?: string | null
          processed?: boolean | null
          received_at?: string | null
          subject?: string | null
          suggested_response?: string | null
          summary?: string | null
          tenant_id?: string
          to_email?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      encaissements: {
        Row: {
          caisse_id: string | null
          created_at: string
          date_encaissement: string | null
          id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          notes: string | null
          reference_transaction: string | null
          session_caisse_id: string | null
          tenant_id: string
          updated_at: string
          vente_id: string
        }
        Insert: {
          caisse_id?: string | null
          created_at?: string
          date_encaissement?: string | null
          id?: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          notes?: string | null
          reference_transaction?: string | null
          session_caisse_id?: string | null
          tenant_id: string
          updated_at?: string
          vente_id: string
        }
        Update: {
          caisse_id?: string | null
          created_at?: string
          date_encaissement?: string | null
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          notes?: string | null
          reference_transaction?: string | null
          session_caisse_id?: string | null
          tenant_id?: string
          updated_at?: string
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaissements_caisse_id_fkey"
            columns: ["caisse_id"]
            isOneToOne: false
            referencedRelation: "caisses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "v_rapport_session_complet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "v_sessions_caisse_resumees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_configs: {
        Row: {
          active_keys_count: number | null
          algorithm: string
          auto_rotation_enabled: boolean | null
          created_at: string
          encryption_type: string
          id: string
          key_rotation_days: number | null
          last_rotation_at: string | null
          metadata_encryption: boolean | null
          next_rotation_at: string | null
          resource_name: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active_keys_count?: number | null
          algorithm?: string
          auto_rotation_enabled?: boolean | null
          created_at?: string
          encryption_type: string
          id?: string
          key_rotation_days?: number | null
          last_rotation_at?: string | null
          metadata_encryption?: boolean | null
          next_rotation_at?: string | null
          resource_name: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active_keys_count?: number | null
          algorithm?: string
          auto_rotation_enabled?: boolean | null
          created_at?: string
          encryption_type?: string
          id?: string
          key_rotation_days?: number | null
          last_rotation_at?: string | null
          metadata_encryption?: boolean | null
          next_rotation_at?: string | null
          resource_name?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encryption_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encryption_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          created_at: string
          fournisseur_import_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fournisseur_import_key: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fournisseur_import_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encryption_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encryption_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements_tresorerie: {
        Row: {
          compte_bancaire_id: string | null
          created_at: string
          date_echeance: string
          id: string
          libelle: string
          montant_xaf: number
          notes: string | null
          reference_document: string | null
          statut: string
          tenant_id: string
          type_engagement: string
          updated_at: string
        }
        Insert: {
          compte_bancaire_id?: string | null
          created_at?: string
          date_echeance: string
          id?: string
          libelle: string
          montant_xaf: number
          notes?: string | null
          reference_document?: string | null
          statut?: string
          tenant_id: string
          type_engagement: string
          updated_at?: string
        }
        Update: {
          compte_bancaire_id?: string | null
          created_at?: string
          date_echeance?: string
          id?: string
          libelle?: string
          montant_xaf?: number
          notes?: string | null
          reference_document?: string | null
          statut?: string
          tenant_id?: string
          type_engagement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagements_tresorerie_compte_bancaire_id_fkey"
            columns: ["compte_bancaire_id"]
            isOneToOne: false
            referencedRelation: "comptes_bancaires"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations_fournisseurs: {
        Row: {
          commande_id: string | null
          commentaires: string | null
          created_at: string
          date_evaluation: string
          evaluateur_id: string | null
          fournisseur_id: string
          id: string
          note_delai: number | null
          note_globale: number | null
          note_prix: number | null
          note_qualite: number | null
          note_service: number | null
          recommande: boolean | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          commande_id?: string | null
          commentaires?: string | null
          created_at?: string
          date_evaluation?: string
          evaluateur_id?: string | null
          fournisseur_id: string
          id?: string
          note_delai?: number | null
          note_globale?: number | null
          note_prix?: number | null
          note_qualite?: number | null
          note_service?: number | null
          recommande?: boolean | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commande_id?: string | null
          commentaires?: string | null
          created_at?: string
          date_evaluation?: string
          evaluateur_id?: string | null
          fournisseur_id?: string
          id?: string
          note_delai?: number | null
          note_globale?: number | null
          note_prix?: number | null
          note_qualite?: number | null
          note_service?: number | null
          recommande?: boolean | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_fournisseurs_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_fournisseurs_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices_comptables: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          libelle_exercice: string
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          libelle_exercice: string
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          libelle_exercice?: string
          statut?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercices_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercices_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          connection_config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_connection_at: string | null
          last_error: string | null
          last_sync_at: string | null
          metadata: Json | null
          provider_name: string
          status: string | null
          sync_settings: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_connection_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider_name: string
          status?: string | null
          sync_settings?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_connection_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider_name?: string
          status?: string | null
          sync_settings?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          client_id: string | null
          created_at: string
          created_by_id: string | null
          date_echeance: string
          date_emission: string
          derniere_relance: string | null
          fournisseur_id: string | null
          id: string
          libelle: string
          montant_ht: number
          montant_paye: number
          montant_restant: number
          montant_ttc: number
          montant_tva: number
          notes: string | null
          numero: string
          pieces_jointes: Json | null
          reception_id: string | null
          reference_externe: string | null
          relances_effectuees: number
          statut: string
          statut_paiement: string
          tenant_id: string
          type: string
          updated_at: string
          vente_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_echeance: string
          date_emission?: string
          derniere_relance?: string | null
          fournisseur_id?: string | null
          id?: string
          libelle: string
          montant_ht?: number
          montant_paye?: number
          montant_restant?: number
          montant_ttc?: number
          montant_tva?: number
          notes?: string | null
          numero: string
          pieces_jointes?: Json | null
          reception_id?: string | null
          reference_externe?: string | null
          relances_effectuees?: number
          statut?: string
          statut_paiement?: string
          tenant_id: string
          type: string
          updated_at?: string
          vente_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_echeance?: string
          date_emission?: string
          derniere_relance?: string | null
          fournisseur_id?: string | null
          id?: string
          libelle?: string
          montant_ht?: number
          montant_paye?: number
          montant_restant?: number
          montant_ttc?: number
          montant_tva?: number
          notes?: string | null
          numero?: string
          pieces_jointes?: Json | null
          reception_id?: string | null
          reference_externe?: string | null
          relances_effectuees?: number
          statut?: string
          statut_paiement?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "receptions_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      factures_importees: {
        Row: {
          centime_additionnel: number | null
          created_at: string
          created_by: string | null
          date_facture: string
          devise: string | null
          fichier_original: string | null
          fournisseur_id: string | null
          fournisseur_nom: string | null
          id: string
          lignes: Json | null
          metadata: Json | null
          montant_ht: number | null
          montant_ttc: number | null
          montant_tva: number | null
          notes: string | null
          numero_facture: string
          source_import: string | null
          statut: string | null
          tenant_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          centime_additionnel?: number | null
          created_at?: string
          created_by?: string | null
          date_facture: string
          devise?: string | null
          fichier_original?: string | null
          fournisseur_id?: string | null
          fournisseur_nom?: string | null
          id?: string
          lignes?: Json | null
          metadata?: Json | null
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_facture: string
          source_import?: string | null
          statut?: string | null
          tenant_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          centime_additionnel?: number | null
          created_at?: string
          created_by?: string | null
          date_facture?: string
          devise?: string | null
          fichier_original?: string | null
          fournisseur_id?: string | null
          fournisseur_nom?: string | null
          id?: string
          lignes?: Json | null
          metadata?: Json | null
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_facture?: string
          source_import?: string | null
          statut?: string | null
          tenant_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_importees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_importees_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_importees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_importees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_importees_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      famille_produit: {
        Row: {
          created_at: string
          description: string | null
          id: string
          libelle_famille: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_famille: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_famille?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "famille_produit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famille_produit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      fec_exports: {
        Row: {
          created_at: string | null
          download_count: number | null
          downloaded_at: string | null
          downloaded_by: string | null
          end_date: string
          exercice_id: string | null
          export_status: string | null
          exported_by: string | null
          file_path: string | null
          file_size_mb: number | null
          format: string | null
          generation_duration_seconds: number | null
          id: string
          include_analytics: boolean | null
          start_date: string
          tenant_id: string
          total_entries: number | null
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          downloaded_at?: string | null
          downloaded_by?: string | null
          end_date: string
          exercice_id?: string | null
          export_status?: string | null
          exported_by?: string | null
          file_path?: string | null
          file_size_mb?: number | null
          format?: string | null
          generation_duration_seconds?: number | null
          id?: string
          include_analytics?: boolean | null
          start_date: string
          tenant_id: string
          total_entries?: number | null
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          downloaded_at?: string | null
          downloaded_by?: string | null
          end_date?: string
          exercice_id?: string | null
          export_status?: string | null
          exported_by?: string | null
          file_path?: string | null
          file_size_mb?: number | null
          format?: string | null
          generation_duration_seconds?: number | null
          id?: string
          include_analytics?: boolean | null
          start_date?: string
          tenant_id?: string
          total_entries?: number | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fec_exports_downloaded_by_fkey"
            columns: ["downloaded_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fec_exports_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fec_exports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fec_exports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_employes: {
        Row: {
          certificat_requis: boolean
          cout: number | null
          created_at: string
          date_debut: string
          date_fin: string
          description: string | null
          duree: number
          id: string
          lieu: string
          nom: string
          organisme: string
          statut: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          certificat_requis?: boolean
          cout?: number | null
          created_at?: string
          date_debut: string
          date_fin: string
          description?: string | null
          duree: number
          id?: string
          lieu: string
          nom: string
          organisme: string
          statut?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          certificat_requis?: boolean
          cout?: number | null
          created_at?: string
          date_debut?: string
          date_fin?: string
          description?: string | null
          duree?: number
          id?: string
          lieu?: string
          nom?: string
          organisme?: string
          statut?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_employes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formations_employes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      formes_galeniques: {
        Row: {
          created_at: string
          description: string | null
          id: string
          libelle_forme: string
          tenant_id: string
          updated_at: string
          voie_administration: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_forme: string
          tenant_id: string
          updated_at?: string
          voie_administration?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_forme?: string
          tenant_id?: string
          updated_at?: string
          voie_administration?: string | null
        }
        Relationships: []
      }
      fournisseurs: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          id_fournisseur_import: string | null
          mp_fournisseur_import: string | null
          niu: string | null
          nom: string
          pharmaml_cle_secrete: string | null
          pharmaml_code_repartiteur: string | null
          pharmaml_enabled: boolean | null
          pharmaml_id_officine: string | null
          pharmaml_id_repartiteur: string | null
          pharmaml_pays: string | null
          pharmaml_url: string | null
          statut: string | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
          url_fournisseur_import: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_fournisseur_import?: string | null
          mp_fournisseur_import?: string | null
          niu?: string | null
          nom: string
          pharmaml_cle_secrete?: string | null
          pharmaml_code_repartiteur?: string | null
          pharmaml_enabled?: boolean | null
          pharmaml_id_officine?: string | null
          pharmaml_id_repartiteur?: string | null
          pharmaml_pays?: string | null
          pharmaml_url?: string | null
          statut?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
          url_fournisseur_import?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_fournisseur_import?: string | null
          mp_fournisseur_import?: string | null
          niu?: string | null
          nom?: string
          pharmaml_cle_secrete?: string | null
          pharmaml_code_repartiteur?: string | null
          pharmaml_enabled?: boolean | null
          pharmaml_id_officine?: string | null
          pharmaml_id_repartiteur?: string | null
          pharmaml_pays?: string | null
          pharmaml_url?: string | null
          statut?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
          url_fournisseur_import?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      global_alert_settings: {
        Row: {
          alert_retention_days: number
          auto_cleanup_enabled: boolean | null
          business_days: number[] | null
          business_end_time: string | null
          business_hours_only: boolean | null
          business_start_time: string | null
          check_frequency_minutes: number
          created_at: string
          default_email_template: string | null
          default_sms_template: string | null
          default_whatsapp_template: string | null
          duplicate_alert_cooldown_minutes: number | null
          escalation_delay_minutes: number | null
          escalation_enabled: boolean
          id: string
          max_alerts_per_hour: number | null
          max_escalation_level: number | null
          system_enabled: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_retention_days?: number
          auto_cleanup_enabled?: boolean | null
          business_days?: number[] | null
          business_end_time?: string | null
          business_hours_only?: boolean | null
          business_start_time?: string | null
          check_frequency_minutes?: number
          created_at?: string
          default_email_template?: string | null
          default_sms_template?: string | null
          default_whatsapp_template?: string | null
          duplicate_alert_cooldown_minutes?: number | null
          escalation_delay_minutes?: number | null
          escalation_enabled?: boolean
          id?: string
          max_alerts_per_hour?: number | null
          max_escalation_level?: number | null
          system_enabled?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_retention_days?: number
          auto_cleanup_enabled?: boolean | null
          business_days?: number[] | null
          business_end_time?: string | null
          business_hours_only?: boolean | null
          business_start_time?: string | null
          check_frequency_minutes?: number
          created_at?: string
          default_email_template?: string | null
          default_sms_template?: string | null
          default_whatsapp_template?: string | null
          duplicate_alert_cooldown_minutes?: number | null
          escalation_delay_minutes?: number | null
          escalation_enabled?: boolean
          id?: string
          max_alerts_per_hour?: number | null
          max_escalation_level?: number | null
          system_enabled?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          faq_items: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          keywords: string[] | null
          media_urls: string[] | null
          steps: Json | null
          summary: string | null
          tenant_id: string
          title: string
          translations: Json | null
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          faq_items?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string[] | null
          media_urls?: string[] | null
          steps?: Json | null
          summary?: string | null
          tenant_id: string
          title: string
          translations?: Json | null
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          faq_items?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          keywords?: string[] | null
          media_urls?: string[] | null
          steps?: Json | null
          summary?: string | null
          tenant_id?: string
          title?: string
          translations?: Json | null
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          module_key: string | null
          name: string
          order_index: number | null
          parent_id: string | null
          tenant_id: string
          translations: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module_key?: string | null
          name: string
          order_index?: number | null
          parent_id?: string | null
          tenant_id: string
          translations?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module_key?: string | null
          name?: string
          order_index?: number | null
          parent_id?: string | null
          tenant_id?: string
          translations?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      help_history: {
        Row: {
          accessed_at: string
          article_id: string | null
          helpful_vote: boolean | null
          id: string
          search_query: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          article_id?: string | null
          helpful_vote?: boolean | null
          id?: string
          search_query?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          article_id?: string | null
          helpful_vote?: boolean | null
          id?: string
          search_query?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      help_settings: {
        Row: {
          ai_suggestions_enabled: boolean | null
          created_at: string
          default_language: string | null
          enable_search_analytics: boolean | null
          id: string
          max_recent_items: number | null
          show_video_tutorials: boolean | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_suggestions_enabled?: boolean | null
          created_at?: string
          default_language?: string | null
          enable_search_analytics?: boolean | null
          id?: string
          max_recent_items?: number | null
          show_video_tutorials?: boolean | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_suggestions_enabled?: boolean | null
          created_at?: string
          default_language?: string | null
          enable_search_analytics?: boolean | null
          id?: string
          max_recent_items?: number | null
          show_video_tutorials?: boolean | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      immobilisations: {
        Row: {
          compte_id: string | null
          created_at: string
          date_acquisition: string
          duree_amortissement: number | null
          id: string
          libelle: string
          statut: string | null
          taux_amortissement: number | null
          tenant_id: string
          updated_at: string
          valeur_acquisition: number
          valeur_residuelle: number | null
        }
        Insert: {
          compte_id?: string | null
          created_at?: string
          date_acquisition: string
          duree_amortissement?: number | null
          id?: string
          libelle: string
          statut?: string | null
          taux_amortissement?: number | null
          tenant_id: string
          updated_at?: string
          valeur_acquisition: number
          valeur_residuelle?: number | null
        }
        Update: {
          compte_id?: string | null
          created_at?: string
          date_acquisition?: string
          duree_amortissement?: number | null
          id?: string
          libelle?: string
          statut?: string | null
          taux_amortissement?: number | null
          tenant_id?: string
          updated_at?: string
          valeur_acquisition?: number
          valeur_residuelle?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "immobilisations_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immobilisations_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immobilisations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immobilisations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          incident_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          incident_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          incident_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      inventaire_items: {
        Row: {
          code_barre: string
          created_at: string
          date_comptage: string | null
          emplacement_reel: string | null
          emplacement_theorique: string
          id: string
          lot_id: string | null
          lot_numero: string | null
          notes: string | null
          operateur_id: string | null
          operateur_nom: string | null
          produit_id: string | null
          produit_nom: string
          quantite_comptee: number | null
          quantite_theorique: number
          session_id: string
          statut: string
          tenant_id: string
          unite: string
          updated_at: string
        }
        Insert: {
          code_barre: string
          created_at?: string
          date_comptage?: string | null
          emplacement_reel?: string | null
          emplacement_theorique?: string
          id?: string
          lot_id?: string | null
          lot_numero?: string | null
          notes?: string | null
          operateur_id?: string | null
          operateur_nom?: string | null
          produit_id?: string | null
          produit_nom: string
          quantite_comptee?: number | null
          quantite_theorique?: number
          session_id: string
          statut?: string
          tenant_id: string
          unite?: string
          updated_at?: string
        }
        Update: {
          code_barre?: string
          created_at?: string
          date_comptage?: string | null
          emplacement_reel?: string | null
          emplacement_theorique?: string
          id?: string
          lot_id?: string | null
          lot_numero?: string | null
          notes?: string | null
          operateur_id?: string | null
          operateur_nom?: string | null
          produit_id?: string | null
          produit_nom?: string
          quantite_comptee?: number | null
          quantite_theorique?: number
          session_id?: string
          statut?: string
          tenant_id?: string
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventaire_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_items_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_items_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_items_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_items_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_items_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "inventaire_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventaire_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventaire_rapports: {
        Row: {
          contenu: Json | null
          created_at: string
          date_generation: string
          fichier_url: string | null
          format: string | null
          genere_par_id: string | null
          id: string
          nom: string
          parametres: Json | null
          session_id: string | null
          statut: string | null
          taille_fichier: number | null
          tenant_id: string
          type: string
        }
        Insert: {
          contenu?: Json | null
          created_at?: string
          date_generation?: string
          fichier_url?: string | null
          format?: string | null
          genere_par_id?: string | null
          id?: string
          nom: string
          parametres?: Json | null
          session_id?: string | null
          statut?: string | null
          taille_fichier?: number | null
          tenant_id: string
          type: string
        }
        Update: {
          contenu?: Json | null
          created_at?: string
          date_generation?: string
          fichier_url?: string | null
          format?: string | null
          genere_par_id?: string | null
          id?: string
          nom?: string
          parametres?: Json | null
          session_id?: string | null
          statut?: string | null
          taille_fichier?: number | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventaire_rapports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventaire_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventaire_saisies: {
        Row: {
          code_barre: string
          created_at: string
          date_saisie: string
          emplacement: string | null
          id: string
          lot_id: string | null
          notes: string | null
          operateur_id: string
          produit_id: string | null
          produit_trouve: boolean | null
          quantite: number
          session_id: string
          tenant_id: string
        }
        Insert: {
          code_barre: string
          created_at?: string
          date_saisie?: string
          emplacement?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          operateur_id: string
          produit_id?: string | null
          produit_trouve?: boolean | null
          quantite?: number
          session_id: string
          tenant_id: string
        }
        Update: {
          code_barre?: string
          created_at?: string
          date_saisie?: string
          emplacement?: string | null
          id?: string
          lot_id?: string | null
          notes?: string | null
          operateur_id?: string
          produit_id?: string | null
          produit_trouve?: boolean | null
          quantite?: number
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventaire_saisies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventaire_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventaire_sessions: {
        Row: {
          agent_id: string
          created_at: string
          cyclique_jours: number | null
          date_creation: string | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          ecarts: number | null
          filtres_emplacement: string[] | null
          filtres_fournisseur: string[] | null
          filtres_peremption_jours: number | null
          filtres_rayon: string[] | null
          id: string
          nom: string | null
          participants: string[] | null
          produits_comptes: number | null
          produits_total: number | null
          progression: number | null
          responsable: string | null
          secteurs: string[] | null
          statut: string | null
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          cyclique_jours?: number | null
          date_creation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          ecarts?: number | null
          filtres_emplacement?: string[] | null
          filtres_fournisseur?: string[] | null
          filtres_peremption_jours?: number | null
          filtres_rayon?: string[] | null
          id?: string
          nom?: string | null
          participants?: string[] | null
          produits_comptes?: number | null
          produits_total?: number | null
          progression?: number | null
          responsable?: string | null
          secteurs?: string[] | null
          statut?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          cyclique_jours?: number | null
          date_creation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          ecarts?: number | null
          filtres_emplacement?: string[] | null
          filtres_fournisseur?: string[] | null
          filtres_peremption_jours?: number | null
          filtres_rayon?: string[] | null
          id?: string
          nom?: string | null
          participants?: string[] | null
          produits_comptes?: number | null
          produits_total?: number | null
          progression?: number | null
          responsable?: string | null
          secteurs?: string[] | null
          statut?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventaire_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventaire_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      journaux_comptables: {
        Row: {
          auto_generation: boolean | null
          code_journal: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          libelle_journal: string
          prefixe: string | null
          sequence_courante: number | null
          tenant_id: string
          type_journal: string
          updated_at: string
        }
        Insert: {
          auto_generation?: boolean | null
          code_journal: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_journal: string
          prefixe?: string | null
          sequence_courante?: number | null
          tenant_id: string
          type_journal: string
          updated_at?: string
        }
        Update: {
          auto_generation?: boolean | null
          code_journal?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_journal?: string
          prefixe?: string | null
          sequence_courante?: number | null
          tenant_id?: string
          type_journal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journaux_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journaux_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      journaux_comptables_globaux: {
        Row: {
          code_journal: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          libelle_journal: string
          plan_comptable_id: string
          type_journal: string
        }
        Insert: {
          code_journal: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_journal: string
          plan_comptable_id: string
          type_journal: string
        }
        Update: {
          code_journal?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_journal?: string
          plan_comptable_id?: string
          type_journal?: string
        }
        Relationships: [
          {
            foreignKeyName: "journaux_comptables_globaux_plan_comptable_id_fkey"
            columns: ["plan_comptable_id"]
            isOneToOne: false
            referencedRelation: "plans_comptables_globaux"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratoires: {
        Row: {
          created_at: string
          email_delegation_local: string | null
          email_siege: string | null
          id: string
          libelle: string
          pays_siege: string | null
          telephone_appel_delegation_local: string | null
          telephone_whatsapp_delegation_local: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_delegation_local?: string | null
          email_siege?: string | null
          id?: string
          libelle: string
          pays_siege?: string | null
          telephone_appel_delegation_local?: string | null
          telephone_whatsapp_delegation_local?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_delegation_local?: string | null
          email_siege?: string | null
          id?: string
          libelle?: string
          pays_siege?: string | null
          telephone_appel_delegation_local?: string | null
          telephone_whatsapp_delegation_local?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratoires_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratoires_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_commande_fournisseur: {
        Row: {
          commande_id: string
          created_at: string
          id: string
          prix_achat_unitaire_attendu: number | null
          produit_id: string
          quantite_commandee: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          commande_id: string
          created_at?: string
          id?: string
          prix_achat_unitaire_attendu?: number | null
          produit_id: string
          quantite_commandee: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commande_id?: string
          created_at?: string
          id?: string
          prix_achat_unitaire_attendu?: number | null
          produit_id?: string
          quantite_commandee?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_commande_fournisseur_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "lignes_commande_fournisseur_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_fournisseur_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_echeancier: {
        Row: {
          created_at: string
          date_echeance: string
          date_paiement: string | null
          echeancier_id: string
          id: string
          montant_echeance: number
          montant_paye: number
          montant_restant: number
          notes: string | null
          numero_echeance: number
          paiement_facture_id: string | null
          statut: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_echeance: string
          date_paiement?: string | null
          echeancier_id: string
          id?: string
          montant_echeance: number
          montant_paye?: number
          montant_restant: number
          notes?: string | null
          numero_echeance: number
          paiement_facture_id?: string | null
          statut?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_echeance?: string
          date_paiement?: string | null
          echeancier_id?: string
          id?: string
          montant_echeance?: number
          montant_paye?: number
          montant_restant?: number
          notes?: string | null
          numero_echeance?: number
          paiement_facture_id?: string | null
          statut?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_echeancier_echeancier_id_fkey"
            columns: ["echeancier_id"]
            isOneToOne: false
            referencedRelation: "echeanciers_paiements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_echeancier_paiement_facture_id_fkey"
            columns: ["paiement_facture_id"]
            isOneToOne: false
            referencedRelation: "paiements_factures"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_ecriture: {
        Row: {
          centre_cout_id: string | null
          compte_id: string
          created_at: string
          credit: number | null
          debit: number | null
          ecriture_id: string
          id: string
          libelle: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          centre_cout_id?: string | null
          compte_id: string
          created_at?: string
          credit?: number | null
          debit?: number | null
          ecriture_id: string
          id?: string
          libelle?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          centre_cout_id?: string | null
          compte_id?: string
          created_at?: string
          credit?: number | null
          debit?: number | null
          ecriture_id?: string
          id?: string
          libelle?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_ecriture_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "v_performance_centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_ecriture_id_fkey"
            columns: ["ecriture_id"]
            isOneToOne: false
            referencedRelation: "ecritures_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_ecriture_id_fkey"
            columns: ["ecriture_id"]
            isOneToOne: false
            referencedRelation: "v_ecritures_avec_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ecriture_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_facture: {
        Row: {
          created_at: string
          designation: string
          facture_id: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          prix_unitaire: number
          quantite: number
          taux_tva: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation: string
          facture_id: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          prix_unitaire?: number
          quantite?: number
          taux_tva?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string
          facture_id?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          prix_unitaire?: number
          quantite?: number
          taux_tva?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_facture_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_facture_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_prescriptions: {
        Row: {
          created_at: string | null
          dosage: string | null
          duree_traitement: string | null
          id: string
          nom_medicament: string
          notes: string | null
          posologie: string | null
          prescription_id: string
          produit_id: string | null
          quantite_prescrite: number
          quantite_servie: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          duree_traitement?: string | null
          id?: string
          nom_medicament: string
          notes?: string | null
          posologie?: string | null
          prescription_id: string
          produit_id?: string | null
          quantite_prescrite: number
          quantite_servie?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          duree_traitement?: string | null
          id?: string
          nom_medicament?: string
          notes?: string | null
          posologie?: string | null
          prescription_id?: string
          produit_id?: string | null
          quantite_prescrite?: number
          quantite_servie?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_prescriptions_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_prescriptions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_prescriptions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_prescriptions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_prescriptions_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "lignes_prescriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_prescriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_reception_fournisseur: {
        Row: {
          categorie_tarification_id: string | null
          commentaire: string | null
          created_at: string
          date_peremption: string | null
          emplacement: string | null
          id: string
          lot_id: string | null
          numero_lot: string | null
          prix_achat_reel: number | null
          prix_achat_unitaire_reel: number
          produit_id: string
          quantite_acceptee: number | null
          quantite_commandee: number | null
          quantite_recue: number
          reception_id: string
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          categorie_tarification_id?: string | null
          commentaire?: string | null
          created_at?: string
          date_peremption?: string | null
          emplacement?: string | null
          id?: string
          lot_id?: string | null
          numero_lot?: string | null
          prix_achat_reel?: number | null
          prix_achat_unitaire_reel: number
          produit_id: string
          quantite_acceptee?: number | null
          quantite_commandee?: number | null
          quantite_recue: number
          reception_id: string
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          categorie_tarification_id?: string | null
          commentaire?: string | null
          created_at?: string
          date_peremption?: string | null
          emplacement?: string | null
          id?: string
          lot_id?: string | null
          numero_lot?: string | null
          prix_achat_reel?: number | null
          prix_achat_unitaire_reel?: number
          produit_id?: string
          quantite_acceptee?: number | null
          quantite_commandee?: number | null
          quantite_recue?: number
          reception_id?: string
          statut?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_reception_fournisseur_categorie_tarification_id_fkey"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "receptions_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_fournisseur_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_repartition: {
        Row: {
          centre_cout_id: string
          coefficient: number
          compte_destination_id: string | null
          created_at: string
          id: string
          justification: string | null
          montant: number
          repartition_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          centre_cout_id: string
          coefficient: number
          compte_destination_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          montant: number
          repartition_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          centre_cout_id?: string
          coefficient?: number
          compte_destination_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          montant?: number
          repartition_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_repartition_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_repartition_centre_cout_id_fkey"
            columns: ["centre_cout_id"]
            isOneToOne: false
            referencedRelation: "v_performance_centres_couts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_repartition_compte_destination_id_fkey"
            columns: ["compte_destination_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_repartition_compte_destination_id_fkey"
            columns: ["compte_destination_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_repartition_repartition_id_fkey"
            columns: ["repartition_id"]
            isOneToOne: false
            referencedRelation: "repartitions_charges"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_retours: {
        Row: {
          created_at: string | null
          etat_produit: string | null
          id: string
          lot_id: string | null
          montant_ligne: number
          motif_ligne: string | null
          prix_unitaire: number
          produit_id: string | null
          quantite_retournee: number
          remis_en_stock: boolean | null
          retour_id: string
          taux_remboursement: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          etat_produit?: string | null
          id?: string
          lot_id?: string | null
          montant_ligne: number
          motif_ligne?: string | null
          prix_unitaire: number
          produit_id?: string | null
          quantite_retournee: number
          remis_en_stock?: boolean | null
          retour_id: string
          taux_remboursement?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          etat_produit?: string | null
          id?: string
          lot_id?: string | null
          montant_ligne?: number
          motif_ligne?: string | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite_retournee?: number
          remis_en_stock?: boolean | null
          retour_id?: string
          taux_remboursement?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_retours_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retours_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retours_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retours_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retours_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "lignes_retours_retour_id_fkey"
            columns: ["retour_id"]
            isOneToOne: false
            referencedRelation: "retours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_retours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_ventes: {
        Row: {
          created_at: string
          date_peremption_lot: string | null
          id: string
          lot_id: string | null
          montant_centime_ligne: number | null
          montant_ligne_ttc: number
          montant_tva_ligne: number | null
          numero_lot: string | null
          prix_unitaire_ht: number
          prix_unitaire_ttc: number
          produit_id: string
          quantite: number
          remise_ligne: number | null
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string
          updated_at: string
          vente_id: string
        }
        Insert: {
          created_at?: string
          date_peremption_lot?: string | null
          id?: string
          lot_id?: string | null
          montant_centime_ligne?: number | null
          montant_ligne_ttc: number
          montant_tva_ligne?: number | null
          numero_lot?: string | null
          prix_unitaire_ht: number
          prix_unitaire_ttc: number
          produit_id: string
          quantite: number
          remise_ligne?: number | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id: string
          updated_at?: string
          vente_id: string
        }
        Update: {
          created_at?: string
          date_peremption_lot?: string | null
          id?: string
          lot_id?: string | null
          montant_centime_ligne?: number | null
          montant_ligne_ttc?: number
          montant_tva_ligne?: number | null
          numero_lot?: string | null
          prix_unitaire_ht?: number
          prix_unitaire_ttc?: number
          produit_id?: string
          quantite?: number
          remise_ligne?: number | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id?: string
          updated_at?: string
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_ventes_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ventes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ventes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ventes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ventes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "lignes_ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_ventes_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success: boolean
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_barcode_sequences: {
        Row: {
          created_at: string
          date_key: string
          id: string
          last_sequence: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_key: string
          id?: string
          last_sequence?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_key?: string
          id?: string
          last_sequence?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_barcode_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_barcode_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_optimization_metrics: {
        Row: {
          created_at: string | null
          expirations_avoided: number | null
          expirations_avoided_value: number | null
          fifo_corrections: number | null
          id: string
          metadata: Json | null
          metric_date: string | null
          stock_reorders_suggested: number | null
          suggestions_applied: number | null
          suggestions_ignored: number | null
          tenant_id: string
          total_savings: number | null
          total_suggestions_generated: number | null
        }
        Insert: {
          created_at?: string | null
          expirations_avoided?: number | null
          expirations_avoided_value?: number | null
          fifo_corrections?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string | null
          stock_reorders_suggested?: number | null
          suggestions_applied?: number | null
          suggestions_ignored?: number | null
          tenant_id: string
          total_savings?: number | null
          total_suggestions_generated?: number | null
        }
        Update: {
          created_at?: string | null
          expirations_avoided?: number | null
          expirations_avoided_value?: number | null
          fifo_corrections?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string | null
          stock_reorders_suggested?: number | null
          suggestions_applied?: number | null
          suggestions_ignored?: number | null
          tenant_id?: string
          total_savings?: number | null
          total_suggestions_generated?: number | null
        }
        Relationships: []
      }
      lot_optimization_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lot_optimization_suggestions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          expected_benefit: string | null
          id: string
          lot_id: string | null
          priority: string
          product_id: string | null
          status: string | null
          suggested_value: number | null
          suggestion_type: string
          tenant_id: string
          title: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          expected_benefit?: string | null
          id?: string
          lot_id?: string | null
          priority: string
          product_id?: string | null
          status?: string | null
          suggested_value?: number | null
          suggestion_type: string
          tenant_id: string
          title: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          expected_benefit?: string | null
          id?: string
          lot_id?: string | null
          priority?: string
          product_id?: string | null
          status?: string | null
          suggested_value?: number | null
          suggestion_type?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_optimization_suggestions_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_optimization_suggestions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_optimization_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_optimization_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_optimization_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_optimization_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
        ]
      }
      lots: {
        Row: {
          categorie_tarification_id: string | null
          code_barre: string | null
          created_at: string
          date_fabrication: string | null
          date_peremption: string | null
          date_reception: string | null
          emplacement: string | null
          fournisseur_id: string | null
          id: string
          montant_centime_additionnel: number | null
          montant_tva: number | null
          notes: string | null
          numero_lot: string
          prix_achat_unitaire: number | null
          prix_vente_ht: number | null
          prix_vente_suggere: number | null
          prix_vente_ttc: number | null
          produit_id: string
          quantite_initiale: number
          quantite_restante: number
          reception_id: string | null
          statut: string | null
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          categorie_tarification_id?: string | null
          code_barre?: string | null
          created_at?: string
          date_fabrication?: string | null
          date_peremption?: string | null
          date_reception?: string | null
          emplacement?: string | null
          fournisseur_id?: string | null
          id?: string
          montant_centime_additionnel?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_lot: string
          prix_achat_unitaire?: number | null
          prix_vente_ht?: number | null
          prix_vente_suggere?: number | null
          prix_vente_ttc?: number | null
          produit_id: string
          quantite_initiale: number
          quantite_restante: number
          reception_id?: string | null
          statut?: string | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          categorie_tarification_id?: string | null
          code_barre?: string | null
          created_at?: string
          date_fabrication?: string | null
          date_peremption?: string | null
          date_reception?: string | null
          emplacement?: string | null
          fournisseur_id?: string | null
          id?: string
          montant_centime_additionnel?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_lot?: string
          prix_achat_unitaire?: number | null
          prix_vente_ht?: number | null
          prix_vente_suggere?: number | null
          prix_vente_ttc?: number | null
          produit_id?: string
          quantite_initiale?: number
          quantite_restante?: number
          reception_id?: string | null
          statut?: string | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_categorie_tarification_id_fkey"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "lots_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "receptions_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_actions_log: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          error_message: string | null
          executed_at: string
          executed_by: string | null
          id: string
          produit_id: string
          result_status: string | null
          tenant_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          produit_id: string
          result_status?: string | null
          tenant_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          produit_id?: string
          result_status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "low_stock_actions_log_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_actions_log_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_actions_log_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_actions_log_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_actions_log_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
        ]
      }
      margin_rules: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          id: string
          margin: number
          max_price: number | null
          min_price: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          id?: string
          margin?: number
          max_price?: number | null
          min_price?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          id?: string
          margin?: number
          max_price?: number | null
          min_price?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      metriques_performance_lots: {
        Row: {
          created_at: string | null
          expirations_avoided: number | null
          expirations_avoided_value: number | null
          fifo_corrections: number | null
          id: string
          metadata: Json | null
          metric_date: string
          stock_reorders_suggested: number | null
          suggestions_applied: number | null
          suggestions_ignored: number | null
          tenant_id: string
          total_savings: number | null
          total_suggestions_generated: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expirations_avoided?: number | null
          expirations_avoided_value?: number | null
          fifo_corrections?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          stock_reorders_suggested?: number | null
          suggestions_applied?: number | null
          suggestions_ignored?: number | null
          tenant_id: string
          total_savings?: number | null
          total_suggestions_generated?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expirations_avoided?: number | null
          expirations_avoided_value?: number | null
          fifo_corrections?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          stock_reorders_suggested?: number | null
          suggestions_applied?: number | null
          suggestions_ignored?: number | null
          tenant_id?: string
          total_savings?: number | null
          total_suggestions_generated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      modes_paiement_config: {
        Row: {
          code: string
          compte_bancaire_id: string | null
          compte_comptable_id: string | null
          couleur: string | null
          created_at: string
          delai_encaissement: number | null
          est_actif: boolean
          exige_reference: boolean
          exige_validation: boolean
          frais_fixes: number | null
          frais_pourcentage: number | null
          icone: string | null
          id: string
          libelle: string
          montant_maximum: number | null
          montant_minimum: number | null
          notes: string | null
          ordre_affichage: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          compte_bancaire_id?: string | null
          compte_comptable_id?: string | null
          couleur?: string | null
          created_at?: string
          delai_encaissement?: number | null
          est_actif?: boolean
          exige_reference?: boolean
          exige_validation?: boolean
          frais_fixes?: number | null
          frais_pourcentage?: number | null
          icone?: string | null
          id?: string
          libelle: string
          montant_maximum?: number | null
          montant_minimum?: number | null
          notes?: string | null
          ordre_affichage?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          compte_bancaire_id?: string | null
          compte_comptable_id?: string | null
          couleur?: string | null
          created_at?: string
          delai_encaissement?: number | null
          est_actif?: boolean
          exige_reference?: boolean
          exige_validation?: boolean
          frais_fixes?: number | null
          frais_pourcentage?: number | null
          icone?: string | null
          id?: string
          libelle?: string
          montant_maximum?: number | null
          montant_minimum?: number | null
          notes?: string | null
          ordre_affichage?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modes_paiement_config_compte_bancaire_id_fkey"
            columns: ["compte_bancaire_id"]
            isOneToOne: false
            referencedRelation: "comptes_bancaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modes_paiement_config_compte_comptable_id_fkey"
            columns: ["compte_comptable_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modes_paiement_config_compte_comptable_id_fkey"
            columns: ["compte_comptable_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
        ]
      }
      module_sync_configs: {
        Row: {
          auto_sync: boolean | null
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          is_enabled: boolean | null
          last_sync_at: string | null
          last_sync_status: string | null
          module_name: string
          sync_count: number | null
          sync_frequency: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_sync?: boolean | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          module_name: string
          sync_count?: number | null
          sync_frequency?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_sync?: boolean | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          module_name?: string
          sync_count?: number | null
          sync_frequency?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_sync_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_sync_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      module_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_details: Json | null
          id: string
          module_name: string
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string | null
          status: string | null
          sync_config_id: string | null
          sync_type: string | null
          tenant_id: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          id?: string
          module_name: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_config_id?: string | null
          sync_type?: string | null
          tenant_id: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          id?: string
          module_name?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          sync_config_id?: string | null
          sync_type?: string | null
          tenant_id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_sync_logs_sync_config_id_fkey"
            columns: ["sync_config_id"]
            isOneToOne: false
            referencedRelation: "module_sync_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_sync_logs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_caisse: {
        Row: {
          agent_id: string | null
          annule_par: string | null
          created_at: string
          date_annulation: string | null
          date_mouvement: string | null
          description: string | null
          est_annule: boolean | null
          id: string
          montant: number
          motif: string
          motif_annulation: string | null
          notes: string | null
          reference: string | null
          reference_id: string | null
          reference_type: string | null
          session_caisse_id: string
          tenant_id: string
          type_mouvement: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          annule_par?: string | null
          created_at?: string
          date_annulation?: string | null
          date_mouvement?: string | null
          description?: string | null
          est_annule?: boolean | null
          id?: string
          montant: number
          motif: string
          motif_annulation?: string | null
          notes?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          session_caisse_id: string
          tenant_id: string
          type_mouvement: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          annule_par?: string | null
          created_at?: string
          date_annulation?: string | null
          date_mouvement?: string | null
          description?: string | null
          est_annule?: boolean | null
          id?: string
          montant?: number
          motif?: string
          motif_annulation?: string | null
          notes?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          session_caisse_id?: string
          tenant_id?: string
          type_mouvement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_caisse_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_annule_par_fkey"
            columns: ["annule_par"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "v_rapport_session_complet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "v_sessions_caisse_resumees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_lots: {
        Row: {
          agent_id: string | null
          created_at: string | null
          date_mouvement: string | null
          emplacement_destination: string | null
          emplacement_source: string | null
          id: string
          lot_destination_id: string | null
          lot_id: string
          metadata: Json | null
          motif: string | null
          prix_unitaire: number | null
          produit_id: string
          quantite_apres: number
          quantite_avant: number
          quantite_mouvement: number
          reference_document: string | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          type_mouvement: string
          valeur_mouvement: number | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          date_mouvement?: string | null
          emplacement_destination?: string | null
          emplacement_source?: string | null
          id?: string
          lot_destination_id?: string | null
          lot_id: string
          metadata?: Json | null
          motif?: string | null
          prix_unitaire?: number | null
          produit_id: string
          quantite_apres: number
          quantite_avant: number
          quantite_mouvement: number
          reference_document?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          type_mouvement: string
          valeur_mouvement?: number | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          date_mouvement?: string | null
          emplacement_destination?: string | null
          emplacement_source?: string | null
          id?: string
          lot_destination_id?: string | null
          lot_id?: string
          metadata?: Json | null
          motif?: string | null
          prix_unitaire?: number | null
          produit_id?: string
          quantite_apres?: number
          quantite_avant?: number
          quantite_mouvement?: number
          reference_document?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          type_mouvement?: string
          valeur_mouvement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mouvements_lots_lot_destination_id"
            columns: ["lot_destination_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mouvements_lots_lot_id"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mouvements_lots_produit_id"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mouvements_lots_produit_id"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mouvements_lots_produit_id"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mouvements_lots_produit_id"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "mouvements_lots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_points: {
        Row: {
          agent_id: string | null
          created_at: string | null
          date_expiration: string | null
          date_mouvement: string | null
          description: string | null
          id: string
          montant_points: number
          points_apres: number
          points_avant: number
          programme_id: string
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          type_mouvement: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          date_expiration?: string | null
          date_mouvement?: string | null
          description?: string | null
          id?: string
          montant_points: number
          points_apres: number
          points_avant: number
          programme_id: string
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          type_mouvement: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          date_expiration?: string | null
          date_mouvement?: string | null
          description?: string | null
          id?: string
          montant_points?: number
          points_apres?: number
          points_avant?: number
          programme_id?: string
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_points_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_points_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programme_fidelite"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      multichannel_analytics: {
        Row: {
          avg_response_time_ms: number | null
          connector_id: string | null
          cost_estimate: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          messages_delivered: number | null
          messages_failed: number | null
          messages_received: number | null
          messages_sent: number | null
          metadata: Json | null
          period_end: string
          period_start: string
          response_rate: number | null
          tenant_id: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          connector_id?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          metadata?: Json | null
          period_end: string
          period_start: string
          response_rate?: number | null
          tenant_id: string
        }
        Update: {
          avg_response_time_ms?: number | null
          connector_id?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          metadata?: Json | null
          period_end?: string
          period_start?: string
          response_rate?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multichannel_analytics_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "multichannel_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multichannel_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multichannel_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      multichannel_automation_rules: {
        Row: {
          actions: Json | null
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          is_network_rule: boolean | null
          last_executed_at: string | null
          name: string
          priority_order: number | null
          rule_type: string
          target_channels: string[] | null
          tenant_id: string
          trigger_conditions: Json | null
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_network_rule?: boolean | null
          last_executed_at?: string | null
          name: string
          priority_order?: number | null
          rule_type: string
          target_channels?: string[] | null
          tenant_id: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_network_rule?: boolean | null
          last_executed_at?: string | null
          name?: string
          priority_order?: number | null
          rule_type?: string
          target_channels?: string[] | null
          tenant_id?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multichannel_automation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multichannel_automation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      multichannel_connectors: {
        Row: {
          channel_type: string
          config: Json | null
          created_at: string | null
          id: string
          is_network_shared: boolean | null
          last_error: string | null
          last_used_at: string | null
          messages_received: number | null
          messages_sent: number | null
          name: string
          priority_order: number | null
          provider: string
          response_rate: number | null
          shared_with_pharmacies: string[] | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_network_shared?: boolean | null
          last_error?: string | null
          last_used_at?: string | null
          messages_received?: number | null
          messages_sent?: number | null
          name: string
          priority_order?: number | null
          provider?: string
          response_rate?: number | null
          shared_with_pharmacies?: string[] | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_network_shared?: boolean | null
          last_error?: string | null
          last_used_at?: string | null
          messages_received?: number | null
          messages_sent?: number | null
          name?: string
          priority_order?: number | null
          provider?: string
          response_rate?: number | null
          shared_with_pharmacies?: string[] | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multichannel_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multichannel_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_activity_stats: {
        Row: {
          active_channels: number | null
          active_users: number | null
          avg_response_time_ms: number | null
          created_at: string | null
          error_count: number | null
          files_shared: number | null
          files_size_mb: number | null
          id: string
          inter_tenant_messages: number | null
          messages_received: number | null
          messages_sent: number | null
          partner_messages: number | null
          peak_concurrent_users: number | null
          stat_date: string
          stat_hour: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active_channels?: number | null
          active_users?: number | null
          avg_response_time_ms?: number | null
          created_at?: string | null
          error_count?: number | null
          files_shared?: number | null
          files_size_mb?: number | null
          id?: string
          inter_tenant_messages?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          partner_messages?: number | null
          peak_concurrent_users?: number | null
          stat_date?: string
          stat_hour?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active_channels?: number | null
          active_users?: number | null
          avg_response_time_ms?: number | null
          created_at?: string | null
          error_count?: number | null
          files_shared?: number | null
          files_size_mb?: number | null
          id?: string
          inter_tenant_messages?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          partner_messages?: number | null
          peak_concurrent_users?: number | null
          stat_date?: string
          stat_hour?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_activity_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_activity_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean | null
          setting_category: string
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          setting_category: string
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          setting_category?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_admin_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_admin_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_analytics_insights: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          confidence: number | null
          created_at: string
          description: string | null
          dismissed_at: string | null
          dismissed_by: string | null
          expires_at: string | null
          id: string
          impact: string | null
          insight_type: string
          is_applied: boolean | null
          is_dismissed: boolean | null
          metadata: Json | null
          metric_change: number | null
          pharmacies_involved: string[] | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          id?: string
          impact?: string | null
          insight_type?: string
          is_applied?: boolean | null
          is_dismissed?: boolean | null
          metadata?: Json | null
          metric_change?: number | null
          pharmacies_involved?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          dismissed_at?: string | null
          dismissed_by?: string | null
          expires_at?: string | null
          id?: string
          impact?: string | null
          insight_type?: string
          is_applied?: boolean | null
          is_dismissed?: boolean | null
          metadata?: Json | null
          metric_change?: number | null
          pharmacies_involved?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_analytics_insights_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_analytics_insights_dismissed_by_fkey"
            columns: ["dismissed_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_analytics_insights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_analytics_insights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_audit_logs: {
        Row: {
          action_category: string
          action_type: string
          created_at: string | null
          details: Json | null
          geo_location: Json | null
          id: string
          ip_address: unknown
          is_reviewed: boolean | null
          is_sensitive: boolean | null
          partner_account_id: string | null
          personnel_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          severity: string | null
          source_tenant_id: string | null
          target_id: string | null
          target_name: string | null
          target_tenant_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_category: string
          action_type: string
          created_at?: string | null
          details?: Json | null
          geo_location?: Json | null
          id?: string
          ip_address?: unknown
          is_reviewed?: boolean | null
          is_sensitive?: boolean | null
          partner_account_id?: string | null
          personnel_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          severity?: string | null
          source_tenant_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_tenant_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_category?: string
          action_type?: string
          created_at?: string | null
          details?: Json | null
          geo_location?: Json | null
          id?: string
          ip_address?: unknown
          is_reviewed?: boolean | null
          is_sensitive?: boolean | null
          partner_account_id?: string | null
          personnel_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          severity?: string | null
          source_tenant_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_tenant_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_audit_logs_partner_account_id_fkey"
            columns: ["partner_account_id"]
            isOneToOne: false
            referencedRelation: "network_partner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_source_tenant_id_fkey"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_source_tenant_id_fkey"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_backup_jobs: {
        Row: {
          compression_enabled: boolean | null
          configuration: Json | null
          created_at: string
          encryption_enabled: boolean | null
          id: string
          is_active: boolean | null
          job_name: string
          job_type: string
          last_run: string | null
          last_size_mb: number | null
          last_status: string | null
          next_run: string | null
          retention_days: number | null
          schedule_days: number[] | null
          schedule_time: string | null
          schedule_type: string | null
          target_path: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          compression_enabled?: boolean | null
          configuration?: Json | null
          created_at?: string
          encryption_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          job_name: string
          job_type: string
          last_run?: string | null
          last_size_mb?: number | null
          last_status?: string | null
          next_run?: string | null
          retention_days?: number | null
          schedule_days?: number[] | null
          schedule_time?: string | null
          schedule_type?: string | null
          target_path?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          compression_enabled?: boolean | null
          configuration?: Json | null
          created_at?: string
          encryption_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          job_name?: string
          job_type?: string
          last_run?: string | null
          last_size_mb?: number | null
          last_status?: string | null
          next_run?: string | null
          retention_days?: number | null
          schedule_days?: number[] | null
          schedule_time?: string | null
          schedule_type?: string | null
          target_path?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_backup_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_backup_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_backup_runs: {
        Row: {
          backup_job_id: string | null
          completed_at: string | null
          configuration: Json | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          id: string
          is_archived: boolean | null
          size_mb: number | null
          started_at: string | null
          status: string | null
          storage_target: string | null
          tenant_id: string
          triggered_by: string | null
          type: string
          updated_at: string
        }
        Insert: {
          backup_job_id?: string | null
          completed_at?: string | null
          configuration?: Json | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          is_archived?: boolean | null
          size_mb?: number | null
          started_at?: string | null
          status?: string | null
          storage_target?: string | null
          tenant_id: string
          triggered_by?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          backup_job_id?: string | null
          completed_at?: string | null
          configuration?: Json | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          is_archived?: boolean | null
          size_mb?: number | null
          started_at?: string | null
          status?: string | null
          storage_target?: string | null
          tenant_id?: string
          triggered_by?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_backup_runs_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "network_backup_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_backup_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_backup_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_backup_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      network_channel_invitations: {
        Row: {
          accepted_at: string | null
          channel_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string | null
          invitee_partner_id: string | null
          invitee_tenant_id: string | null
          invitee_type: string
          inviter_tenant_id: string
          inviter_user_id: string | null
          message: string | null
          rejected_at: string | null
          rejection_reason: string | null
          reminder_sent_at: string | null
          role_in_channel: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          channel_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string | null
          invitee_partner_id?: string | null
          invitee_tenant_id?: string | null
          invitee_type: string
          inviter_tenant_id: string
          inviter_user_id?: string | null
          message?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          reminder_sent_at?: string | null
          role_in_channel?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          channel_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string | null
          invitee_partner_id?: string | null
          invitee_tenant_id?: string | null
          invitee_type?: string
          inviter_tenant_id?: string
          inviter_user_id?: string | null
          message?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          reminder_sent_at?: string | null
          role_in_channel?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_channel_invitations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "network_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_invitee_partner_id_fkey"
            columns: ["invitee_partner_id"]
            isOneToOne: false
            referencedRelation: "network_partner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_invitee_tenant_id_fkey"
            columns: ["invitee_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_invitee_tenant_id_fkey"
            columns: ["invitee_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_inviter_tenant_id_fkey"
            columns: ["inviter_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_inviter_tenant_id_fkey"
            columns: ["inviter_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channel_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_channels: {
        Row: {
          auto_archive_days: number | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_system: boolean | null
          keywords: string[] | null
          name: string
          status: string | null
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          auto_archive_days?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          keywords?: string[] | null
          name: string
          status?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          auto_archive_days?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          keywords?: string[] | null
          name?: string
          status?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_chat_config: {
        Row: {
          can_override: boolean | null
          category: string | null
          config_key: string
          config_type: string | null
          config_value: string | null
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          can_override?: boolean | null
          category?: string | null
          config_key: string
          config_type?: string | null
          config_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          can_override?: boolean | null
          category?: string | null
          config_key?: string
          config_type?: string | null
          config_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_chat_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_chat_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_by: string | null
          id: string
          is_bidirectional: boolean | null
          is_granted: boolean | null
          notes: string | null
          permission_type: string
          revoked_at: string | null
          revoked_by: string | null
          source_tenant_id: string
          target_partner_id: string | null
          target_tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_bidirectional?: boolean | null
          is_granted?: boolean | null
          notes?: string | null
          permission_type: string
          revoked_at?: string | null
          revoked_by?: string | null
          source_tenant_id: string
          target_partner_id?: string | null
          target_tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_bidirectional?: boolean | null
          is_granted?: boolean | null
          notes?: string | null
          permission_type?: string
          revoked_at?: string | null
          revoked_by?: string | null
          source_tenant_id?: string
          target_partner_id?: string | null
          target_tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_chat_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_permissions_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_permissions_source_tenant_id_fkey"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_permissions_source_tenant_id_fkey"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_permissions_target_partner_id_fkey"
            columns: ["target_partner_id"]
            isOneToOne: false
            referencedRelation: "network_partner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_permissions_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_chat_permissions_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_compliance_reports: {
        Row: {
          completed_at: string | null
          compliance_score: number | null
          created_at: string
          file_size_mb: number | null
          file_url: string | null
          findings: Json | null
          generated_by: string | null
          id: string
          period: string
          recommendations: Json | null
          report_type: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          compliance_score?: number | null
          created_at?: string
          file_size_mb?: number | null
          file_url?: string | null
          findings?: Json | null
          generated_by?: string | null
          id?: string
          period: string
          recommendations?: Json | null
          report_type: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          compliance_score?: number | null
          created_at?: string
          file_size_mb?: number | null
          file_url?: string | null
          findings?: Json | null
          generated_by?: string | null
          id?: string
          period?: string
          recommendations?: Json | null
          report_type?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_compliance_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_compliance_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_customization_themes: {
        Row: {
          accent_color: string
          background_color: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          is_network_shared: boolean | null
          name: string
          preview_class: string | null
          primary_color: string
          secondary_color: string
          tenant_id: string | null
          theme_id: string
          updated_at: string
        }
        Insert: {
          accent_color: string
          background_color: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          is_network_shared?: boolean | null
          name: string
          preview_class?: string | null
          primary_color: string
          secondary_color: string
          tenant_id?: string | null
          theme_id: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          is_network_shared?: boolean | null
          name?: string
          preview_class?: string | null
          primary_color?: string
          secondary_color?: string
          tenant_id?: string | null
          theme_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_customization_themes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_customization_themes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_customization_themes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_maintenance_task_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          message: string | null
          metadata: Json | null
          started_at: string | null
          status: string | null
          task_name: string
          tenant_id: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          task_name: string
          tenant_id: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          task_name?: string
          tenant_id?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_maintenance_task_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_maintenance_task_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_maintenance_task_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      network_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          message_type: string | null
          metadata: Json | null
          priority: string | null
          read_by: Json | null
          sender_name: string
          sender_pharmacy_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          read_by?: Json | null
          sender_name: string
          sender_pharmacy_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          read_by?: Json | null
          sender_name?: string
          sender_pharmacy_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "network_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_messages_sender_pharmacy_id_fkey"
            columns: ["sender_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_messages_sender_pharmacy_id_fkey"
            columns: ["sender_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_notification_preferences: {
        Row: {
          created_at: string
          description: string | null
          email: boolean | null
          enabled: boolean | null
          id: string
          is_network_shared: boolean | null
          name: string
          notification_type: string
          popup: boolean | null
          priority: number | null
          sound: boolean | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: boolean | null
          enabled?: boolean | null
          id?: string
          is_network_shared?: boolean | null
          name: string
          notification_type: string
          popup?: boolean | null
          priority?: number | null
          sound?: boolean | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: boolean | null
          enabled?: boolean | null
          id?: string
          is_network_shared?: boolean | null
          name?: string
          notification_type?: string
          popup?: boolean | null
          priority?: number | null
          sound?: boolean | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      network_partner_accounts: {
        Row: {
          activated_at: string | null
          allowed_channels: string[] | null
          avatar_url: string | null
          can_create_channels: boolean | null
          can_initiate_conversation: boolean | null
          chat_enabled: boolean | null
          created_at: string | null
          display_name: string
          email: string | null
          id: string
          invitation_sent_at: string | null
          invited_by: string | null
          last_active_at: string | null
          max_daily_messages: number | null
          metadata: Json | null
          partner_id: string
          partner_type: string
          phone: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          allowed_channels?: string[] | null
          avatar_url?: string | null
          can_create_channels?: boolean | null
          can_initiate_conversation?: boolean | null
          chat_enabled?: boolean | null
          created_at?: string | null
          display_name: string
          email?: string | null
          id?: string
          invitation_sent_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
          max_daily_messages?: number | null
          metadata?: Json | null
          partner_id: string
          partner_type: string
          phone?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          allowed_channels?: string[] | null
          avatar_url?: string | null
          can_create_channels?: boolean | null
          can_initiate_conversation?: boolean | null
          chat_enabled?: boolean | null
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          invitation_sent_at?: string | null
          invited_by?: string | null
          last_active_at?: string | null
          max_daily_messages?: number | null
          metadata?: Json | null
          partner_id?: string
          partner_type?: string
          phone?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_partner_accounts_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_partner_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_partner_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_security_assets: {
        Row: {
          asset_name: string
          asset_type: string
          configuration: Json | null
          created_at: string
          expiry_date: string | null
          id: string
          last_updated: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          asset_name: string
          asset_type: string
          configuration?: Json | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_updated?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          configuration?: Json | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_updated?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_security_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_security_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_system_components: {
        Row: {
          configuration: Json | null
          cpu_load: number | null
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          last_check: string | null
          memory_usage: number | null
          name: string
          port: number | null
          status: string | null
          storage_usage: number | null
          tenant_id: string
          type: string
          updated_at: string
          uptime_start: string | null
        }
        Insert: {
          configuration?: Json | null
          cpu_load?: number | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          last_check?: string | null
          memory_usage?: number | null
          name: string
          port?: number | null
          status?: string | null
          storage_usage?: number | null
          tenant_id: string
          type: string
          updated_at?: string
          uptime_start?: string | null
        }
        Update: {
          configuration?: Json | null
          cpu_load?: number | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          last_check?: string | null
          memory_usage?: number | null
          name?: string
          port?: number | null
          status?: string | null
          storage_usage?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
          uptime_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_system_components_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_system_components_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_system_stats: {
        Row: {
          cpu_usage: number | null
          created_at: string
          database_size_mb: number | null
          disk_usage: number | null
          id: string
          last_maintenance_at: string | null
          log_size_mb: number | null
          memory_usage: number | null
          next_maintenance_at: string | null
          temp_files_mb: number | null
          tenant_id: string
          updated_at: string
          uptime_seconds: number | null
        }
        Insert: {
          cpu_usage?: number | null
          created_at?: string
          database_size_mb?: number | null
          disk_usage?: number | null
          id?: string
          last_maintenance_at?: string | null
          log_size_mb?: number | null
          memory_usage?: number | null
          next_maintenance_at?: string | null
          temp_files_mb?: number | null
          tenant_id: string
          updated_at?: string
          uptime_seconds?: number | null
        }
        Update: {
          cpu_usage?: number | null
          created_at?: string
          database_size_mb?: number | null
          disk_usage?: number | null
          id?: string
          last_maintenance_at?: string | null
          log_size_mb?: number | null
          memory_usage?: number | null
          next_maintenance_at?: string | null
          temp_files_mb?: number | null
          tenant_id?: string
          updated_at?: string
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "network_system_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_system_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      network_user_preferences: {
        Row: {
          animations_enabled: boolean | null
          auto_retry: boolean | null
          auto_save: boolean | null
          connection_timeout: number | null
          created_at: string
          device_mode: string | null
          display_quality: string | null
          font_size: number
          high_contrast: boolean | null
          id: string
          is_network_shared: boolean | null
          keyboard_focus: boolean | null
          language: string
          layout_compact: boolean | null
          max_retries: number | null
          offline_mode: boolean | null
          reduced_motion: boolean | null
          screen_reader: boolean | null
          tenant_id: string
          theme_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean | null
          auto_retry?: boolean | null
          auto_save?: boolean | null
          connection_timeout?: number | null
          created_at?: string
          device_mode?: string | null
          display_quality?: string | null
          font_size?: number
          high_contrast?: boolean | null
          id?: string
          is_network_shared?: boolean | null
          keyboard_focus?: boolean | null
          language?: string
          layout_compact?: boolean | null
          max_retries?: number | null
          offline_mode?: boolean | null
          reduced_motion?: boolean | null
          screen_reader?: boolean | null
          tenant_id: string
          theme_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          animations_enabled?: boolean | null
          auto_retry?: boolean | null
          auto_save?: boolean | null
          connection_timeout?: number | null
          created_at?: string
          device_mode?: string | null
          display_quality?: string | null
          font_size?: number
          high_contrast?: boolean | null
          id?: string
          is_network_shared?: boolean | null
          keyboard_focus?: boolean | null
          language?: string
          layout_compact?: boolean | null
          max_retries?: number | null
          offline_mode?: boolean | null
          reduced_motion?: boolean | null
          screen_reader?: boolean | null
          tenant_id?: string
          theme_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_user_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_user_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_configurations: {
        Row: {
          created_at: string
          email_enabled: boolean
          email_from_address: string | null
          email_from_name: string | null
          email_smtp_host: string | null
          email_smtp_password: string | null
          email_smtp_port: number | null
          email_smtp_user: string | null
          email_template_footer: string | null
          email_template_header: string | null
          id: string
          sms_api_key: string | null
          sms_api_secret: string | null
          sms_enabled: boolean
          sms_provider: string | null
          sms_sender_id: string | null
          tenant_id: string
          updated_at: string
          whatsapp_api_key: string | null
          whatsapp_business_id: string | null
          whatsapp_enabled: boolean
          whatsapp_phone_number: string | null
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          email_from_address?: string | null
          email_from_name?: string | null
          email_smtp_host?: string | null
          email_smtp_password?: string | null
          email_smtp_port?: number | null
          email_smtp_user?: string | null
          email_template_footer?: string | null
          email_template_header?: string | null
          id?: string
          sms_api_key?: string | null
          sms_api_secret?: string | null
          sms_enabled?: boolean
          sms_provider?: string | null
          sms_sender_id?: string | null
          tenant_id: string
          updated_at?: string
          whatsapp_api_key?: string | null
          whatsapp_business_id?: string | null
          whatsapp_enabled?: boolean
          whatsapp_phone_number?: string | null
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          email_from_address?: string | null
          email_from_name?: string | null
          email_smtp_host?: string | null
          email_smtp_password?: string | null
          email_smtp_port?: number | null
          email_smtp_user?: string | null
          email_template_footer?: string | null
          email_template_header?: string | null
          id?: string
          sms_api_key?: string | null
          sms_api_secret?: string | null
          sms_enabled?: boolean
          sms_provider?: string | null
          sms_sender_id?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_api_key?: string | null
          whatsapp_business_id?: string | null
          whatsapp_enabled?: boolean
          whatsapp_phone_number?: string | null
        }
        Relationships: []
      }
      objectifs_ventes: {
        Row: {
          annee: number
          created_at: string
          created_by_id: string | null
          id: string
          mois: number
          montant_cible: number
          tenant_id: string
          type_objectif: string
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          created_by_id?: string | null
          id?: string
          mois: number
          montant_cible?: number
          tenant_id: string
          type_objectif?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          created_by_id?: string | null
          id?: string
          mois?: number
          montant_cible?: number
          tenant_id?: string
          type_objectif?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectifs_ventes_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations_fiscales: {
        Row: {
          created_at: string
          description: string | null
          est_actif: boolean
          frequence: string
          id: string
          prochaine_echeance: string
          rappel_email: boolean
          rappel_jours_avant: number | null
          statut: string
          tenant_id: string
          type_obligation: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          est_actif?: boolean
          frequence: string
          id?: string
          prochaine_echeance: string
          rappel_email?: boolean
          rappel_jours_avant?: number | null
          statut?: string
          tenant_id: string
          type_obligation: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          est_actif?: boolean
          frequence?: string
          id?: string
          prochaine_echeance?: string
          rappel_email?: boolean
          rappel_jours_avant?: number | null
          statut?: string
          tenant_id?: string
          type_obligation?: string
          updated_at?: string
        }
        Relationships: []
      }
      paiements_factures: {
        Row: {
          created_at: string
          created_by_id: string | null
          date_paiement: string
          facture_id: string
          id: string
          mode_paiement: string
          montant: number
          notes: string | null
          reference_paiement: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          date_paiement?: string
          facture_id: string
          id?: string
          mode_paiement: string
          montant: number
          notes?: string | null
          reference_paiement?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          date_paiement?: string
          facture_id?: string
          id?: string
          mode_paiement?: string
          montant?: number
          notes?: string | null
          reference_paiement?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_factures_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_factures_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_factures_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_fournisseurs: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_paiement: string
          fournisseur_id: string | null
          id: string
          mode_paiement: string
          montant: number
          notes: string | null
          reception_id: string | null
          reference_paiement: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_paiement?: string
          fournisseur_id?: string | null
          id?: string
          mode_paiement?: string
          montant: number
          notes?: string | null
          reception_id?: string | null
          reference_paiement?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_paiement?: string
          fournisseur_id?: string | null
          id?: string
          mode_paiement?: string
          montant?: number
          notes?: string | null
          reception_id?: string | null
          reference_paiement?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_fournisseurs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_fournisseurs_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_fournisseurs_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "receptions_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_audit_regionaux: {
        Row: {
          code_devise: string
          created_at: string
          duree_conservation_ans: number
          exige_rgpd: boolean
          exige_signature_electronique: boolean
          exigences_obligatoires: Json
          format_date: string
          format_heure: string
          id: string
          labels_interface: Json
          libelle_pays: string
          mentions_legales: string | null
          organisme_normalisation: string
          pays: string
          referentiel_comptable: string
          timezone: string
          updated_at: string
        }
        Insert: {
          code_devise: string
          created_at?: string
          duree_conservation_ans?: number
          exige_rgpd?: boolean
          exige_signature_electronique?: boolean
          exigences_obligatoires?: Json
          format_date?: string
          format_heure?: string
          id?: string
          labels_interface?: Json
          libelle_pays: string
          mentions_legales?: string | null
          organisme_normalisation: string
          pays: string
          referentiel_comptable: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          code_devise?: string
          created_at?: string
          duree_conservation_ans?: number
          exige_rgpd?: boolean
          exige_signature_electronique?: boolean
          exigences_obligatoires?: Json
          format_date?: string
          format_heure?: string
          id?: string
          labels_interface?: Json
          libelle_pays?: string
          mentions_legales?: string | null
          organisme_normalisation?: string
          pays?: string
          referentiel_comptable?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      parametres_bancaires: {
        Row: {
          alertes_actives: boolean
          code_pays: string
          created_at: string
          devise_principale: string
          emails_alertes: string[] | null
          format_import_defaut: string
          frequence_sync: string
          id: string
          rapprochement_auto: boolean
          seuil_alerte_bas_xaf: number
          seuil_alerte_critique_xaf: number
          synchronisation_auto: boolean
          tenant_id: string
          tolerance_rapprochement_jours: number
          tolerance_rapprochement_montant_xaf: number
          updated_at: string
        }
        Insert: {
          alertes_actives?: boolean
          code_pays?: string
          created_at?: string
          devise_principale?: string
          emails_alertes?: string[] | null
          format_import_defaut?: string
          frequence_sync?: string
          id?: string
          rapprochement_auto?: boolean
          seuil_alerte_bas_xaf?: number
          seuil_alerte_critique_xaf?: number
          synchronisation_auto?: boolean
          tenant_id: string
          tolerance_rapprochement_jours?: number
          tolerance_rapprochement_montant_xaf?: number
          updated_at?: string
        }
        Update: {
          alertes_actives?: boolean
          code_pays?: string
          created_at?: string
          devise_principale?: string
          emails_alertes?: string[] | null
          format_import_defaut?: string
          frequence_sync?: string
          id?: string
          rapprochement_auto?: boolean
          seuil_alerte_bas_xaf?: number
          seuil_alerte_critique_xaf?: number
          synchronisation_auto?: boolean
          tenant_id?: string
          tolerance_rapprochement_jours?: number
          tolerance_rapprochement_montant_xaf?: number
          updated_at?: string
        }
        Relationships: []
      }
      parametres_comptabilite_analytique_regionale: {
        Row: {
          centres_types: Json
          cles_repartition_types: Json
          code_pays: string
          created_at: string
          devise_principale: string
          id: string
          nom_pays: string
          seuils_alertes: Json
          systeme_comptable: string
          tenant_id: string
          terminologie: Json
          updated_at: string
        }
        Insert: {
          centres_types?: Json
          cles_repartition_types?: Json
          code_pays: string
          created_at?: string
          devise_principale: string
          id?: string
          nom_pays: string
          seuils_alertes?: Json
          systeme_comptable: string
          tenant_id: string
          terminologie?: Json
          updated_at?: string
        }
        Update: {
          centres_types?: Json
          cles_repartition_types?: Json
          code_pays?: string
          created_at?: string
          devise_principale?: string
          id?: string
          nom_pays?: string
          seuils_alertes?: Json
          systeme_comptable?: string
          tenant_id?: string
          terminologie?: Json
          updated_at?: string
        }
        Relationships: []
      }
      parametres_expiration: {
        Row: {
          action_auto_alerte: boolean | null
          action_auto_blocage: boolean | null
          created_at: string | null
          delai_alerte_jours: number
          delai_bloquant_jours: number
          delai_critique_jours: number
          famille_id: string | null
          id: string
          notifications_dashboard: boolean | null
          notifications_email: boolean | null
          produit_id: string | null
          tenant_id: string
          type_parametre: string | null
          updated_at: string | null
        }
        Insert: {
          action_auto_alerte?: boolean | null
          action_auto_blocage?: boolean | null
          created_at?: string | null
          delai_alerte_jours?: number
          delai_bloquant_jours?: number
          delai_critique_jours?: number
          famille_id?: string | null
          id?: string
          notifications_dashboard?: boolean | null
          notifications_email?: boolean | null
          produit_id?: string | null
          tenant_id: string
          type_parametre?: string | null
          updated_at?: string | null
        }
        Update: {
          action_auto_alerte?: boolean | null
          action_auto_blocage?: boolean | null
          created_at?: string | null
          delai_alerte_jours?: number
          delai_bloquant_jours?: number
          delai_critique_jours?: number
          famille_id?: string | null
          id?: string
          notifications_dashboard?: boolean | null
          notifications_email?: boolean | null
          produit_id?: string | null
          tenant_id?: string
          type_parametre?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_expiration_famille_produit_id_fkey"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_expiration_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_expiration_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_expiration_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_expiration_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
        ]
      }
      parametres_factures_regionaux: {
        Row: {
          adresse_societe: string | null
          archivage_obligatoire_annees: number | null
          code_pays: string
          conditions_paiement_defaut: string | null
          created_at: string | null
          delai_paiement_defaut: number | null
          devise_principale: string | null
          email_societe: string | null
          format_date: string | null
          format_numero: string | null
          id: string
          libelle_tva: string | null
          longueur_numero: number | null
          mentions_legales_facture: string | null
          montant_max_sans_facture: number | null
          nom_societe: string | null
          numero_tva: string | null
          numero_tva_obligatoire: boolean | null
          pays: string | null
          penalite_retard_pourcentage: number | null
          position_symbole_devise: string | null
          prefixe_avoir: string | null
          prefixe_facture_client: string | null
          prefixe_facture_fournisseur: string | null
          registre_commerce: string | null
          separateur_decimal: string | null
          separateur_milliers: string | null
          signature_electronique_requise: boolean | null
          site_web: string | null
          symbole_devise: string | null
          taux_tva_reduit: number | null
          taux_tva_standard: number | null
          telephone_societe: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          adresse_societe?: string | null
          archivage_obligatoire_annees?: number | null
          code_pays: string
          conditions_paiement_defaut?: string | null
          created_at?: string | null
          delai_paiement_defaut?: number | null
          devise_principale?: string | null
          email_societe?: string | null
          format_date?: string | null
          format_numero?: string | null
          id?: string
          libelle_tva?: string | null
          longueur_numero?: number | null
          mentions_legales_facture?: string | null
          montant_max_sans_facture?: number | null
          nom_societe?: string | null
          numero_tva?: string | null
          numero_tva_obligatoire?: boolean | null
          pays?: string | null
          penalite_retard_pourcentage?: number | null
          position_symbole_devise?: string | null
          prefixe_avoir?: string | null
          prefixe_facture_client?: string | null
          prefixe_facture_fournisseur?: string | null
          registre_commerce?: string | null
          separateur_decimal?: string | null
          separateur_milliers?: string | null
          signature_electronique_requise?: boolean | null
          site_web?: string | null
          symbole_devise?: string | null
          taux_tva_reduit?: number | null
          taux_tva_standard?: number | null
          telephone_societe?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          adresse_societe?: string | null
          archivage_obligatoire_annees?: number | null
          code_pays?: string
          conditions_paiement_defaut?: string | null
          created_at?: string | null
          delai_paiement_defaut?: number | null
          devise_principale?: string | null
          email_societe?: string | null
          format_date?: string | null
          format_numero?: string | null
          id?: string
          libelle_tva?: string | null
          longueur_numero?: number | null
          mentions_legales_facture?: string | null
          montant_max_sans_facture?: number | null
          nom_societe?: string | null
          numero_tva?: string | null
          numero_tva_obligatoire?: boolean | null
          pays?: string | null
          penalite_retard_pourcentage?: number | null
          position_symbole_devise?: string | null
          prefixe_avoir?: string | null
          prefixe_facture_client?: string | null
          prefixe_facture_fournisseur?: string | null
          registre_commerce?: string | null
          separateur_decimal?: string | null
          separateur_milliers?: string | null
          signature_electronique_requise?: boolean | null
          site_web?: string | null
          symbole_devise?: string | null
          taux_tva_reduit?: number | null
          taux_tva_standard?: number | null
          telephone_societe?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_factures_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_factures_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_fiscaux: {
        Row: {
          alerte_echeances: boolean
          alerte_reglementations: boolean
          alerte_seuil_tva: boolean
          created_at: string
          email_alertes: string | null
          frequence_declaration: string
          id: string
          jours_alerte_avant_echeance: number | null
          numero_tva: string | null
          rapport_mensuel_auto: boolean
          regime_tva: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alerte_echeances?: boolean
          alerte_reglementations?: boolean
          alerte_seuil_tva?: boolean
          created_at?: string
          email_alertes?: string | null
          frequence_declaration?: string
          id?: string
          jours_alerte_avant_echeance?: number | null
          numero_tva?: string | null
          rapport_mensuel_auto?: boolean
          regime_tva?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alerte_echeances?: boolean
          alerte_reglementations?: boolean
          alerte_seuil_tva?: boolean
          created_at?: string
          email_alertes?: string | null
          frequence_declaration?: string
          id?: string
          jours_alerte_avant_echeance?: number | null
          numero_tva?: string | null
          rapport_mensuel_auto?: boolean
          regime_tva?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      parametres_integrations_regionaux: {
        Row: {
          archiving_required: boolean | null
          banking_api_available: boolean | null
          banking_standard: string | null
          code_pays: string
          created_at: string | null
          data_retention_years: number | null
          fec_encodage: string | null
          fec_format_defaut: string | null
          fec_obligatoire: boolean | null
          fec_separateur: string | null
          id: string
          labels: Json | null
          pays: string
          social_org_name: string | null
          social_portal_available: boolean | null
          social_portal_url: string | null
          tax_declaration_format: string | null
          tax_portal_available: boolean | null
          tax_portal_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          archiving_required?: boolean | null
          banking_api_available?: boolean | null
          banking_standard?: string | null
          code_pays: string
          created_at?: string | null
          data_retention_years?: number | null
          fec_encodage?: string | null
          fec_format_defaut?: string | null
          fec_obligatoire?: boolean | null
          fec_separateur?: string | null
          id?: string
          labels?: Json | null
          pays: string
          social_org_name?: string | null
          social_portal_available?: boolean | null
          social_portal_url?: string | null
          tax_declaration_format?: string | null
          tax_portal_available?: boolean | null
          tax_portal_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          archiving_required?: boolean | null
          banking_api_available?: boolean | null
          banking_standard?: string | null
          code_pays?: string
          created_at?: string | null
          data_retention_years?: number | null
          fec_encodage?: string | null
          fec_format_defaut?: string | null
          fec_obligatoire?: boolean | null
          fec_separateur?: string | null
          id?: string
          labels?: Json | null
          pays?: string
          social_org_name?: string | null
          social_portal_available?: boolean | null
          social_portal_url?: string | null
          tax_declaration_format?: string | null
          tax_portal_available?: boolean | null
          tax_portal_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_integrations_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_integrations_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_journalisation_regionaux: {
        Row: {
          code_pays: string
          conservation_brouillons_jours: number | null
          created_at: string | null
          devise_principale: string
          equilibre_obligatoire: boolean | null
          format_date: string | null
          format_numero_achat: string
          format_numero_banque: string
          format_numero_caisse: string
          format_numero_od: string
          format_numero_vente: string
          id: string
          longueur_numero: number | null
          mentions_legales_ecritures: string | null
          pays: string
          position_symbole_devise: string | null
          reference_obligatoire: boolean | null
          separateur_decimal: string | null
          separateur_milliers: string | null
          symbole_devise: string
          tenant_id: string
          updated_at: string | null
          validation_automatique: boolean | null
          verrouillage_auto_fin_mois: boolean | null
        }
        Insert: {
          code_pays: string
          conservation_brouillons_jours?: number | null
          created_at?: string | null
          devise_principale: string
          equilibre_obligatoire?: boolean | null
          format_date?: string | null
          format_numero_achat: string
          format_numero_banque: string
          format_numero_caisse: string
          format_numero_od: string
          format_numero_vente: string
          id?: string
          longueur_numero?: number | null
          mentions_legales_ecritures?: string | null
          pays: string
          position_symbole_devise?: string | null
          reference_obligatoire?: boolean | null
          separateur_decimal?: string | null
          separateur_milliers?: string | null
          symbole_devise: string
          tenant_id: string
          updated_at?: string | null
          validation_automatique?: boolean | null
          verrouillage_auto_fin_mois?: boolean | null
        }
        Update: {
          code_pays?: string
          conservation_brouillons_jours?: number | null
          created_at?: string | null
          devise_principale?: string
          equilibre_obligatoire?: boolean | null
          format_date?: string | null
          format_numero_achat?: string
          format_numero_banque?: string
          format_numero_caisse?: string
          format_numero_od?: string
          format_numero_vente?: string
          id?: string
          longueur_numero?: number | null
          mentions_legales_ecritures?: string | null
          pays?: string
          position_symbole_devise?: string | null
          reference_obligatoire?: boolean | null
          separateur_decimal?: string | null
          separateur_milliers?: string | null
          symbole_devise?: string
          tenant_id?: string
          updated_at?: string | null
          validation_automatique?: boolean | null
          verrouillage_auto_fin_mois?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_journalisation_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_journalisation_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_paiements_regionaux: {
        Row: {
          code_pays: string
          created_at: string
          delai_compensation_virement: number | null
          delai_encaissement_cheque: number | null
          devise_principale: string
          format_iban: string | null
          frais_bancaires_standard: number | null
          frais_carte_pourcentage: number | null
          frais_mobile_money_pourcentage: number | null
          id: string
          modes_paiement_defaut: Json
          montant_max_especes: number | null
          pays: string
          plafond_mobile_money: number | null
          require_kyc_au_dessus: number | null
          swift_obligatoire: boolean | null
          symbole_devise: string
          tenant_id: string
          tolerance_rapprochement: number | null
          updated_at: string
          validation_iban_active: boolean | null
        }
        Insert: {
          code_pays: string
          created_at?: string
          delai_compensation_virement?: number | null
          delai_encaissement_cheque?: number | null
          devise_principale: string
          format_iban?: string | null
          frais_bancaires_standard?: number | null
          frais_carte_pourcentage?: number | null
          frais_mobile_money_pourcentage?: number | null
          id?: string
          modes_paiement_defaut?: Json
          montant_max_especes?: number | null
          pays: string
          plafond_mobile_money?: number | null
          require_kyc_au_dessus?: number | null
          swift_obligatoire?: boolean | null
          symbole_devise: string
          tenant_id: string
          tolerance_rapprochement?: number | null
          updated_at?: string
          validation_iban_active?: boolean | null
        }
        Update: {
          code_pays?: string
          created_at?: string
          delai_compensation_virement?: number | null
          delai_encaissement_cheque?: number | null
          devise_principale?: string
          format_iban?: string | null
          frais_bancaires_standard?: number | null
          frais_carte_pourcentage?: number | null
          frais_mobile_money_pourcentage?: number | null
          id?: string
          modes_paiement_defaut?: Json
          montant_max_especes?: number | null
          pays?: string
          plafond_mobile_money?: number | null
          require_kyc_au_dessus?: number | null
          swift_obligatoire?: boolean | null
          symbole_devise?: string
          tenant_id?: string
          tolerance_rapprochement?: number | null
          updated_at?: string
          validation_iban_active?: boolean | null
        }
        Relationships: []
      }
      parametres_plan_comptable_regionaux: {
        Row: {
          autoriser_comptes_negatifs: boolean | null
          classes_definition: Json
          code_pays: string
          created_at: string | null
          devise_principale: string
          format_code_compte: string | null
          gestion_analytique_obligatoire: boolean | null
          id: string
          longueur_code_max: number | null
          longueur_code_min: number | null
          mentions_legales_plan: string | null
          organisme_normalisation: string | null
          pays: string
          position_symbole_devise: string | null
          reference_reglementaire: string | null
          separateur_decimal: string | null
          separateur_hierarchique: string | null
          separateur_milliers: string | null
          symbole_devise: string
          systeme_comptable: string
          template_json: Json | null
          template_predefini: boolean | null
          tenant_id: string
          terminologie_comptes: Json | null
          updated_at: string | null
          validation_code_strict: boolean | null
          version_systeme: string | null
        }
        Insert: {
          autoriser_comptes_negatifs?: boolean | null
          classes_definition: Json
          code_pays: string
          created_at?: string | null
          devise_principale: string
          format_code_compte?: string | null
          gestion_analytique_obligatoire?: boolean | null
          id?: string
          longueur_code_max?: number | null
          longueur_code_min?: number | null
          mentions_legales_plan?: string | null
          organisme_normalisation?: string | null
          pays: string
          position_symbole_devise?: string | null
          reference_reglementaire?: string | null
          separateur_decimal?: string | null
          separateur_hierarchique?: string | null
          separateur_milliers?: string | null
          symbole_devise: string
          systeme_comptable: string
          template_json?: Json | null
          template_predefini?: boolean | null
          tenant_id: string
          terminologie_comptes?: Json | null
          updated_at?: string | null
          validation_code_strict?: boolean | null
          version_systeme?: string | null
        }
        Update: {
          autoriser_comptes_negatifs?: boolean | null
          classes_definition?: Json
          code_pays?: string
          created_at?: string | null
          devise_principale?: string
          format_code_compte?: string | null
          gestion_analytique_obligatoire?: boolean | null
          id?: string
          longueur_code_max?: number | null
          longueur_code_min?: number | null
          mentions_legales_plan?: string | null
          organisme_normalisation?: string | null
          pays?: string
          position_symbole_devise?: string | null
          reference_reglementaire?: string | null
          separateur_decimal?: string | null
          separateur_hierarchique?: string | null
          separateur_milliers?: string | null
          symbole_devise?: string
          systeme_comptable?: string
          template_json?: Json | null
          template_predefini?: boolean | null
          tenant_id?: string
          terminologie_comptes?: Json | null
          updated_at?: string | null
          validation_code_strict?: boolean | null
          version_systeme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_plan_comptable_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_plan_comptable_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_rapports_regionaux: {
        Row: {
          code_pays: string
          created_at: string
          exercice_fiscal_debut: string | null
          exercice_fiscal_fin: string | null
          format_date: string | null
          format_nombre: string | null
          id: string
          labels: Json | null
          nombre_decimales: number | null
          pays: string
          periodicite_tva: string | null
          plan_comptable: string | null
          separateur_decimales: string | null
          separateur_milliers: string | null
          symbole_devise: string | null
          taux_tva_normal: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code_pays: string
          created_at?: string
          exercice_fiscal_debut?: string | null
          exercice_fiscal_fin?: string | null
          format_date?: string | null
          format_nombre?: string | null
          id?: string
          labels?: Json | null
          nombre_decimales?: number | null
          pays: string
          periodicite_tva?: string | null
          plan_comptable?: string | null
          separateur_decimales?: string | null
          separateur_milliers?: string | null
          symbole_devise?: string | null
          taux_tva_normal?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code_pays?: string
          created_at?: string
          exercice_fiscal_debut?: string | null
          exercice_fiscal_fin?: string | null
          format_date?: string | null
          format_nombre?: string | null
          id?: string
          labels?: Json | null
          nombre_decimales?: number | null
          pays?: string
          periodicite_tva?: string | null
          plan_comptable?: string | null
          separateur_decimales?: string | null
          separateur_milliers?: string | null
          symbole_devise?: string | null
          taux_tva_normal?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametres_rapports_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_rapports_regionaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_regionaux_bancaires: {
        Row: {
          banque_centrale: string
          code_pays: string
          created_at: string
          devise_principale: string
          format_iban: string | null
          format_import_defaut: string
          format_rib: string
          id: string
          liste_banques: Json
          longueur_rib: number
          mention_legale_footer: string
          pays: string
          seuil_alerte_bas: number
          seuil_alerte_critique: number
          tenant_id: string
          updated_at: string
          validation_regex_iban: string | null
          validation_regex_rib: string | null
        }
        Insert: {
          banque_centrale?: string
          code_pays?: string
          created_at?: string
          devise_principale?: string
          format_iban?: string | null
          format_import_defaut?: string
          format_rib?: string
          id?: string
          liste_banques?: Json
          longueur_rib?: number
          mention_legale_footer?: string
          pays?: string
          seuil_alerte_bas?: number
          seuil_alerte_critique?: number
          tenant_id: string
          updated_at?: string
          validation_regex_iban?: string | null
          validation_regex_rib?: string | null
        }
        Update: {
          banque_centrale?: string
          code_pays?: string
          created_at?: string
          devise_principale?: string
          format_iban?: string | null
          format_import_defaut?: string
          format_rib?: string
          id?: string
          liste_banques?: Json
          longueur_rib?: number
          mention_legale_footer?: string
          pays?: string
          seuil_alerte_bas?: number
          seuil_alerte_critique?: number
          tenant_id?: string
          updated_at?: string
          validation_regex_iban?: string | null
          validation_regex_rib?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_regionaux_bancaires_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_regionaux_bancaires_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_regionaux_fiscaux: {
        Row: {
          autorite_fiscale: string
          code_pays: string
          created_at: string | null
          devise_principale: string
          duree_conservation_annees: number
          exoneration_medicaments_essentiels: boolean
          format_numero_tva: string
          frequence_declaration_defaut: string
          id: string
          jour_echeance_mensuelle: number
          jour_echeance_trimestrielle: number
          mention_legale_footer: string
          mois_cloture_fiscale: number
          obligations_templates: Json
          pays: string
          regime_fiscal: string
          seuil_franchise_tva: number | null
          seuil_regime_simplifie: number | null
          systeme_comptable: string
          taux_centime_additionnel: number | null
          taux_tva_reduits: Json
          taux_tva_standard: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          autorite_fiscale?: string
          code_pays?: string
          created_at?: string | null
          devise_principale?: string
          duree_conservation_annees?: number
          exoneration_medicaments_essentiels?: boolean
          format_numero_tva?: string
          frequence_declaration_defaut?: string
          id?: string
          jour_echeance_mensuelle?: number
          jour_echeance_trimestrielle?: number
          mention_legale_footer?: string
          mois_cloture_fiscale?: number
          obligations_templates?: Json
          pays?: string
          regime_fiscal?: string
          seuil_franchise_tva?: number | null
          seuil_regime_simplifie?: number | null
          systeme_comptable?: string
          taux_centime_additionnel?: number | null
          taux_tva_reduits?: Json
          taux_tva_standard?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          autorite_fiscale?: string
          code_pays?: string
          created_at?: string | null
          devise_principale?: string
          duree_conservation_annees?: number
          exoneration_medicaments_essentiels?: boolean
          format_numero_tva?: string
          frequence_declaration_defaut?: string
          id?: string
          jour_echeance_mensuelle?: number
          jour_echeance_trimestrielle?: number
          mention_legale_footer?: string
          mois_cloture_fiscale?: number
          obligations_templates?: Json
          pays?: string
          regime_fiscal?: string
          seuil_franchise_tva?: number | null
          seuil_regime_simplifie?: number | null
          systeme_comptable?: string
          taux_centime_additionnel?: number | null
          taux_tva_reduits?: Json
          taux_tva_standard?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_regionaux_fiscaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_regionaux_fiscaux_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_regionaux_rapports: {
        Row: {
          champ_identification_1: string
          champ_identification_2: string
          code_pays: string
          created_at: string
          devise_principale: string
          export_excel_enabled: boolean
          export_pdf_enabled: boolean
          format_date: string
          format_nombre: string
          id: string
          mention_legale_footer: string
          mention_signature: string
          pays: string
          seuil_marge_exploitation: number
          seuil_marge_nette: number
          seuil_ratio_autonomie: number
          seuil_ratio_endettement: number
          seuil_ratio_liquidite: number
          seuil_rentabilite_capitaux: number
          systeme_comptable: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          champ_identification_1?: string
          champ_identification_2?: string
          code_pays?: string
          created_at?: string
          devise_principale?: string
          export_excel_enabled?: boolean
          export_pdf_enabled?: boolean
          format_date?: string
          format_nombre?: string
          id?: string
          mention_legale_footer?: string
          mention_signature?: string
          pays?: string
          seuil_marge_exploitation?: number
          seuil_marge_nette?: number
          seuil_ratio_autonomie?: number
          seuil_ratio_endettement?: number
          seuil_ratio_liquidite?: number
          seuil_rentabilite_capitaux?: number
          systeme_comptable?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          champ_identification_1?: string
          champ_identification_2?: string
          code_pays?: string
          created_at?: string
          devise_principale?: string
          export_excel_enabled?: boolean
          export_pdf_enabled?: boolean
          format_date?: string
          format_nombre?: string
          id?: string
          mention_legale_footer?: string
          mention_signature?: string
          pays?: string
          seuil_marge_exploitation?: number
          seuil_marge_nette?: number
          seuil_ratio_autonomie?: number
          seuil_ratio_endettement?: number
          seuil_ratio_liquidite?: number
          seuil_rentabilite_capitaux?: number
          systeme_comptable?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      parametres_systeme: {
        Row: {
          categorie: string
          cle_parametre: string
          created_at: string
          description: string | null
          id: string
          is_modifiable: boolean | null
          is_visible: boolean | null
          tenant_id: string
          type_parametre: string | null
          updated_at: string
          valeur_defaut: string | null
          valeur_parametre: string | null
        }
        Insert: {
          categorie: string
          cle_parametre: string
          created_at?: string
          description?: string | null
          id?: string
          is_modifiable?: boolean | null
          is_visible?: boolean | null
          tenant_id: string
          type_parametre?: string | null
          updated_at?: string
          valeur_defaut?: string | null
          valeur_parametre?: string | null
        }
        Update: {
          categorie?: string
          cle_parametre?: string
          created_at?: string
          description?: string | null
          id?: string
          is_modifiable?: boolean | null
          is_visible?: boolean | null
          tenant_id?: string
          type_parametre?: string | null
          updated_at?: string
          valeur_defaut?: string | null
          valeur_parametre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_systeme_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametres_systeme_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      participations_formation: {
        Row: {
          certificat_obtenu: boolean | null
          commentaires: string | null
          created_at: string
          date_completion: string | null
          date_inscription: string
          employe_id: string
          formation_id: string
          id: string
          note_finale: number | null
          statut_participation: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          certificat_obtenu?: boolean | null
          commentaires?: string | null
          created_at?: string
          date_completion?: string | null
          date_inscription?: string
          employe_id: string
          formation_id: string
          id?: string
          note_finale?: number | null
          statut_participation?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          certificat_obtenu?: boolean | null
          commentaires?: string | null
          created_at?: string
          date_completion?: string | null
          date_inscription?: string
          employe_id?: string
          formation_id?: string
          id?: string
          note_finale?: number | null
          statut_participation?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_formation_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_formation_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations_employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_formation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_formation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          personnel_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          personnel_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          personnel_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      password_policies: {
        Row: {
          created_at: string
          force_2fa_for_roles: string[] | null
          id: string
          lockout_duration_minutes: number | null
          max_age_days: number | null
          max_failed_attempts: number | null
          min_length: number | null
          remember_last_passwords: number | null
          require_lowercase: boolean | null
          require_numbers: boolean | null
          require_special_chars: boolean | null
          require_uppercase: boolean | null
          session_timeout_minutes: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          force_2fa_for_roles?: string[] | null
          id?: string
          lockout_duration_minutes?: number | null
          max_age_days?: number | null
          max_failed_attempts?: number | null
          min_length?: number | null
          remember_last_passwords?: number | null
          require_lowercase?: boolean | null
          require_numbers?: boolean | null
          require_special_chars?: boolean | null
          require_uppercase?: boolean | null
          session_timeout_minutes?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          force_2fa_for_roles?: string[] | null
          id?: string
          lockout_duration_minutes?: number | null
          max_age_days?: number | null
          max_failed_attempts?: number | null
          min_length?: number | null
          remember_last_passwords?: number | null
          require_lowercase?: boolean | null
          require_numbers?: boolean | null
          require_special_chars?: boolean | null
          require_uppercase?: boolean | null
          session_timeout_minutes?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_reminders: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          prescription_id: string | null
          reminder_type: string
          scheduled_date: string
          sent_at: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          channel?: string
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          prescription_id?: string | null
          reminder_type: string
          scheduled_date: string
          sent_at?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          prescription_id?: string | null
          reminder_type?: string
          scheduled_date?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reminders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          categorie: string
          code_permission: string
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          nom_permission: string
          updated_at: string | null
        }
        Insert: {
          categorie?: string
          code_permission: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          nom_permission: string
          updated_at?: string | null
        }
        Update: {
          categorie?: string
          code_permission?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          nom_permission?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      personnel: {
        Row: {
          adresse: string | null
          assureur_id: string | null
          auth_user_id: string | null
          caution: number | null
          created_at: string
          date_naissance: string | null
          date_recrutement: string | null
          email: string | null
          fonction: string | null
          id: string
          is_active: boolean | null
          limite_dette: number | null
          niu_cni: string | null
          nombre_enfants: number | null
          noms: string
          numero_cnss: string | null
          peut_prendre_bon: boolean | null
          photo_identite: string | null
          prenoms: string
          profession: string | null
          reference_agent: string
          role: string
          salaire_base: number | null
          situation_familiale:
            | Database["public"]["Enums"]["situation_familiale"]
            | null
          statut_contractuel:
            | Database["public"]["Enums"]["statut_contractuel"]
            | null
          taux_agent: number | null
          taux_ayant_droit: number | null
          taux_remise_automatique: number | null
          taux_ticket_moderateur: number | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          assureur_id?: string | null
          auth_user_id?: string | null
          caution?: number | null
          created_at?: string
          date_naissance?: string | null
          date_recrutement?: string | null
          email?: string | null
          fonction?: string | null
          id?: string
          is_active?: boolean | null
          limite_dette?: number | null
          niu_cni?: string | null
          nombre_enfants?: number | null
          noms: string
          numero_cnss?: string | null
          peut_prendre_bon?: boolean | null
          photo_identite?: string | null
          prenoms: string
          profession?: string | null
          reference_agent: string
          role?: string
          salaire_base?: number | null
          situation_familiale?:
            | Database["public"]["Enums"]["situation_familiale"]
            | null
          statut_contractuel?:
            | Database["public"]["Enums"]["statut_contractuel"]
            | null
          taux_agent?: number | null
          taux_ayant_droit?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          assureur_id?: string | null
          auth_user_id?: string | null
          caution?: number | null
          created_at?: string
          date_naissance?: string | null
          date_recrutement?: string | null
          email?: string | null
          fonction?: string | null
          id?: string
          is_active?: boolean | null
          limite_dette?: number | null
          niu_cni?: string | null
          nombre_enfants?: number | null
          noms?: string
          numero_cnss?: string | null
          peut_prendre_bon?: boolean | null
          photo_identite?: string | null
          prenoms?: string
          profession?: string | null
          reference_agent?: string
          role?: string
          salaire_base?: number | null
          situation_familiale?:
            | Database["public"]["Enums"]["situation_familiale"]
            | null
          statut_contractuel?:
            | Database["public"]["Enums"]["statut_contractuel"]
            | null
          taux_agent?: number | null
          taux_ayant_droit?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personnel_assureur_id_fkey"
            columns: ["assureur_id"]
            isOneToOne: false
            referencedRelation: "assureurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pharma_tool_configs: {
        Row: {
          config: Json | null
          created_at: string | null
          external_url: string | null
          id: string
          is_enabled: boolean | null
          last_sync_at: string | null
          tenant_id: string
          tool_name: string
          tool_type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          external_url?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          tenant_id: string
          tool_name: string
          tool_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          external_url?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          tenant_id?: string
          tool_name?: string
          tool_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharma_tool_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharma_tool_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          arrondissement: string | null
          city: string | null
          code: string
          created_at: string
          departement: string | null
          email: string | null
          id: string
          logo: string | null
          name: string
          niu: string | null
          password_hash: string | null
          pays: string | null
          photo_exterieur: string | null
          photo_interieur: string | null
          postal_code: string | null
          quartier: string | null
          region: string | null
          status: string | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          arrondissement?: string | null
          city?: string | null
          code: string
          created_at?: string
          departement?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          name: string
          niu?: string | null
          password_hash?: string | null
          pays?: string | null
          photo_exterieur?: string | null
          photo_interieur?: string | null
          postal_code?: string | null
          quartier?: string | null
          region?: string | null
          status?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          arrondissement?: string | null
          city?: string | null
          code?: string
          created_at?: string
          departement?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          name?: string
          niu?: string | null
          password_hash?: string | null
          pays?: string | null
          photo_exterieur?: string | null
          photo_interieur?: string | null
          postal_code?: string | null
          quartier?: string | null
          region?: string | null
          status?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_presence: {
        Row: {
          current_users: number | null
          id: string
          last_seen: string | null
          metadata: Json | null
          pharmacy_id: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          current_users?: number | null
          id?: string
          last_seen?: string | null
          metadata?: Json | null
          pharmacy_id: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          current_users?: number | null
          id?: string
          last_seen?: string | null
          metadata?: Json | null
          pharmacy_id?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_presence_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_presence_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_presence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_presence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          metadata: Json | null
          pharmacy_id: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          metadata?: Json | null
          pharmacy_id?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          metadata?: Json | null
          pharmacy_id?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_sessions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_sessions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_specialties: {
        Row: {
          certifications: string[] | null
          created_at: string | null
          description: string | null
          equipment: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_network_shared: boolean | null
          name: string
          patient_demographics: string | null
          protocols: string[] | null
          shared_with_pharmacies: string[] | null
          staff_requirements: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_network_shared?: boolean | null
          name: string
          patient_demographics?: string | null
          protocols?: string[] | null
          shared_with_pharmacies?: string[] | null
          staff_requirements?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_network_shared?: boolean | null
          name?: string
          patient_demographics?: string | null
          protocols?: string[] | null
          shared_with_pharmacies?: string[] | null
          staff_requirements?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_specialties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_specialties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmaml_transmissions: {
        Row: {
          code_erreur: string | null
          commande_id: string
          created_at: string
          duree_ms: number | null
          fournisseur_id: string
          id: string
          message: string | null
          numero_commande_pharmaml: string | null
          statut: string
          tenant_id: string
          updated_at: string
          xml_envoye: string | null
          xml_reponse: string | null
        }
        Insert: {
          code_erreur?: string | null
          commande_id: string
          created_at?: string
          duree_ms?: number | null
          fournisseur_id: string
          id?: string
          message?: string | null
          numero_commande_pharmaml?: string | null
          statut?: string
          tenant_id: string
          updated_at?: string
          xml_envoye?: string | null
          xml_reponse?: string | null
        }
        Update: {
          code_erreur?: string | null
          commande_id?: string
          created_at?: string
          duree_ms?: number | null
          fournisseur_id?: string
          id?: string
          message?: string | null
          numero_commande_pharmaml?: string | null
          statut?: string
          tenant_id?: string
          updated_at?: string
          xml_envoye?: string | null
          xml_reponse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmaml_transmissions_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmaml_transmissions_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmaml_transmissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmaml_transmissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_comptable: {
        Row: {
          analytique: boolean | null
          classe: number
          compte_parent_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          libelle_compte: string
          nature_compte: string | null
          niveau: number | null
          numero_compte: string
          rapprochement: boolean | null
          tenant_id: string
          type_compte: string
          updated_at: string
        }
        Insert: {
          analytique?: boolean | null
          classe: number
          compte_parent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_compte: string
          nature_compte?: string | null
          niveau?: number | null
          numero_compte: string
          rapprochement?: boolean | null
          tenant_id: string
          type_compte: string
          updated_at?: string
        }
        Update: {
          analytique?: boolean | null
          classe?: number
          compte_parent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle_compte?: string
          nature_compte?: string | null
          niveau?: number | null
          numero_compte?: string
          rapprochement?: boolean | null
          tenant_id?: string
          type_compte?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_comptable_compte_parent_id_fkey"
            columns: ["compte_parent_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_compte_parent_id_fkey"
            columns: ["compte_parent_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_employes: {
        Row: {
          created_at: string
          date: string
          employe_id: string
          heure_debut: string
          heure_fin: string
          id: number
          notes: string | null
          poste: string
          statut: string
          tenant_id: string
          type_shift: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          employe_id: string
          heure_debut: string
          heure_fin: string
          id?: number
          notes?: string | null
          poste: string
          statut?: string
          tenant_id: string
          type_shift: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          employe_id?: string
          heure_debut?: string
          heure_fin?: string
          id?: number
          notes?: string | null
          poste?: string
          statut?: string
          tenant_id?: string
          type_shift?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_employes_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_employes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_employes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      plans_comptables_globaux: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          devise_principale: string | null
          id: string
          is_active: boolean
          nom: string
          organisme_normalisation: string | null
          reference_reglementaire: string | null
          updated_at: string
          version: string | null
          zone_geographique: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          devise_principale?: string | null
          id?: string
          is_active?: boolean
          nom: string
          organisme_normalisation?: string | null
          reference_reglementaire?: string | null
          updated_at?: string
          version?: string | null
          zone_geographique?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          devise_principale?: string | null
          id?: string
          is_active?: boolean
          nom?: string
          organisme_normalisation?: string | null
          reference_reglementaire?: string | null
          updated_at?: string
          version?: string | null
          zone_geographique?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_comptables_globaux_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          auth_user_id: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          nom: string
          prenoms: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          nom: string
          prenoms?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          nom?: string
          prenoms?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_secret: boolean
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      preferences_utilisateur: {
        Row: {
          cle_preference: string
          created_at: string
          id: string
          personnel_id: string
          tenant_id: string
          type_preference: string
          updated_at: string
          valeur_preference: string | null
        }
        Insert: {
          cle_preference: string
          created_at?: string
          id?: string
          personnel_id: string
          tenant_id: string
          type_preference?: string
          updated_at?: string
          valeur_preference?: string | null
        }
        Update: {
          cle_preference?: string
          created_at?: string
          id?: string
          personnel_id?: string
          tenant_id?: string
          type_preference?: string
          updated_at?: string
          valeur_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preferences_utilisateur_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          client_id: string | null
          created_at: string | null
          date_expiration: string | null
          date_prescription: string
          date_validation: string | null
          diagnostic: string | null
          est_validee: boolean | null
          fichier_url: string | null
          id: string
          instructions: string | null
          medecin_nom: string | null
          medecin_specialite: string | null
          medecin_telephone: string | null
          metadata: Json | null
          notes: string | null
          numero_prescription: string
          statut: string | null
          tenant_id: string
          type_prescription: string | null
          updated_at: string | null
          validateur_id: string | null
          vente_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date_expiration?: string | null
          date_prescription: string
          date_validation?: string | null
          diagnostic?: string | null
          est_validee?: boolean | null
          fichier_url?: string | null
          id?: string
          instructions?: string | null
          medecin_nom?: string | null
          medecin_specialite?: string | null
          medecin_telephone?: string | null
          metadata?: Json | null
          notes?: string | null
          numero_prescription: string
          statut?: string | null
          tenant_id: string
          type_prescription?: string | null
          updated_at?: string | null
          validateur_id?: string | null
          vente_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date_expiration?: string | null
          date_prescription?: string
          date_validation?: string | null
          diagnostic?: string | null
          est_validee?: boolean | null
          fichier_url?: string | null
          id?: string
          instructions?: string | null
          medecin_nom?: string | null
          medecin_specialite?: string | null
          medecin_telephone?: string | null
          metadata?: Json | null
          notes?: string | null
          numero_prescription?: string
          statut?: string | null
          tenant_id?: string
          type_prescription?: string | null
          updated_at?: string | null
          validateur_id?: string | null
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      previsions_tresorerie: {
        Row: {
          coefficient_ajustement: number
          created_at: string
          entrees_prevues_xaf: number
          exercice_id: string | null
          id: string
          notes: string | null
          periode_debut: string
          periode_fin: string
          solde_final_previsionnel_xaf: number
          solde_initial_xaf: number
          sorties_prevues_xaf: number
          tenant_id: string
          type_scenario: string
          updated_at: string
        }
        Insert: {
          coefficient_ajustement?: number
          created_at?: string
          entrees_prevues_xaf?: number
          exercice_id?: string | null
          id?: string
          notes?: string | null
          periode_debut: string
          periode_fin: string
          solde_final_previsionnel_xaf?: number
          solde_initial_xaf?: number
          sorties_prevues_xaf?: number
          tenant_id: string
          type_scenario?: string
          updated_at?: string
        }
        Update: {
          coefficient_ajustement?: number
          created_at?: string
          entrees_prevues_xaf?: number
          exercice_id?: string | null
          id?: string
          notes?: string | null
          periode_debut?: string
          periode_fin?: string
          solde_final_previsionnel_xaf?: number
          solde_initial_xaf?: number
          sorties_prevues_xaf?: number
          tenant_id?: string
          type_scenario?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          allow_discounts: boolean | null
          auto_update_prices: boolean | null
          created_at: string
          default_centime_additionnel_rate: number | null
          default_margin: number | null
          default_tax_rate: number | null
          id: string
          include_tax_in_price: boolean | null
          max_discount_percent: number | null
          maximum_margin: number | null
          minimum_margin: number | null
          price_rounding_method: string | null
          price_rounding_value: number | null
          require_discount_approval: boolean | null
          show_cost_to_customers: boolean | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allow_discounts?: boolean | null
          auto_update_prices?: boolean | null
          created_at?: string
          default_centime_additionnel_rate?: number | null
          default_margin?: number | null
          default_tax_rate?: number | null
          id?: string
          include_tax_in_price?: boolean | null
          max_discount_percent?: number | null
          maximum_margin?: number | null
          minimum_margin?: number | null
          price_rounding_method?: string | null
          price_rounding_value?: number | null
          require_discount_approval?: boolean | null
          show_cost_to_customers?: boolean | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allow_discounts?: boolean | null
          auto_update_prices?: boolean | null
          created_at?: string
          default_centime_additionnel_rate?: number | null
          default_margin?: number | null
          default_tax_rate?: number | null
          id?: string
          include_tax_in_price?: boolean | null
          max_discount_percent?: number | null
          maximum_margin?: number | null
          minimum_margin?: number | null
          price_rounding_method?: string | null
          price_rounding_value?: number | null
          require_discount_approval?: boolean | null
          show_cost_to_customers?: boolean | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      print_printers: {
        Row: {
          connection_type: string
          created_at: string
          driver_name: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          paper_sizes: string[] | null
          port: string | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          driver_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          paper_sizes?: string[] | null
          port?: string | null
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          driver_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          paper_sizes?: string[] | null
          port?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      produits: {
        Row: {
          ancien_code_cip: string | null
          categorie_tarification_id: string | null
          centime_additionnel: number | null
          classe_therapeutique_id: string | null
          code_barre_externe: string | null
          code_cip: string | null
          conditions_conservation: string | null
          created_at: string
          dci_id: string | null
          famille_id: string | null
          forme_id: string | null
          id: string
          id_produit_source: string | null
          is_active: boolean | null
          laboratoires_id: string | null
          libelle_produit: string
          niveau_detail: number | null
          prescription_requise: boolean | null
          prix_achat: number | null
          prix_vente_ht: number | null
          prix_vente_ttc: number | null
          quantite_unites_details_source: number | null
          rayon_id: string | null
          rayon_produit_id: string | null
          reference_agent_enregistrement_id: string | null
          reference_agent_modification_id: string | null
          scanner_config: Json | null
          stock_critique: number | null
          stock_faible: number | null
          stock_limite: number | null
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string
          tva: number | null
          updated_at: string
        }
        Insert: {
          ancien_code_cip?: string | null
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          classe_therapeutique_id?: string | null
          code_barre_externe?: string | null
          code_cip?: string | null
          conditions_conservation?: string | null
          created_at?: string
          dci_id?: string | null
          famille_id?: string | null
          forme_id?: string | null
          id?: string
          id_produit_source?: string | null
          is_active?: boolean | null
          laboratoires_id?: string | null
          libelle_produit: string
          niveau_detail?: number | null
          prescription_requise?: boolean | null
          prix_achat?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_unites_details_source?: number | null
          rayon_id?: string | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          scanner_config?: Json | null
          stock_critique?: number | null
          stock_faible?: number | null
          stock_limite?: number | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id: string
          tva?: number | null
          updated_at?: string
        }
        Update: {
          ancien_code_cip?: string | null
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          classe_therapeutique_id?: string | null
          code_barre_externe?: string | null
          code_cip?: string | null
          conditions_conservation?: string | null
          created_at?: string
          dci_id?: string | null
          famille_id?: string | null
          forme_id?: string | null
          id?: string
          id_produit_source?: string | null
          is_active?: boolean | null
          laboratoires_id?: string | null
          libelle_produit?: string
          niveau_detail?: number | null
          prescription_requise?: boolean | null
          prix_achat?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_unites_details_source?: number | null
          rayon_id?: string | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          scanner_config?: Json | null
          stock_critique?: number | null
          stock_faible?: number | null
          stock_limite?: number | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id?: string
          tva?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produits_categorie_tarification"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_classe_therapeutique"
            columns: ["classe_therapeutique_id"]
            isOneToOne: false
            referencedRelation: "classes_therapeutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_dci_id"
            columns: ["dci_id"]
            isOneToOne: false
            referencedRelation: "dci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_famille_id"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_forme"
            columns: ["forme_id"]
            isOneToOne: false
            referencedRelation: "formes_galeniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_rayon"
            columns: ["rayon_id"]
            isOneToOne: false
            referencedRelation: "rayons_produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "produits_rayon_produit_id_fkey"
            columns: ["rayon_produit_id"]
            isOneToOne: false
            referencedRelation: "rayon_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_reference_agent_enregistrement_id_fkey"
            columns: ["reference_agent_enregistrement_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_reference_agent_modification_id_fkey"
            columns: ["reference_agent_modification_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      produits_dci: {
        Row: {
          created_at: string | null
          dci_id: string
          id: string
          produit_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          dci_id: string
          id?: string
          produit_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          dci_id?: string
          id?: string
          produit_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produits_dci_dci_id_fkey"
            columns: ["dci_id"]
            isOneToOne: false
            referencedRelation: "dci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_dci_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_dci_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_dci_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_dci_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
        ]
      }
      produits_eligibles_promotion: {
        Row: {
          categorie_id: string | null
          classe_therapeutique_id: string | null
          created_at: string
          id: string
          produit_id: string
          promotion_id: string
          tenant_id: string
        }
        Insert: {
          categorie_id?: string | null
          classe_therapeutique_id?: string | null
          created_at?: string
          id?: string
          produit_id: string
          promotion_id: string
          tenant_id: string
        }
        Update: {
          categorie_id?: string | null
          classe_therapeutique_id?: string | null
          created_at?: string
          id?: string
          produit_id?: string
          promotion_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produits_eligibles_promotion_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_eligibles_promotion_classe_therapeutique_id_fkey"
            columns: ["classe_therapeutique_id"]
            isOneToOne: false
            referencedRelation: "classes_therapeutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_eligibles_promotion_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_eligibles_promotion_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_eligibles_promotion_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_eligibles_promotion_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "produits_eligibles_promotion_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      produits_substituts: {
        Row: {
          created_at: string | null
          date_derniere_utilisation: string | null
          efficacite_validee: boolean | null
          id: string
          is_active: boolean | null
          nombre_utilisations: number | null
          priorite: number | null
          produit_principal_id: string
          produit_substitut_id: string
          raison_substitution: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_derniere_utilisation?: string | null
          efficacite_validee?: boolean | null
          id?: string
          is_active?: boolean | null
          nombre_utilisations?: number | null
          priorite?: number | null
          produit_principal_id: string
          produit_substitut_id: string
          raison_substitution?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_derniere_utilisation?: string | null
          efficacite_validee?: boolean | null
          id?: string
          is_active?: boolean | null
          nombre_utilisations?: number | null
          priorite?: number | null
          produit_principal_id?: string
          produit_substitut_id?: string
          raison_substitution?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_substituts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_substituts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_fidelite: {
        Row: {
          client_id: string
          created_at: string | null
          date_adhesion: string | null
          date_derniere_activite: string | null
          id: string
          metadata: Json | null
          montant_total_achats: number | null
          niveau_fidelite: string | null
          nombre_achats: number | null
          numero_carte: string | null
          points_actuels: number | null
          points_cumules: number | null
          points_utilises: number | null
          recompenses_gagnees: number | null
          recompenses_utilisees: number | null
          statut: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_adhesion?: string | null
          date_derniere_activite?: string | null
          id?: string
          metadata?: Json | null
          montant_total_achats?: number | null
          niveau_fidelite?: string | null
          nombre_achats?: number | null
          numero_carte?: string | null
          points_actuels?: number | null
          points_cumules?: number | null
          points_utilises?: number | null
          recompenses_gagnees?: number | null
          recompenses_utilisees?: number | null
          statut?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_adhesion?: string | null
          date_derniere_activite?: string | null
          id?: string
          metadata?: Json | null
          montant_total_achats?: number | null
          niveau_fidelite?: string | null
          nombre_achats?: number | null
          numero_carte?: string | null
          points_actuels?: number | null
          points_cumules?: number | null
          points_utilises?: number | null
          recompenses_gagnees?: number | null
          recompenses_utilisees?: number | null
          statut?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programme_fidelite_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_fidelite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_fidelite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          cible_clients: string
          code_promo: string | null
          combinable: boolean | null
          conditions: Json | null
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          description: string | null
          est_actif: boolean
          heure_debut: string | null
          heure_fin: string | null
          id: string
          limite_par_client: number | null
          limite_utilisations: number | null
          montant_minimum: number | null
          nom: string
          nombre_utilisations: number
          priorite: number | null
          tenant_id: string
          type_promotion: string
          updated_at: string
          valeur_promotion: number
        }
        Insert: {
          cible_clients?: string
          code_promo?: string | null
          combinable?: boolean | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          description?: string | null
          est_actif?: boolean
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          limite_par_client?: number | null
          limite_utilisations?: number | null
          montant_minimum?: number | null
          nom: string
          nombre_utilisations?: number
          priorite?: number | null
          tenant_id: string
          type_promotion: string
          updated_at?: string
          valeur_promotion: number
        }
        Update: {
          cible_clients?: string
          code_promo?: string | null
          combinable?: boolean | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          description?: string | null
          est_actif?: boolean
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          limite_par_client?: number | null
          limite_utilisations?: number | null
          montant_minimum?: number | null
          nom?: string
          nombre_utilisations?: number
          priorite?: number | null
          tenant_id?: string
          type_promotion?: string
          updated_at?: string
          valeur_promotion?: number
        }
        Relationships: []
      }
      rapports_comptables: {
        Row: {
          contenu: Json
          created_at: string
          date_debut: string
          date_fin: string
          exercice_id: string | null
          id: string
          tenant_id: string
          type_rapport: string
        }
        Insert: {
          contenu?: Json
          created_at?: string
          date_debut: string
          date_fin: string
          exercice_id?: string | null
          id?: string
          tenant_id: string
          type_rapport: string
        }
        Update: {
          contenu?: Json
          created_at?: string
          date_debut?: string
          date_fin?: string
          exercice_id?: string | null
          id?: string
          tenant_id?: string
          type_rapport?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapports_comptables_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rapprochements_bancaires: {
        Row: {
          commentaires: string | null
          compte_bancaire_id: string
          created_at: string
          created_by_id: string | null
          date_debut: string
          date_fin: string
          date_validation: string | null
          ecart: number
          ecart_justifie: number
          ecart_non_justifie: number
          id: string
          nb_transactions_non_rapprochees: number
          nb_transactions_rapprochees: number
          nb_transactions_suspectes: number
          notes: string | null
          numero_rapprochement: string
          solde_comptable_debut: number
          solde_comptable_fin: number
          solde_releve_debut: number
          solde_releve_fin: number
          statut: string
          tenant_id: string
          updated_at: string
          valide_par_id: string | null
        }
        Insert: {
          commentaires?: string | null
          compte_bancaire_id: string
          created_at?: string
          created_by_id?: string | null
          date_debut: string
          date_fin: string
          date_validation?: string | null
          ecart?: number
          ecart_justifie?: number
          ecart_non_justifie?: number
          id?: string
          nb_transactions_non_rapprochees?: number
          nb_transactions_rapprochees?: number
          nb_transactions_suspectes?: number
          notes?: string | null
          numero_rapprochement: string
          solde_comptable_debut: number
          solde_comptable_fin: number
          solde_releve_debut: number
          solde_releve_fin: number
          statut?: string
          tenant_id: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Update: {
          commentaires?: string | null
          compte_bancaire_id?: string
          created_at?: string
          created_by_id?: string | null
          date_debut?: string
          date_fin?: string
          date_validation?: string | null
          ecart?: number
          ecart_justifie?: number
          ecart_non_justifie?: number
          id?: string
          nb_transactions_non_rapprochees?: number
          nb_transactions_rapprochees?: number
          nb_transactions_suspectes?: number
          notes?: string | null
          numero_rapprochement?: string
          solde_comptable_debut?: number
          solde_comptable_fin?: number
          solde_releve_debut?: number
          solde_releve_fin?: number
          statut?: string
          tenant_id?: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapprochements_bancaires_compte_bancaire_id_fkey"
            columns: ["compte_bancaire_id"]
            isOneToOne: false
            referencedRelation: "comptes_bancaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapprochements_bancaires_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapprochements_bancaires_valide_par_id_fkey"
            columns: ["valide_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      rayon_produit: {
        Row: {
          created_at: string
          id: string
          libelle_rayon: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          libelle_rayon: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          libelle_rayon?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rayon_produit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rayon_produit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rayons_produits: {
        Row: {
          created_at: string
          description: string | null
          id: string
          libelle_rayon: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_rayon: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          libelle_rayon?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      receptions_fournisseurs: {
        Row: {
          agent_id: string | null
          commande_id: string | null
          created_at: string
          date_reception: string | null
          emballage_conforme: boolean | null
          etiquetage_correct: boolean | null
          facture_generee: boolean | null
          facture_id: string | null
          fournisseur_id: string
          id: string
          montant_asdi: number | null
          montant_centime_additionnel: number | null
          montant_ht: number | null
          montant_ttc: number | null
          montant_tva: number | null
          notes: string | null
          numero_reception: string | null
          reference_facture: string | null
          statut: string | null
          temperature_respectee: boolean | null
          tenant_id: string
          updated_at: string
          valide_par_id: string | null
        }
        Insert: {
          agent_id?: string | null
          commande_id?: string | null
          created_at?: string
          date_reception?: string | null
          emballage_conforme?: boolean | null
          etiquetage_correct?: boolean | null
          facture_generee?: boolean | null
          facture_id?: string | null
          fournisseur_id: string
          id?: string
          montant_asdi?: number | null
          montant_centime_additionnel?: number | null
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_reception?: string | null
          reference_facture?: string | null
          statut?: string | null
          temperature_respectee?: boolean | null
          tenant_id: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Update: {
          agent_id?: string | null
          commande_id?: string | null
          created_at?: string
          date_reception?: string | null
          emballage_conforme?: boolean | null
          etiquetage_correct?: boolean | null
          facture_generee?: boolean | null
          facture_id?: string | null
          fournisseur_id?: string
          id?: string
          montant_asdi?: number | null
          montant_centime_additionnel?: number | null
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_reception?: string | null
          reference_facture?: string | null
          statut?: string | null
          temperature_respectee?: boolean | null
          tenant_id?: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receptions_fournisseurs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_fournisseurs_valide_par_id_fkey"
            columns: ["valide_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      recompenses_fidelite: {
        Row: {
          cout_points: number
          created_at: string | null
          description: string | null
          duree_validite_jours: number | null
          est_actif: boolean | null
          id: string
          image_url: string | null
          metadata: Json | null
          niveau_requis: string | null
          nom: string
          produit_id: string | null
          stock_disponible: number | null
          tenant_id: string
          type_recompense: string
          updated_at: string | null
          utilisations: number | null
          valeur: number | null
        }
        Insert: {
          cout_points: number
          created_at?: string | null
          description?: string | null
          duree_validite_jours?: number | null
          est_actif?: boolean | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          niveau_requis?: string | null
          nom: string
          produit_id?: string | null
          stock_disponible?: number | null
          tenant_id: string
          type_recompense: string
          updated_at?: string | null
          utilisations?: number | null
          valeur?: number | null
        }
        Update: {
          cout_points?: number
          created_at?: string | null
          description?: string | null
          duree_validite_jours?: number | null
          est_actif?: boolean | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          niveau_requis?: string | null
          nom?: string
          produit_id?: string | null
          stock_disponible?: number | null
          tenant_id?: string
          type_recompense?: string
          updated_at?: string | null
          utilisations?: number | null
          valeur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recompenses_fidelite_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompenses_fidelite_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompenses_fidelite_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompenses_fidelite_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "recompenses_fidelite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompenses_fidelite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reglementations: {
        Row: {
          autorite_competente: string
          created_at: string
          date_application: string
          date_expiration: string | null
          description: string | null
          id: string
          niveau_restriction: string
          nom_reglementation: string
          produits_concernes: number | null
          reference_legale: string
          statut: string
          tenant_id: string
          type_reglementation: string
          updated_at: string
        }
        Insert: {
          autorite_competente: string
          created_at?: string
          date_application: string
          date_expiration?: string | null
          description?: string | null
          id?: string
          niveau_restriction: string
          nom_reglementation: string
          produits_concernes?: number | null
          reference_legale: string
          statut?: string
          tenant_id: string
          type_reglementation: string
          updated_at?: string
        }
        Update: {
          autorite_competente?: string
          created_at?: string
          date_application?: string
          date_expiration?: string | null
          description?: string | null
          id?: string
          niveau_restriction?: string
          nom_reglementation?: string
          produits_concernes?: number | null
          reference_legale?: string
          statut?: string
          tenant_id?: string
          type_reglementation?: string
          updated_at?: string
        }
        Relationships: []
      }
      regles_categorisation_bancaire: {
        Row: {
          appliquee_automatiquement: boolean
          banque_specifique: string | null
          categorie_cible: string
          created_at: string
          est_actif: boolean
          id: string
          montant_max: number | null
          montant_min: number | null
          nom_regle: string
          pattern_recherche: string
          priorite: number
          tenant_id: string
          type_pattern: string
          type_transaction: string
          updated_at: string
        }
        Insert: {
          appliquee_automatiquement?: boolean
          banque_specifique?: string | null
          categorie_cible: string
          created_at?: string
          est_actif?: boolean
          id?: string
          montant_max?: number | null
          montant_min?: number | null
          nom_regle: string
          pattern_recherche: string
          priorite?: number
          tenant_id: string
          type_pattern?: string
          type_transaction?: string
          updated_at?: string
        }
        Update: {
          appliquee_automatiquement?: boolean
          banque_specifique?: string | null
          categorie_cible?: string
          created_at?: string
          est_actif?: boolean
          id?: string
          montant_max?: number | null
          montant_min?: number | null
          nom_regle?: string
          pattern_recherche?: string
          priorite?: number
          tenant_id?: string
          type_pattern?: string
          type_transaction?: string
          updated_at?: string
        }
        Relationships: []
      }
      relances_factures: {
        Row: {
          created_at: string
          created_by_id: string | null
          date_relance: string
          destinataire: string | null
          facture_id: string
          id: string
          message: string | null
          statut: string
          tenant_id: string
          type_relance: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          date_relance?: string
          destinataire?: string | null
          facture_id: string
          id?: string
          message?: string | null
          statut?: string
          tenant_id: string
          type_relance: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          date_relance?: string
          destinataire?: string | null
          facture_id?: string
          id?: string
          message?: string | null
          statut?: string
          tenant_id?: string
          type_relance?: string
        }
        Relationships: [
          {
            foreignKeyName: "relances_factures_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_factures_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relances_factures_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_settings: {
        Row: {
          auto_send: boolean
          control_reminders_enabled: boolean
          created_at: string
          days_before_expiry: number
          email_enabled: boolean
          id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_frequency: string
          renewal_reminders_enabled: boolean
          sms_enabled: boolean
          tenant_id: string
          updated_at: string
          vaccination_reminders_enabled: boolean
          whatsapp_enabled: boolean
        }
        Insert: {
          auto_send?: boolean
          control_reminders_enabled?: boolean
          created_at?: string
          days_before_expiry?: number
          email_enabled?: boolean
          id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string
          renewal_reminders_enabled?: boolean
          sms_enabled?: boolean
          tenant_id: string
          updated_at?: string
          vaccination_reminders_enabled?: boolean
          whatsapp_enabled?: boolean
        }
        Update: {
          auto_send?: boolean
          control_reminders_enabled?: boolean
          created_at?: string
          days_before_expiry?: number
          email_enabled?: boolean
          id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_frequency?: string
          renewal_reminders_enabled?: boolean
          sms_enabled?: boolean
          tenant_id?: string
          updated_at?: string
          vaccination_reminders_enabled?: boolean
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reminder_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      repartitions_charges: {
        Row: {
          cle_repartition_id: string | null
          comptabilise_par_id: string | null
          compte_charge_id: string | null
          created_at: string
          created_by_id: string | null
          date_comptabilisation: string | null
          date_repartition: string
          date_validation: string | null
          ecriture_comptable_id: string | null
          id: string
          libelle: string
          methode: string
          montant_non_reparti: number | null
          montant_reparti: number
          montant_total: number
          notes: string | null
          numero_repartition: string
          statut: string
          tenant_id: string
          type_charge: string
          updated_at: string
          valide_par_id: string | null
        }
        Insert: {
          cle_repartition_id?: string | null
          comptabilise_par_id?: string | null
          compte_charge_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_comptabilisation?: string | null
          date_repartition: string
          date_validation?: string | null
          ecriture_comptable_id?: string | null
          id?: string
          libelle: string
          methode: string
          montant_non_reparti?: number | null
          montant_reparti?: number
          montant_total: number
          notes?: string | null
          numero_repartition: string
          statut?: string
          tenant_id: string
          type_charge: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Update: {
          cle_repartition_id?: string | null
          comptabilise_par_id?: string | null
          compte_charge_id?: string | null
          created_at?: string
          created_by_id?: string | null
          date_comptabilisation?: string | null
          date_repartition?: string
          date_validation?: string | null
          ecriture_comptable_id?: string | null
          id?: string
          libelle?: string
          methode?: string
          montant_non_reparti?: number | null
          montant_reparti?: number
          montant_total?: number
          notes?: string | null
          numero_repartition?: string
          statut?: string
          tenant_id?: string
          type_charge?: string
          updated_at?: string
          valide_par_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repartitions_charges_cle_repartition_id_fkey"
            columns: ["cle_repartition_id"]
            isOneToOne: false
            referencedRelation: "cles_repartition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_comptabilise_par_id_fkey"
            columns: ["comptabilise_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_compte_charge_id_fkey"
            columns: ["compte_charge_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_compte_charge_id_fkey"
            columns: ["compte_charge_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_ecriture_comptable_id_fkey"
            columns: ["ecriture_comptable_id"]
            isOneToOne: false
            referencedRelation: "ecritures_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_ecriture_comptable_id_fkey"
            columns: ["ecriture_comptable_id"]
            isOneToOne: false
            referencedRelation: "v_ecritures_avec_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repartitions_charges_valide_par_id_fkey"
            columns: ["valide_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      report_api_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          name: string
          permissions: Json | null
          scopes: string[] | null
          tenant_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          name: string
          permissions?: Json | null
          scopes?: string[] | null
          tenant_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          name?: string
          permissions?: Json | null
          scopes?: string[] | null
          tenant_id?: string
          token_hash?: string
        }
        Relationships: []
      }
      report_archiving_policies: {
        Row: {
          created_at: string
          id: string
          purge_enabled: boolean
          retention_days: number
          storage_location: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          purge_enabled?: boolean
          retention_days?: number
          storage_location?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          purge_enabled?: boolean
          retention_days?: number
          storage_location?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      report_connectors: {
        Row: {
          config: Json | null
          connector_name: string
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean | null
          last_sync: string | null
          provider: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connector_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync?: string | null
          provider: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connector_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync?: string | null
          provider?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_export: boolean | null
          can_modify: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          report_key: string
          report_type: string
          subject: string
          subject_id: string
          subject_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_modify?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          report_key: string
          report_type: string
          subject: string
          subject_id: string
          subject_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_export?: boolean | null
          can_modify?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          report_key?: string
          report_type?: string
          subject?: string
          subject_id?: string
          subject_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          cron_expr: string | null
          day_of_month: number | null
          day_of_week: number | null
          format: string
          frequency: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          options: Json | null
          recipients: Json | null
          report_key: string | null
          report_type: string
          schedule_config: Json | null
          schedule_name: string
          schedule_type: string
          template_id: string | null
          tenant_id: string
          time_of_day: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          cron_expr?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          format: string
          frequency: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          options?: Json | null
          recipients?: Json | null
          report_key?: string | null
          report_type: string
          schedule_config?: Json | null
          schedule_name: string
          schedule_type: string
          template_id?: string | null
          tenant_id: string
          time_of_day?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          cron_expr?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          format?: string
          frequency?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          options?: Json | null
          recipients?: Json | null
          report_key?: string | null
          report_type?: string
          schedule_config?: Json | null
          schedule_name?: string
          schedule_type?: string
          template_id?: string | null
          tenant_id?: string
          time_of_day?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_schedules_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_template_versions: {
        Row: {
          change_notes: string | null
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          template_id: string
          tenant_id: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_id: string
          tenant_id: string
          version_number: number
        }
        Update: {
          change_notes?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          template_id?: string
          tenant_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          category: string
          content: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_system: boolean | null
          name: string
          template_type: string
          tenant_id: string
          updated_at: string
          version: number | null
        }
        Insert: {
          category: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_system?: boolean | null
          name: string
          template_type: string
          tenant_id: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          category?: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_system?: boolean | null
          name?: string
          template_type?: string
          tenant_id?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      retours: {
        Row: {
          agent_id: string | null
          client_id: string | null
          created_at: string | null
          date_retour: string | null
          date_validation: string | null
          id: string
          metadata: Json | null
          mode_remboursement: string | null
          montant_avoir: number | null
          montant_rembourse: number | null
          montant_total_retour: number | null
          motif_retour: string
          notes: string | null
          numero_retour: string
          numero_vente_origine: string | null
          statut: string | null
          tenant_id: string
          type_operation: string | null
          updated_at: string | null
          validateur_id: string | null
          vente_origine_id: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string | null
          date_retour?: string | null
          date_validation?: string | null
          id?: string
          metadata?: Json | null
          mode_remboursement?: string | null
          montant_avoir?: number | null
          montant_rembourse?: number | null
          montant_total_retour?: number | null
          motif_retour: string
          notes?: string | null
          numero_retour: string
          numero_vente_origine?: string | null
          statut?: string | null
          tenant_id: string
          type_operation?: string | null
          updated_at?: string | null
          validateur_id?: string | null
          vente_origine_id?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string | null
          date_retour?: string | null
          date_validation?: string | null
          id?: string
          metadata?: Json | null
          mode_remboursement?: string | null
          montant_avoir?: number | null
          montant_rembourse?: number | null
          montant_total_retour?: number | null
          motif_retour?: string
          notes?: string | null
          numero_retour?: string
          numero_vente_origine?: string | null
          statut?: string | null
          tenant_id?: string
          type_operation?: string | null
          updated_at?: string | null
          validateur_id?: string | null
          vente_origine_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retours_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_vente_origine_id_fkey"
            columns: ["vente_origine_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          niveau_hierarchique: number
          nom_role: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          niveau_hierarchique?: number
          nom_role: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          niveau_hierarchique?: number
          nom_role?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_permissions: {
        Row: {
          accorde: boolean | null
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          accorde?: boolean | null
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          accorde?: boolean | null
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_access_rules: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          permissions: string[] | null
          priority: number | null
          rule_name: string
          rule_type: string
          target_resource: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: string[] | null
          priority?: number | null
          rule_name: string
          rule_type: string
          target_resource?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: string[] | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          target_resource?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_access_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_access_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_access_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_auth_methods: {
        Row: {
          configuration: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          is_required_for_2fa: boolean | null
          last_used_at: string | null
          method_type: string
          tenant_id: string
          updated_at: string
          users_enrolled_count: number | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          is_required_for_2fa?: boolean | null
          last_used_at?: string | null
          method_type: string
          tenant_id: string
          updated_at?: string
          users_enrolled_count?: number | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          is_required_for_2fa?: boolean | null
          last_used_at?: string | null
          method_type?: string
          tenant_id?: string
          updated_at?: string
          users_enrolled_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "security_auth_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_auth_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_controls: {
        Row: {
          check_frequency: string | null
          compliance_score: number | null
          control_name: string
          control_type: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          last_check_date: string | null
          metadata: Json | null
          next_check_date: string | null
          risk_level: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          check_frequency?: string | null
          compliance_score?: number | null
          control_name: string
          control_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_check_date?: string | null
          metadata?: Json | null
          next_check_date?: string | null
          risk_level?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          check_frequency?: string | null
          compliance_score?: number | null
          control_name?: string
          control_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_check_date?: string | null
          metadata?: Json | null
          next_check_date?: string | null
          risk_level?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_systems: string[] | null
          created_at: string
          description: string | null
          id: string
          impact_level: string
          incident_type: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affected_systems?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          impact_level?: string
          incident_type?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affected_systems?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          impact_level?: string
          incident_type?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_key_rotations: {
        Row: {
          completed_at: string | null
          created_at: string
          encryption_config_id: string | null
          id: string
          initiated_by: string | null
          new_key_id: string | null
          old_key_id: string | null
          rotation_type: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          encryption_config_id?: string | null
          id?: string
          initiated_by?: string | null
          new_key_id?: string | null
          old_key_id?: string | null
          rotation_type: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          encryption_config_id?: string | null
          id?: string
          initiated_by?: string | null
          new_key_id?: string | null
          old_key_id?: string | null
          rotation_type?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_key_rotations_encryption_config_id_fkey"
            columns: ["encryption_config_id"]
            isOneToOne: false
            referencedRelation: "encryption_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_key_rotations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_key_rotations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_key_rotations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_reports: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          params: Json | null
          status: string
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          params?: Json | null
          status?: string
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          params?: Json | null
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_caisse: {
        Row: {
          agent_id: string | null
          caisse_id: string | null
          caissier_id: string | null
          created_at: string
          date_fermeture: string | null
          date_ouverture: string | null
          date_session: string
          ecart: number | null
          fond_caisse_fermeture: number | null
          fond_caisse_ouverture: number | null
          id: string
          montant_reel_fermeture: number | null
          montant_theorique_fermeture: number | null
          montant_total_encaissements: number | null
          montant_total_ventes: number | null
          notes: string | null
          numero_session: string | null
          statut: string | null
          tenant_id: string
          type_session: Database["public"]["Enums"]["type_session_enum"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          caisse_id?: string | null
          caissier_id?: string | null
          created_at?: string
          date_fermeture?: string | null
          date_ouverture?: string | null
          date_session?: string
          ecart?: number | null
          fond_caisse_fermeture?: number | null
          fond_caisse_ouverture?: number | null
          id?: string
          montant_reel_fermeture?: number | null
          montant_theorique_fermeture?: number | null
          montant_total_encaissements?: number | null
          montant_total_ventes?: number | null
          notes?: string | null
          numero_session?: string | null
          statut?: string | null
          tenant_id: string
          type_session?: Database["public"]["Enums"]["type_session_enum"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          caisse_id?: string | null
          caissier_id?: string | null
          created_at?: string
          date_fermeture?: string | null
          date_ouverture?: string | null
          date_session?: string
          ecart?: number | null
          fond_caisse_fermeture?: number | null
          fond_caisse_ouverture?: number | null
          id?: string
          montant_reel_fermeture?: number | null
          montant_theorique_fermeture?: number | null
          montant_total_encaissements?: number | null
          montant_total_ventes?: number | null
          notes?: string | null
          numero_session?: string | null
          statut?: string | null
          tenant_id?: string
          type_session?: Database["public"]["Enums"]["type_session_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_caisse_id_fkey"
            columns: ["caisse_id"]
            isOneToOne: false
            referencedRelation: "caisses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_documents: {
        Row: {
          category: string | null
          channel_id: string | null
          created_at: string
          description: string | null
          document_id: string | null
          download_count: number | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_network_document: boolean | null
          last_accessed_at: string | null
          name: string
          shared_with_pharmacies: string[] | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
          uploaded_by_name: string | null
          uploaded_by_pharmacy_id: string | null
          uploaded_by_user_id: string | null
          version: number | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          channel_id?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          download_count?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_network_document?: boolean | null
          last_accessed_at?: string | null
          name: string
          shared_with_pharmacies?: string[] | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          uploaded_by_name?: string | null
          uploaded_by_pharmacy_id?: string | null
          uploaded_by_user_id?: string | null
          version?: number | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          channel_id?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          download_count?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_network_document?: boolean | null
          last_accessed_at?: string | null
          name?: string
          shared_with_pharmacies?: string[] | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          uploaded_by_name?: string | null
          uploaded_by_pharmacy_id?: string | null
          uploaded_by_user_id?: string | null
          version?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_documents_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "network_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_uploaded_by_pharmacy_id_fkey"
            columns: ["uploaded_by_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_uploaded_by_pharmacy_id_fkey"
            columns: ["uploaded_by_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "collaborative_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      societes: {
        Row: {
          adresse: string | null
          assureur_id: string | null
          caution: number | null
          created_at: string
          email: string | null
          id: string
          libelle_societe: string
          limite_dette: number | null
          niu: string | null
          peut_prendre_bon: boolean | null
          taux_couverture_agent: number | null
          taux_couverture_ayant_droit: number | null
          taux_remise_automatique: number | null
          taux_ticket_moderateur: number | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          assureur_id?: string | null
          caution?: number | null
          created_at?: string
          email?: string | null
          id?: string
          libelle_societe: string
          limite_dette?: number | null
          niu?: string | null
          peut_prendre_bon?: boolean | null
          taux_couverture_agent?: number | null
          taux_couverture_ayant_droit?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          assureur_id?: string | null
          caution?: number | null
          created_at?: string
          email?: string | null
          id?: string
          libelle_societe?: string
          limite_dette?: number | null
          niu?: string | null
          peut_prendre_bon?: boolean | null
          taux_couverture_agent?: number | null
          taux_couverture_ayant_droit?: number | null
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "societes_assureur_id_fkey"
            columns: ["assureur_id"]
            isOneToOne: false
            referencedRelation: "assureurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "societes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "societes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sous_compte_depenses: {
        Row: {
          compte_depenses_id: string
          created_at: string
          id: string
          libelle_sous_compte: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          compte_depenses_id: string
          created_at?: string
          id?: string
          libelle_sous_compte: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          compte_depenses_id?: string
          created_at?: string
          id?: string
          libelle_sous_compte?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sous_compte_depenses_compte_depenses_id_fkey"
            columns: ["compte_depenses_id"]
            isOneToOne: false
            referencedRelation: "compte_depenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sous_compte_depenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sous_compte_depenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alert_recipients: {
        Row: {
          alert_id: string
          created_at: string
          id: string
          notification_type: string
          personnel_id: string
          read_at: string | null
          sent_at: string | null
          tenant_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          id?: string
          notification_type: string
          personnel_id: string
          read_at?: string | null
          sent_at?: string | null
          tenant_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          id?: string
          notification_type?: string
          personnel_id?: string
          read_at?: string | null
          sent_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alert_recipients_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alertes_peremption"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alert_recipients_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_mouvements: {
        Row: {
          agent_id: string | null
          created_at: string
          date_mouvement: string | null
          id: string
          lot_id: string | null
          produit_id: string
          quantite: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          type_mouvement: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          date_mouvement?: string | null
          id?: string
          lot_id?: string | null
          produit_id: string
          quantite: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          type_mouvement: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          date_mouvement?: string | null
          id?: string
          lot_id?: string | null
          produit_id?: string
          quantite?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          type_mouvement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_mouvements_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "stock_mouvements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mouvements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_settings: {
        Row: {
          allow_negative_stock: boolean | null
          auto_generate_lots: boolean | null
          auto_reorder_enabled: boolean | null
          created_at: string
          default_units: string | null
          id: string
          maximum_stock_days: number | null
          minimum_stock_days: number | null
          reorder_point_days: number | null
          require_lot_numbers: boolean | null
          rounding_precision: number | null
          safety_stock_percentage: number | null
          tenant_id: string
          track_expiration_dates: boolean | null
          updated_at: string
          valuation_method: string | null
        }
        Insert: {
          allow_negative_stock?: boolean | null
          auto_generate_lots?: boolean | null
          auto_reorder_enabled?: boolean | null
          created_at?: string
          default_units?: string | null
          id?: string
          maximum_stock_days?: number | null
          minimum_stock_days?: number | null
          reorder_point_days?: number | null
          require_lot_numbers?: boolean | null
          rounding_precision?: number | null
          safety_stock_percentage?: number | null
          tenant_id: string
          track_expiration_dates?: boolean | null
          updated_at?: string
          valuation_method?: string | null
        }
        Update: {
          allow_negative_stock?: boolean | null
          auto_generate_lots?: boolean | null
          auto_reorder_enabled?: boolean | null
          created_at?: string
          default_units?: string | null
          id?: string
          maximum_stock_days?: number | null
          minimum_stock_days?: number | null
          reorder_point_days?: number | null
          require_lot_numbers?: boolean | null
          rounding_precision?: number | null
          safety_stock_percentage?: number | null
          tenant_id?: string
          track_expiration_dates?: boolean | null
          updated_at?: string
          valuation_method?: string | null
        }
        Relationships: []
      }
      suggestions_vente: {
        Row: {
          created_at: string | null
          id: string
          lot_id: string
          metadata: Json | null
          motif_suggestion: string
          priorite: string
          prix_vente_suggere: number
          produit_id: string
          remise_suggere: number | null
          statut: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lot_id: string
          metadata?: Json | null
          motif_suggestion: string
          priorite?: string
          prix_vente_suggere: number
          produit_id: string
          remise_suggere?: number | null
          statut?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lot_id?: string
          metadata?: Json | null
          motif_suggestion?: string
          priorite?: string
          prix_vente_suggere?: number
          produit_id?: string
          remise_suggere?: number | null
          statut?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_vente_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "suggestions_vente_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_vente_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      suivi_commandes: {
        Row: {
          agent_id: string | null
          commande_id: string
          commentaire: string | null
          created_at: string
          date_changement: string
          id: string
          numero_suivi: string | null
          statut: string
          tenant_id: string
          transporteur_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          commande_id: string
          commentaire?: string | null
          created_at?: string
          date_changement?: string
          id?: string
          numero_suivi?: string | null
          statut: string
          tenant_id: string
          transporteur_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          commande_id?: string
          commentaire?: string | null
          created_at?: string
          date_changement?: string
          id?: string
          numero_suivi?: string | null
          statut?: string
          tenant_id?: string
          transporteur_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suivi_commandes_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_commandes_transporteur_id_fkey"
            columns: ["transporteur_id"]
            isOneToOne: false
            referencedRelation: "transporteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_excel_mappings: {
        Row: {
          created_at: string
          fournisseur_id: string
          id: string
          is_active: boolean | null
          mapping_config: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fournisseur_id: string
          id?: string
          is_active?: boolean | null
          mapping_config?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fournisseur_id?: string
          id?: string
          is_active?: boolean | null
          mapping_config?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_excel_mappings_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_excel_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_excel_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_name: string | null
          author_pharmacy_id: string | null
          author_user_id: string | null
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_name?: string | null
          author_pharmacy_id?: string | null
          author_user_id?: string | null
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_name?: string | null
          author_pharmacy_id?: string | null
          author_user_id?: string | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_pharmacy_id_fkey"
            columns: ["author_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_author_pharmacy_id_fkey"
            columns: ["author_pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "collaborative_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      taux_tva: {
        Row: {
          created_at: string
          description: string | null
          est_actif: boolean
          est_par_defaut: boolean
          id: string
          nom_taux: string
          taux_pourcentage: number
          tenant_id: string
          type_taux: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          est_actif?: boolean
          est_par_defaut?: boolean
          id?: string
          nom_taux: string
          taux_pourcentage: number
          tenant_id: string
          type_taux: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          est_actif?: boolean
          est_par_defaut?: boolean
          id?: string
          nom_taux?: string
          taux_pourcentage?: number
          tenant_id?: string
          type_taux?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_security_config: {
        Row: {
          allow_cross_tenant_read: boolean
          allowed_source_tenants: string[] | null
          auto_block_violations: boolean
          created_at: string
          id: string
          max_violations_per_hour: number
          notification_webhook: string | null
          security_level: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allow_cross_tenant_read?: boolean
          allowed_source_tenants?: string[] | null
          auto_block_violations?: boolean
          created_at?: string
          id?: string
          max_violations_per_hour?: number
          notification_webhook?: string | null
          security_level?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allow_cross_tenant_read?: boolean
          allowed_source_tenants?: string[] | null
          auto_block_violations?: boolean
          created_at?: string
          id?: string
          max_violations_per_hour?: number
          notification_webhook?: string | null
          security_level?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_security_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_security_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_bancaires: {
        Row: {
          categorie: string | null
          compte_bancaire_id: string
          created_at: string
          created_by_id: string | null
          date_import: string | null
          date_rapprochement: string | null
          date_transaction: string
          date_valeur: string | null
          description: string | null
          encaissement_id: string | null
          id: string
          libelle: string
          metadata: Json | null
          montant: number
          mouvement_caisse_id: string | null
          notes: string | null
          paiement_facture_id: string | null
          pieces_jointes: Json | null
          rapproche_par_id: string | null
          reference: string
          reference_externe: string | null
          source_import: string | null
          statut_rapprochement: string
          tenant_id: string
          type_transaction: string
          updated_at: string
        }
        Insert: {
          categorie?: string | null
          compte_bancaire_id: string
          created_at?: string
          created_by_id?: string | null
          date_import?: string | null
          date_rapprochement?: string | null
          date_transaction: string
          date_valeur?: string | null
          description?: string | null
          encaissement_id?: string | null
          id?: string
          libelle: string
          metadata?: Json | null
          montant: number
          mouvement_caisse_id?: string | null
          notes?: string | null
          paiement_facture_id?: string | null
          pieces_jointes?: Json | null
          rapproche_par_id?: string | null
          reference: string
          reference_externe?: string | null
          source_import?: string | null
          statut_rapprochement?: string
          tenant_id: string
          type_transaction: string
          updated_at?: string
        }
        Update: {
          categorie?: string | null
          compte_bancaire_id?: string
          created_at?: string
          created_by_id?: string | null
          date_import?: string | null
          date_rapprochement?: string | null
          date_transaction?: string
          date_valeur?: string | null
          description?: string | null
          encaissement_id?: string | null
          id?: string
          libelle?: string
          metadata?: Json | null
          montant?: number
          mouvement_caisse_id?: string | null
          notes?: string | null
          paiement_facture_id?: string | null
          pieces_jointes?: Json | null
          rapproche_par_id?: string | null
          reference?: string
          reference_externe?: string | null
          source_import?: string | null
          statut_rapprochement?: string
          tenant_id?: string
          type_transaction?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bancaires_compte_bancaire_id_fkey"
            columns: ["compte_bancaire_id"]
            isOneToOne: false
            referencedRelation: "comptes_bancaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_encaissement_id_fkey"
            columns: ["encaissement_id"]
            isOneToOne: false
            referencedRelation: "encaissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_paiement_facture_id_fkey"
            columns: ["paiement_facture_id"]
            isOneToOne: false
            referencedRelation: "paiements_factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bancaires_rapproche_par_id_fkey"
            columns: ["rapproche_par_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      transporteurs: {
        Row: {
          adresse: string | null
          contact_principal: string | null
          created_at: string
          delai_livraison_standard: number | null
          email: string | null
          id: string
          is_active: boolean
          nom: string
          notes: string | null
          tarif_base: number | null
          tarif_par_km: number | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
          zone_couverture: string[] | null
        }
        Insert: {
          adresse?: string | null
          contact_principal?: string | null
          created_at?: string
          delai_livraison_standard?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          nom: string
          notes?: string | null
          tarif_base?: number | null
          tarif_par_km?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
          zone_couverture?: string[] | null
        }
        Update: {
          adresse?: string | null
          contact_principal?: string | null
          created_at?: string
          delai_livraison_standard?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          nom?: string
          notes?: string | null
          tarif_base?: number | null
          tarif_par_km?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
          zone_couverture?: string[] | null
        }
        Relationships: []
      }
      tva_declaration: {
        Row: {
          centime_additionnel_a_payer: number | null
          centime_additionnel_collecte: number | null
          centime_additionnel_deductible: number | null
          created_at: string
          exercice_id: string
          id: string
          periode: string
          statut: string | null
          tenant_id: string
          tva_a_payer: number | null
          tva_collectee: number | null
          tva_deductible: number | null
          updated_at: string
        }
        Insert: {
          centime_additionnel_a_payer?: number | null
          centime_additionnel_collecte?: number | null
          centime_additionnel_deductible?: number | null
          created_at?: string
          exercice_id: string
          id?: string
          periode: string
          statut?: string | null
          tenant_id: string
          tva_a_payer?: number | null
          tva_collectee?: number | null
          tva_deductible?: number | null
          updated_at?: string
        }
        Update: {
          centime_additionnel_a_payer?: number | null
          centime_additionnel_collecte?: number | null
          centime_additionnel_deductible?: number | null
          created_at?: string
          exercice_id?: string
          id?: string
          periode?: string
          statut?: string | null
          tenant_id?: string
          tva_a_payer?: number | null
          tva_collectee?: number | null
          tva_deductible?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tva_declaration_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tva_declaration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tva_declaration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          last_used_at: string | null
          personnel_id: string
          secret_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          personnel_id: string
          secret_key: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          personnel_id?: string
          secret_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          personnel_id: string
          requires_2fa: boolean | null
          risk_score: number | null
          security_level: string | null
          session_token: string
          tenant_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          personnel_id: string
          requires_2fa?: boolean | null
          risk_score?: number | null
          security_level?: string | null
          session_token: string
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          personnel_id?: string
          requires_2fa?: boolean | null
          risk_score?: number | null
          security_level?: string | null
          session_token?: string
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisations_promotion: {
        Row: {
          agent_id: string | null
          client_id: string | null
          date_utilisation: string
          id: string
          metadata: Json | null
          montant_remise: number
          promotion_id: string
          tenant_id: string
          vente_id: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          date_utilisation?: string
          id?: string
          metadata?: Json | null
          montant_remise: number
          promotion_id: string
          tenant_id: string
          vente_id?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          date_utilisation?: string
          id?: string
          metadata?: Json | null
          montant_remise?: number
          promotion_id?: string
          tenant_id?: string
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utilisations_promotion_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisations_promotion_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utilisations_promotion_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          agent_id: string | null
          caisse_id: string | null
          client_id: string | null
          created_at: string
          date_vente: string | null
          facture_generee: boolean | null
          facture_id: string | null
          id: string
          metadata: Json | null
          mode_paiement: Database["public"]["Enums"]["mode_paiement"] | null
          mode_paiement_secondaire: string | null
          montant_centime_additionnel: number | null
          montant_net: number
          montant_paiement_secondaire: number | null
          montant_part_assurance: number | null
          montant_part_patient: number | null
          montant_paye: number | null
          montant_rendu: number | null
          montant_total_ht: number
          montant_total_ttc: number
          montant_tva: number | null
          notes: string | null
          numero_vente: string
          points_gagnes: number | null
          points_utilises: number | null
          prescription_id: string | null
          recompense_appliquee_id: string | null
          reference_paiement: string | null
          reference_paiement_secondaire: string | null
          remise_globale: number | null
          session_caisse_id: string | null
          statut: Database["public"]["Enums"]["statut_vente"] | null
          taux_couverture_assurance: number | null
          tenant_id: string
          terminal_id: string | null
          type_vente: Database["public"]["Enums"]["type_vente"] | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          caisse_id?: string | null
          client_id?: string | null
          created_at?: string
          date_vente?: string | null
          facture_generee?: boolean | null
          facture_id?: string | null
          id?: string
          metadata?: Json | null
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          mode_paiement_secondaire?: string | null
          montant_centime_additionnel?: number | null
          montant_net?: number
          montant_paiement_secondaire?: number | null
          montant_part_assurance?: number | null
          montant_part_patient?: number | null
          montant_paye?: number | null
          montant_rendu?: number | null
          montant_total_ht?: number
          montant_total_ttc?: number
          montant_tva?: number | null
          notes?: string | null
          numero_vente: string
          points_gagnes?: number | null
          points_utilises?: number | null
          prescription_id?: string | null
          recompense_appliquee_id?: string | null
          reference_paiement?: string | null
          reference_paiement_secondaire?: string | null
          remise_globale?: number | null
          session_caisse_id?: string | null
          statut?: Database["public"]["Enums"]["statut_vente"] | null
          taux_couverture_assurance?: number | null
          tenant_id: string
          terminal_id?: string | null
          type_vente?: Database["public"]["Enums"]["type_vente"] | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          caisse_id?: string | null
          client_id?: string | null
          created_at?: string
          date_vente?: string | null
          facture_generee?: boolean | null
          facture_id?: string | null
          id?: string
          metadata?: Json | null
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          mode_paiement_secondaire?: string | null
          montant_centime_additionnel?: number | null
          montant_net?: number
          montant_paiement_secondaire?: number | null
          montant_part_assurance?: number | null
          montant_part_patient?: number | null
          montant_paye?: number | null
          montant_rendu?: number | null
          montant_total_ht?: number
          montant_total_ttc?: number
          montant_tva?: number | null
          notes?: string | null
          numero_vente?: string
          points_gagnes?: number | null
          points_utilises?: number | null
          prescription_id?: string | null
          recompense_appliquee_id?: string | null
          reference_paiement?: string | null
          reference_paiement_secondaire?: string | null
          remise_globale?: number | null
          session_caisse_id?: string | null
          statut?: Database["public"]["Enums"]["statut_vente"] | null
          taux_couverture_assurance?: number | null
          tenant_id?: string
          terminal_id?: string | null
          type_vente?: Database["public"]["Enums"]["type_vente"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_caisse_id_fkey"
            columns: ["caisse_id"]
            isOneToOne: false
            referencedRelation: "caisses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "v_factures_avec_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "v_rapport_session_complet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "v_sessions_caisse_resumees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          max_attempts: number
          phone: string | null
          type: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          max_attempts?: number
          phone?: string | null
          type: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          phone?: string | null
          type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      webhooks_config: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[] | null
          failed_calls: number | null
          id: string
          is_active: boolean | null
          last_status: string | null
          last_triggered_at: string | null
          name: string
          retry_count: number | null
          secret_key: string | null
          success_calls: number | null
          tenant_id: string
          timeout_seconds: number | null
          total_calls: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          failed_calls?: number | null
          id?: string
          is_active?: boolean | null
          last_status?: string | null
          last_triggered_at?: string | null
          name: string
          retry_count?: number | null
          secret_key?: string | null
          success_calls?: number | null
          tenant_id: string
          timeout_seconds?: number | null
          total_calls?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          failed_calls?: number | null
          id?: string
          is_active?: boolean | null
          last_status?: string | null
          last_triggered_at?: string | null
          name?: string
          retry_count?: number | null
          secret_key?: string | null
          success_calls?: number | null
          tenant_id?: string
          timeout_seconds?: number | null
          total_calls?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json | null
          request_headers: Json | null
          response_body: string | null
          response_status: number | null
          response_time_ms: number | null
          retry_count: number | null
          success: boolean | null
          tenant_id: string
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          request_headers?: Json | null
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          retry_count?: number | null
          success?: boolean | null
          tenant_id: string
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          request_headers?: Json | null
          response_body?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          retry_count?: number | null
          success?: boolean | null
          tenant_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks_config"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_actions: {
        Row: {
          action_type: string
          configuration: Json
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          action_type: string
          configuration?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          action_type?: string
          configuration?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_actions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          progress: number
          result: Json | null
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          result?: Json | null
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          result?: Json | null
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          setting_key: string
          setting_type: string
          setting_value: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          tags: string[] | null
          template_data: Json
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          tags?: string[] | null
          template_data?: Json
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          tags?: string[] | null
          template_data?: Json
          tenant_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          configuration: Json
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string
          trigger_type: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          trigger_type: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          trigger_type?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actual_duration: number | null
          assigned_to: string | null
          category: string | null
          completion_rate: number | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          estimated_duration: number | null
          execution_count: number | null
          id: string
          last_executed: string | null
          name: string
          priority: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actual_duration?: number | null
          assigned_to?: string | null
          category?: string | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          estimated_duration?: number | null
          execution_count?: number | null
          id?: string
          last_executed?: string | null
          name: string
          priority?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          actual_duration?: number | null
          assigned_to?: string | null
          category?: string | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          estimated_duration?: number | null
          execution_count?: number | null
          id?: string
          last_executed?: string | null
          name?: string
          priority?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          pharmacy_id: string | null
          role: string
          status: string
          user_id: string | null
          user_name: string | null
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          pharmacy_id?: string | null
          role?: string
          status?: string
          user_id?: string | null
          user_name?: string | null
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          pharmacy_id?: string | null
          role?: string
          status?: string
          user_id?: string | null
          user_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "collaborative_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pharmacies_public: {
        Row: {
          address: string | null
          arrondissement: string | null
          city: string | null
          code: string | null
          created_at: string | null
          departement: string | null
          email: string | null
          id: string | null
          logo: string | null
          name: string | null
          niu: string | null
          pays: string | null
          photo_exterieur: string | null
          photo_interieur: string | null
          postal_code: string | null
          quartier: string | null
          region: string | null
          status: string | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          arrondissement?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          departement?: string | null
          email?: string | null
          id?: string | null
          logo?: string | null
          name?: string | null
          niu?: string | null
          pays?: string | null
          photo_exterieur?: string | null
          photo_interieur?: string | null
          postal_code?: string | null
          quartier?: string | null
          region?: string | null
          status?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          arrondissement?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          departement?: string | null
          email?: string | null
          id?: string | null
          logo?: string | null
          name?: string | null
          niu?: string | null
          pays?: string | null
          photo_exterieur?: string | null
          photo_interieur?: string | null
          postal_code?: string | null
          quartier?: string | null
          region?: string | null
          status?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produits_with_stock: {
        Row: {
          ancien_code_cip: string | null
          categorie_tarification_id: string | null
          centime_additionnel: number | null
          classe_therapeutique_id: string | null
          code_cip: string | null
          created_at: string | null
          dci_id: string | null
          dci_noms: string | null
          famille_id: string | null
          forme_id: string | null
          id: string | null
          id_produit_source: string | null
          is_active: boolean | null
          laboratoires_id: string | null
          libelle_produit: string | null
          niveau_detail: number | null
          prix_achat: number | null
          prix_vente_ht: number | null
          prix_vente_ttc: number | null
          quantite_unites_details_source: number | null
          rayon_id: string | null
          stock_actuel: number | null
          stock_critique: number | null
          stock_faible: number | null
          stock_limite: number | null
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string | null
          tva: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_produits_categorie_tarification"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_classe_therapeutique"
            columns: ["classe_therapeutique_id"]
            isOneToOne: false
            referencedRelation: "classes_therapeutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_dci_id"
            columns: ["dci_id"]
            isOneToOne: false
            referencedRelation: "dci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_famille_id"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_forme"
            columns: ["forme_id"]
            isOneToOne: false
            referencedRelation: "formes_galeniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_rayon"
            columns: ["rayon_id"]
            isOneToOne: false
            referencedRelation: "rayons_produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_comptes_avec_soldes: {
        Row: {
          actif: boolean | null
          analytique: boolean | null
          classe: number | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string | null
          libelle: string | null
          niveau: number | null
          parent_id: string | null
          rapprochement: boolean | null
          solde_crediteur: number | null
          solde_debiteur: number | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_comptable_compte_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_compte_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_comptes_avec_soldes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comptable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ecritures_avec_details: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_id: string | null
          date_ecriture: string | null
          exercice_debut: string | null
          exercice_fin: string | null
          exercice_id: string | null
          exercice_name: string | null
          id: string | null
          journal_code: string | null
          journal_id: string | null
          journal_name: string | null
          journal_type: string | null
          libelle: string | null
          locked_at: string | null
          locked_by: string | null
          locked_by_id: string | null
          montant_total: number | null
          numero_piece: string | null
          reference_id: string | null
          reference_type: string | null
          statut: string | null
          tenant_id: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validated_by_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecritures_comptables_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journaux_comptables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_locked_by_id_fkey"
            columns: ["locked_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecritures_comptables_validated_by_id_fkey"
            columns: ["validated_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      v_factures_avec_details: {
        Row: {
          client_adresse: string | null
          client_email: string | null
          client_fournisseur: string | null
          client_id: string | null
          client_nom: string | null
          client_telephone: string | null
          created_at: string | null
          created_by: string | null
          created_by_id: string | null
          date_echeance: string | null
          date_emission: string | null
          derniere_relance: string | null
          fournisseur_adresse: string | null
          fournisseur_email: string | null
          fournisseur_id: string | null
          fournisseur_nom: string | null
          fournisseur_telephone: string | null
          id: string | null
          jours_avant_echeance: number | null
          jours_retard: number | null
          libelle: string | null
          montant_ht: number | null
          montant_paye: number | null
          montant_restant: number | null
          montant_ttc: number | null
          montant_tva: number | null
          nombre_lignes: number | null
          notes: string | null
          numero: string | null
          pieces_jointes: Json | null
          reception_id: string | null
          reference_externe: string | null
          relances_effectuees: number | null
          statut: string | null
          statut_paiement: string | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
          vente_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "receptions_fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_performance_centres_couts: {
        Row: {
          budget_total: number | null
          budgets_depassement: number | null
          code: string | null
          created_at: string | null
          ecart_montant: number | null
          ecart_pourcentage: number | null
          est_actif: boolean | null
          id: string | null
          nom: string | null
          nombre_budgets: number | null
          realise_total: number | null
          responsable_id: string | null
          responsable_nom: string | null
          tenant_id: string | null
          type_centre: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centres_couts_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      v_produits_with_famille: {
        Row: {
          ancien_code_cip: string | null
          categorie_tarification_id: string | null
          categorie_tarification_libelle: string | null
          centime_additionnel: number | null
          classe_therapeutique_id: string | null
          classe_therapeutique_libelle: string | null
          code_cip: string | null
          created_at: string | null
          dci_id: string | null
          dci_noms: string | null
          famille_id: string | null
          forme_id: string | null
          id: string | null
          id_produit_source: string | null
          is_active: boolean | null
          laboratoire_nom: string | null
          laboratoires_id: string | null
          libelle_famille: string | null
          libelle_forme: string | null
          libelle_produit: string | null
          libelle_rayon: string | null
          niveau_detail: number | null
          nom_dci: string | null
          prix_achat: number | null
          prix_vente_ht: number | null
          prix_vente_ttc: number | null
          quantite_unites_details_source: number | null
          rayon_id: string | null
          stock_actuel: number | null
          stock_critique: number | null
          stock_faible: number | null
          stock_limite: number | null
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string | null
          tva: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_produits_categorie_tarification"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_classe_therapeutique"
            columns: ["classe_therapeutique_id"]
            isOneToOne: false
            referencedRelation: "classes_therapeutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_dci_id"
            columns: ["dci_id"]
            isOneToOne: false
            referencedRelation: "dci"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_famille_id"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_forme"
            columns: ["forme_id"]
            isOneToOne: false
            referencedRelation: "formes_galeniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_rayon"
            columns: ["rayon_id"]
            isOneToOne: false
            referencedRelation: "rayons_produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "produits_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "v_produits_with_famille"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_id_produit_source_fkey"
            columns: ["id_produit_source"]
            isOneToOne: false
            referencedRelation: "v_rentabilite_produits"
            referencedColumns: ["produit_id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rapport_par_caisse_type: {
        Row: {
          caisse_nom: string | null
          date_journee: string | null
          nombre_sessions: number | null
          tenant_id: string | null
          total_decaissements: number | null
          total_encaissements: number | null
          type_caisse: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rapport_session_complet: {
        Row: {
          agent_nom: string | null
          caisse_nom: string | null
          date_fermeture: string | null
          date_ouverture: string | null
          ecart: number | null
          fond_caisse_ouverture: number | null
          id: string | null
          montant_reel_fermeture: number | null
          montant_theorique_fermeture: number | null
          mouvements: Json | null
          numero_session: string | null
          statut: string | null
          tenant_id: string | null
          type_caisse: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rentabilite_produits: {
        Row: {
          chiffre_affaires: number | null
          code_produit: string | null
          cout_achat: number | null
          derniere_vente: string | null
          famille: string | null
          marge_brute: number | null
          produit_id: string | null
          produit_nom: string | null
          quantite_vendue: number | null
          taux_marge: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_resume_journalier: {
        Row: {
          date_journee: string | null
          ecart_total: number | null
          nombre_mouvements: number | null
          nombre_sessions: number | null
          solde_net: number | null
          tenant_id: string | null
          total_decaissements: number | null
          total_encaissements: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sessions_caisse_resumees: {
        Row: {
          agent_id: string | null
          agent_nom: string | null
          caisse_nom: string | null
          date_fermeture: string | null
          date_ouverture: string | null
          ecart: number | null
          fond_caisse_ouverture: number | null
          id: string | null
          montant_reel_fermeture: number | null
          montant_theorique_fermeture: number | null
          nombre_mouvements: number | null
          notes: string | null
          numero_session: string | null
          statut: string | null
          tenant_id: string | null
          total_decaissements: number | null
          total_encaissements: number | null
          type_caisse: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analyze_process_optimization: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      authenticate_pharmacy: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      auto_segment_clients: { Args: { p_tenant_id: string }; Returns: number }
      calculate_account_level: {
        Args: { p_account_id: string; p_tenant_id: string }
        Returns: number
      }
      calculate_ai_stock_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_automatic_allocation: {
        Args: {
          p_cle_id: string
          p_date_ref: string
          p_montant_total: number
          p_tenant_id: string
        }
        Returns: {
          centre_cout_id: string
          coefficient: number
          montant: number
        }[]
      }
      calculate_client_predictions: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      calculate_compliance_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_expected_closing: {
        Args: { p_session_id: string }
        Returns: number
      }
      calculate_lot_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      calculate_low_stock_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_low_stock_metrics_v2: {
        Args: {
          p_critical_threshold?: number
          p_low_threshold?: number
          p_tenant_id: string
        }
        Returns: Json
      }
      calculate_network_analytics_metrics: {
        Args: { p_tenant_id: string; p_timeframe?: string }
        Returns: Json
      }
      calculate_out_of_stock_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_profitability_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_reception_totals: {
        Args: { p_reception_id: string }
        Returns: Json
      }
      calculate_sentiment_metrics: {
        Args: { p_days?: number; p_tenant_id: string }
        Returns: Json
      }
      calculate_session_risk_score: {
        Args: {
          p_ip_address: string
          p_personnel_id: string
          p_user_agent: string
        }
        Returns: number
      }
      calculate_stock_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      calculate_stock_valuation_paginated:
        | {
            Args: {
              p_category_id?: string
              p_page?: number
              p_page_size?: number
              p_search?: string
              p_sort_by?: string
              p_sort_order?: string
              p_status?: string
              p_tenant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_evolution_period?: string
              p_famille_id?: string
              p_page_offset?: number
              p_page_size?: number
              p_rayon_id?: string
              p_rotation_filter?: string
              p_search?: string
              p_sort_by?: string
              p_status_filter?: string
              p_tenant_id: string
            }
            Returns: {
              code_produit: string
              evolution_prix: number
              famille_nom: string
              id: string
              nom_produit: string
              prix_achat_moyen: number
              prix_vente_ht: number
              rayon_nom: string
              statut_stock: string
              stock_actuel: number
              taux_rotation: number
              total_count: number
              valeur_stock: number
            }[]
          }
      calculate_total_stock_value: {
        Args: { tenant_filter: string }
        Returns: number
      }
      calculate_valuation_by_family: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_valuation_by_rayon: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_valuation_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_vision_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      calculer_jours_restants_expiration: {
        Args: { date_peremption: string }
        Returns: number
      }
      can_delete_account: {
        Args: { p_account_id: string; p_tenant_id: string }
        Returns: Json
      }
      check_drug_interactions: {
        Args: {
          p_drug1_id?: string
          p_drug1_name?: string
          p_drug2_id?: string
          p_drug2_name?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      check_email_available_for_user: {
        Args: { p_email: string }
        Returns: Json
      }
      check_login_attempts: {
        Args: { p_email: string; p_tenant_id: string }
        Returns: Json
      }
      check_pharmacy_email_exists: {
        Args: { email_to_check: string }
        Returns: Json
      }
      check_promotion_validity: {
        Args: {
          p_client_id?: string
          p_montant?: number
          p_promotion_id: string
        }
        Returns: {
          est_valide: boolean
          message: string
          valeur_remise: number
        }[]
      }
      cleanup_expired_pharmacy_sessions: { Args: never; Returns: number }
      cleanup_expired_verification_codes: { Args: never; Returns: number }
      complete_training_session: {
        Args: {
          p_final_accuracy: number
          p_session_id: string
          p_status?: string
        }
        Returns: Json
      }
      create_personnel_for_user: {
        Args: { data: Json; pharmacy_id: string }
        Returns: Json
      }
      create_pharmacy_session: {
        Args: {
          p_ip_address?: string
          p_pharmacy_id: string
          p_user_agent?: string
        }
        Returns: Json
      }
      create_shelf_analysis: {
        Args: {
          p_image_url?: string
          p_issues?: Json
          p_misplacements_detected?: number
          p_rayon_id?: string
          p_scanned_by?: string
          p_shelf_location?: string
          p_shelf_name: string
          p_stockouts_detected?: number
          p_tenant_id: string
          p_total_products?: number
        }
        Returns: string
      }
      debug_user_connection_state: { Args: never; Returns: Json }
      decrypt_fournisseur_password: {
        Args: { p_cipher_text: string; p_tenant_id: string }
        Returns: string
      }
      detect_accounting_anomalies: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      detect_suspicious_patterns: { Args: never; Returns: undefined }
      determiner_niveau_urgence: {
        Args: { jours_restants: number }
        Returns: string
      }
      disconnect_pharmacy_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      discover_business_patterns: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      encrypt_fournisseur_password: {
        Args: { p_plain: string; p_tenant_id: string }
        Returns: string
      }
      ensure_encryption_key: { Args: { p_tenant_id: string }; Returns: string }
      execute_ai_workflow: {
        Args: {
          p_tenant_id: string
          p_trigger_context?: Json
          p_workflow_id: string
        }
        Returns: Json
      }
      generate_accounting_entry:
        | {
            Args: {
              p_date: string
              p_journal_code: string
              p_libelle: string
              p_lines: Json
              p_reference_id?: string
              p_reference_type?: string
              p_tenant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_compte_credit: string
              p_compte_debit: string
              p_date_ecriture: string
              p_journal_code: string
              p_libelle: string
              p_montant: number
              p_reference_document?: string
              p_tenant_id: string
              p_type_piece?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_date_ecriture: string
              p_journal_code: string
              p_libelle: string
              p_lines?: Json
              p_reference_id?: string
              p_reference_type?: string
              p_tenant_id: string
            }
            Returns: Json
          }
      generate_accounting_report_summary: {
        Args: { p_end_date: string; p_start_date: string; p_tenant_id: string }
        Returns: Json
      }
      generate_ai_forecast: {
        Args: {
          p_model_code?: string
          p_period_days?: number
          p_tenant_id: string
        }
        Returns: Json
      }
      generate_allocation_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_avoir_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_cost_center_code: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_internal_product_code: {
        Args: { p_product_id: string }
        Returns: string
      }
      generate_inventaire_report: {
        Args: { p_session_id: string; p_tenant_id: string; p_type: string }
        Returns: Json
      }
      generate_invoice_number: {
        Args: { p_tenant_id: string; p_type: string }
        Returns: string
      }
      generate_lot_barcode: {
        Args: { p_fournisseur_id: string; p_tenant_id: string }
        Returns: string
      }
      generate_network_heatmap_data: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      generate_piece_number: {
        Args: { p_date_piece?: string; p_journal_id: string }
        Returns: string
      }
      generate_pos_invoice_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_sales_suggestions: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      generate_session_number:
        | { Args: never; Returns: string }
        | {
            Args: { p_caisse_id?: string; p_type_session?: string }
            Returns: string
          }
      generate_strategic_recommendations: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      generer_alertes_expiration_automatiques: { Args: never; Returns: Json }
      get_account_hierarchy: {
        Args: { p_tenant_id: string }
        Returns: {
          actif: boolean
          analytique: boolean
          classe: number
          code: string
          description: string
          id: string
          libelle: string
          niveau: number
          parent_id: string
          path: string
          rapprochement: boolean
          solde_crediteur: number
          solde_debiteur: number
          type: string
        }[]
      }
      get_account_hierarchy_paginated: {
        Args: { p_limit?: number; p_offset?: number; p_tenant_id: string }
        Returns: {
          actif: boolean
          analytique: boolean
          classe: number
          code: string
          description: string
          id: string
          libelle: string
          niveau: number
          parent_id: string
          path: string
          rapprochement: boolean
          solde_crediteur: number
          solde_debiteur: number
          type: string
        }[]
      }
      get_accounting_expert_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_active_sessions_totals: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_active_stock_alerts: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          alert_id: string
          alert_level: string
          alert_type: string
          created_at: string
          message: string
          produit_id: string
          produit_nom: string
          stock_actuel: number
        }[]
      }
      get_ai_dashboard_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_ai_integration_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_ai_learning_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_ai_stock_suggestions: { Args: { p_tenant_id: string }; Returns: Json }
      get_analytical_summary: { Args: { p_tenant_id: string }; Returns: Json }
      get_automation_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_bi_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_budget_chart_data: {
        Args: { p_annee?: number; p_centre_id?: string; p_tenant_id: string }
        Returns: {
          budget: number
          ecart: number
          mois: number
          periode: string
          realise: number
        }[]
      }
      get_cash_registers_status: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_center_performance_data: {
        Args: { p_annee?: number; p_tenant_id: string }
        Returns: {
          budget_total: number
          budgets_depassement: number
          code: string
          ecart_montant: number
          ecart_pourcentage: number
          est_actif: boolean
          id: string
          nom: string
          nombre_budgets: number
          realise_total: number
          responsable_nom: string
          type_centre: string
        }[]
      }
      get_collaboration_analytics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_current_tenant_alert_settings: { Args: never; Returns: Json }
      get_current_user_country: { Args: never; Returns: string }
      get_current_user_tenant_id: { Args: never; Returns: string }
      get_customization_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_dashboard_stock_metrics: {
        Args: { tenant_filter: string }
        Returns: Json
      }
      get_diagnostic_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_drug_database_with_details: {
        Args: {
          p_category?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_fast_moving_products: {
        Args: { p_days?: number; p_limit?: number; p_tenant_id: string }
        Returns: {
          code_cip: string
          libelle_produit: string
          produit_id: string
          quantite_vendue: number
          rotation_jours: number
          stock_actuel: number
          valeur_vendue: number
        }[]
      }
      get_fiscal_calendar: {
        Args: { p_tenant_id: string; p_year?: number }
        Returns: Json
      }
      get_forecast_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_fournisseur_import_key: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_help_metrics: {
        Args: { p_days?: number; p_tenant_id: string }
        Returns: Json
      }
      get_hero_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_low_stock_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_low_stock_products:
        | { Args: { p_tenant_id: string }; Returns: Json }
        | {
            Args: { p_limit?: number; p_offset?: number; p_tenant_id: string }
            Returns: {
              categorie_nom: string
              code_barre: string
              id: string
              nom: string
              prix_vente: number
              statut_stock: string
              stock_actuel: number
              stock_critique: number
              stock_faible: number
              stock_limite: number
              urgence: string
            }[]
          }
        | {
            Args: {
              p_category?: string
              p_limit?: number
              p_offset?: number
              p_search?: string
              p_status?: string
              p_tenant_id: string
            }
            Returns: Json
          }
      get_matching_global_plan: {
        Args: { p_tenant_id: string }
        Returns: {
          classes_count: number
          comptes_count: number
          plan_code: string
          plan_id: string
          plan_nom: string
          plan_version: string
        }[]
      }
      get_multichannel_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_network_activity_distribution: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_network_time_series_data: {
        Args: { p_tenant_id: string; p_timeframe?: string }
        Returns: Json
      }
      get_next_accounting_number: {
        Args: {
          p_journal_code?: string
          p_rule_type: string
          p_tenant_id: string
        }
        Returns: string
      }
      get_pharma_expert_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_pharma_tools_metrics: { Args: { p_tenant_id: string }; Returns: Json }
      get_pharmacy_id_by_email: { Args: { p_email: string }; Returns: string }
      get_pharmacy_phone_by_email: {
        Args: { p_email: string }
        Returns: string
      }
      get_pos_products: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_product_lots: {
        Args: { p_product_id: string; p_tenant_id: string }
        Returns: {
          date_peremption: string
          id: string
          montant_centime_additionnel: number
          montant_tva: number
          numero_lot: string
          prix_achat_unitaire: number
          prix_vente_ht: number
          prix_vente_ttc: number
          quantite_restante: number
          taux_centime_additionnel: number
          taux_tva: number
        }[]
      }
      get_profitability_data: {
        Args: {
          p_date_debut?: string
          p_date_fin?: string
          p_famille_id?: string
          p_limit?: number
          p_tenant_id: string
        }
        Returns: {
          chiffre_affaires: number
          code_produit: string
          cout_achat: number
          derniere_vente: string
          famille: string
          marge_brute: number
          produit_id: string
          produit_nom: string
          quantite_vendue: number
          taux_marge: number
          taux_marque: number
          tenant_id: string
        }[]
      }
      get_recent_sales_transactions: {
        Args: {
          p_agent_id?: string
          p_caisse_id?: string
          p_date_debut?: string
          p_date_fin?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_recommendations_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_sales_dashboard_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_stock_alerts_with_products: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_stock_status_distribution: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_stock_threshold: {
        Args: { p_stock_limite: number; p_threshold_type: string }
        Returns: number
      }
      get_stock_threshold_cascade: {
        Args: {
          p_product_critical: number
          p_product_low: number
          p_product_max: number
          p_tenant_id: string
          p_threshold_type: string
        }
        Returns: number
      }
      get_supplier_excel_mapping: {
        Args: { p_fournisseur_id: string; p_fournisseur_nom?: string }
        Returns: {
          created_at: string
          fournisseur_id: string
          id: string
          is_active: boolean
          is_owner: boolean
          mapping_config: Json
          tenant_id: string
          updated_at: string
        }[]
      }
      get_top_critical_products: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          famille_libelle: string
          jours_rupture_estimee: number
          libelle_produit: string
          pourcentage_critique: number
          produit_id: string
          stock_actuel: number
          stock_critique: number
          stock_faible: number
          stock_limite: number
        }[]
      }
      get_unbilled_receptions_by_supplier: {
        Args: { p_fournisseur_id: string; p_tenant_id: string }
        Returns: {
          date_reception: string
          id: string
          montant_centime_additionnel: number
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero_reception: string
          reference_facture: string
        }[]
      }
      get_unbilled_sales_by_client: {
        Args: { p_client_id: string; p_tenant_id: string }
        Returns: {
          date_vente: string
          id: string
          montant_total_ht: number
          montant_total_ttc: number
          montant_tva: number
          numero_vente: string
        }[]
      }
      get_vision_statistics: { Args: { p_tenant_id: string }; Returns: Json }
      has_open_session:
        | { Args: never; Returns: boolean }
        | {
            Args: { p_caisse_id?: string; p_type_session?: string }
            Returns: boolean
          }
      import_global_accounting_plan: {
        Args: { p_plan_global_id: string; p_tenant_id: string }
        Returns: Json
      }
      import_plan_comptable_global: {
        Args: { p_plan_comptable_code?: string; p_tenant_id: string }
        Returns: Json
      }
      init_analytical_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: Json
      }
      init_banking_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: string
      }
      init_coa_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: undefined
      }
      init_fiscal_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: string
      }
      init_forecast_models_for_tenant: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      init_inventaire_items: {
        Args: { p_session_id: string; p_tenant_id?: string }
        Returns: Json
      }
      init_invoice_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: undefined
      }
      init_journal_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: undefined
      }
      init_payment_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: string
      }
      init_product_lots: { Args: { p_tenant_id: string }; Returns: Json }
      init_regional_params_for_tenant: {
        Args: { p_country_code?: string; p_tenant_id: string }
        Returns: string
      }
      initialize_tenant_roles_permissions: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      is_cross_tenant_authorized: {
        Args: {
          p_permission_type: string
          p_resource_id?: string
          p_resource_type?: string
          p_source_tenant_id: string
          p_target_tenant_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_system_admin: { Args: never; Returns: boolean }
      nettoyer_alertes_expiration_anciennes: {
        Args: { p_jours_retention?: number; p_tenant_id: string }
        Returns: {
          alertes_archivees: number
          alertes_supprimees: number
        }[]
      }
      network_get_pharmacy_overview: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
      network_get_pharmacy_permissions: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
      network_get_security_settings: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
      network_list_pharmacy_users: {
        Args: { target_tenant_id: string }
        Returns: Json
      }
      network_toggle_pharmacy_permission: {
        Args: {
          enabled: boolean
          permission_code: string
          target_tenant_id: string
        }
        Returns: Json
      }
      network_update_pharmacy_user: {
        Args: { payload: Json; personnel_id: string; target_tenant_id: string }
        Returns: Json
      }
      network_update_security_settings: {
        Args: { settings: Json; target_tenant_id: string }
        Returns: Json
      }
      preview_inventaire_items_count: {
        Args: {
          p_cyclique_jours?: number
          p_filtres_emplacement?: string[]
          p_filtres_fournisseur?: string[]
          p_filtres_peremption_jours?: number
          p_filtres_rayon?: string[]
          p_tenant_id: string
          p_type_inventaire: string
        }
        Returns: number
      }
      process_vision_detection: {
        Args: {
          p_confidence?: number
          p_detected_barcode?: string
          p_detected_expiry_date?: string
          p_detected_name: string
          p_detected_price?: number
          p_image_url?: string
          p_metadata?: Json
          p_packaging_status?: string
          p_processing_time_ms?: number
          p_tenant_id: string
        }
        Returns: string
      }
      recalculer_prix_lots: { Args: never; Returns: Json }
      recalculer_prix_lots_avec_arrondi: {
        Args: { p_method?: string; p_precision?: number }
        Returns: Json
      }
      recalculer_prix_produits: { Args: never; Returns: Json }
      recalculer_tous_les_prix_v2: { Args: never; Returns: Json }
      refresh_network_system_stats: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      register_pharmacy_simple: {
        Args: { pharmacy_data: Json; pharmacy_password: string }
        Returns: Json
      }
      register_pharmacy_with_admin: {
        Args: {
          admin_data: Json
          admin_email: string
          admin_password: string
          pharmacy_data: Json
        }
        Returns: Json
      }
      reports_apply_archiving_policy: { Args: never; Returns: number }
      reports_get_configuration: { Args: never; Returns: Json }
      reports_upsert_settings: { Args: { payload: Json }; Returns: Json }
      reports_upsert_template: { Args: { template: Json }; Returns: string }
      rpc_inventory_create_session: {
        Args: {
          session_description?: string
          session_name: string
          session_participants?: string[]
          session_secteurs?: string[]
          session_type?: string
        }
        Returns: string
      }
      rpc_inventory_record_entry: {
        Args: {
          code_barre: string
          emplacement?: string
          quantite?: number
          session_id: string
        }
        Returns: Json
      }
      rpc_inventory_start_session: {
        Args: { session_id: string }
        Returns: boolean
      }
      rpc_stock_delete_movement: {
        Args: { p_movement_id: string }
        Returns: Json
      }
      rpc_stock_record_movement: {
        Args: {
          p_agent_id?: string
          p_emplacement_destination?: string
          p_emplacement_source?: string
          p_lot_destination_id?: string
          p_lot_id: string
          p_metadata?: Json
          p_motif?: string
          p_prix_unitaire?: number
          p_produit_id: string
          p_quantite_mouvement: number
          p_quantite_reelle?: number
          p_reference_document?: string
          p_reference_id?: string
          p_reference_type?: string
          p_type_mouvement: string
        }
        Returns: Json
      }
      rpc_stock_update_movement:
        | {
            Args: {
              p_metadata?: Json
              p_motif?: string
              p_mouvement_id: string
              p_quantite_mouvement: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_metadata?: Json
              p_motif?: string
              p_movement_id: string
              p_quantite_mouvement?: number
              p_reference_document?: string
            }
            Returns: Json
          }
      run_ai_diagnostic: { Args: { p_tenant_id: string }; Returns: Json }
      run_ai_stock_analysis: { Args: { p_tenant_id: string }; Returns: Json }
      run_pharma_compliance_check: {
        Args: { p_category: string; p_checked_by: string; p_tenant_id: string }
        Returns: Json
      }
      search_help_articles: {
        Args: {
          p_language?: string
          p_limit?: number
          p_module?: string
          p_query: string
          p_tenant_id: string
        }
        Returns: {
          category_id: string
          category_name: string
          content: string
          id: string
          is_featured: boolean
          keywords: string[]
          module_key: string
          rank: number
          summary: string
          title: string
          video_url: string
          view_count: number
        }[]
      }
      search_lots_paginated: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status_filter?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      search_product_by_barcode: {
        Args: { p_barcode: string; p_tenant_id: string }
        Returns: {
          category: string
          centime_additionnel_montant: number
          code_barre_lot: string
          code_cip: string
          date_peremption: string
          dci: string
          id: string
          libelle_produit: string
          lot_id: string
          name: string
          numero_lot: string
          price: number
          price_ht: number
          prix_achat_unitaire: number
          requires_prescription: boolean
          stock: number
          taux_centime_additionnel: number
          taux_tva: number
          tenant_id: string
          tva_montant: number
        }[]
      }
      start_ai_model_training: {
        Args: {
          p_epochs?: number
          p_model_id: string
          p_started_by?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      sync_ai_data_source: {
        Args: { p_source_id: string; p_tenant_id: string }
        Returns: Json
      }
      sync_tenant_permissions_from_template: {
        Args: never
        Returns: {
          permissions_added: number
          tenant_id: string
          tenant_name: string
        }[]
      }
      test_ai_provider_connection: {
        Args: { p_provider_id: string; p_tenant_id: string }
        Returns: Json
      }
      update_pharmacy_password: {
        Args: { p_new_password: string; p_pharmacy_id: string }
        Returns: Json
      }
      update_training_progress: {
        Args: {
          p_current_accuracy?: number
          p_epochs_completed: number
          p_session_id: string
        }
        Returns: Json
      }
      validate_password_strength: {
        Args: { p_tenant_id: string; password: string }
        Returns: Json
      }
      validate_pharmacy_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      verify_user_belongs_to_tenant: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
    }
    Enums: {
      mode_paiement:
        | "Espèces"
        | "Mobile Money"
        | "Carte Bancaire"
        | "Chèque"
        | "Virement"
      situation_familiale:
        | "Célibataire"
        | "Marié(e)"
        | "Divorcé(e)"
        | "Veuf(ve)"
      situation_familiale_enum:
        | "Célibataire"
        | "Marié(e)"
        | "Divorcé(e)"
        | "Veuf/Veuve"
        | "Concubinage"
      statut_client: "Actif" | "Inactif" | "Suspendu"
      statut_contractuel: "CDI" | "CDD" | "Stage" | "Intérim" | "Freelance"
      statut_contractuel_enum:
        | "CDI"
        | "CDD"
        | "Stage"
        | "Freelance"
        | "Consultant"
        | "Temporaire"
      statut_vente:
        | "En cours"
        | "Validée"
        | "Annulée"
        | "Remboursée"
        | "Finalisée"
      type_client: "Ordinaire" | "Conventionné" | "Entreprise" | "Personnel"
      type_session_enum: "Matin" | "Midi" | "Soir"
      type_vente: "Comptant" | "Crédit" | "Assurance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mode_paiement: [
        "Espèces",
        "Mobile Money",
        "Carte Bancaire",
        "Chèque",
        "Virement",
      ],
      situation_familiale: [
        "Célibataire",
        "Marié(e)",
        "Divorcé(e)",
        "Veuf(ve)",
      ],
      situation_familiale_enum: [
        "Célibataire",
        "Marié(e)",
        "Divorcé(e)",
        "Veuf/Veuve",
        "Concubinage",
      ],
      statut_client: ["Actif", "Inactif", "Suspendu"],
      statut_contractuel: ["CDI", "CDD", "Stage", "Intérim", "Freelance"],
      statut_contractuel_enum: [
        "CDI",
        "CDD",
        "Stage",
        "Freelance",
        "Consultant",
        "Temporaire",
      ],
      statut_vente: [
        "En cours",
        "Validée",
        "Annulée",
        "Remboursée",
        "Finalisée",
      ],
      type_client: ["Ordinaire", "Conventionné", "Entreprise", "Personnel"],
      type_session_enum: ["Matin", "Midi", "Soir"],
      type_vente: ["Comptant", "Crédit", "Assurance"],
    },
  },
} as const
