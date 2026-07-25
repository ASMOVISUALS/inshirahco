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
      articles: {
        Row: {
          author_name: string
          author_role: string | null
          body: Json
          created_at: string
          description: string
          downloadable: boolean
          id: string
          pillar: string
          published: boolean
          published_at: string
          read_time: string | null
          slug: string
          tags: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          body?: Json
          created_at?: string
          description: string
          downloadable?: boolean
          id?: string
          pillar: string
          published?: boolean
          published_at?: string
          read_time?: string | null
          slug: string
          tags?: string[]
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          body?: Json
          created_at?: string
          description?: string
          downloadable?: boolean
          id?: string
          pillar?: string
          published?: boolean
          published_at?: string
          read_time?: string | null
          slug?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_pillar_fkey"
            columns: ["pillar"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "articles_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "resource_formats"
            referencedColumns: ["slug"]
          },
        ]
      }
      bookmarks: {
        Row: {
          article_slug: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_slug: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_slug?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          page_key: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          page_key: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          page_key?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          consented_at: string
          created_at: string
          email: string
          id: string
          newsletter_id: string
          source: string | null
        }
        Insert: {
          consented_at?: string
          created_at?: string
          email: string
          id?: string
          newsletter_id: string
          source?: string | null
        }
        Update: {
          consented_at?: string
          created_at?: string
          email?: string
          id?: string
          newsletter_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_signups_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          archived_at: string | null
          content: Json
          created_at: string
          is_locked: boolean
          is_published: boolean
          key: string
          slug: string | null
          status: Database["public"]["Enums"]["page_status"]
          template: string
          title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          content?: Json
          created_at?: string
          is_locked?: boolean
          is_published?: boolean
          key: string
          slug?: string | null
          status?: Database["public"]["Enums"]["page_status"]
          template?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          content?: Json
          created_at?: string
          is_locked?: boolean
          is_published?: boolean
          key?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["page_status"]
          template?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pillars: {
        Row: {
          arabic_letter: string
          coming_soon: boolean
          created_at: string
          description: string
          href: string
          label: string
          short_label: string
          slug: string
          sort_order: number
          tint: string
          updated_at: string
        }
        Insert: {
          arabic_letter: string
          coming_soon?: boolean
          created_at?: string
          description?: string
          href: string
          label: string
          short_label: string
          slug: string
          sort_order?: number
          tint?: string
          updated_at?: string
        }
        Update: {
          arabic_letter?: string
          coming_soon?: boolean
          created_at?: string
          description?: string
          href?: string
          label?: string
          short_label?: string
          slug?: string
          sort_order?: number
          tint?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          dob: string | null
          email: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          active: boolean
          arabic: string
          created_at: string
          id: string
          reference: string
          sort_order: number
          translation: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          arabic: string
          created_at?: string
          id?: string
          reference: string
          sort_order?: number
          translation: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          arabic?: string
          created_at?: string
          id?: string
          reference?: string
          sort_order?: number
          translation?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_formats: {
        Row: {
          arabic_letter: string
          created_at: string
          label: string
          plural: string
          slug: string
          sort_order: number
          tint: string
          updated_at: string
        }
        Insert: {
          arabic_letter: string
          created_at?: string
          label: string
          plural: string
          slug: string
          sort_order?: number
          tint?: string
          updated_at?: string
        }
        Update: {
          arabic_letter?: string
          created_at?: string
          label?: string
          plural?: string
          slug?: string
          sort_order?: number
          tint?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          featured: boolean
          id: string
          name: string
          quote: string
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          featured?: boolean
          id?: string
          name: string
          quote: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          featured?: boolean
          id?: string
          name?: string
          quote?: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "member"
      gender_type: "male" | "female" | "prefer_not_to_say"
      page_status: "published" | "hidden" | "coming_soon"
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
      app_role: ["admin", "member"],
      gender_type: ["male", "female", "prefer_not_to_say"],
      page_status: ["published", "hidden", "coming_soon"],
    },
  },
} as const
