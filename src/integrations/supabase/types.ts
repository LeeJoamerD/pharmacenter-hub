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
        ]
      }
      alertes_peremption: {
        Row: {
          action_recommandee: string | null
          created_at: string | null
          date_expiration: string
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
          traitee_par: string | null
          type_alerte: string
          updated_at: string | null
        }
        Insert: {
          action_recommandee?: string | null
          created_at?: string | null
          date_expiration: string
          date_traitement?: string | null
          id?: string
          jours_restants?: number | null
          lot_id: string
          niveau_urgence: string
          notes?: string | null
          produit_id: string
          quantite_concernee: number
          statut?: string | null
          tenant_id: string
          traitee_par?: string | null
          type_alerte: string
          updated_at?: string | null
        }
        Update: {
          action_recommandee?: string | null
          created_at?: string | null
          date_expiration?: string
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
          traitee_par?: string | null
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
            foreignKeyName: "alertes_peremption_traitee_par_fkey"
            columns: ["traitee_par"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      assureurs: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
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
        ]
      }
      categories_tarification: {
        Row: {
          code_categorie: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          libelle: string
          taux_marge_defaut: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code_categorie?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle: string
          taux_marge_defaut?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code_categorie?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          libelle?: string
          taux_marge_defaut?: number | null
          tenant_id?: string
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
            foreignKeyName: "channel_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
      clients: {
        Row: {
          adresse: string | null
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
          limite_credit: number | null
          metadata: Json | null
          niu: string | null
          nom_complet: string
          notes: string | null
          numero_cni: string | null
          numero_police: string | null
          numero_registre_commerce: string | null
          personnel_id: string | null
          plafond_annuel: number | null
          plafond_mensuel: number | null
          raison_sociale: string | null
          secteur_activite: string | null
          societe_id: string | null
          statut: Database["public"]["Enums"]["statut_client"] | null
          taux_couverture: number | null
          taux_remise_automatique: number | null
          telephone: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          type_client: Database["public"]["Enums"]["type_client"]
          updated_at: string
        }
        Insert: {
          adresse?: string | null
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
          limite_credit?: number | null
          metadata?: Json | null
          niu?: string | null
          nom_complet: string
          notes?: string | null
          numero_cni?: string | null
          numero_police?: string | null
          numero_registre_commerce?: string | null
          personnel_id?: string | null
          plafond_annuel?: number | null
          plafond_mensuel?: number | null
          raison_sociale?: string | null
          secteur_activite?: string | null
          societe_id?: string | null
          statut?: Database["public"]["Enums"]["statut_client"] | null
          taux_couverture?: number | null
          taux_remise_automatique?: number | null
          telephone?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          type_client?: Database["public"]["Enums"]["type_client"]
          updated_at?: string
        }
        Update: {
          adresse?: string | null
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
          limite_credit?: number | null
          metadata?: Json | null
          niu?: string | null
          nom_complet?: string
          notes?: string | null
          numero_cni?: string | null
          numero_police?: string | null
          numero_registre_commerce?: string | null
          personnel_id?: string | null
          plafond_annuel?: number | null
          plafond_mensuel?: number | null
          raison_sociale?: string | null
          secteur_activite?: string | null
          societe_id?: string | null
          statut?: Database["public"]["Enums"]["statut_client"] | null
          taux_couverture?: number | null
          taux_remise_automatique?: number | null
          telephone?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          type_client?: Database["public"]["Enums"]["type_client"]
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      commandes_fournisseurs: {
        Row: {
          agent_id: string | null
          created_at: string
          date_commande: string | null
          fournisseur_id: string
          id: string
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          date_commande?: string | null
          fournisseur_id: string
          id?: string
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          date_commande?: string | null
          fournisseur_id?: string
          id?: string
          statut?: string | null
          tenant_id?: string
          updated_at?: string
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
        ]
      }
      configurations_fifo: {
        Row: {
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
        ]
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
        ]
      }
      conventionnes: {
        Row: {
          adresse: string | null
          caution: number | null
          created_at: string
          email: string | null
          id: string
          limite_dette: number | null
          niu: string | null
          noms: string
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
          caution?: number | null
          created_at?: string
          email?: string | null
          id?: string
          limite_dette?: number | null
          niu?: string | null
          noms: string
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
          caution?: number | null
          created_at?: string
          email?: string | null
          id?: string
          limite_dette?: number | null
          niu?: string | null
          noms?: string
          taux_remise_automatique?: number | null
          taux_ticket_moderateur?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
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
            foreignKeyName: "fk_cross_tenant_permissions_target"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_permissions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
        ]
      }
      ecritures_comptables: {
        Row: {
          created_at: string
          date_ecriture: string
          exercice_id: string
          id: string
          journal_id: string
          libelle: string
          numero_piece: string
          reference_id: string | null
          reference_type: string | null
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_ecriture: string
          exercice_id: string
          id?: string
          journal_id: string
          libelle: string
          numero_piece: string
          reference_id?: string | null
          reference_type?: string | null
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_ecriture?: string
          exercice_id?: string
          id?: string
          journal_id?: string
          libelle?: string
          numero_piece?: string
          reference_id?: string | null
          reference_type?: string | null
          statut?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "ecritures_comptables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
            foreignKeyName: "encaissements_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
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
            foreignKeyName: "encaissements_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
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
          niu: string | null
          nom: string
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
          niu?: string | null
          nom: string
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
          niu?: string | null
          nom?: string
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
            foreignKeyName: "immobilisations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
          date_creation: string | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          ecarts: number | null
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
          date_creation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          ecarts?: number | null
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
          date_creation?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          ecarts?: number | null
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
        ]
      }
      journaux_comptables: {
        Row: {
          code_journal: string
          created_at: string
          id: string
          is_active: boolean | null
          libelle_journal: string
          tenant_id: string
          type_journal: string
          updated_at: string
        }
        Insert: {
          code_journal: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle_journal: string
          tenant_id: string
          type_journal: string
          updated_at?: string
        }
        Update: {
          code_journal?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle_journal?: string
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
            foreignKeyName: "lignes_commande_fournisseur_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_ecriture: {
        Row: {
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
            foreignKeyName: "lignes_ecriture_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
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
            foreignKeyName: "lignes_ecriture_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_reception_fournisseur: {
        Row: {
          created_at: string
          date_peremption: string | null
          id: string
          lot_id: string | null
          prix_achat_unitaire_reel: number
          produit_id: string
          quantite_recue: number
          reception_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_peremption?: string | null
          id?: string
          lot_id?: string | null
          prix_achat_unitaire_reel: number
          produit_id: string
          quantite_recue: number
          reception_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_peremption?: string | null
          id?: string
          lot_id?: string | null
          prix_achat_unitaire_reel?: number
          produit_id?: string
          quantite_recue?: number
          reception_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      lignes_ventes: {
        Row: {
          created_at: string
          id: string
          lot_id: string | null
          montant_total_ligne: number
          prix_unitaire_ht: number
          prix_unitaire_ttc: number
          produit_id: string
          quantite: number
          remise_ligne: number | null
          taux_tva: number | null
          tenant_id: string
          updated_at: string
          vente_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id?: string | null
          montant_total_ligne: number
          prix_unitaire_ht: number
          prix_unitaire_ttc: number
          produit_id: string
          quantite: number
          remise_ligne?: number | null
          taux_tva?: number | null
          tenant_id: string
          updated_at?: string
          vente_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string | null
          montant_total_ligne?: number
          prix_unitaire_ht?: number
          prix_unitaire_ttc?: number
          produit_id?: string
          quantite?: number
          remise_ligne?: number | null
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
            foreignKeyName: "lignes_ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
        ]
      }
      lots: {
        Row: {
          created_at: string
          date_peremption: string | null
          fournisseur_id: string | null
          id: string
          numero_lot: string
          prix_achat_unitaire: number | null
          produit_id: string
          quantite_initiale: number
          quantite_restante: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_peremption?: string | null
          fournisseur_id?: string | null
          id?: string
          numero_lot: string
          prix_achat_unitaire?: number | null
          produit_id: string
          quantite_initiale: number
          quantite_restante: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_peremption?: string | null
          fournisseur_id?: string | null
          id?: string
          numero_lot?: string
          prix_achat_unitaire?: number | null
          produit_id?: string
          quantite_initiale?: number
          quantite_restante?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
      mouvements_caisse: {
        Row: {
          agent_id: string | null
          created_at: string
          date_mouvement: string | null
          id: string
          montant: number
          motif: string
          notes: string | null
          reference: string | null
          session_caisse_id: string
          tenant_id: string
          type_mouvement: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          date_mouvement?: string | null
          id?: string
          montant: number
          motif: string
          notes?: string | null
          reference?: string | null
          session_caisse_id: string
          tenant_id: string
          type_mouvement: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          date_mouvement?: string | null
          id?: string
          montant?: number
          motif?: string
          notes?: string | null
          reference?: string | null
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
            foreignKeyName: "mouvements_caisse_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
            foreignKeyName: "mouvements_lots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_lots_lot_destination_id_fkey"
            columns: ["lot_destination_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
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
            foreignKeyName: "network_backup_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      network_channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
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
            foreignKeyName: "network_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
      parametres_expiration: {
        Row: {
          action_automatique: string | null
          created_at: string | null
          famille_produit_id: string | null
          id: string
          jours_alerte: number
          jours_blocage: number
          jours_critique: number
          priorite: number | null
          produit_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          action_automatique?: string | null
          created_at?: string | null
          famille_produit_id?: string | null
          id?: string
          jours_alerte?: number
          jours_blocage?: number
          jours_critique?: number
          priorite?: number | null
          produit_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          action_automatique?: string | null
          created_at?: string | null
          famille_produit_id?: string | null
          id?: string
          jours_alerte?: number
          jours_blocage?: number
          jours_critique?: number
          priorite?: number | null
          produit_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametres_expiration_famille_produit_id_fkey"
            columns: ["famille_produit_id"]
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
        ]
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
          auth_user_id: string | null
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
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          auth_user_id?: string | null
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
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          auth_user_id?: string | null
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
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personnel_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
          pays: string | null
          phone: string | null
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
          pays?: string | null
          phone?: string | null
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
          pays?: string | null
          phone?: string | null
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
            foreignKeyName: "pharmacy_presence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
        ]
      }
      plan_comptable: {
        Row: {
          classe: number
          compte_parent_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          libelle_compte: string
          numero_compte: string
          tenant_id: string
          type_compte: string
          updated_at: string
        }
        Insert: {
          classe: number
          compte_parent_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle_compte: string
          numero_compte: string
          tenant_id: string
          type_compte: string
          updated_at?: string
        }
        Update: {
          classe?: number
          compte_parent_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle_compte?: string
          numero_compte?: string
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
            foreignKeyName: "plan_comptable_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
        ]
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
          categorie_tarification_id: string | null
          centime_additionnel: number | null
          classe_therapeutique_id: string | null
          code_cip: string | null
          created_at: string
          dci_id: string | null
          famille_id: string | null
          famille_produit_id: string | null
          forme_id: string | null
          id: string
          id_produit_source: string | null
          is_active: boolean | null
          laboratoires_id: string | null
          libelle_produit: string
          niveau_detail: number | null
          prix_achat: number | null
          prix_vente_ht: number | null
          prix_vente_ttc: number | null
          quantite_unites_details_source: number | null
          rayon_id: string | null
          rayon_produit_id: string | null
          reference_agent_enregistrement_id: string | null
          reference_agent_modification_id: string | null
          stock_alerte: number | null
          stock_limite: number | null
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string
          tva: number | null
          updated_at: string
        }
        Insert: {
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          classe_therapeutique_id?: string | null
          code_cip?: string | null
          created_at?: string
          dci_id?: string | null
          famille_id?: string | null
          famille_produit_id?: string | null
          forme_id?: string | null
          id?: string
          id_produit_source?: string | null
          is_active?: boolean | null
          laboratoires_id?: string | null
          libelle_produit: string
          niveau_detail?: number | null
          prix_achat?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_unites_details_source?: number | null
          rayon_id?: string | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          stock_alerte?: number | null
          stock_limite?: number | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id: string
          tva?: number | null
          updated_at?: string
        }
        Update: {
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          classe_therapeutique_id?: string | null
          code_cip?: string | null
          created_at?: string
          dci_id?: string | null
          famille_id?: string | null
          famille_produit_id?: string | null
          forme_id?: string | null
          id?: string
          id_produit_source?: string | null
          is_active?: boolean | null
          laboratoires_id?: string | null
          libelle_produit?: string
          niveau_detail?: number | null
          prix_achat?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_unites_details_source?: number | null
          rayon_id?: string | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          stock_alerte?: number | null
          stock_limite?: number | null
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id?: string
          tva?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produits_classe_therapeutique"
            columns: ["classe_therapeutique_id"]
            isOneToOne: false
            referencedRelation: "classes_therapeutiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produits_dci"
            columns: ["dci_id"]
            isOneToOne: false
            referencedRelation: "dci"
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
            foreignKeyName: "produits_categorie_tarification_id_fkey"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_famille_produit_id_fkey"
            columns: ["famille_produit_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
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
        ]
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
          fournisseur_id: string
          id: string
          reference_facture: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          commande_id?: string | null
          created_at?: string
          date_reception?: string | null
          fournisseur_id: string
          id?: string
          reference_facture?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          commande_id?: string | null
          created_at?: string
          date_reception?: string | null
          fournisseur_id?: string
          id?: string
          reference_facture?: string | null
          tenant_id?: string
          updated_at?: string
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
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string
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
        ]
      }
      security_incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_type: string
          metadata: Json | null
          resolved: boolean | null
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
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          metadata?: Json | null
          resolved?: boolean | null
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
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          metadata?: Json | null
          resolved?: boolean | null
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
        ]
      }
      sessions_caisse: {
        Row: {
          agent_id: string
          created_at: string
          date_fermeture: string | null
          date_ouverture: string | null
          ecart: number | null
          fond_caisse_fermeture: number | null
          fond_caisse_ouverture: number | null
          id: string
          montant_total_encaissements: number | null
          montant_total_ventes: number | null
          notes: string | null
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          date_fermeture?: string | null
          date_ouverture?: string | null
          ecart?: number | null
          fond_caisse_fermeture?: number | null
          fond_caisse_ouverture?: number | null
          id?: string
          montant_total_encaissements?: number | null
          montant_total_ventes?: number | null
          notes?: string | null
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          date_fermeture?: string | null
          date_ouverture?: string | null
          ecart?: number | null
          fond_caisse_fermeture?: number | null
          fond_caisse_ouverture?: number | null
          id?: string
          montant_total_encaissements?: number | null
          montant_total_ventes?: number | null
          notes?: string | null
          statut?: string | null
          tenant_id?: string
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
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      societes: {
        Row: {
          adresse: string | null
          assureur_id: string
          created_at: string
          email: string | null
          id: string
          libelle_societe: string
          limite_dette: number | null
          niu: string | null
          taux_couverture_agent: number | null
          taux_couverture_ayant_droit: number | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          assureur_id: string
          created_at?: string
          email?: string | null
          id?: string
          libelle_societe: string
          limite_dette?: number | null
          niu?: string | null
          taux_couverture_agent?: number | null
          taux_couverture_ayant_droit?: number | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          assureur_id?: string
          created_at?: string
          email?: string | null
          id?: string
          libelle_societe?: string
          limite_dette?: number | null
          niu?: string | null
          taux_couverture_agent?: number | null
          taux_couverture_ayant_droit?: number | null
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
            foreignKeyName: "stock_mouvements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
            foreignKeyName: "suggestions_vente_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
        ]
      }
      ventes: {
        Row: {
          agent_id: string | null
          client_id: string | null
          created_at: string
          date_vente: string | null
          id: string
          metadata: Json | null
          mode_paiement: Database["public"]["Enums"]["mode_paiement"] | null
          montant_net: number
          montant_part_assurance: number | null
          montant_part_patient: number | null
          montant_paye: number | null
          montant_rendu: number | null
          montant_total_ht: number
          montant_total_ttc: number
          montant_tva: number | null
          notes: string | null
          numero_vente: string
          remise_globale: number | null
          statut: Database["public"]["Enums"]["statut_vente"] | null
          taux_couverture_assurance: number | null
          tenant_id: string
          type_vente: Database["public"]["Enums"]["type_vente"] | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string
          date_vente?: string | null
          id?: string
          metadata?: Json | null
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          montant_net?: number
          montant_part_assurance?: number | null
          montant_part_patient?: number | null
          montant_paye?: number | null
          montant_rendu?: number | null
          montant_total_ht?: number
          montant_total_ttc?: number
          montant_tva?: number | null
          notes?: string | null
          numero_vente: string
          remise_globale?: number | null
          statut?: Database["public"]["Enums"]["statut_vente"] | null
          taux_couverture_assurance?: number | null
          tenant_id: string
          type_vente?: Database["public"]["Enums"]["type_vente"] | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          created_at?: string
          date_vente?: string | null
          id?: string
          metadata?: Json | null
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          montant_net?: number
          montant_part_assurance?: number | null
          montant_part_patient?: number | null
          montant_paye?: number | null
          montant_rendu?: number | null
          montant_total_ht?: number
          montant_total_ttc?: number
          montant_tva?: number | null
          notes?: string | null
          numero_vente?: string
          remise_globale?: number | null
          statut?: Database["public"]["Enums"]["statut_vente"] | null
          taux_couverture_assurance?: number | null
          tenant_id?: string
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
            foreignKeyName: "ventes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
          configuration: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          tags: string[] | null
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: string | null
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string | null
          configuration?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          tags?: string[] | null
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
          configuration: Json
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          estimated_duration: number | null
          execution_count: number | null
          id: string
          last_executed_at: string | null
          name: string
          priority: number
          status: string
          tags: string[] | null
          tenant_id: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actual_duration?: number | null
          assigned_to?: string | null
          category?: string | null
          completion_rate?: number | null
          configuration?: Json
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          estimated_duration?: number | null
          execution_count?: number | null
          id?: string
          last_executed_at?: string | null
          name: string
          priority?: number
          status?: string
          tags?: string[] | null
          tenant_id: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actual_duration?: number | null
          assigned_to?: string | null
          category?: string | null
          completion_rate?: number | null
          configuration?: Json
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          estimated_duration?: number | null
          execution_count?: number | null
          id?: string
          last_executed_at?: string | null
          name?: string
          priority?: number
          status?: string
          tags?: string[] | null
          tenant_id?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_compliance_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_low_stock_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      calculate_out_of_stock_metrics: {
        Args: { p_tenant_id: string }
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
      check_login_attempts: {
        Args: { p_email: string; p_tenant_id: string }
        Returns: Json
      }
      check_pharmacy_email_exists: {
        Args: { email_to_check: string }
        Returns: Json
      }
      cleanup_expired_pharmacy_sessions: { Args: never; Returns: number }
      create_pharmacy_session: {
        Args: {
          p_ip_address?: unknown
          p_pharmacy_id: string
          p_user_agent?: string
        }
        Returns: Json
      }
      debug_user_connection_state: { Args: never; Returns: Json }
      detect_suspicious_patterns: { Args: never; Returns: undefined }
      generate_inventaire_report: {
        Args: { p_session_id: string; p_tenant_id: string; p_type: string }
        Returns: Json
      }
      generate_sales_suggestions: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      generer_alertes_expiration_automatiques: { Args: never; Returns: Json }
      get_current_user_tenant_id: { Args: never; Returns: string }
      get_next_accounting_number: {
        Args: {
          p_journal_code?: string
          p_rule_type: string
          p_tenant_id: string
        }
        Returns: string
      }
      init_inventaire_items: { Args: { p_session_id: string }; Returns: Json }
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
      refresh_network_system_stats: {
        Args: { p_tenant_id: string }
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
      rpc_stock_record_movement:
        | {
            Args: {
              p_agent_id?: string
              p_emplacement_destination?: string
              p_emplacement_source?: string
              p_lot_destination_id?: string
              p_lot_id: string
              p_metadata?: Json
              p_motif?: string
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
        | {
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
      validate_password_strength: {
        Args: { p_tenant_id: string; password: string }
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
      statut_vente: "En cours" | "Validée" | "Annulée" | "Remboursée"
      type_client:
        | "Ordinaire"
        | "Assuré"
        | "Conventionné"
        | "Entreprise"
        | "Personnel"
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
      statut_vente: ["En cours", "Validée", "Annulée", "Remboursée"],
      type_client: [
        "Ordinaire",
        "Assuré",
        "Conventionné",
        "Entreprise",
        "Personnel",
      ],
      type_vente: ["Comptant", "Crédit", "Assurance"],
    },
  },
} as const
