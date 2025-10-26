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
          id: string
          libelle_categorie: string
          taux_centime_additionnel: number | null
          taux_tva: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          coefficient_prix_vente?: number | null
          created_at?: string
          id?: string
          libelle_categorie: string
          taux_centime_additionnel?: number | null
          taux_tva?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          coefficient_prix_vente?: number | null
          created_at?: string
          id?: string
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
      clients: {
        Row: {
          adresse: string | null
          contact_email: string | null
          contact_fonction: string | null
          contact_nom: string | null
          contact_telephone: string | null
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
          plafond_annuel: number | null
          plafond_mensuel: number | null
          raison_sociale: string | null
          secteur_activite: string | null
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
          plafond_annuel?: number | null
          plafond_mensuel?: number | null
          raison_sociale?: string | null
          secteur_activite?: string | null
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
          plafond_annuel?: number | null
          plafond_mensuel?: number | null
          raison_sociale?: string | null
          secteur_activite?: string | null
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
      document_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
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
          category: string | null
          content: string | null
          created_at: string
          document_type: string
          due_date: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          name: string
          priority: string | null
          recipient: string | null
          sender: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          document_type: string
          due_date?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          name: string
          priority?: string | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          document_type?: string
          due_date?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          priority?: string | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
      exercices_comptables: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          libelle: string
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          libelle: string
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          libelle?: string
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
          id: string
          libelle_famille: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          libelle_famille: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
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
      inventaire_sessions: {
        Row: {
          agent_id: string
          created_at: string
          date_debut: string | null
          date_fin: string | null
          id: string
          statut: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          id?: string
          statut?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          id?: string
          statut?: string | null
          tenant_id?: string
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
      report_api_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          permissions: Json | null
          tenant_id: string
          token_hash: string
          token_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          permissions?: Json | null
          tenant_id: string
          token_hash: string
          token_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          permissions?: Json | null
          tenant_id?: string
          token_hash?: string
          token_name?: string
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
          connection_config: Json | null
          connector_name: string
          connector_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          connection_config?: Json | null
          connector_name: string
          connector_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          connection_config?: Json | null
          connector_name?: string
          connector_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string
          id: string
          report_type: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          report_type: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string
          id?: string
          report_type?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run: string | null
          next_run: string | null
          recipients: Json | null
          report_type: string
          schedule_config: Json | null
          schedule_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          recipients?: Json | null
          report_type: string
          schedule_config?: Json | null
          schedule_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          next_run?: string | null
          recipients?: Json | null
          report_type?: string
          schedule_config?: Json | null
          schedule_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
          is_system: boolean | null
          name: string
          template_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          template_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          template_type?: string
          tenant_id?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_session_risk_score: {
        Args: {
          p_ip_address: string
          p_personnel_id: string
          p_user_agent: string
        }
        Returns: number
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
      generate_sales_suggestions: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      get_current_user_tenant_id: { Args: never; Returns: string }
      is_system_admin: { Args: never; Returns: boolean }
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
      rpc_stock_delete_movement:
        | { Args: { p_mouvement_id: string }; Returns: Json }
        | {
            Args: { p_mouvement_id: string; p_tenant_id: string }
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
              p_lot_id: string
              p_motif?: string
              p_produit_id: string
              p_quantite: number
              p_tenant_id: string
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
              p_motif?: string
              p_mouvement_id: string
              p_quantite: number
              p_tenant_id: string
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
      type_client: "Particulier" | "Assureur" | "Société" | "Conventionné"
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
      type_client: ["Particulier", "Assureur", "Société", "Conventionné"],
      type_vente: ["Comptant", "Crédit", "Assurance"],
    },
  },
} as const
