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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
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
          {
            foreignKeyName: "lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
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
      produits: {
        Row: {
          categorie_tarification_id: string | null
          centime_additionnel: number | null
          code_cip: string | null
          created_at: string
          famille_produit_id: string | null
          id: string
          id_produit_source: string | null
          libelle_produit: string
          niveau_detail: number | null
          prix_achat: number | null
          prix_vente_ht: number | null
          prix_vente_ttc: number | null
          quantite_unites_details_source: number | null
          rayon_produit_id: string | null
          reference_agent_enregistrement_id: string | null
          reference_agent_modification_id: string | null
          stock_alerte: number | null
          stock_limite: number | null
          tenant_id: string
          tva: number | null
          updated_at: string
        }
        Insert: {
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          code_cip?: string | null
          created_at?: string
          famille_produit_id?: string | null
          id?: string
          id_produit_source?: string | null
          libelle_produit: string
          niveau_detail?: number | null
          prix_achat?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_unites_details_source?: number | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          stock_alerte?: number | null
          stock_limite?: number | null
          tenant_id: string
          tva?: number | null
          updated_at?: string
        }
        Update: {
          categorie_tarification_id?: string | null
          centime_additionnel?: number | null
          code_cip?: string | null
          created_at?: string
          famille_produit_id?: string | null
          id?: string
          id_produit_source?: string | null
          libelle_produit?: string
          niveau_detail?: number | null
          prix_achat?: number | null
          prix_vente_ht?: number | null
          prix_vente_ttc?: number | null
          quantite_unites_details_source?: number | null
          rayon_produit_id?: string | null
          reference_agent_enregistrement_id?: string | null
          reference_agent_modification_id?: string | null
          stock_alerte?: number | null
          stock_limite?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_sales_suggestions: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      get_current_user_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
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
      type_client: "Particulier" | "Assureur" | "Société" | "Conventionné"
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
      type_client: ["Particulier", "Assureur", "Société", "Conventionné"],
    },
  },
} as const
