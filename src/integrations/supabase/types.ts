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
      alertes: {
        Row: {
          created_at: string | null
          date_expiration: string | null
          id: string
          lu: boolean | null
          message: string
          niveau_priorite: number | null
          produit_id: string | null
          tenant_id: string | null
          titre: string
          type_alerte: Database["public"]["Enums"]["alert_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_expiration?: string | null
          id?: string
          lu?: boolean | null
          message: string
          niveau_priorite?: number | null
          produit_id?: string | null
          tenant_id?: string | null
          titre: string
          type_alerte: Database["public"]["Enums"]["alert_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_expiration?: string | null
          id?: string
          lu?: boolean | null
          message?: string
          niveau_priorite?: number | null
          produit_id?: string | null
          tenant_id?: string | null
          titre?: string
          type_alerte?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertes_tenant_id_fkey"
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
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string | null
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
      clients: {
        Row: {
          adresse: string | null
          created_at: string | null
          date_naissance: string | null
          email: string | null
          id: string
          mutuelle: string | null
          nom: string
          numero_mutuelle: string | null
          numero_securite_sociale: string | null
          prenom: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          mutuelle?: string | null
          nom: string
          numero_mutuelle?: string | null
          numero_securite_sociale?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string | null
          date_naissance?: string | null
          email?: string | null
          id?: string
          mutuelle?: string | null
          nom?: string
          numero_mutuelle?: string | null
          numero_securite_sociale?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
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
      commandes: {
        Row: {
          created_at: string | null
          date_commande: string | null
          date_livraison_prevue: string | null
          date_livraison_reelle: string | null
          fournisseur_id: string | null
          id: string
          montant_total: number | null
          montant_ttc: number | null
          montant_tva: number | null
          notes: string | null
          numero_commande: string
          statut: Database["public"]["Enums"]["order_status"] | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_commande?: string | null
          date_livraison_prevue?: string | null
          date_livraison_reelle?: string | null
          fournisseur_id?: string | null
          id?: string
          montant_total?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_commande: string
          statut?: Database["public"]["Enums"]["order_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_commande?: string | null
          date_livraison_prevue?: string | null
          date_livraison_reelle?: string | null
          fournisseur_id?: string | null
          id?: string
          montant_total?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          notes?: string | null
          numero_commande?: string
          statut?: Database["public"]["Enums"]["order_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commandes_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commandes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      encaissements: {
        Row: {
          caissier_id: string
          created_at: string | null
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
          updated_at: string | null
          vente_id: string
        }
        Insert: {
          caissier_id: string
          created_at?: string | null
          date_encaissement: string
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
          updated_at?: string | null
          vente_id: string
        }
        Update: {
          caissier_id?: string
          created_at?: string | null
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
          updated_at?: string | null
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
      familles_produits: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          nom: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "familles_produits_tenant_id_fkey"
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
          conditions_paiement: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string | null
          delai_livraison: number | null
          id: string
          nom: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          delai_livraison?: number | null
          id?: string
          nom: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          delai_livraison?: number | null
          id?: string
          nom?: string
          tenant_id?: string | null
          updated_at?: string | null
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
      inventaires: {
        Row: {
          created_at: string | null
          date_inventaire: string | null
          id: string
          notes: string | null
          numero_inventaire: string
          statut: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_inventaire?: string | null
          id?: string
          notes?: string | null
          numero_inventaire: string
          statut?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_inventaire?: string | null
          id?: string
          notes?: string | null
          numero_inventaire?: string
          statut?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventaires_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratoires: {
        Row: {
          adresse: string | null
          created_at: string | null
          email: string | null
          id: string
          nom: string
          telephone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
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
      lignes_commande: {
        Row: {
          commande_id: string | null
          created_at: string | null
          id: string
          montant_ligne: number | null
          prix_unitaire: number
          produit_id: string | null
          quantite_commandee: number
          quantite_livree: number | null
          remise_pourcentage: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          commande_id?: string | null
          created_at?: string | null
          id?: string
          montant_ligne?: number | null
          prix_unitaire: number
          produit_id?: string | null
          quantite_commandee: number
          quantite_livree?: number | null
          remise_pourcentage?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commande_id?: string | null
          created_at?: string | null
          id?: string
          montant_ligne?: number | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite_commandee?: number
          quantite_livree?: number | null
          remise_pourcentage?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_commande_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_commande_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_inventaire: {
        Row: {
          created_at: string | null
          ecart: number | null
          id: string
          inventaire_id: string | null
          lot_id: string | null
          produit_id: string | null
          quantite_physique: number | null
          quantite_theorique: number | null
          tenant_id: string | null
          updated_at: string | null
          valeur_ecart: number | null
        }
        Insert: {
          created_at?: string | null
          ecart?: number | null
          id?: string
          inventaire_id?: string | null
          lot_id?: string | null
          produit_id?: string | null
          quantite_physique?: number | null
          quantite_theorique?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          valeur_ecart?: number | null
        }
        Update: {
          created_at?: string | null
          ecart?: number | null
          id?: string
          inventaire_id?: string | null
          lot_id?: string | null
          produit_id?: string | null
          quantite_physique?: number | null
          quantite_theorique?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          valeur_ecart?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_inventaire_inventaire_id_fkey"
            columns: ["inventaire_id"]
            isOneToOne: false
            referencedRelation: "inventaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_inventaire_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_inventaire_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_inventaire_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_inventaire_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_inventaire_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_reception: {
        Row: {
          created_at: string | null
          date_expiration: string | null
          id: string
          lot_id: string | null
          numero_lot: string | null
          prix_unitaire: number | null
          produit_id: string | null
          quantite_recue: number
          reception_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_expiration?: string | null
          id?: string
          lot_id?: string | null
          numero_lot?: string | null
          prix_unitaire?: number | null
          produit_id?: string | null
          quantite_recue: number
          reception_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_expiration?: string | null
          id?: string
          lot_id?: string | null
          numero_lot?: string | null
          prix_unitaire?: number | null
          produit_id?: string | null
          quantite_recue?: number
          reception_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_reception_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_reception_id_fkey"
            columns: ["reception_id"]
            isOneToOne: false
            referencedRelation: "receptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_reception_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_vente: {
        Row: {
          created_at: string | null
          id: string
          lot_id: string | null
          montant_ligne: number | null
          prix_unitaire: number
          produit_id: string | null
          quantite: number
          remise_montant: number | null
          remise_pourcentage: number | null
          tenant_id: string | null
          updated_at: string | null
          vente_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lot_id?: string | null
          montant_ligne?: number | null
          prix_unitaire: number
          produit_id?: string | null
          quantite: number
          remise_montant?: number | null
          remise_pourcentage?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          vente_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lot_id?: string | null
          montant_ligne?: number | null
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          remise_montant?: number | null
          remise_pourcentage?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lignes_vente_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_vente_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      lots_produit: {
        Row: {
          created_at: string | null
          date_expiration: string | null
          date_fabrication: string | null
          fournisseur_id: string | null
          id: string
          numero_lot: string
          prix_achat_unitaire: number | null
          produit_id: string | null
          quantite_initiale: number
          quantite_restante: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_expiration?: string | null
          date_fabrication?: string | null
          fournisseur_id?: string | null
          id?: string
          numero_lot: string
          prix_achat_unitaire?: number | null
          produit_id?: string | null
          quantite_initiale?: number
          quantite_restante?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_expiration?: string | null
          date_fabrication?: string | null
          fournisseur_id?: string | null
          id?: string
          numero_lot?: string
          prix_achat_unitaire?: number | null
          produit_id?: string | null
          quantite_initiale?: number
          quantite_restante?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lots_produit_fournisseur_id_fkey"
            columns: ["fournisseur_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_produit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      mouvements_caisse: {
        Row: {
          created_at: string | null
          id: string
          montant: number
          motif: string
          reference: string | null
          session_id: string | null
          tenant_id: string | null
          type_mouvement: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          montant: number
          motif: string
          reference?: string | null
          session_id?: string | null
          tenant_id?: string | null
          type_mouvement: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          montant?: number
          motif?: string
          reference?: string | null
          session_id?: string | null
          tenant_id?: string | null
          type_mouvement?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_caisse_session_id_fkey"
            columns: ["session_id"]
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
      mouvements_stock: {
        Row: {
          created_at: string | null
          id: string
          lot_id: string | null
          motif: string | null
          prix_unitaire: number | null
          produit_id: string | null
          quantite: number
          quantite_apres: number | null
          quantite_avant: number | null
          reference_document: string | null
          tenant_id: string | null
          type_mouvement: Database["public"]["Enums"]["movement_type"]
          updated_at: string | null
          user_id: string | null
          valeur_totale: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lot_id?: string | null
          motif?: string | null
          prix_unitaire?: number | null
          produit_id?: string | null
          quantite: number
          quantite_apres?: number | null
          quantite_avant?: number | null
          reference_document?: string | null
          tenant_id?: string | null
          type_mouvement: Database["public"]["Enums"]["movement_type"]
          updated_at?: string | null
          user_id?: string | null
          valeur_totale?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lot_id?: string | null
          motif?: string | null
          prix_unitaire?: number | null
          produit_id?: string | null
          quantite?: number
          quantite_apres?: number | null
          quantite_avant?: number | null
          reference_document?: string | null
          tenant_id?: string | null
          type_mouvement?: Database["public"]["Enums"]["movement_type"]
          updated_at?: string | null
          user_id?: string | null
          valeur_totale?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_stock_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots_produit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_stock_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_vente: {
        Row: {
          created_at: string | null
          id: string
          methode_paiement: string
          montant: number
          reference_transaction: string | null
          tenant_id: string | null
          updated_at: string | null
          vente_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          methode_paiement: string
          montant: number
          reference_transaction?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          vente_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          methode_paiement?: string
          montant?: number
          reference_transaction?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          vente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_vente_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_vente_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_systeme: {
        Row: {
          cle: string
          created_at: string | null
          description: string | null
          id: string
          tenant_id: string | null
          type_donnee: string | null
          updated_at: string | null
          valeur: string | null
        }
        Insert: {
          cle: string
          created_at?: string | null
          description?: string | null
          id?: string
          tenant_id?: string | null
          type_donnee?: string | null
          updated_at?: string | null
          valeur?: string | null
        }
        Update: {
          cle?: string
          created_at?: string | null
          description?: string | null
          id?: string
          tenant_id?: string | null
          type_donnee?: string | null
          updated_at?: string | null
          valeur?: string | null
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
      personnel: {
        Row: {
          actif: boolean | null
          adresse: string | null
          auth_user_id: string | null
          created_at: string | null
          date_embauche: string | null
          email: string
          id: string
          nom: string
          prenom: string
          role: string | null
          salaire: number | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_embauche?: string | null
          email: string
          id?: string
          nom: string
          prenom: string
          role?: string | null
          salaire?: number | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_embauche?: string | null
          email?: string
          id?: string
          nom?: string
          prenom?: string
          role?: string | null
          salaire?: number | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
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
          adresse: string | null
          created_at: string | null
          directeur_nom: string | null
          directeur_prenom: string | null
          email: string | null
          id: string
          nom: string
          numero_licence: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string | null
          directeur_nom?: string | null
          directeur_prenom?: string | null
          email?: string | null
          id?: string
          nom: string
          numero_licence?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string | null
          directeur_nom?: string | null
          directeur_prenom?: string | null
          email?: string | null
          id?: string
          nom?: string
          numero_licence?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produits: {
        Row: {
          code_barre: string | null
          conditionnement: string | null
          created_at: string | null
          dci: string | null
          description: string | null
          dosage: string | null
          famille_id: string | null
          forme: string | null
          fournisseur_principal_id: string | null
          id: string
          laboratoire_id: string | null
          nom: string
          prescription_requise: boolean | null
          prix_achat: number | null
          prix_vente: number | null
          remboursable: boolean | null
          stock_maximum: number | null
          stock_minimum: number | null
          taux_tva: number | null
          tenant_id: string | null
          unite: string | null
          updated_at: string | null
        }
        Insert: {
          code_barre?: string | null
          conditionnement?: string | null
          created_at?: string | null
          dci?: string | null
          description?: string | null
          dosage?: string | null
          famille_id?: string | null
          forme?: string | null
          fournisseur_principal_id?: string | null
          id?: string
          laboratoire_id?: string | null
          nom: string
          prescription_requise?: boolean | null
          prix_achat?: number | null
          prix_vente?: number | null
          remboursable?: boolean | null
          stock_maximum?: number | null
          stock_minimum?: number | null
          taux_tva?: number | null
          tenant_id?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Update: {
          code_barre?: string | null
          conditionnement?: string | null
          created_at?: string | null
          dci?: string | null
          description?: string | null
          dosage?: string | null
          famille_id?: string | null
          forme?: string | null
          fournisseur_principal_id?: string | null
          id?: string
          laboratoire_id?: string | null
          nom?: string
          prescription_requise?: boolean | null
          prix_achat?: number | null
          prix_vente?: number | null
          remboursable?: boolean | null
          stock_maximum?: number | null
          stock_minimum?: number | null
          taux_tva?: number | null
          tenant_id?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_famille_id_fkey"
            columns: ["famille_id"]
            isOneToOne: false
            referencedRelation: "familles_produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_fournisseur_principal_id_fkey"
            columns: ["fournisseur_principal_id"]
            isOneToOne: false
            referencedRelation: "fournisseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_laboratoire_id_fkey"
            columns: ["laboratoire_id"]
            isOneToOne: false
            referencedRelation: "laboratoires"
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
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nom: string | null
          prenom: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nom?: string | null
          prenom?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nom?: string | null
          prenom?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receptions: {
        Row: {
          commande_id: string | null
          created_at: string | null
          date_reception: string | null
          id: string
          montant_facture: number | null
          notes: string | null
          numero_facture: string | null
          numero_reception: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commande_id?: string | null
          created_at?: string | null
          date_reception?: string | null
          id?: string
          montant_facture?: number | null
          notes?: string | null
          numero_facture?: string | null
          numero_reception: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commande_id?: string | null
          created_at?: string | null
          date_reception?: string | null
          id?: string
          montant_facture?: number | null
          notes?: string | null
          numero_facture?: string | null
          numero_reception?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receptions_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          created_at: string | null
          description: string
          id: string
          incident_type: string
          ip_address: unknown | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          incident_type: string
          ip_address?: unknown | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          incident_type?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_caisse: {
        Row: {
          created_at: string | null
          date_fermeture: string | null
          date_ouverture: string | null
          id: string
          montant_autres: number | null
          montant_cartes: number | null
          montant_especes: number | null
          montant_final: number | null
          montant_initial: number | null
          statut: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_fermeture?: string | null
          date_ouverture?: string | null
          id?: string
          montant_autres?: number | null
          montant_cartes?: number | null
          montant_especes?: number | null
          montant_final?: number | null
          montant_initial?: number | null
          statut?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_fermeture?: string | null
          date_ouverture?: string | null
          id?: string
          montant_autres?: number | null
          montant_cartes?: number | null
          montant_especes?: number | null
          montant_final?: number | null
          montant_initial?: number | null
          statut?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_caisse_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_actuel: {
        Row: {
          created_at: string | null
          derniere_entree: string | null
          derniere_sortie: string | null
          id: string
          produit_id: string | null
          quantite_disponible: number | null
          quantite_reservee: number | null
          quantite_totale: number | null
          tenant_id: string | null
          updated_at: string | null
          valeur_stock: number | null
        }
        Insert: {
          created_at?: string | null
          derniere_entree?: string | null
          derniere_sortie?: string | null
          id?: string
          produit_id?: string | null
          quantite_disponible?: number | null
          quantite_reservee?: number | null
          quantite_totale?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          valeur_stock?: number | null
        }
        Update: {
          created_at?: string | null
          derniere_entree?: string | null
          derniere_sortie?: string | null
          id?: string
          produit_id?: string | null
          quantite_disponible?: number | null
          quantite_reservee?: number | null
          quantite_totale?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          valeur_stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_actuel_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_actuel_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_actuel_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_actuel_tenant_id_fkey"
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
            referencedRelation: "lots_produit"
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
            referencedRelation: "vue_produits_expires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_vente_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_stock_critique"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          client_id: string | null
          created_at: string | null
          date_vente: string | null
          id: string
          montant_ht: number | null
          montant_ttc: number | null
          montant_tva: number | null
          numero_ticket: string
          remise_globale: number | null
          statut: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date_vente?: string | null
          id?: string
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          numero_ticket: string
          remise_globale?: number | null
          statut?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date_vente?: string | null
          id?: string
          montant_ht?: number | null
          montant_ttc?: number | null
          montant_tva?: number | null
          numero_ticket?: string
          remise_globale?: number | null
          statut?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
      vue_produits_expires: {
        Row: {
          date_expiration: string | null
          id: string | null
          nom: string | null
          numero_lot: string | null
          quantite_restante: number | null
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
        ]
      }
      vue_stock_critique: {
        Row: {
          id: string | null
          nom: string | null
          quantite_disponible: number | null
          stock_minimum: number | null
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
        ]
      }
    }
    Functions: {
      calculate_low_stock_metrics_v2: {
        Args: { p_critical_threshold?: number; p_low_threshold?: number }
        Returns: Json
      }
      check_product_availability: {
        Args: { p_product_id: string; p_quantity: number; p_tenant_id: string }
        Returns: boolean
      }
      check_stock_availability: {
        Args: { p_produit_id: string; p_quantite_demandee: number }
        Returns: boolean
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never> | { p_tenant_id: string }
        Returns: string
      }
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_low_stock_products: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nom: string
          pourcentage_stock: number
          stock_actuel: number
          stock_minimum: number
        }[]
      }
      process_sale: {
        Args: { p_lignes_vente: Json[]; p_vente_data: Json }
        Returns: string
      }
      update_stock_after_sale: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_tenant_id: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_type: "stock_bas" | "expiration" | "rupture" | "commande"
      movement_type:
        | "entree"
        | "sortie"
        | "ajustement"
        | "peremption"
        | "retour"
      order_status: "en_attente" | "confirme" | "expedie" | "livre" | "annule"
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
      alert_type: ["stock_bas", "expiration", "rupture", "commande"],
      movement_type: ["entree", "sortie", "ajustement", "peremption", "retour"],
      order_status: ["en_attente", "confirme", "expedie", "livre", "annule"],
    },
  },
} as const
