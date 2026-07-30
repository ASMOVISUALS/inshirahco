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
      article_series: {
        Row: {
          article_id: string
          created_at: string
          position: number
          series_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          position?: number
          series_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          position?: number
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_series_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_series_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          archived_at: string | null
          author_name: string
          author_role: string | null
          body: Json
          created_at: string
          description: string
          downloadable: boolean
          id: string
          last_published_at: string | null
          pillar: string
          pillar_id: string
          published: boolean
          published_at: string
          read_time: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          author_name: string
          author_role?: string | null
          body?: Json
          created_at?: string
          description: string
          downloadable?: boolean
          id?: string
          last_published_at?: string | null
          pillar: string
          pillar_id: string
          published?: boolean
          published_at?: string
          read_time?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          author_name?: string
          author_role?: string | null
          body?: Json
          created_at?: string
          description?: string
          downloadable?: boolean
          id?: string
          last_published_at?: string | null
          pillar?: string
          pillar_id?: string
          published?: boolean
          published_at?: string
          read_time?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      ayahs: {
        Row: {
          active: boolean
          arabic: string
          archived_at: string | null
          ayah_number: number | null
          created_at: string
          day_end: string | null
          day_start: string | null
          id: string
          queue_order: number | null
          reference: string
          sort_order: number
          status: string
          surah_id: string | null
          translation: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          arabic: string
          archived_at?: string | null
          ayah_number?: number | null
          created_at?: string
          day_end?: string | null
          day_start?: string | null
          id?: string
          queue_order?: number | null
          reference: string
          sort_order?: number
          status?: string
          surah_id?: string | null
          translation: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          arabic?: string
          archived_at?: string | null
          ayah_number?: number | null
          created_at?: string
          day_end?: string | null
          day_start?: string | null
          id?: string
          queue_order?: number | null
          reference?: string
          sort_order?: number
          status?: string
          surah_id?: string | null
          translation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ayahs_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["id"]
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
          in_nav: boolean
          is_locked: boolean
          is_published: boolean
          key: string
          nav_label: string | null
          nav_order: number
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
          in_nav?: boolean
          is_locked?: boolean
          is_published?: boolean
          key: string
          nav_label?: string | null
          nav_order?: number
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
          in_nav?: boolean
          is_locked?: boolean
          is_published?: boolean
          key?: string
          nav_label?: string | null
          nav_order?: number
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
          archived_at: string | null
          coming_soon: boolean
          created_at: string
          description: string
          href: string
          id: string
          label: string
          short_label: string
          slug: string
          sort_order: number
          tint: string
          updated_at: string
        }
        Insert: {
          arabic_letter: string
          archived_at?: string | null
          coming_soon?: boolean
          created_at?: string
          description?: string
          href: string
          id?: string
          label: string
          short_label: string
          slug: string
          sort_order?: number
          tint?: string
          updated_at?: string
        }
        Update: {
          arabic_letter?: string
          archived_at?: string | null
          coming_soon?: boolean
          created_at?: string
          description?: string
          href?: string
          id?: string
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
      reflection_likes: {
        Row: {
          created_at: string
          id: string
          reflection_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reflection_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reflection_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_likes_reflection_id_fkey"
            columns: ["reflection_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          ayah_id: string
          body: string
          created_at: string
          id: string
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ayah_id: string
          body: string
          created_at?: string
          id?: string
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ayah_id?: string
          body?: string
          created_at?: string
          id?: string
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_ayah_id_fkey"
            columns: ["ayah_id"]
            isOneToOne: false
            referencedRelation: "ayahs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          is_article: boolean
          is_reflection: boolean
          is_votw: boolean
          message: string
          reporter_email: string | null
          reporter_id: string | null
          target_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_article?: boolean
          is_reflection?: boolean
          is_votw?: boolean
          message: string
          reporter_email?: string | null
          reporter_id?: string | null
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_article?: boolean
          is_reflection?: boolean
          is_votw?: boolean
          message?: string
          reporter_email?: string | null
          reporter_id?: string | null
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          arabic_letter: string
          archived_at: string | null
          cover_image: string | null
          created_at: string
          description: string
          id: string
          pillar: string | null
          pillar_id: string | null
          slug: string
          sort_order: number
          status: string
          tint: string
          title: string
          updated_at: string
        }
        Insert: {
          arabic_letter?: string
          archived_at?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          id?: string
          pillar?: string | null
          pillar_id?: string | null
          slug: string
          sort_order?: number
          status?: string
          tint?: string
          title: string
          updated_at?: string
        }
        Update: {
          arabic_letter?: string
          archived_at?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          id?: string
          pillar?: string | null
          pillar_id?: string | null
          slug?: string
          sort_order?: number
          status?: string
          tint?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      setting_fields: {
        Row: {
          created_at: string
          default_value: Json | null
          field_key: string
          field_type: string
          group_id: string
          help: string
          id: string
          label: string
          max_value: number | null
          min_value: number | null
          options: Json
          options_source: string
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: Json | null
          field_key: string
          field_type: string
          group_id: string
          help?: string
          id?: string
          label: string
          max_value?: number | null
          min_value?: number | null
          options?: Json
          options_source?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: Json | null
          field_key?: string
          field_type?: string
          group_id?: string
          help?: string
          id?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          options?: Json
          options_source?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setting_fields_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "setting_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      setting_groups: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          label: string
          settings_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          label: string
          settings_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          label?: string
          settings_key?: string
          sort_order?: number
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
      surahs: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          number: number
          updated_at: string
          verse_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          number: number
          updated_at?: string
          verse_count: number
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          number?: number
          updated_at?: string
          verse_count?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          archived_at: string | null
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
          archived_at?: string | null
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
          archived_at?: string | null
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
      verse_of_the_week: {
        Row: {
          ayah_id: string
          created_at: string
          week_start: string
        }
        Insert: {
          ayah_id: string
          created_at?: string
          week_start: string
        }
        Update: {
          ayah_id?: string
          created_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "verse_of_the_week_ayah_id_fkey"
            columns: ["ayah_id"]
            isOneToOne: false
            referencedRelation: "ayahs"
            referencedColumns: ["id"]
          },
        ]
      }
      votw_schedule: {
        Row: {
          created_at: string
          id: string
          mode: string
          next_change_at: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          next_change_at?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          next_change_at?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_verse_of_the_week: {
        Args: never
        Returns: {
          active: boolean
          arabic: string
          archived_at: string | null
          ayah_number: number | null
          created_at: string
          day_end: string | null
          day_start: string | null
          id: string
          queue_order: number | null
          reference: string
          sort_order: number
          status: string
          surah_id: string | null
          translation: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ayahs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rotate_verse_of_the_week: { Args: never; Returns: undefined }
      rotate_verse_of_the_week_if_due: { Args: never; Returns: undefined }
      votw_next_friday: { Args: { _from?: string }; Returns: string }
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
