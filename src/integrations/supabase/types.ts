export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          personnel_id: string | null
          record_id: string | null
          status: string | null
          table_name: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          personnel_id?: string | null
          record_id?: string | null
          status?: string | null
          table_name?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          personnel_id?: string | null
          record_id?: string | null
          status?: string | null
          table_name?: string | null
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
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      balances: {
        Row: {
          compte_id: string
          created_at: string
          date_calcul: string
          exercice_id: string
          id: string
          periode: string
          solde_credit_cloture: number
          solde_credit_ouverture: number
          solde_debit_cloture: number
          solde_debit_ouverture: number
          tenant_id: string
          total_credit_periode: number
          total_debit_periode: number
          updated_at: string
        }
        Insert: {
          compte_id: string
          created_at?: string
          date_calcul?: string
          exercice_id: string
          id?: string
          periode: string
          solde_credit_cloture?: number
          solde_credit_ouverture?: number
          solde_debit_cloture?: number
          solde_debit_ouverture?: number
          tenant_id: string
          total_credit_periode?: number
          total_debit_periode?: number
          updated_at?: string
        }
        Update: {
          compte_id?: string
          created_at?: string
          date_calcul?: string
          exercice_id?: string
          id?: string
          periode?: string
          solde_credit_cloture?: number
          solde_credit_ouverture?: number
          solde_debit_cloture?: number
          solde_debit_ouverture?: number
          tenant_id?: string
          total_credit_periode?: number
          total_debit_periode?: number
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
      clients: {
        Row: {
          adresse: string | null
          conventionne_id: string | null
          created_at: string
          id: string
          nom_complet: string | null
          personnel_id: string | null
          societe_id: string | null
          taux_remise_automatique: number | null
          telephone: string | null
          tenant_id: string
          type_client: Database["public"]["Enums"]["type_client_enum"]
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          conventionne_id?: string | null
          created_at?: string
          id?: string
          nom_complet?: string | null
          personnel_id?: string | null
          societe_id?: string | null
          taux_remise_automatique?: number | null
          telephone?: string | null
          tenant_id: string
          type_client: Database["public"]["Enums"]["type_client_enum"]
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          conventionne_id?: string | null
          created_at?: string
          id?: string
          nom_complet?: string | null
          personnel_id?: string | null
          societe_id?: string | null
          taux_remise_automatique?: number | null
          telephone?: string | null
          tenant_id?: string
          type_client?: Database["public"]["Enums"]["type_client_enum"]
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
          granted_by: string
          granted_to: string | null
          id: string
          is_active: boolean
          permission_type: string
          source_tenant_id: string
          table_name: string
          target_tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by: string
          granted_to?: string | null
          id?: string
          is_active?: boolean
          permission_type: string
          source_tenant_id: string
          table_name: string
          target_tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string
          granted_to?: string | null
          id?: string
          is_active?: boolean
          permission_type?: string
          source_tenant_id?: string
          table_name?: string
          target_tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cross_tenant_granted_by"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_granted_to"
            columns: ["granted_to"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_source"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cross_tenant_target"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      dci: {
        Row: {
          classe_therapeutique: string | null
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
          classe_therapeutique?: string | null
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
          classe_therapeutique?: string | null
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
        Relationships: []
      }
      document_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
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
          id?: string
          is_system?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          author_id: string | null
          category: string
          created_at: string
          description: string | null
          file_path: string | null
          file_size: number
          file_type: string
          file_url: string | null
          id: string
          name: string
          original_filename: string
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size: number
          file_type: string
          file_url?: string | null
          id?: string
          name: string
          original_filename: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number
          file_type?: string
          file_url?: string | null
          id?: string
          name?: string
          original_filename?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ecritures_comptables: {
        Row: {
          created_at: string
          date_ecriture: string
          date_valeur: string | null
          exercice_id: string
          id: string
          journal_id: string
          libelle_ecriture: string
          montant_total: number
          notes: string | null
          numero_piece: string
          personnel_id: string | null
          reference_externe: string | null
          reference_id: string | null
          reference_type: string | null
          statut: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_ecriture: string
          date_valeur?: string | null
          exercice_id: string
          id?: string
          journal_id: string
          libelle_ecriture: string
          montant_total?: number
          notes?: string | null
          numero_piece: string
          personnel_id?: string | null
          reference_externe?: string | null
          reference_id?: string | null
          reference_type?: string | null
          statut?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_ecriture?: string
          date_valeur?: string | null
          exercice_id?: string
          id?: string
          journal_id?: string
          libelle_ecriture?: string
          montant_total?: number
          notes?: string | null
          numero_piece?: string
          personnel_id?: string | null
          reference_externe?: string | null
          reference_id?: string | null
          reference_type?: string | null
          statut?: string
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
            foreignKeyName: "ecritures_comptables_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      encaissements: {
        Row: {
          caissier_id: string
          created_at: string
          date_encaissement: string
          id: string
          mode_paiement: string
          montant_a_encaisser: number
          montant_recu: number
          montant_rendu: number
          notes: string | null
          numero_encaissement: string
          reference_paiement: string | null
          session_caisse_id: string | null
          statut: string
          tenant_id: string
          updated_at: string
          vente_id: string
        }
        Insert: {
          caissier_id: string
          created_at?: string
          date_encaissement?: string
          id?: string
          mode_paiement: string
          montant_a_encaisser: number
          montant_recu?: number
          montant_rendu?: number
          notes?: string | null
          numero_encaissement: string
          reference_paiement?: string | null
          session_caisse_id?: string | null
          statut?: string
          tenant_id: string
          updated_at?: string
          vente_id: string
        }
        Update: {
          caissier_id?: string
          created_at?: string
          date_encaissement?: string
          id?: string
          mode_paiement?: string
          montant_a_encaisser?: number
          montant_recu?: number
          montant_rendu?: number
          notes?: string | null
          numero_encaissement?: string
          reference_paiement?: string | null
          session_caisse_id?: string | null
          statut?: string
          tenant_id?: string
          updated_at?: string
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaissements_caissier_id_fkey"
            columns: ["caissier_id"]
            isOneToOne: false
            referencedRelation: "personnel"
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
          is_current: boolean
          libelle_exercice: string
          notes: string | null
          statut: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          is_current?: boolean
          libelle_exercice: string
          notes?: string | null
          statut?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          is_current?: boolean
          libelle_exercice?: string
          notes?: string | null
          statut?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      formations_employes: {
        Row: {
          certificat_requis: boolean | null
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
          certificat_requis?: boolean | null
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
          certificat_requis?: boolean | null
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
        Relationships: []
      }
      formations_employes_participants: {
        Row: {
          certificat_obtenu: boolean | null
          commentaires: string | null
          created_at: string
          employe_id: string
          formation_id: string
          id: string
          note_finale: number | null
          statut_participation: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          certificat_obtenu?: boolean | null
          commentaires?: string | null
          created_at?: string
          employe_id: string
          formation_id: string
          id?: string
          note_finale?: number | null
          statut_participation?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          certificat_obtenu?: boolean | null
          commentaires?: string | null
          created_at?: string
          employe_id?: string
          formation_id?: string
          id?: string
          note_finale?: number | null
          statut_participation?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_employes_participants_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations_employes"
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
        Relationships: []
      }
      horaires_employes: {
        Row: {
          created_at: string
          date_planning: string
          employe_id: string
          heure_debut: string
          heure_fin: string
          id: string
          notes: string | null
          poste: string
          statut: string
          tenant_id: string
          type_shift: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_planning: string
          employe_id: string
          heure_debut: string
          heure_fin: string
          id?: string
          notes?: string | null
          poste: string
          statut?: string
          tenant_id: string
          type_shift: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_planning?: string
          employe_id?: string
          heure_debut?: string
          heure_fin?: string
          id?: string
          notes?: string | null
          poste?: string
          statut?: string
          tenant_id?: string
          type_shift?: string
          updated_at?: string
        }
        Relationships: []
      }
      immobilisations: {
        Row: {
          compte_amortissement_id: string | null
          compte_immobilisation_id: string
          created_at: string
          cumul_amortissement: number
          date_acquisition: string
          date_sortie: string | null
          duree_amortissement: number | null
          id: string
          is_active: boolean
          libelle_immobilisation: string
          mode_amortissement: string | null
          motif_sortie: string | null
          notes: string | null
          numero_immobilisation: string
          taux_amortissement: number | null
          tenant_id: string
          updated_at: string
          valeur_acquisition: number
          valeur_nette_comptable: number
          valeur_residuelle: number | null
        }
        Insert: {
          compte_amortissement_id?: string | null
          compte_immobilisation_id: string
          created_at?: string
          cumul_amortissement?: number
          date_acquisition: string
          date_sortie?: string | null
          duree_amortissement?: number | null
          id?: string
          is_active?: boolean
          libelle_immobilisation: string
          mode_amortissement?: string | null
          motif_sortie?: string | null
          notes?: string | null
          numero_immobilisation: string
          taux_amortissement?: number | null
          tenant_id: string
          updated_at?: string
          valeur_acquisition: number
          valeur_nette_comptable?: number
          valeur_residuelle?: number | null
        }
        Update: {
          compte_amortissement_id?: string | null
          compte_immobilisation_id?: string
          created_at?: string
          cumul_amortissement?: number
          date_acquisition?: string
          date_sortie?: string | null
          duree_amortissement?: number | null
          id?: string
          is_active?: boolean
          libelle_immobilisation?: string
          mode_amortissement?: string | null
          motif_sortie?: string | null
          notes?: string | null
          numero_immobilisation?: string
          taux_amortissement?: number | null
          tenant_id?: string
          updated_at?: string
          valeur_acquisition?: number
          valeur_nette_comptable?: number
          valeur_residuelle?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "immobilisations_compte_amortissement_id_fkey"
            columns: ["compte_amortissement_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immobilisations_compte_immobilisation_id_fkey"
            columns: ["compte_immobilisation_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
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
        ]
      }
      journaux_comptables: {
        Row: {
          code_journal: string
          compte_contrepartie_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          libelle_journal: string
          numero_dernier_mouvement: number
          tenant_id: string
          type_journal: string
          updated_at: string
        }
        Insert: {
          code_journal: string
          compte_contrepartie_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle_journal: string
          numero_dernier_mouvement?: number
          tenant_id: string
          type_journal: string
          updated_at?: string
        }
        Update: {
          code_journal?: string
          compte_contrepartie_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          libelle_journal?: string
          numero_dernier_mouvement?: number
          tenant_id?: string
          type_journal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journaux_comptables_compte_contrepartie_id_fkey"
            columns: ["compte_contrepartie_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable"
            referencedColumns: ["id"]
          },
        ]
      }
      journaux_configuration: {
        Row: {
          ancienne_valeur: Json | null
          created_at: string
          description: string | null
          enregistrement_id: string
          id: string
          ip_address: string | null
          nouvelle_valeur: Json | null
          personnel_id: string | null
          table_affectee: string
          tenant_id: string
          type_changement: string
          user_agent: string | null
        }
        Insert: {
          ancienne_valeur?: Json | null
          created_at?: string
          description?: string | null
          enregistrement_id: string
          id?: string
          ip_address?: string | null
          nouvelle_valeur?: Json | null
          personnel_id?: string | null
          table_affectee: string
          tenant_id: string
          type_changement: string
          user_agent?: string | null
        }
        Update: {
          ancienne_valeur?: Json | null
          created_at?: string
          description?: string | null
          enregistrement_id?: string
          id?: string
          ip_address?: string | null
          nouvelle_valeur?: Json | null
          personnel_id?: string | null
          table_affectee?: string
          tenant_id?: string
          type_changement?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journaux_configuration_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
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
        Relationships: []
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
        ]
      }
      lignes_ecriture: {
        Row: {
          analytique_code: string | null
          compte_id: string
          created_at: string
          date_echeance: string | null
          ecriture_id: string
          id: string
          is_lettree: boolean
          lettrage: string | null
          libelle_ligne: string
          montant_credit: number
          montant_debit: number
          notes: string | null
          numero_ligne: number
          piece_jointe: string | null
          quantite: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          analytique_code?: string | null
          compte_id: string
          created_at?: string
          date_echeance?: string | null
          ecriture_id: string
          id?: string
          is_lettree?: boolean
          lettrage?: string | null
          libelle_ligne: string
          montant_credit?: number
          montant_debit?: number
          notes?: string | null
          numero_ligne: number
          piece_jointe?: string | null
          quantite?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          analytique_code?: string | null
          compte_id?: string
          created_at?: string
          date_echeance?: string | null
          ecriture_id?: string
          id?: string
          is_lettree?: boolean
          lettrage?: string | null
          libelle_ligne?: string
          montant_credit?: number
          montant_debit?: number
          notes?: string | null
          numero_ligne?: number
          piece_jointe?: string | null
          quantite?: number | null
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
        ]
      }
      lignes_ventes: {
        Row: {
          created_at: string
          id: string
          lot_id: string | null
          montant_ligne_ht: number
          montant_ligne_ttc: number
          prix_unitaire_ht: number
          prix_unitaire_ttc: number
          produit_id: string
          quantite: number
          remise_ligne: number
          tenant_id: string
          updated_at: string
          vente_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id?: string | null
          montant_ligne_ht?: number
          montant_ligne_ttc?: number
          prix_unitaire_ht?: number
          prix_unitaire_ttc?: number
          produit_id: string
          quantite: number
          remise_ligne?: number
          tenant_id: string
          updated_at?: string
          vente_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string | null
          montant_ligne_ht?: number
          montant_ligne_ttc?: number
          prix_unitaire_ht?: number
          prix_unitaire_ttc?: number
          produit_id?: string
          quantite?: number
          remise_ligne?: number
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
          success?: boolean
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
            foreignKeyName: "fk_login_attempts_tenant"
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
          id: string
          numero_lot: string
          produit_id: string
          quantite_initiale: number
          quantite_restante: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_peremption?: string | null
          id?: string
          numero_lot: string
          produit_id: string
          quantite_initiale: number
          quantite_restante: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_peremption?: string | null
          id?: string
          numero_lot?: string
          produit_id?: string
          quantite_initiale?: number
          quantite_restante?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_caisse: {
        Row: {
          agent_id: string | null
          created_at: string
          date_mouvement: string
          description: string | null
          id: string
          montant: number
          reference_id: string | null
          reference_type: string | null
          session_caisse_id: string
          tenant_id: string
          type_mouvement: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          date_mouvement?: string
          description?: string | null
          id?: string
          montant: number
          reference_id?: string | null
          reference_type?: string | null
          session_caisse_id: string
          tenant_id: string
          type_mouvement: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          date_mouvement?: string
          description?: string | null
          id?: string
          montant?: number
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
            foreignKeyName: "mouvements_caisse_session_caisse_id_fkey"
            columns: ["session_caisse_id"]
            isOneToOne: false
            referencedRelation: "sessions_caisse"
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
            foreignKeyName: "network_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
      parametres_systeme: {
        Row: {
          categorie: string
          cle_parametre: string
          created_at: string
          description: string | null
          id: string
          is_modifiable: boolean
          is_visible: boolean
          tenant_id: string
          type_parametre: string
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
          is_modifiable?: boolean
          is_visible?: boolean
          tenant_id: string
          type_parametre: string
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
          is_modifiable?: boolean
          is_visible?: boolean
          tenant_id?: string
          type_parametre?: string
          updated_at?: string
          valeur_defaut?: string | null
          valeur_parametre?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "fk_password_history_personnel"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_password_history_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      password_policies: {
        Row: {
          created_at: string
          force_2fa_for_roles: string[] | null
          id: string
          lockout_duration_minutes: number
          max_age_days: number
          max_failed_attempts: number
          min_length: number
          remember_last_passwords: number
          require_lowercase: boolean
          require_numbers: boolean
          require_special_chars: boolean
          require_uppercase: boolean
          session_timeout_minutes: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          force_2fa_for_roles?: string[] | null
          id?: string
          lockout_duration_minutes?: number
          max_age_days?: number
          max_failed_attempts?: number
          min_length?: number
          remember_last_passwords?: number
          require_lowercase?: boolean
          require_numbers?: boolean
          require_special_chars?: boolean
          require_uppercase?: boolean
          session_timeout_minutes?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          force_2fa_for_roles?: string[] | null
          id?: string
          lockout_duration_minutes?: number
          max_age_days?: number
          max_failed_attempts?: number
          min_length?: number
          remember_last_passwords?: number
          require_lowercase?: boolean
          require_numbers?: boolean
          require_special_chars?: boolean
          require_uppercase?: boolean
          session_timeout_minutes?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_password_policies_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          categorie: string
          code_permission: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          nom_permission: string
          updated_at: string
        }
        Insert: {
          categorie: string
          code_permission: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          nom_permission: string
          updated_at?: string
        }
        Update: {
          categorie?: string
          code_permission?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          nom_permission?: string
          updated_at?: string
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
          password: string | null
          photo_identite: string | null
          prenoms: string
          profession: string | null
          reference_agent: string
          role: string
          salaire_base: number | null
          situation_familiale:
            | Database["public"]["Enums"]["situation_familiale_enum"]
            | null
          statut_contractuel:
            | Database["public"]["Enums"]["statut_contractuel_enum"]
            | null
          telephone_appel: string | null
          telephone_whatsapp: string | null
          tenant_id: string | null
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
          password?: string | null
          photo_identite?: string | null
          prenoms: string
          profession?: string | null
          reference_agent: string
          role?: string
          salaire_base?: number | null
          situation_familiale?:
            | Database["public"]["Enums"]["situation_familiale_enum"]
            | null
          statut_contractuel?:
            | Database["public"]["Enums"]["statut_contractuel_enum"]
            | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string | null
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
          password?: string | null
          photo_identite?: string | null
          prenoms?: string
          profession?: string | null
          reference_agent?: string
          role?: string
          salaire_base?: number | null
          situation_familiale?:
            | Database["public"]["Enums"]["situation_familiale_enum"]
            | null
          statut_contractuel?:
            | Database["public"]["Enums"]["statut_contractuel_enum"]
            | null
          telephone_appel?: string | null
          telephone_whatsapp?: string | null
          tenant_id?: string | null
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
          banque: string | null
          city: string | null
          code: string
          created_at: string
          departement: string | null
          email: string | null
          id: string
          logo: string | null
          name: string
          niu: string | null
          numero_compte_bancaire: string | null
          password: string | null
          pays: string | null
          phone: string | null
          photo_exterieur: string | null
          photo_interieur: string | null
          postal_code: string | null
          quartier: string | null
          rccm: string | null
          region: string | null
          slogan: string | null
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
          banque?: string | null
          city?: string | null
          code: string
          created_at?: string
          departement?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          name: string
          niu?: string | null
          numero_compte_bancaire?: string | null
          password?: string | null
          pays?: string | null
          phone?: string | null
          photo_exterieur?: string | null
          photo_interieur?: string | null
          postal_code?: string | null
          quartier?: string | null
          rccm?: string | null
          region?: string | null
          slogan?: string | null
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
          banque?: string | null
          city?: string | null
          code?: string
          created_at?: string
          departement?: string | null
          email?: string | null
          id?: string
          logo?: string | null
          name?: string
          niu?: string | null
          numero_compte_bancaire?: string | null
          password?: string | null
          pays?: string | null
          phone?: string | null
          photo_exterieur?: string | null
          photo_interieur?: string | null
          postal_code?: string | null
          quartier?: string | null
          rccm?: string | null
          region?: string | null
          slogan?: string | null
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
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          pharmacy_id: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          pharmacy_id: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          pharmacy_id?: string
          session_token?: string
          user_agent?: string | null
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
          classe_compte: number
          compte_parent_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_collectif: boolean
          libelle_compte: string
          niveau_compte: number
          numero_compte: string
          sens_normal: string
          sous_classe: string | null
          tenant_id: string
          type_compte: string
          updated_at: string
        }
        Insert: {
          classe_compte: number
          compte_parent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_collectif?: boolean
          libelle_compte: string
          niveau_compte?: number
          numero_compte: string
          sens_normal: string
          sous_classe?: string | null
          tenant_id: string
          type_compte: string
          updated_at?: string
        }
        Update: {
          classe_compte?: number
          compte_parent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_collectif?: boolean
          libelle_compte?: string
          niveau_compte?: number
          numero_compte?: string
          sens_normal?: string
          sous_classe?: string | null
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
        ]
      }
      planning_employes: {
        Row: {
          created_at: string
          date: string
          employe_id: string
          heure_debut: string
          heure_fin: string
          id: string
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
          id?: string
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
          id?: string
          notes?: string | null
          poste?: string
          statut?: string
          tenant_id?: string
          type_shift?: string
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
          type_preference: string
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
          code_cip: string | null
          created_at: string
          dci_id: string | null
          famille_id: string | null
          famille_produit_id: string | null
          id: string
          id_produit_source: string | null
          is_active: boolean | null
          laboratoire: string | null
          libelle_produit: string
          niveau_detail: number | null
          prix_achat: number | null
          prix_vente: number | null
          prix_vente_ht: number | null
          prix_vente_ttc: number | null
          quantite_stock: number | null
          quantite_unites_details_source: number | null
          rayon_id: string | null
          rayon_produit_id: string | null
          reference_agent_enregistrement_id: string | null
          reference_agent_modification_id: string | null
          stock_alerte: number | null
          stock_limite: number | null
          taux_tva: number | null
          tenant_id: string
          tva: number | null
          updated_at: string
        }
        Insert: {
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          code_cip?: string | null
          created_at?: string
          dci_id?: string | null
          famille_id?: string | null
          famille_produit_id?: string | null
          id?: string
          id_produit_source?: string | null
          is_active?: boolean | null
          laboratoire?: string | null
          libelle_produit: string
          niveau_detail?: number | null
          prix_achat?: number | null
          prix_vente?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_stock?: number | null
          quantite_unites_details_source?: number | null
          rayon_id?: string | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          stock_alerte?: number | null
          stock_limite?: number | null
          taux_tva?: number | null
          tenant_id: string
          tva?: number | null
          updated_at?: string
        }
        Update: {
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          code_cip?: string | null
          created_at?: string
          dci_id?: string | null
          famille_id?: string | null
          famille_produit_id?: string | null
          id?: string
          id_produit_source?: string | null
          is_active?: boolean | null
          laboratoire?: string | null
          libelle_produit?: string
          niveau_detail?: number | null
          prix_achat?: number | null
          prix_vente?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_stock?: number | null
          quantite_unites_details_source?: number | null
          rayon_id?: string | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          stock_alerte?: number | null
          stock_limite?: number | null
          taux_tva?: number | null
          tenant_id?: string
          tva?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produits_categorie"
            columns: ["categorie_tarification_id"]
            isOneToOne: false
            referencedRelation: "categorie_tarification"
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
            foreignKeyName: "fk_produits_famille"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "famille_produit"
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
        ]
      }
      rapports_comptables: {
        Row: {
          contenu_rapport: Json | null
          created_at: string
          date_debut: string
          date_fin: string
          exercice_id: string
          fichier_export: string | null
          id: string
          nom_rapport: string
          parametres: Json | null
          personnel_id: string | null
          statut: string
          tenant_id: string
          type_rapport: string
          updated_at: string
        }
        Insert: {
          contenu_rapport?: Json | null
          created_at?: string
          date_debut: string
          date_fin: string
          exercice_id: string
          fichier_export?: string | null
          id?: string
          nom_rapport: string
          parametres?: Json | null
          personnel_id?: string | null
          statut?: string
          tenant_id: string
          type_rapport: string
          updated_at?: string
        }
        Update: {
          contenu_rapport?: Json | null
          created_at?: string
          date_debut?: string
          date_fin?: string
          exercice_id?: string
          fichier_export?: string | null
          id?: string
          nom_rapport?: string
          parametres?: Json | null
          personnel_id?: string | null
          statut?: string
          tenant_id?: string
          type_rapport?: string
          updated_at?: string
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
            foreignKeyName: "rapports_comptables_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
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
          niveau_restriction?: string
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
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          niveau_hierarchique: number
          nom_role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          niveau_hierarchique?: number
          nom_role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          niveau_hierarchique?: number
          nom_role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles_permissions: {
        Row: {
          accorde: boolean
          created_at: string
          id: string
          permission_id: string
          role_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accorde?: boolean
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accorde?: boolean
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
          tenant_id?: string
          updated_at?: string
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
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
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
          affected_systems: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          impact_level: string | null
          incident_type: string
          ip_address: string | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          affected_systems?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact_level?: string | null
          incident_type: string
          ip_address?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          affected_systems?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact_level?: string | null
          incident_type?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      sessions_caisse: {
        Row: {
          caissier_id: string
          created_at: string
          date_fermeture: string | null
          date_ouverture: string
          ecart: number | null
          fond_caisse_ouverture: number
          id: string
          montant_reel_fermeture: number | null
          montant_theorique_fermeture: number | null
          numero_session: string
          statut: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          caissier_id: string
          created_at?: string
          date_fermeture?: string | null
          date_ouverture?: string
          ecart?: number | null
          fond_caisse_ouverture?: number
          id?: string
          montant_reel_fermeture?: number | null
          montant_theorique_fermeture?: number | null
          numero_session: string
          statut?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          caissier_id?: string
          created_at?: string
          date_fermeture?: string | null
          date_ouverture?: string
          ecart?: number | null
          fond_caisse_ouverture?: number
          id?: string
          montant_reel_fermeture?: number | null
          montant_theorique_fermeture?: number | null
          numero_session?: string
          statut?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_caissier_id_fkey"
            columns: ["caissier_id"]
            isOneToOne: false
            referencedRelation: "personnel"
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
            foreignKeyName: "fk_tenant_security_config_tenant"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      tva_declaration: {
        Row: {
          acompte_verse: number
          created_at: string
          credit_tva_anterieur: number
          date_declaration: string | null
          exercice_id: string
          id: string
          notes: string | null
          periode: string
          solde_a_payer: number
          statut: string
          tenant_id: string
          tva_a_payer: number
          tva_collectee: number
          tva_deductible: number
          updated_at: string
        }
        Insert: {
          acompte_verse?: number
          created_at?: string
          credit_tva_anterieur?: number
          date_declaration?: string | null
          exercice_id: string
          id?: string
          notes?: string | null
          periode: string
          solde_a_payer?: number
          statut?: string
          tenant_id: string
          tva_a_payer?: number
          tva_collectee?: number
          tva_deductible?: number
          updated_at?: string
        }
        Update: {
          acompte_verse?: number
          created_at?: string
          credit_tva_anterieur?: number
          date_declaration?: string | null
          exercice_id?: string
          id?: string
          notes?: string | null
          periode?: string
          solde_a_payer?: number
          statut?: string
          tenant_id?: string
          tva_a_payer?: number
          tva_collectee?: number
          tva_deductible?: number
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
        ]
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
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
          is_enabled?: boolean
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
          is_enabled?: boolean
          last_used_at?: string | null
          personnel_id?: string
          secret_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_two_factor_auth_personnel"
            columns: ["personnel_id"]
            isOneToOne: true
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_two_factor_auth_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          personnel_id: string
          requires_2fa: boolean
          risk_score: number | null
          security_level: string
          session_token: string
          tenant_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          personnel_id: string
          requires_2fa?: boolean
          risk_score?: number | null
          security_level?: string
          session_token: string
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          personnel_id?: string
          requires_2fa?: boolean
          risk_score?: number | null
          security_level?: string
          session_token?: string
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_sessions_personnel"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_sessions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          agent_vendeur_id: string | null
          client_id: string | null
          created_at: string
          date_vente: string
          id: string
          montant_brut: number
          montant_net: number
          montant_remise_automatique: number
          montant_remise_manuelle: number
          notes: string | null
          numero_ticket: string
          statut: string
          taux_remise_manuelle: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agent_vendeur_id?: string | null
          client_id?: string | null
          created_at?: string
          date_vente?: string
          id?: string
          montant_brut?: number
          montant_net?: number
          montant_remise_automatique?: number
          montant_remise_manuelle?: number
          notes?: string | null
          numero_ticket: string
          statut?: string
          taux_remise_manuelle?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agent_vendeur_id?: string | null
          client_id?: string | null
          created_at?: string
          date_vente?: string
          id?: string
          montant_brut?: number
          montant_net?: number
          montant_remise_automatique?: number
          montant_remise_manuelle?: number
          notes?: string | null
          numero_ticket?: string
          statut?: string
          taux_remise_manuelle?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventes_agent_vendeur_id_fkey"
            columns: ["agent_vendeur_id"]
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
        ]
      }
      workflow_actions: {
        Row: {
          action_config: Json
          action_name: string
          action_type: string
          created_at: string
          execution_order: number
          id: string
          is_required: boolean | null
          max_retries: number | null
          retry_count: number | null
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          action_config?: Json
          action_name: string
          action_type: string
          created_at?: string
          execution_order?: number
          id?: string
          is_required?: boolean | null
          max_retries?: number | null
          retry_count?: number | null
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          action_config?: Json
          action_name?: string
          action_type?: string
          created_at?: string
          execution_order?: number
          id?: string
          is_required?: boolean | null
          max_retries?: number | null
          retry_count?: number | null
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          error_message: string | null
          executor_id: string | null
          id: string
          logs: Json | null
          progress_percentage: number | null
          result_data: Json | null
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          error_message?: string | null
          executor_id?: string | null
          id?: string
          logs?: Json | null
          progress_percentage?: number | null
          result_data?: Json | null
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          error_message?: string | null
          executor_id?: string | null
          id?: string
          logs?: Json | null
          progress_percentage?: number | null
          result_data?: Json | null
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflow_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
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
          setting_value?: Json
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
          setting_value?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          tags: string[] | null
          template_data: Json
          tenant_id: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tags?: string[] | null
          template_data?: Json
          tenant_id: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          tags?: string[] | null
          template_data?: Json
          tenant_id?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered: string | null
          tenant_id: string
          trigger_config: Json
          trigger_count: number | null
          trigger_name: string
          trigger_type: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          tenant_id: string
          trigger_config?: Json
          trigger_count?: number | null
          trigger_name: string
          trigger_type: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          tenant_id?: string
          trigger_config?: Json
          trigger_count?: number | null
          trigger_name?: string
          trigger_type?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: []
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
          priority: string
          status: string
          tags: string[] | null
          tenant_id: string
          trigger_config: Json | null
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
          priority?: string
          status?: string
          tags?: string[] | null
          tenant_id: string
          trigger_config?: Json | null
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
          priority?: string
          status?: string
          tags?: string[] | null
          tenant_id?: string
          trigger_config?: Json | null
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
      calculate_session_risk_score: {
        Args: { ip_address: string; user_agent: string; personnel_id: string }
        Returns: number
      }
      check_cross_tenant_permission: {
        Args: {
          source_tenant: string
          target_tenant: string
          table_name: string
          permission_type: string
        }
        Returns: boolean
      }
      check_login_attempts: {
        Args: { email: string; tenant_id: string }
        Returns: Json
      }
      check_user_permission: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      cleanup_old_security_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_security_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_admin_personnel: {
        Args: { pharmacy_id: string; admin_data: Json }
        Returns: Json
      }
      create_pharmacy_for_user: {
        Args: { pharmacy_data: Json }
        Returns: Json
      }
      create_pharmacy_session: {
        Args: {
          p_pharmacy_id: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      detect_suspicious_patterns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      disconnect_pharmacy_session: {
        Args: { p_session_token: string }
        Returns: boolean
      }
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_system_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_sensitive_operation: {
        Args: {
          operation_type: string
          table_name: string
          record_data: Json
          risk_level?: string
        }
        Returns: undefined
      }
      register_pharmacy_with_admin: {
        Args: {
          pharmacy_data: Json
          admin_data: Json
          admin_email: string
          admin_password: string
        }
        Returns: Json
      }
      setup_cross_tenant_security_triggers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_password_strength: {
        Args: { password: string; tenant_id: string }
        Returns: Json
      }
      validate_pharmacy_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      validate_tenant_access: {
        Args: { target_tenant_id: string; operation_type?: string }
        Returns: boolean
      }
    }
    Enums: {
      situation_familiale_enum:
        | "Célibataire"
        | "Marié(e)"
        | "Divorcé(e)"
        | "Veuf/Veuve"
        | "Concubinage"
      statut_contractuel_enum:
        | "CDI"
        | "CDD"
        | "Stage"
        | "Freelance"
        | "Consultant"
        | "Temporaire"
      type_client: "Ordinaire" | "Conventionné" | "Personnel" | "Assuré"
      type_client_enum: "Ordinaire" | "Conventionné" | "Personnel" | "Assuré"
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
      situation_familiale_enum: [
        "Célibataire",
        "Marié(e)",
        "Divorcé(e)",
        "Veuf/Veuve",
        "Concubinage",
      ],
      statut_contractuel_enum: [
        "CDI",
        "CDD",
        "Stage",
        "Freelance",
        "Consultant",
        "Temporaire",
      ],
      type_client: ["Ordinaire", "Conventionné", "Personnel", "Assuré"],
      type_client_enum: ["Ordinaire", "Conventionné", "Personnel", "Assuré"],
    },
  },
} as const
