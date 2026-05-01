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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      community_items: {
        Row: {
          approved: boolean
          armor_type: string | null
          charges: Json | null
          class_restriction: string | null
          created_at: string
          effects: Json
          gear_score: number | null
          id: string
          level: number | null
          name: string
          notes: string | null
          origin: string | null
          procs: Json | null
          quality: number | null
          realm: string
          slot: string
          source_type: string | null
          submitted_by: string | null
          submitter_name: string | null
          updated_at: string
          upvote_count: number
          utility: number | null
          weapon_type: string | null
        }
        Insert: {
          approved?: boolean
          armor_type?: string | null
          charges?: Json | null
          class_restriction?: string | null
          created_at?: string
          effects?: Json
          gear_score?: number | null
          id?: string
          level?: number | null
          name: string
          notes?: string | null
          origin?: string | null
          procs?: Json | null
          quality?: number | null
          realm: string
          slot: string
          source_type?: string | null
          submitted_by?: string | null
          submitter_name?: string | null
          updated_at?: string
          upvote_count?: number
          utility?: number | null
          weapon_type?: string | null
        }
        Update: {
          approved?: boolean
          armor_type?: string | null
          charges?: Json | null
          class_restriction?: string | null
          created_at?: string
          effects?: Json
          gear_score?: number | null
          id?: string
          level?: number | null
          name?: string
          notes?: string | null
          origin?: string | null
          procs?: Json | null
          quality?: number | null
          realm?: string
          slot?: string
          source_type?: string | null
          submitted_by?: string | null
          submitter_name?: string | null
          updated_at?: string
          upvote_count?: number
          utility?: number | null
          weapon_type?: string | null
        }
        Relationships: []
      }
      feature_request_votes: {
        Row: {
          created_at: string
          id: string
          request_id: string
          voter_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          voter_key: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          voter_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_request_votes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          author_name: string | null
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          author_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: []
      }
      formula_config: {
        Row: {
          config: Json
          description: string | null
          id: string
          label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config: Json
          description?: string | null
          id: string
          label: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          description?: string | null
          id?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          armor_af: number | null
          armor_type: string | null
          bonus_level: number | null
          class_restriction: string | null
          created_at: string
          effects: Json
          external_id: string | null
          id: string
          item_level: number | null
          level: number | null
          name: string
          online_url: string | null
          origin: string | null
          quality: number | null
          raw: Json | null
          realm: string
          required_level: number | null
          slot: string
          source_type: string | null
          weapon_damage_type: string | null
          weapon_dps: number | null
          weapon_speed: number | null
          weapon_type: string | null
        }
        Insert: {
          armor_af?: number | null
          armor_type?: string | null
          bonus_level?: number | null
          class_restriction?: string | null
          created_at?: string
          effects?: Json
          external_id?: string | null
          id?: string
          item_level?: number | null
          level?: number | null
          name: string
          online_url?: string | null
          origin?: string | null
          quality?: number | null
          raw?: Json | null
          realm: string
          required_level?: number | null
          slot: string
          source_type?: string | null
          weapon_damage_type?: string | null
          weapon_dps?: number | null
          weapon_speed?: number | null
          weapon_type?: string | null
        }
        Update: {
          armor_af?: number | null
          armor_type?: string | null
          bonus_level?: number | null
          class_restriction?: string | null
          created_at?: string
          effects?: Json
          external_id?: string | null
          id?: string
          item_level?: number | null
          level?: number | null
          name?: string
          online_url?: string | null
          origin?: string | null
          quality?: number | null
          raw?: Json | null
          realm?: string
          required_level?: number | null
          slot?: string
          source_type?: string | null
          weapon_damage_type?: string | null
          weapon_dps?: number | null
          weapon_speed?: number | null
          weapon_type?: string | null
        }
        Relationships: []
      }
      platform_stats: {
        Row: {
          id: string
          updated_at: string
          value: number
        }
        Insert: {
          id: string
          updated_at?: string
          value?: number
        }
        Update: {
          id?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_templates: {
        Row: {
          author_name: string | null
          class_name: string | null
          created_at: string
          gear_score: number | null
          id: string
          is_public: boolean
          name: string
          notes: string | null
          owner_user_id: string | null
          realm: string
          share_code: string | null
          slots: Json
          spellcraft: Json
          updated_at: string
          utility: number | null
          view_count: number
          vote_count: number
        }
        Insert: {
          author_name?: string | null
          class_name?: string | null
          created_at?: string
          gear_score?: number | null
          id?: string
          is_public?: boolean
          name: string
          notes?: string | null
          owner_user_id?: string | null
          realm: string
          share_code?: string | null
          slots?: Json
          spellcraft?: Json
          updated_at?: string
          utility?: number | null
          view_count?: number
          vote_count?: number
        }
        Update: {
          author_name?: string | null
          class_name?: string | null
          created_at?: string
          gear_score?: number | null
          id?: string
          is_public?: boolean
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          realm?: string
          share_code?: string | null
          slots?: Json
          spellcraft?: Json
          updated_at?: string
          utility?: number | null
          view_count?: number
          vote_count?: number
        }
        Relationships: []
      }
      template_votes: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string | null
          voter_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id?: string | null
          voter_key: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string | null
          voter_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_votes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "saved_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
