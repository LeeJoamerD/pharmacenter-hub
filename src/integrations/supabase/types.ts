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
            | Database["public"]["Enums"]["situation_familiale_enum"]
            | null
          statut_contractuel:
            | Database["public"]["Enums"]["statut_contractuel_enum"]
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
            | Database["public"]["Enums"]["situation_familiale_enum"]
            | null
          statut_contractuel?:
            | Database["public"]["Enums"]["statut_contractuel_enum"]
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
            | Database["public"]["Enums"]["situation_familiale_enum"]
            | null
          statut_contractuel?:
            | Database["public"]["Enums"]["statut_contractuel_enum"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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
    },
  },
} as const
